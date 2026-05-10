"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThreadKey = string;

interface ThreadState {
  threads: Record<ThreadKey, string>;
  inFlight: Record<ThreadKey, Promise<string>>;
  getOrCreate: (key: ThreadKey) => Promise<string>;
  set: (key: ThreadKey, threadId: string) => void;
  reset: (key: ThreadKey) => void;
  clearAll: () => void;
}

export const useThreadStore = create<ThreadState>()(
  persist(
    (set, get) => ({
      threads: {},
      inFlight: {},
      getOrCreate: async (key) => {
        const existing = get().threads[key];
        if (existing) return existing;
        const inFlight = get().inFlight[key];
        if (inFlight) return inFlight;
        const promise = (async () => {
          const res = await fetch("/api/backboard/thread", { method: "POST" });
          if (!res.ok) throw new Error("Failed to create Backboard thread");
          const data = (await res.json()) as { id: string };
          set((state) => ({
            threads: { ...state.threads, [key]: data.id },
            inFlight: Object.fromEntries(
              Object.entries(state.inFlight).filter(([k]) => k !== key)
            ),
          }));
          return data.id;
        })();
        set((state) => ({
          inFlight: { ...state.inFlight, [key]: promise },
        }));
        return promise;
      },
      set: (key, threadId) =>
        set((state) => ({
          threads: { ...state.threads, [key]: threadId },
        })),
      reset: (key) =>
        set((state) => {
          const next = { ...state.threads };
          delete next[key];
          return { threads: next };
        }),
      clearAll: () => set({ threads: {} }),
    }),
    {
      name: "enya-threads",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
      partialize: (state) => ({ threads: state.threads }),
    }
  )
);
