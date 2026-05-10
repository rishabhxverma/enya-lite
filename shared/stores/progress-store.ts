"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudentProgress } from "@shared/types";

const DEFAULT_PROGRESS: Omit<StudentProgress, "studentId"> = {
  xp: 0,
  streakDays: 0,
  completedActivities: [],
  quizScores: {},
  skillMastery: {},
};

interface ProgressState {
  progressByStudent: Record<string, StudentProgress>;
  hydrate: () => Promise<void>;
  getProgress: (studentId: string) => StudentProgress;
  markActivityComplete: (studentId: string, activityId: string) => void;
  awardXp: (studentId: string, amount: number) => void;
  recordQuizScore: (studentId: string, quizId: string, scorePct: number) => void;
  updateSkillMastery: (
    studentId: string,
    skillId: string,
    delta: number
  ) => void;
  resetStudent: (studentId: string) => void;
  hydrateForStudent: (studentId: string, data: Partial<StudentProgress>) => void;
}

const ensure = (
  byStudent: Record<string, StudentProgress>,
  studentId: string
): StudentProgress => {
  return (
    byStudent[studentId] ?? {
      studentId,
      ...DEFAULT_PROGRESS,
    }
  );
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progressByStudent: {},
      hydrate: async () => {
        try {
          const res = await fetch("/seed/_progress.json", { cache: "no-store" });
          if (!res.ok) return;
          const data = (await res.json()) as Record<string, StudentProgress>;
          set((state) => ({
            progressByStudent: { ...data, ...state.progressByStudent },
          }));
        } catch {
          /* ignore */
        }
      },
      getProgress: (studentId) => ensure(get().progressByStudent, studentId),
      markActivityComplete: (studentId, activityId) =>
        set((state) => {
          const prev = ensure(state.progressByStudent, studentId);
          if (prev.completedActivities.includes(activityId)) return state;
          return {
            progressByStudent: {
              ...state.progressByStudent,
              [studentId]: {
                ...prev,
                completedActivities: [...prev.completedActivities, activityId],
              },
            },
          };
        }),
      awardXp: (studentId, amount) =>
        set((state) => {
          const prev = ensure(state.progressByStudent, studentId);
          return {
            progressByStudent: {
              ...state.progressByStudent,
              [studentId]: { ...prev, xp: prev.xp + amount },
            },
          };
        }),
      recordQuizScore: (studentId, quizId, scorePct) =>
        set((state) => {
          const prev = ensure(state.progressByStudent, studentId);
          return {
            progressByStudent: {
              ...state.progressByStudent,
              [studentId]: {
                ...prev,
                quizScores: { ...prev.quizScores, [quizId]: scorePct },
              },
            },
          };
        }),
      updateSkillMastery: (studentId, skillId, delta) =>
        set((state) => {
          const prev = ensure(state.progressByStudent, studentId);
          const current = prev.skillMastery[skillId] ?? 0;
          const next = Math.min(100, Math.max(0, current + delta));
          return {
            progressByStudent: {
              ...state.progressByStudent,
              [studentId]: {
                ...prev,
                skillMastery: { ...prev.skillMastery, [skillId]: next },
              },
            },
          };
        }),
      resetStudent: (studentId) =>
        set((state) => {
          const next = { ...state.progressByStudent };
          delete next[studentId];
          return { progressByStudent: next };
        }),
      hydrateForStudent: (studentId, data) =>
        set((state) => ({
          progressByStudent: {
            ...state.progressByStudent,
            [studentId]: {
              ...ensure(state.progressByStudent, studentId),
              ...data,
              studentId,
            },
          },
        })),
    }),
    { name: "enya-progress" }
  )
);
