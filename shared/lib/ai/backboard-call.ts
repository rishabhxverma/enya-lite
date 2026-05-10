/**
 * Wrappers around Backboard's `runStructuredCall` that bake in the per-tool
 * model override matrix from `ultraplan-00-architecture.md` §4.4.
 *
 * Use these instead of calling `runStructuredCall` directly so the model
 * choice for each task lives in one place.
 */
import { z } from "zod";
import {
  getBackboardClient,
  type BackboardClient,
  type RunStructuredCallOptions,
} from "@shared/lib/backboard";

function assistantId(): string {
  const id = process.env.BACKBOARD_ASSISTANT_ID;
  if (!id)
    throw new Error(
      "BACKBOARD_ASSISTANT_ID missing — set it in .env.local before calling AI tools."
    );
  return id;
}

function client(): BackboardClient {
  return getBackboardClient();
}

/** Per-task model override matrix from architecture §4.4. */
export const MODELS = {
  // Generation: Claude Sonnet 4 — strong on long-form structured output.
  generation: {
    llmProvider: "anthropic" as const,
    modelName: "claude-sonnet-4-20250514",
  },
  // Quizzes / structured JSON: GPT-4o — best JSON adherence.
  quizJson: {
    llmProvider: "openai" as const,
    modelName: "gpt-4o",
  },
  // Fast chat / lightweight analysis: Gemini 2.5 Flash (Backboard's
  // current Gemini build — 2.0-flash is not on the platform).
  fastChat: {
    llmProvider: "google" as const,
    modelName: "gemini-2.5-flash",
  },
};

export interface CallOpts<T> {
  systemPrompt: string;
  content: string;
  schema: z.ZodType<T>;
  /** Pick a model from MODELS, or pass a custom override. */
  model?: { llmProvider: "openai" | "anthropic" | "google"; modelName: string };
  /** Reuse a thread (e.g. multi-turn placement quiz). Otherwise spawn ephemeral. */
  threadId?: string;
  /** Memory mode override. Default Readonly (don't bloat memory). */
  memory?: "Auto" | "Readonly" | "Off";
}

/** Generic typed structured call. */
export async function callForJson<T>(opts: CallOpts<T>): Promise<T> {
  const m = opts.model ?? MODELS.generation;
  const callOpts: RunStructuredCallOptions<T> = {
    assistantId: assistantId(),
    systemPrompt: opts.systemPrompt,
    content: opts.content,
    threadId: opts.threadId,
    llmProvider: m.llmProvider,
    modelName: m.modelName,
    memory: opts.memory ?? "Readonly",
    parser: (raw: unknown): T => {
      const parsed = opts.schema.safeParse(raw);
      if (!parsed.success) {
        // Tolerant: log + try to coerce. Some downstream consumers will
        // accept passthrough fields; the schema uses .passthrough() so
        // most drift cases pass anyway. If safeParse failed it means
        // required fields are missing — surface the error.
        console.warn(
          `[ai:callForJson] schema validation failed: ${parsed.error.message.slice(0, 200)}`
        );
        throw new Error(`Schema validation failed: ${parsed.error.message}`);
      }
      return parsed.data;
    },
  };
  return client().runStructuredCall(callOpts);
}

/** Reference an indexed Backboard document by ID inside the message body so
 *  the assistant's RAG layer retrieves chunks for context. */
export function withDocumentRef(documentId: string | undefined, body: string): string {
  if (!documentId) return body;
  return `${body}\n\n[CONTEXT: documentId ${documentId} — use RAG retrieval to ground every claim in the actual document content. If you cannot find evidence in the document, say so plainly rather than inventing.]`;
}

/** Memory helpers — these are convenience wrappers so handlers don't have
 *  to grab the client manually. */
export async function rememberFact(content: string, metadata?: Record<string, unknown>) {
  return client().addMemory(assistantId(), content, metadata);
}

export async function recallFacts(query: string, limit = 5) {
  return client().searchMemories(assistantId(), query, limit);
}

export async function listAllMemories(opts?: { page?: number; pageSize?: number }) {
  return client().listMemories(assistantId(), opts);
}
