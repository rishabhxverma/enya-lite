import axios, { type AxiosInstance, AxiosError } from "axios";
// p-retry v6 moved AbortError to a named export (was `pRetry.AbortError` in v5).
import pRetry, { AbortError } from "p-retry";
import type { ToolDefinition } from "@shared/types";

export interface CreateThreadResult {
  id: string;
}

export type MemoryMode = "Auto" | "Readonly" | "Off";

export interface SendMessageOptions {
  content: string;
  threadId: string;
  assistantId: string;
  tools?: ToolDefinition[];
  memory?: MemoryMode;
  llmProvider?: "openai" | "anthropic" | "google";
  modelName?: string;
  systemPromptAddendum?: string;
  responseFormat?: "text" | "json";
}

export interface BackboardToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface BackboardMessageResponse {
  threadId: string;
  status: "completed" | "requires_action" | "failed";
  content: string;
  toolCalls?: BackboardToolCall[];
  rawResponse?: unknown;
}

export interface ToolOutput {
  toolCallId: string;
  toolName: string;
  output: unknown;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;
export type ToolHandlerMap = Record<string, ToolHandler>;

export interface BackboardClient {
  // Threads are nested under an assistant in Backboard's API — every thread
  // is bound to one assistant at creation time.
  createThread(assistantId: string): Promise<CreateThreadResult>;
  sendMessage(opts: SendMessageOptions): Promise<BackboardMessageResponse>;
  submitToolOutputs(
    threadId: string,
    toolOutputs: ToolOutput[]
  ): Promise<BackboardMessageResponse>;
  uploadDocument(
    file: Buffer | Blob,
    name: string,
    assistantId?: string
  ): Promise<{ id: string }>;
  runToolLoop(
    opts: SendMessageOptions,
    handlers: ToolHandlerMap,
    maxRounds?: number
  ): Promise<{
    final: BackboardMessageResponse;
    toolResults: { toolName: string; args: unknown; output: unknown }[];
  }>;
}

interface BackboardConfig {
  apiKey: string;
  apiUrl?: string;
}

class BackboardImpl implements BackboardClient {
  private http: AxiosInstance;

