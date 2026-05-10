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

export const studentService = {
  getDashboard: (studentId: string) =>
    post("/api/student/dashboard", { studentId }),
  generateTextLesson: (input: {
    studentId: string;
    lessonId: string;
    topic: string;
    learningObjectives: string[];
  }) => post("/api/student/generate-text-lesson", input),
  searchYoutube: (input: { topic: string; gradeLevel: number }) =>
    post("/api/student/search-youtube", input),
  generateVideoQuestions: (input: {
    studentId: string;
    lessonId: string;
    youtubeId: string;
    learningObjectives: string[];
  }) => post("/api/student/generate-video-questions", input),
  generateStoryNode: (input: {
    studentId: string;
    lessonId: string;
    isFirstNode?: boolean;
    requestedNodeId?: string;
    previousNodes?: unknown[];
  }) => post("/api/student/generate-story-node", input),
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
  getProgress: (studentId: string) =>
    post("/api/student/progress", { studentId }),
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
