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
  // Full per-turn system prompt override. When set, replaces the assistant's
  // default system prompt for THIS turn only — used by analytical handlers
  // (audit, course outline, etc.) to inject a tightly-scoped task brief.
  // Maps to Backboard's `system_prompt` body field.
  systemPrompt?: string;
  // Request structured JSON output. Maps to Backboard's `json_output`. Per
  // docs: silently ignored when documents (RAG) / web_search / tools are
  // active on the message — for those cases we instruct via systemPrompt
  // and parse JSON-from-text on the caller side.
  jsonOutput?: boolean;
}

/** One-shot structured call against an assistant (no thread chaining). */
export interface RunStructuredCallOptions<T> {
  assistantId: string;
  systemPrompt: string;
  content: string;
  llmProvider?: SendMessageOptions["llmProvider"];
  modelName?: string;
  // When true, sends `json_output: true`. Caller is responsible for knowing
  // whether this is compatible with the message (i.e. no RAG/tools/web_search).
  jsonOutput?: boolean;
  // Optional thread to reuse for context retention. Omit to use the assistant's
  // default ephemeral thread (Backboard auto-creates one).
  threadId?: string;
  // Validator/transformer applied to the parsed JSON. Throws on invalid.
  parser: (raw: unknown) => T;
  // Memory mode for this call. Default "Readonly" — analytical calls should
  // see student/course memory but NOT bloat memory with one-off generations.
  memory?: MemoryMode;
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

export interface DocumentStatus {
  documentId: string;
  filename?: string;
  status: "pending" | "processing" | "indexed" | "error";
  statusMessage?: string;
  chunkCount?: number;
  totalTokens?: number;
}

export interface MemoryEntry {
  memoryId: string;
  content: string;
  metadata?: Record<string, unknown>;
  score?: number;
}

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
  getDocumentStatus(documentId: string): Promise<DocumentStatus>;
  /** Poll until status === 'indexed' or 'error', or maxMs elapses. */
  waitForDocumentIndexed(
    documentId: string,
    opts?: { maxMs?: number; intervalMs?: number }
  ): Promise<DocumentStatus>;
  /** POST /assistants/{id}/memories — write a fact. */
  addMemory(
    assistantId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<{ memoryId: string }>;
  /** POST /assistants/{id}/memories/search — semantic search. */
  searchMemories(
    assistantId: string,
    query: string,
    limit?: number
  ): Promise<MemoryEntry[]>;
  /** GET /assistants/{id}/memories — list all (paginated). */
  listMemories(
    assistantId: string,
    opts?: { page?: number; pageSize?: number }
  ): Promise<{ memories: MemoryEntry[]; totalCount: number }>;
  runToolLoop(
    opts: SendMessageOptions,
    handlers: ToolHandlerMap,
    maxRounds?: number
  ): Promise<{
    final: BackboardMessageResponse;
    toolResults: { toolName: string; args: unknown; output: unknown }[];
  }>;
  /**
   * One-shot structured call against an assistant — used by analytical
   * tool handlers that want JSON back from a side-thread without polluting
   * the user-facing chat thread. Spawns an ephemeral thread per call.
   */
  runStructuredCall<T>(opts: RunStructuredCallOptions<T>): Promise<T>;
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
    // Same Backboard streaming-pipeline issue affects POST /threads/messages
    // on follow-up turns (notably after a previous tool roundtrip): the user
    // message and assistant reply both land server-side, but the response
    // stream returns HTTP 500. We snapshot the thread length before the
    // POST so we can recover by polling for the new assistant reply.
    const body: Record<string, unknown> = {
      thread_id: opts.threadId,
      content: opts.content,
      tools: opts.tools,
      memory: opts.memory ?? "Auto",
      llm_provider: opts.llmProvider,
      model_name: opts.modelName,
      // Per docs: `system_prompt` is the per-turn override (not
      // `system_addendum`, which is not a real field). When omitted the
      // assistant's stored description applies.
      system_prompt: opts.systemPrompt,
      // Per docs: `json_output` (not `response_format`). Also: docs warn
      // it's silently ignored when tools/RAG/web_search are active on the
      // turn — analytical callers handle that by instructing JSON shape
      // in the systemPrompt and parsing JSON-from-text downstream.
      json_output: opts.jsonOutput,
    };
    // Strip undefined keys so we don't send them as JSON `null`.
    for (const k of Object.keys(body)) {
      if (body[k] === undefined) delete body[k];
    }

    const baselineCount = await this.getThreadMessageCount(
      opts.threadId
    ).catch(() => 0);

    try {
      const { data } = await this.http.post(`/threads/messages`, body);
      return parseResponse(data, opts.threadId);
    } catch (err) {
      const ax = err as AxiosError;
      if (ax.response?.status === 500) {
        console.warn(
          `[backboard:sendMessage] 500 from /threads/messages — likely streaming ` +
            `blip. Polling thread for assistant reply or tool_calls…`
        );
        const recovered = await this.pollForAssistantReply(
          opts.threadId,
          baselineCount
        );
        if (recovered) return recovered;
      }
      throw err;
    }
  }

