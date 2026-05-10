import {
  isSeedFallbackEnabled,
  readSeedEnvelopeClient,
  readSeedJsonClient,
} from "./seed-loader-client";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${path} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Seed-fallback short-circuits
//
// Each of these mirrors the contract of the live API route but reads from
// /public/seed/ directly. Returning `null` means "no seed file available —
// fall through to the network call." That way we keep one happy-path code
// flow in the caller (`return seed ?? await post(...)`).
// ---------------------------------------------------------------------------

async function trySeedDashboard(studentId: string) {
  return readSeedJsonClient<unknown>(`dashboard-${studentId}.json`);
}

async function trySeedTextLesson(studentId: string, lessonId: string) {
  return readSeedEnvelopeClient<unknown>(
    `lessons-${studentId}/${lessonId}-text.json`
  );
}

async function trySeedVideoQuestions(studentId: string, lessonId: string) {
  // Video seed is `{ content: { ..., overlayQuestions: [...] } }`. The route
  // returns `{ overlayQuestions, ... }` directly, so we re-shape on read.
  const env = await readSeedEnvelopeClient<{
    overlayQuestions?: unknown[];
    youtubeId?: string;
    pauseAtSeconds?: number[];
  }>(`lessons-${studentId}/${lessonId}-video.json`);
  return env;
}

async function trySeedStoryNode(
  studentId: string,
  lessonId: string,
  requestedNodeId?: string,
  isFirstNode?: boolean
) {
  const env = await readSeedEnvelopeClient<{
    allNodes?: Record<string, unknown>;
    startNodeId?: string;
  }>(`lessons-${studentId}/${lessonId}-story.json`);
  if (!env?.allNodes) return null;
  const nodeId =
    requestedNodeId ?? (isFirstNode ? env.startNodeId : undefined) ??
    env.startNodeId;
  if (!nodeId) return null;
  const node = env.allNodes[nodeId];
  if (!node) return null;
  return { node, allNodes: env.allNodes, startNodeId: env.startNodeId };
}

export const studentService = {
  getDashboard: async (studentId: string) => {
    if (isSeedFallbackEnabled()) {
      const seed = await trySeedDashboard(studentId);
      if (seed) return seed;
    }
    return post("/api/student/dashboard", { studentId });
  },
  generateTextLesson: async (input: {
    studentId: string;
    lessonId: string;
    topic: string;
    learningObjectives: string[];
  }) => {
    if (isSeedFallbackEnabled()) {
      const seed = await trySeedTextLesson(input.studentId, input.lessonId);
      if (seed) return seed;
    }
    return post("/api/student/generate-text-lesson", input);
  },
  searchYoutube: (input: { topic: string; gradeLevel: number }) =>
    post("/api/student/search-youtube", input),
  generateVideoQuestions: async (input: {
    studentId: string;
    lessonId: string;
    youtubeId: string;
    learningObjectives: string[];
  }) => {
    if (isSeedFallbackEnabled()) {
      const seed = await trySeedVideoQuestions(input.studentId, input.lessonId);
      if (seed) return seed;
    }
    return post("/api/student/generate-video-questions", input);
  },
  generateStoryNode: async (input: {
    studentId: string;
    lessonId: string;
    isFirstNode?: boolean;
    requestedNodeId?: string;
    previousNodes?: unknown[];
  }) => {
    if (isSeedFallbackEnabled()) {
      const seed = await trySeedStoryNode(
        input.studentId,
        input.lessonId,
        input.requestedNodeId,
        input.isFirstNode
      );
      if (seed) return seed;
    }
    return post("/api/student/generate-story-node", input);
  },
  generateStoryImage: (input: {
    studentId: string;
    sceneDescription: string;
    theme: string;
    fallbackEmoji?: string;
  }) => post("/api/student/generate-story-image", input),
  submitQuizAnswer: (input: {
    studentId: string;
    lessonId: string;
    questionId: string;
    questionType: "multiple-choice" | "true-false" | "fill-blank";
    answer: string | number;
    correctAnswer?: string | number;
    correctAnswerIndex?: number;
    explanation?: string;
  }) => post("/api/student/submit-quiz-answer", input),
  getProgress: async (studentId: string) => {
    if (isSeedFallbackEnabled()) {
      const seed = await readSeedJsonClient<unknown>("_progress.json");
      if (seed) return seed;
    }
    return post("/api/student/progress", { studentId });
  },
  runPlacementQuiz: (input: {
    studentName: string;
    grade: number;
    action: "next" | "submit";
    currentAnswers?: Record<string, unknown>;
  }) => post("/api/student/placement-quiz", input),
  getVoiceSession: (input: {
    studentId: string;
    lessonId: string;
    activitySubtype: "explain-back" | "debate" | "comprehension" | "pronunciation";
    objectives?: string[];
    lessonTitle?: string;
  }) => post("/api/student/voice-session", input),
};

export { isSeedFallbackEnabled, setSeedFallback } from "./seed-loader-client";
