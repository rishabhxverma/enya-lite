"use client";

import { useCallback, useState } from "react";
import { useThreadStore } from "@shared/stores/thread-store";
import { backboardService } from "@shared/services/backboard-service";
import { teacherService } from "@shared/services/teacher-service";

export interface ToolResultRow {
  toolName: string;
  args: unknown;
  output: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolResults?: ToolResultRow[];
  attachments?: {
    documentId?: string;
    filename?: string;
    pageCount?: number;
    chunkCount?: number;
  }[];
  pending?: boolean;
}

export interface AttachmentChip {
  uploadId?: string;
  documentId?: string;
  filename: string;
  status: "uploading" | "ready" | "failed";
  pageCount?: number;
  chunkCount?: number;
}

const greetingMsg: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm Enya. I can help you create a course from your textbook, audit your materials for Bloom's alignment, set up a classroom, or review student progress. What would you like to do today?",
};

export function useTeacherChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMsg]);
  const [attachments, setAttachments] = useState<AttachmentChip[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { getOrCreate, set: setThread } = useThreadStore();

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() && attachments.length === 0) return;
      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        content,
        attachments: attachments.map((a) => ({
          documentId: a.documentId,
          filename: a.filename,
          pageCount: a.pageCount,
          chunkCount: a.chunkCount,
        })),
      };
      const pendingId = `a_${Date.now()}`;
      const pendingMsg: ChatMessage = {
        id: pendingId,
        role: "assistant",
        content: "…",
        pending: true,
      };
      setMessages((m) => [...m, userMsg, pendingMsg]);
      setIsSending(true);

      try {
        const threadId = await getOrCreate("teacher-main");
        const reply = await backboardService.sendMessage({
          threadId,
          role: "teacher",
          content,
          attachments: userMsg.attachments,
        });
        // Server may rotate a stale stub_thread_* into a real Backboard
        // thread; persist the new id so subsequent turns hit the right one.
        if (reply.threadRotated && reply.threadId !== threadId) {
          setThread("teacher-main", reply.threadId);
        }
        setMessages((m) =>
          m.map((msg) =>
            msg.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content: reply.content,
                  toolResults: reply.toolResults,
                }
              : msg
          )
        );
        // Clear attachments after a successful send
        setAttachments([]);
      } catch (err) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content: `I hit a snag: ${err instanceof Error ? err.message : String(err)}`,
                }
              : msg
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [attachments, getOrCreate, setThread]
  );

  /**
   * Upload a file: hits the parse-document route directly (which calls Docling
   * + uploads to Backboard) and adds an attachment chip when ready.
   * Also injects a synthetic UploadStatusCard tool-result message into the
   * conversation so the teacher sees parsing progress inline.
   */
  const uploadFile = useCallback(async (file: File) => {
    const placeholderId = `att_${Date.now()}`;
    const cardMsgId = `s_${Date.now()}`;
    setAttachments((a) => [
      ...a,
      { uploadId: placeholderId, filename: file.name, status: "uploading" },
    ]);
    setMessages((m) => [
      ...m,
      {
        id: cardMsgId,
        role: "system",
        content: "",
        toolResults: [
          {
            toolName: "parse_uploaded_document",
            args: { fileName: file.name },
            output: { status: "parsing", filename: file.name },
          },
        ],
      },
    ]);

    try {
      const result = await teacherService.uploadDocument(file);
      setAttachments((a) =>
        a.map((x) =>
          x.uploadId === placeholderId
            ? {
                ...x,
                documentId: result.documentId,
                status: "ready",
                pageCount: result.pageCount,
                chunkCount: result.chunkCount,
              }
            : x
        )
      );
      setMessages((m) =>
        m.map((msg) =>
          msg.id === cardMsgId
            ? {
                ...msg,
                toolResults: [
                  {
                    toolName: "parse_uploaded_document",
                    args: { fileName: file.name },
                    output: {
                      status: "ready",
                      filename: file.name,
                      pageCount: result.pageCount,
                      chunkCount: result.chunkCount,
                      documentId: result.documentId,
                    },
                  },
                ],
              }
            : msg
        )
      );
    } catch (err) {
      setAttachments((a) =>
        a.map((x) =>
          x.uploadId === placeholderId ? { ...x, status: "failed" } : x
        )
      );
      setMessages((m) =>
        m.map((msg) =>
          msg.id === cardMsgId
            ? {
                ...msg,
                toolResults: [
                  {
                    toolName: "parse_uploaded_document",
                    args: { fileName: file.name },
                    output: {
                      status: "failed",
                      filename: file.name,
                      error:
                        err instanceof Error ? err.message : String(err),
                    },
                  },
                ],
              }
            : msg
        )
      );
    }
  }, []);

  const removeAttachment = useCallback((filename: string) => {
    setAttachments((a) => a.filter((x) => x.filename !== filename));
  }, []);

  const reset = useCallback(() => {
    setMessages([greetingMsg]);
    setAttachments([]);
  }, []);

  return {
    messages,
    attachments,
    isSending,
    send,
    uploadFile,
    removeAttachment,
    reset,
  };
}
