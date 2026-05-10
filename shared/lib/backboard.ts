import axios, { type AxiosInstance, AxiosError } from "axios";
import pRetry from "p-retry";
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
  createThread(): Promise<CreateThreadResult>;
  sendMessage(opts: SendMessageOptions): Promise<BackboardMessageResponse>;
  submitToolOutputs(
    threadId: string,
    toolOutputs: ToolOutput[]
  ): Promise<BackboardMessageResponse>;
  uploadDocument(
    file: Buffer | Blob,
    name: string
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
      baseURL: cfg.apiUrl ?? "https://api.backboard.io",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
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
            throw new pRetry.AbortError(
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

  async createThread(): Promise<CreateThreadResult> {
    return this.withRetry(async () => {
      const { data } = await this.http.post("/v1/threads", {});
      return { id: data.id ?? data.thread_id ?? data.threadId };
    }, "createThread");
  }

  async sendMessage(
    opts: SendMessageOptions
  ): Promise<BackboardMessageResponse> {
    return this.withRetry(async () => {
      const { data } = await this.http.post(
        `/v1/threads/${opts.threadId}/messages`,
        {
          assistant_id: opts.assistantId,
          content: opts.content,
          tools: opts.tools,
          memory: opts.memory ?? "Auto",
          llm_provider: opts.llmProvider,
          model_name: opts.modelName,
          system_addendum: opts.systemPromptAddendum,
          response_format: opts.responseFormat,
        }
      );
      return parseResponse(data, opts.threadId);
    }, "sendMessage");
  }

  async submitToolOutputs(
    threadId: string,
    toolOutputs: ToolOutput[]
  ): Promise<BackboardMessageResponse> {
    return this.withRetry(async () => {
      const { data } = await this.http.post(
        `/v1/threads/${threadId}/tool-outputs`,
        {
          tool_outputs: toolOutputs.map((o) => ({
            tool_call_id: o.toolCallId,
            output:
              typeof o.output === "string"
                ? o.output
                : JSON.stringify(o.output),
          })),
        }
      );
      return parseResponse(data, threadId);
    }, "submitToolOutputs");
  }

  async uploadDocument(file: Buffer | Blob, name: string) {
    return this.withRetry(async () => {
      const formData = new FormData();
      // Node Buffer -> Blob
      const blob =
        file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
      formData.append("file", blob, name);
      const { data } = await this.http.post("/v1/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      response = await this.submitToolOutputs(opts.threadId, outputs);
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
  let status: BackboardMessageResponse["status"] = "completed";
  if (d?.status === "requires_action" || d?.requires_action) {
    status = "requires_action";
  } else if (d?.status === "failed") {
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

  return {
    threadId,
    status,
    content: d?.content ?? d?.text ?? d?.message ?? "",
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
  async createThread() {
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