  async submitToolOutputs(
    threadId: string,
    toolOutputs: ToolOutput[]
  ): Promise<BackboardMessageResponse> {
    // Backboard known issue (confirmed via support 2026-05): POST
    // /threads/tool-outputs accepts the submission server-side but the
    // streaming response pipeline returns HTTP 500 instead of the
    // assistant's reply. The run completes in the background — the
    // assistant's real follow-up message is appended to the thread within
    // ~1-2s. Recovery: on 500 (or 404 "already submitted" from retries),
    // poll GET /threads/{id} until a new completed assistant message
    // appears, then return THAT as the response.
    //
    // We bypass withRetry here because pRetry would also attempt the
    // submit a 2nd time, which then 404s with "already submitted" and
    // poisons the error trail. Recovery is handled inline.
    const body = {
      thread_id: threadId,
      tool_outputs: toolOutputs.map((o) => ({
        tool_call_id: o.toolCallId,
        output:
          typeof o.output === "string"
            ? o.output
            : JSON.stringify(o.output),
      })),
    };

    // Snapshot message count BEFORE submit so we can detect new replies.
    const baselineCount = await this.getThreadMessageCount(threadId).catch(
      () => 0
    );

    try {
      const { data } = await this.http.post(`/threads/tool-outputs`, body);
      return parseResponse(data, threadId);
    } catch (err) {
      const ax = err as AxiosError;
      const status = ax.response?.status;
      const detail = JSON.stringify(ax.response?.data ?? "");
      const isStreamingBlip500 = status === 500;
      // Backboard returns 404 with body "Thread not found, or no pending
      // REQUIRES_ACTION on the thread" when the outputs were already
      // consumed (a previous attempt landed despite a streaming-blip 500).
      // The legacy "already submitted" wording never matched in practice —
      // match what the docs / live API actually return.
      const isAlreadySubmitted404 =
        status === 404 &&
        /already submitted|no pending|requires_action/i.test(detail);
      if (isStreamingBlip500 || isAlreadySubmitted404) {
        console.warn(
          `[backboard:submitToolOutputs] ${status} likely streaming-pipeline ` +
            `blip — submission may have landed. Polling thread for assistant reply…`
        );
        const recovered = await this.pollForAssistantReply(
          threadId,
          baselineCount
        );
        if (recovered) return recovered;
      }
      throw err;
    }
  }

  private async getThreadMessageCount(threadId: string): Promise<number> {
    const { data } = await this.http.get(`/threads/${threadId}`);
    return Array.isArray(data?.messages) ? data.messages.length : 0;
  }

