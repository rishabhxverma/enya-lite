async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export interface BackboardMessageReply {
  threadId: string;
  // True when the server rotated a stub_thread_* (or otherwise invalid)
  // threadId to a fresh real Backboard thread. Callers should persist
  // `threadId` back to the thread store when this is set.
  threadRotated?: boolean;
  content: string;
  toolResults: { toolName: string; args: unknown; output: unknown }[];
}

export const backboardService = {
  createThread: () => post<{ id: string }>("/api/backboard/thread", {}),
  sendMessage: (input: {
    threadId: string;
    content: string;
    role: "teacher" | "student";
    studentId?: string;
    attachments?: { documentId?: string; filename?: string }[];
  }) => post<BackboardMessageReply>("/api/backboard/message", input),
};
