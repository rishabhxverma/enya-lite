"use client";

import { create } from "zustand";
import type { StudentProfile } from "@shared/types";

interface StudentState {
  students: StudentProfile[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getById: (id: string) => StudentProfile | undefined;
  addStudent: (profile: Omit<StudentProfile, "id">) => StudentProfile;
  updateStudent: (id: string, patch: Partial<StudentProfile>) => void;
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const res = await fetch("/seed/students.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load students.json");
      const students = (await res.json()) as StudentProfile[];
      set({ students, hydrated: true });
    } catch (err) {
      console.error("[student-store] hydrate failed", err);
      set({ hydrated: true });
    }
  },
  getById: (id) => get().students.find((s) => s.id === id),
  addStudent: (profile) => {
    const id = slug(profile.name);
    const next: StudentProfile = { ...profile, id };
    set((state) => ({ students: [...state.students, next] }));
    return next;
  },
  updateStudent: (id, patch) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
}));