  private async pollForAssistantReply(
    threadId: string,
    baselineCount: number,
    opts: { maxMs?: number; intervalMs?: number } = {}
  ): Promise<BackboardMessageResponse | null> {
    const maxMs = opts.maxMs ?? 20_000;
    const intervalMs = opts.intervalMs ?? 1_000;
    const start = Date.now();
    // Capture the last assistant message we saw so we can emit a diagnostic
    // if recovery times out — knowing the final state of the thread is the
    // difference between "Backboard never replied" and "Backboard replied
    // with REQUIRES_ACTION but we couldn't extract tool_calls."
    let lastSeenAssistantStatus: string | null = null;
    while (Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        const { data } = await this.http.get(`/threads/${threadId}`);
        const msgs = (data?.messages ?? []) as Array<{
          role?: string;
          status?: string;
          content?: string | null;
          tool_calls?: unknown[];
          requires_action?: { tool_calls?: unknown[] };
        }>;
        if (msgs.length <= baselineCount) continue;
        // Walk from the end for the newest recoverable assistant turn. We
        // accept two outcomes:
        //   1. COMPLETED + text  → the model's final reply; return as completed.
        //   2. REQUIRES_ACTION + tool_calls → the model chained to another
        //      tool call (e.g. parse_uploaded_document → audit_content_pedagogically).
        //      Return as requires_action so runToolLoop can continue the loop.
        // The earlier version only handled (1) and silently skipped (2),
        // which is why audit-after-upload turns failed: the streaming-blip
        // 500 hid a perfectly-valid chained tool call.
        for (let i = msgs.length - 1; i >= baselineCount; i--) {
          const m = msgs[i];
          if (m.role !== "assistant") continue;
          const status = (m.status ?? "").toString().toUpperCase();
          if (status === "COMPLETED") {
            const text = (m.content ?? "").trim();
            if (text) {
              console.info(
                `[backboard:pollForAssistantReply] recovered COMPLETED reply ` +
                  `after ${Date.now() - start}ms (msg index ${i})`
              );
              return parseResponse(
                { status: "COMPLETED", content: text },
                threadId
              );
            }
          }
          if (status === "REQUIRES_ACTION") {
            lastSeenAssistantStatus = "REQUIRES_ACTION";
            const toolCalls =
              m.tool_calls ?? m.requires_action?.tool_calls ?? [];
            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
              console.info(
                `[backboard:pollForAssistantReply] recovered REQUIRES_ACTION ` +
                  `(${toolCalls.length} tool call(s)) after ${Date.now() - start}ms ` +
                  `(msg index ${i})`
              );
              return parseResponse(
                {
                  status: "REQUIRES_ACTION",
                  tool_calls: toolCalls,
                  content: null,
                },
                threadId
              );
            }
          }
          if (status === "COMPLETED" || status === "REQUIRES_ACTION") {
            lastSeenAssistantStatus = status;
          }
        }
      } catch {
        // Transient GET failure — keep polling until window elapses.
      }
    }
    console.warn(
      `[backboard:pollForAssistantReply] no recoverable assistant reply in ` +
        `${maxMs}ms (last seen assistant status: ${lastSeenAssistantStatus ?? "none"})`
    );
    return null;
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    return this.withRetry(async () => {
      const { data } = await this.http.get(`/documents/${documentId}/status`);
      return {
        documentId: data.document_id ?? documentId,
        filename: data.filename,
        status: ((data.status ?? "pending") as string).toLowerCase() as DocumentStatus["status"],
        statusMessage: data.status_message,
        chunkCount: data.chunk_count,
        totalTokens: data.total_tokens,
      };
    }, "getDocumentStatus");
  }

  async waitForDocumentIndexed(
    documentId: string,
    opts: { maxMs?: number; intervalMs?: number } = {}
  ): Promise<DocumentStatus> {
    const maxMs = opts.maxMs ?? 30_000;
    const intervalMs = opts.intervalMs ?? 1_500;
    const start = Date.now();
    let last: DocumentStatus = {
      documentId,
      status: "pending",
    };
    while (Date.now() - start < maxMs) {
      try {
        last = await this.getDocumentStatus(documentId);
        if (last.status === "indexed" || last.status === "error") return last;
      } catch (err) {
        // Transient errors (e.g. 404 right after upload) are normal — keep polling.
        console.warn(
          `[backboard:waitForDocumentIndexed] poll error for ${documentId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    console.warn(
      `[backboard:waitForDocumentIndexed] timed out after ${maxMs}ms for ${documentId} (last status: ${last.status})`
    );
    return last;
  }

  async addMemory(
    assistantId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<{ memoryId: string }> {
    return this.withRetry(async () => {
      const { data } = await this.http.post(
        `/assistants/${assistantId}/memories`,
        { content, metadata }
      );
      return {
        memoryId: data.memory_id ?? data.id ?? data.memoryId,
      };
    }, "addMemory");
  }

  async searchMemories(
    assistantId: string,
    query: string,
    limit = 10
  ): Promise<MemoryEntry[]> {
    return this.withRetry(async () => {
      const { data } = await this.http.post(
        `/assistants/${assistantId}/memories/search`,
        { query, limit }
      );
      const list = (data.memories ?? data.results ?? []) as Array<
        Record<string, unknown>
      >;
      return list.map((m) => ({
        memoryId: (m.memory_id ?? m.id ?? "") as string,
        content: (m.content ?? "") as string,
        metadata: (m.metadata ?? {}) as Record<string, unknown>,
        score: typeof m.score === "number" ? m.score : undefined,
      }));
    }, "searchMemories");
  }

  async listMemories(
    assistantId: string,
    opts: { page?: number; pageSize?: number } = {}
  ): Promise<{ memories: MemoryEntry[]; totalCount: number }> {
    return this.withRetry(async () => {
      const params: Record<string, number> = {};
      if (opts.page) params.page = opts.page;
      if (opts.pageSize) params.page_size = opts.pageSize;
      const { data } = await this.http.get(
        `/assistants/${assistantId}/memories`,
        { params }
      );
      const list = (data.memories ?? []) as Array<Record<string, unknown>>;
      return {
        memories: list.map((m) => ({
          memoryId: (m.memory_id ?? m.id ?? "") as string,
          content: (m.content ?? "") as string,
          metadata: (m.metadata ?? {}) as Record<string, unknown>,
        })),
        totalCount: (data.total_count as number) ?? list.length,
      };
    }, "listMemories");
  }

  async runStructuredCall<T>(opts: RunStructuredCallOptions<T>): Promise<T> {
    // Spawn a fresh ephemeral thread so this call doesn't pollute any
    // user-facing chat thread. Reuse one if the caller passed it.
    const threadId = opts.threadId ?? (await this.createThread(opts.assistantId)).id;
    // Pass `tools: []` explicitly. The assistant has the master tool set
    // configured at assistant level; without an empty override the model
    // tries to call them and we get back REQUIRES_ACTION instead of JSON.
    // Empty array disables tools just for this turn.
    const response = await this.sendMessage({
      threadId,
      assistantId: opts.assistantId,
      content: opts.content,
      systemPrompt: opts.systemPrompt,
      llmProvider: opts.llmProvider,
      modelName: opts.modelName,
      jsonOutput: opts.jsonOutput,
      memory: opts.memory ?? "Readonly",
      tools: [],
    });
    if (response.status !== "completed") {
      throw new Error(
        `[backboard:runStructuredCall] unexpected status '${response.status}' (expected JSON-only completion)`
      );
    }
    const raw = extractJsonFromText(response.content);
    return opts.parser(raw);
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

/**
 * Pull a JSON object out of a model reply. Tolerates raw JSON, ```json fences,
 * untagged ``` fences, and a single JSON object embedded in prose. Throws if
 * no parseable object is found — caller should catch + fall back.
 */
export function extractJsonFromText(text: string): unknown {
  const trimmed = (text ?? "").trim();
  if (!trimmed) throw new Error("[extractJsonFromText] empty model reply");

  // 1. Try raw parse.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // 2. Try a ```json fence (or untagged ``` fence).
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }

  // 3. Greedy first-{ to last-} (or [ to ]) — handles prose wrappers.
  const firstBrace = Math.min(
    ...["{", "["]
      .map((c) => trimmed.indexOf(c))
      .filter((i) => i >= 0)
  );
  if (Number.isFinite(firstBrace)) {
    const open = trimmed[firstBrace];
    const close = open === "{" ? "}" : "]";
    const lastClose = trimmed.lastIndexOf(close);
    if (lastClose > firstBrace) {
      const slice = trimmed.slice(firstBrace, lastClose + 1);
      try {
        return JSON.parse(slice);
      } catch {
        /* fall through */
      }
    }
  }
  throw new Error(
    `[extractJsonFromText] no parseable JSON in reply (first 120 chars: ${trimmed.slice(0, 120)})`
  );
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
  private failPath(): never {
    throw new Error(
      "BACKBOARD_API_KEY missing — provide it in .env.local before invoking the live Backboard client."
    );
  }
  async createThread(_assistantId: string) {
    void _assistantId;
    return { id: `stub_thread_${Date.now()}` };
  }
  async sendMessage(): Promise<BackboardMessageResponse> {
    return this.failPath();
  }
  async submitToolOutputs(): Promise<BackboardMessageResponse> {
    return this.failPath();
  }
  async uploadDocument() {
    return { id: `stub_doc_${Date.now()}` };
  }
  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    return { documentId, status: "indexed" };
  }
  async waitForDocumentIndexed(documentId: string): Promise<DocumentStatus> {
    return { documentId, status: "indexed" };
  }
  async addMemory(): Promise<{ memoryId: string }> {
    return { memoryId: `stub_mem_${Date.now()}` };
  }
  async searchMemories(): Promise<MemoryEntry[]> {
    return [];
  }
  async listMemories(): Promise<{ memories: MemoryEntry[]; totalCount: number }> {
    return { memories: [], totalCount: 0 };
  }
  async runToolLoop(): ReturnType<BackboardClient["runToolLoop"]> {
    return this.failPath();
  }
  async runStructuredCall<T>(): Promise<T> {
    return this.failPath();
  }
}
