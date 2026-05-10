"use client";

import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Send, Paperclip, X, Sparkles } from "lucide-react";
import { useTeacherChat } from "./use-teacher-chat";
import { ToolResultCard } from "./tool-result-cards";
import { cn } from "@shared/lib/utils";

const SUGGESTIONS = [
  "Create a Grade 3 photosynthesis course from this textbook.",
  "Audit my textbook for Bloom's taxonomy alignment.",
  "Maya (grade 3) just arrived from Syria. She loves reading and butterflies",
  "Show me Maya's analytics",
];

export function TeacherChat() {
  const {
    messages,
    attachments,
    isSending,
    send,
    uploadFile,
    removeAttachment,
  } = useTeacherChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const onDrop = (files: File[]) => {
    files.forEach((f) => uploadFile(f));
  };
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    const content = input.trim();
    setInput("");
    await send(content);
  };

  const showEmpty = messages.length === 1 && messages[0].id === "greeting";

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center h-screen relative",
        isDragActive && "ring-2 ring-yellow-500"
      )}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-30 bg-yellow-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-yellow-100 border-2 border-dashed border-yellow-500 p-6 font-bold text-yellow-900">
            Drop your textbook here
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="items-center justify-center  overflow-auto px-4 pt-6 pb-20"
      >
        <div className="max-w-xl mx-auto w-full">
          {showEmpty ? (
            <div className="text-center">
              <div>
                <h1 className="text-3xl font-semibold mb-1">
                  Hi! I&apos;m Enya.
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  What would you like to build?
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-center rounded-3xl bg-muted hover:bg-muted px-4 py-3 text-sm transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-2",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {m.role !== "system" && m.content && (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[80%] whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm",
                        m.pending && "opacity-60"
                      )}
                    >
                      {m.pending ? (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                        </span>
                      ) : (
                        m.content
                      )}
                    </div>
                  )}
                  {m.attachments?.map((a) => (
                    <div
                      key={a.filename}
                      className="text-xs px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-900 font-medium"
                    >
                      📎 {a.filename}
                    </div>
                  ))}
                  {m.toolResults?.map((r, i) => (
                    <div key={i} className="w-full max-w-[640px]">
                      <ToolResultCard result={r} />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-background/95 backdrop-blur max-w-xl mx-auto w-full"
      >
        <div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((a) => (
                <span
                  key={a.filename}
                  className={cn(
                    "inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full font-medium",
                    a.status === "ready"
                      ? "bg-yellow-100 text-yellow-900"
                      : a.status === "failed"
                      ? "bg-red-100 text-red-900"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  📎 {a.filename}
                  {a.status === "uploading" && " (parsing…)"}
                  {a.status === "failed" && " (failed)"}
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.filename)}
                    className="ml-0.5 hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={open}
              className="h-11 w-11 rounded-xl border-2 bg-background hover:bg-muted flex items-center justify-center"
              aria-label="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              placeholder="Create a course', 'audit my textbook', 'add Maya'…"
              className="flex-1 resize-none rounded-xl border-2 px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-yellow-400 max-h-32"
            />
            <button
              type="submit"
              disabled={isSending}
              className="h-11 w-11 rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
