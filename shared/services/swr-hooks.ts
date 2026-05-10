"use client";

// SWR-cached read hooks for the demo data flow.
//
// The previous `useEffect → fetch → setState` pattern re-fired every time the
// presenter flipped Maya↔Liam, which (a) hit the API again, (b) caused a flash
// of skeleton UI on every flip. SWR dedupes by key, holds the previous data
// while revalidating, and retries on failure — much smoother for a live demo.
//
// Keys follow the pattern `student:<studentId>:<resource>:<id?>`. The fetcher
// closes over the relevant `studentService` method and lets the seed-fallback
// runtime toggle still take effect (the service decides where to read from).

import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { studentService } from "./student-service";
import type {
  PersonalizedDashboard,
  StudentProgress,
  TextLessonContent,
  VideoLessonContent,
  StoryGameNode,
} from "@shared/types";

// Demo-friendly defaults: don't refetch on focus (judges click around), keep
// stale data while revalidating, retry once with a 1s delay.
const DEFAULT_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  dedupingInterval: 4000,
  keepPreviousData: true,
};

function withDefaults<T>(extra?: SWRConfiguration): SWRConfiguration {
  return { ...DEFAULT_CONFIG, ...(extra ?? {}) };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useStudentDashboardSWR(
  studentId: string | null | undefined,
  config?: SWRConfiguration
): SWRResponse<PersonalizedDashboard | null> {
  const key = studentId ? `student:${studentId}:dashboard` : null;
  return useSWR<PersonalizedDashboard | null>(
    key,
    async () => {
      if (!studentId) return null;
      const data = await studentService.getDashboard(studentId);
      return data as PersonalizedDashboard;
    },
    withDefaults(config)
  );
}

// ---------------------------------------------------------------------------
// Text lesson
// ---------------------------------------------------------------------------

export function useTextLessonSWR(
  studentId: string | null | undefined,
  lessonId: string | null | undefined,
  topic = "photosynthesis",
  learningObjectives: string[] = [],
  config?: SWRConfiguration
): SWRResponse<TextLessonContent | null> {
  const key =
    studentId && lessonId
      ? `student:${studentId}:lesson:${lessonId}:text`
      : null;
  return useSWR<TextLessonContent | null>(
    key,
    async () => {
      if (!studentId || !lessonId) return null;
      const data = await studentService.generateTextLesson({
        studentId,
        lessonId,
        topic,
        learningObjectives,
      });
      return data as TextLessonContent;
    },
    withDefaults(config)
  );
}

// ---------------------------------------------------------------------------
// Video lesson questions
// ---------------------------------------------------------------------------

export function useVideoLessonSWR(
  studentId: string | null | undefined,
  lessonId: string | null | undefined,
  youtubeId: string,
  learningObjectives: string[] = [],
  config?: SWRConfiguration
): SWRResponse<VideoLessonContent | null> {
  const key =
    studentId && lessonId
      ? `student:${studentId}:lesson:${lessonId}:video:${youtubeId}`
      : null;
  return useSWR<VideoLessonContent | null>(
    key,
    async () => {
      if (!studentId || !lessonId) return null;
      const data = await studentService.generateVideoQuestions({
        studentId,
        lessonId,
        youtubeId,
        learningObjectives,
      });
      return data as VideoLessonContent;
    },
    withDefaults(config)
  );
}

// ---------------------------------------------------------------------------
// Story node (initial / requested node)
// ---------------------------------------------------------------------------

export function useStoryNodeSWR(
  studentId: string | null | undefined,
  lessonId: string | null | undefined,
  options: { isFirstNode?: boolean; requestedNodeId?: string } = {},
  config?: SWRConfiguration
): SWRResponse<{ node: StoryGameNode; allNodes?: Record<string, StoryGameNode>; startNodeId?: string } | null> {
  const nodeKey = options.requestedNodeId ?? (options.isFirstNode ? "first" : "current");
  const key =
    studentId && lessonId
      ? `student:${studentId}:lesson:${lessonId}:story:${nodeKey}`
      : null;
  return useSWR(
    key,
    async () => {
      if (!studentId || !lessonId) return null;
      const data = await studentService.generateStoryNode({
        studentId,
        lessonId,
        isFirstNode: options.isFirstNode,
        requestedNodeId: options.requestedNodeId,
      });
      return data as {
        node: StoryGameNode;
        allNodes?: Record<string, StoryGameNode>;
        startNodeId?: string;
      };
    },
    withDefaults(config)
  );
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function useStudentProgressSWR(
  studentId: string | null | undefined,
  config?: SWRConfiguration
): SWRResponse<StudentProgress | null> {
  const key = studentId ? `student:${studentId}:progress` : null;
  return useSWR<StudentProgress | null>(
    key,
    async () => {
      if (!studentId) return null;
      const data = await studentService.getProgress(studentId);
      return data as StudentProgress;
    },
    withDefaults(config)
  );
}
