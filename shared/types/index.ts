// EAL proficiency
export type EALLevel = "Emerging" | "Developing" | "Proficient" | "Extending";
export const EAL_TO_CEFR: Record<EALLevel, string> = {
  Emerging: "A1",
  Developing: "A2",
  Proficient: "B1",
  Extending: "B2-C1",
};

// Student
export interface StudentProfile {
  id: string;
  name: string;
  avatarUrl: string;
  grade: number;
  ealLevel: EALLevel;
  interests: string[];
  culturalBackground: string;
  learningGoals: string[];
  theme: StudentTheme;
}

export interface StudentTheme {
  primaryColor: string;
  accentColor: string;
  backgroundPattern:
    | "butterflies"
    | "starfield"
    | "soccer"
    | "ocean"
    | "forest"
    | "plain";
  heroImageUrl: string | null;
  fontPairing?: "whimsical" | "futuristic" | "classic";
}

// Course
export interface Course {
  id: string;
  title: string;
  topic: string;
  gradeLevel: number;
  curriculumStandard: string;
  units: Unit[];
  textbookDocumentId: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  learningObjectives: string[];
  activities: Activity[];
}

export type ActivityStatus = "locked" | "available" | "in-progress" | "complete";
export type VoiceSubtype =
  | "explain-back"
  | "debate"
  | "comprehension"
  | "pronunciation";

export type Activity =
  | { type: "text"; id: string; status: ActivityStatus }
  | {
      type: "video";
      id: string;
      status: ActivityStatus;
      youtubeId?: string;
    }
  | {
      type: "voice";
      id: string;
      status: ActivityStatus;
      activitySubtype: VoiceSubtype;
    }
  | { type: "story"; id: string; status: ActivityStatus; theme: string };

export type ActivityType = Activity["type"];

// Quiz
export interface QuizQuestion {
  id: string;
  prompt: string;
  type: "multiple-choice" | "true-false" | "fill-blank";
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswer?: string;
  explanation: string;
  learningObjectiveId: string;
}

// Generated content
export interface TextLessonContent {
  studentId: string;
  lessonId: string;
  title: string;
  bodyMarkdown: string;
  diagrams: { caption: string; emojiArt: string }[];
  comprehensionQuestions: QuizQuestion[];
}

export interface VideoLessonContent {
  studentId: string;
  lessonId: string;
  youtubeId: string;
  title: string;
  overlayQuestions: VideoOverlayQuestion[];
}
export interface VideoOverlayQuestion {
  pauseAtSeconds: number;
  question: QuizQuestion;
}

export interface StoryGameNode {
  id: string;
  narrative: string;
  illustrationUrl: string | null;
  illustrationFallbackEmoji?: string;
  choices: StoryChoice[];
  isTerminal: boolean;
}

export interface StoryChoice {
  text: string;
  isCorrect: boolean;
  learningObjectiveId: string;
  nextNodeId: string;
  feedbackOnSelect: string;
}

export interface StudentProgress {
  studentId: string;
  xp: number;
  streakDays: number;
  completedActivities: string[];
  quizScores: Record<string, number>;
  skillMastery: Record<string, number>;
}

export interface TextbookUpload {
  id: string;
  filename: string;
  status: "parsing" | "ready" | "failed";
  documentId: string;
  pageCount: number;
}

// Backboard tool definition shape (OpenAI function-calling schema)
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  output: unknown;
}

export interface MessageResponse {
  threadId: string;
  content: string;
  toolResults: ToolResult[];
  finishedAt: string;
}

// Pedagogical audit (returned by audit_content_pedagogically)
export interface PedagogicalAudit {
  blooms: {
    score: number;
    distribution: Record<
      "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
      number
    >;
    comment: string;
  };
  scaffolding: { score: number; comment: string };
  vocabularyLoad: {
    score: number;
    tierDistribution: Record<"tier1" | "tier2" | "tier3", number>;
    comment: string;
  };
  culturalSensitivity: { score: number; flags: string[]; comment: string };
  curriculumAlignment: {
    score: number;
    matches: { standard: string; lesson: string; rationale: string }[];
    gaps: string[];
  };
  recommendations: {
    priority: "high" | "medium" | "low";
    description: string;
    suggestedAction: string;
  }[];
}

// Personalized dashboard payload (returned by get_personalized_dashboard)
export interface PersonalizedDashboard {
  studentId: string;
  greeting: string;
  todaysRecommendation: {
    lessonId: string;
    title: string;
    reason: string;
  };
  xp: number;
  streakDays: number;
  motivationalNudges: string[];
  themedHeroImageUrl: string | null;
}

// Voice session response
export interface VoiceSession {
  signedUrl: string;
  agentPersonaPrompt: string;
  maxDurationSeconds: number;
}

// Classroom
export interface Classroom {
  id: string;
  name: string;
  studentIds: string[];
  courseIds: string[];
}

// Student analytics
export interface StudentAnalytics {
  studentId: string;
  quizAverage: number;
  timeSpentMinutes: number;
  ealTrend: "up" | "flat" | "down";
  skillRadar: { skill: string; mastery: number }[];
  activityHistory: { date: string; activitiesCompleted: number }[];
}
