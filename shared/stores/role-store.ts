"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "teacher" | "student";

interface RoleState {
  role: Role;
  currentStudentId: string | null;
  setRole: (role: Role) => void;
  setStudent: (id: string | null) => void;
  effectiveTarget: () => "teacher" | { type: "student"; id: string };
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: "teacher",
      currentStudentId: null,
      setRole: (role) =>
        set({
          role,
          currentStudentId:
            role === "student" ? get().currentStudentId ?? "maya" : null,
        }),
      setStudent: (id) => set({ role: "student", currentStudentId: id }),
      effectiveTarget: () => {
        const s = get();
        return s.role === "teacher"
          ? "teacher"
          : { type: "student", id: s.currentStudentId ?? "maya" };
      },
    }),
    { name: "enya-role" }
  )
);