  constructor(private cfg: BackboardConfig) {
    this.http = axios.create({
      // Real Backboard API base URL (the public marketing hostname is
      // backboard.io, but the actual REST endpoint lives under app.*).
      baseURL: cfg.apiUrl ?? "https://app.backboard.io/api",
      headers: {
        // Backboard uses an X-API-Key header, not Bearer. Confirmed against
        // docs.backboard.io/authentication.
        "X-API-Key": cfg.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 60_000,
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    return pRetry(
      async () => {
        try {
          return await fn();
        } catch (err) {
          const ax = err as AxiosError;
          const status = ax.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            // non-retriable client error
            throw new AbortError(
              `[backboard:${label}] ${status} ${JSON.stringify(
                ax.response?.data ?? ax.message
              )}`
            );
          }
          throw err;
        }
      },
      {
        retries: 3,
        minTimeout: 500,
        factor: 2,
        onFailedAttempt: (e) =>
          console.warn(
            `[backboard:${label}] attempt ${e.attemptNumber} failed: ${e.message}`
          ),
      }
    );
  }

  async createThread(assistantId: string): Promise<CreateThreadResult> {
    return this.withRetry(async () => {
      // POST /assistants/{assistant_id}/threads — nested resource. Returns
      // `{ thread_id, ... }`. Empty body is fine; pass {} to satisfy axios.
      const { data } = await this.http.post(
        `/assistants/${assistantId}/threads`,
        {}
      );
      return { id: data.thread_id ?? data.id ?? data.threadId };
    }, "createThread");
  }

  async sendMessage(
    opts: SendMessageOptions
  ): Promise<BackboardMessageResponse> {
    return this.withRetry(async () => {
      // POST /threads/messages — flat endpoint, thread_id in body. The
      // assistant binding is on the thread, not per-message.
      const { data } = await this.http.post(`/threads/messages`, {
        thread_id: opts.threadId,
        content: opts.content,
        tools: opts.tools,
        memory: opts.memory ?? "Auto",
        llm_provider: opts.llmProvider,
        model_name: opts.modelName,
        system_addendum: opts.systemPromptAddendum,
        response_format: opts.responseFormat,
      });
      return parseResponse(data, opts.threadId);
    }, "sendMessage");
  }

  async submitToolOutputs(
    threadId: string,
    toolOutputs: ToolOutput[]
  ): Promise<BackboardMessageResponse> {
    return this.withRetry(async () => {
      // POST /threads/tool-outputs — also flat. thread_id in body.
      const { data } = await this.http.post(`/threads/tool-outputs`, {
        thread_id: threadId,
        tool_outputs: toolOutputs.map((o) => ({
          tool_call_id: o.toolCallId,
          output:
            typeof o.output === "string"
              ? o.output
              : JSON.stringify(o.output),
        })),
      });
      return parseResponse(data, threadId);
    }, "submitToolOutputs");
  }

  async uploadDocument(file: Buffer | Blob, name: string, assistantId?: string) {
    return this.withRetry(async () => {
      const formData = new FormData();
      // Node Buffer -> Blob
      const blob =
        file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
      formData.append("file", blob, name);
      // Backboard nests document upload under the assistant. If no assistant
      // is provided, fall back to env var (so callers that don't yet thread
      // assistantId still work). The legacy `/documents` flat endpoint
      // doesn't exist on the real API.
      const aid = assistantId ?? process.env.BACKBOARD_ASSISTANT_ID;
      if (!aid)
        throw new Error(
          "uploadDocument requires an assistantId (or BACKBOARD_ASSISTANT_ID env)"
        );
      const { data } = await this.http.post(
        `/assistants/${aid}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return { id: data.id ?? data.document_id ?? data.documentId };
    }, "uploadDocument");
  }

  async runToolLoop(
    opts: SendMessageOptions,
    handlers: ToolHandlerMap,
    maxRounds = 6
  ) {
    let response = await this.sendMessage(opts);
    const toolResults: {
      toolName: string;
      args: unknown;
      output: unknown;
    }[] = [];

    let round = 0;
    while (
      response.status === "requires_action" &&
      response.toolCalls &&
      response.toolCalls.length > 0 &&
      round < maxRounds
    ) {
      round += 1;
      const outputs: ToolOutput[] = [];
      for (const call of response.toolCalls) {
        const handler = handlers[call.name];
        let output: unknown;
        try {
          if (!handler) {
            output = {
              error: `No handler registered for tool ${call.name}`,
            };
          } else {
            output = await handler(call.arguments);
          }
        } catch (err) {
          output = {
            error: err instanceof Error ? err.message : String(err),
          };
        }
        toolResults.push({
          toolName: call.name,
          args: call.arguments,
          output,
        });
        outputs.push({
          toolCallId: call.id,
          toolName: call.name,
          output,
        });
      }
      // Backboard's POST /threads/tool-outputs is intermittently 500-ing
      // (and sometimes returns 404 "no pending tool calls" on retries even
      // when the previous submit landed). When that happens, we DON'T want
      // to throw away the locally-computed tool results and surface a
      // generic "snag" message — the tools actually ran. Catch the submit
      // error, stop the loop, and return a synthesized completed response
      // with a short summary so the UI can render the tool results.
      try {
        response = await this.submitToolOutputs(opts.threadId, outputs);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[backboard:runToolLoop] submitToolOutputs failed at round ${round}: ${message}. ` +
            `Returning ${toolResults.length} local tool result(s) without the assistant's follow-up.`
        );
        const ranTools = toolResults.map((t) => t.toolName).join(", ");
        return {
          final: {
            threadId: opts.threadId,
            status: "completed" as const,
            content: `(Backboard couldn't accept the tool result — ran ${ranTools} locally; please retry the message or use the seed-fallback toggle.)`,
            toolCalls: [],
            rawResponse: { _submitError: message },
          },
          toolResults,
        };
      }
    }
    return { final: response, toolResults };
  }
}

function parseResponse(
  data: unknown,
  threadId: string
): BackboardMessageResponse {
  const d = data as {
    status?: string;
    content?: string;
    text?: string;
    message?: string;
    tool_calls?: Array<{
      id?: string;
      tool_call_id?: string;
      name?: string;
      function?: { name?: string; arguments?: unknown };
      arguments?: unknown;
    }>;
    requires_action?: { tool_calls?: unknown[] };
  };
  // Backboard returns status in UPPERCASE (REQUIRES_ACTION, COMPLETED,
  // IN_PROGRESS, FAILED, CANCELLED) per docs.backboard.io. Normalize before
  // comparison — earlier code compared against lowercase and silently
  // treated tool-call responses as completed, returning Backboard's
  // "Message added successfully" ack as the assistant reply.
  const rawStatus = (d?.status ?? "").toString().toLowerCase();
  let status: BackboardMessageResponse["status"] = "completed";
  if (rawStatus === "requires_action" || d?.requires_action) {
    status = "requires_action";
  } else if (rawStatus === "failed") {
    status = "failed";
  }
  const rawCalls =
    d?.tool_calls ?? (d?.requires_action?.tool_calls as unknown[]) ?? [];
  const toolCalls: BackboardToolCall[] = (rawCalls as Array<Record<string, unknown>>)
    .map((c) => {
      const fn = (c.function as { name?: string; arguments?: unknown }) ?? {};
      const name = (fn.name ?? c.name ?? "") as string;
      const argsRaw = (fn.arguments ?? c.arguments ?? {}) as unknown;
      let args: Record<string, unknown> = {};
      if (typeof argsRaw === "string") {
        try {
          args = JSON.parse(argsRaw);
        } catch {
          args = { _raw: argsRaw };
        }
      } else if (argsRaw && typeof argsRaw === "object") {
        args = argsRaw as Record<string, unknown>;
      }
      return {
        id: (c.id as string) ?? (c.tool_call_id as string) ?? `call_${Math.random().toString(36).slice(2, 8)}`,
        name,
        arguments: args,
      };
    })
    .filter((c) => c.name);

  // `d.message` is Backboard's request-level ack (e.g. "Message added
  // successfully"), NOT assistant content. Don't fall through to it — leave
  // content empty when the assistant produced no text (e.g. it's emitting
  // tool_calls instead, in which case status === "requires_action").
  return {
    threadId,
    status,
    content: d?.content ?? d?.text ?? "",
    toolCalls,
    rawResponse: data,
  };
}

let cached: BackboardClient | null = null;

export function getBackboardClient(): BackboardClient {
  if (cached) return cached;
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    // Return a stub that throws on use so dev work isn't blocked at import time
    return new StubBackboardClient();
  }
  cached = new BackboardImpl({
    apiKey,
    apiUrl: process.env.BACKBOARD_API_URL,
  });
  return cached;
}

class StubBackboardClient implements BackboardClient {
  private failPath() {
    throw new Error(
      "BACKBOARD_API_KEY missing — provide it in .env.local before invoking the live Backboard client."
    );
  }
  async createThread(_assistantId: string) {
    void _assistantId;
    return { id: `stub_thread_${Date.now()}` };
  }
  async sendMessage(): Promise<BackboardMessageResponse> {
    this.failPath();
    return null as never;
  }
  async submitToolOutputs(): Promise<BackboardMessageResponse> {
    this.failPath();
    return null as never;
  }
  async uploadDocument() {
    return { id: `stub_doc_${Date.now()}` };
  }
  async runToolLoop() {
    this.failPath();
    return null as never;
  }
}
