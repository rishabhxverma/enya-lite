import { z } from "zod";

export const EALLevelSchema = z.enum([
  "Emerging",
  "Developing",
  "Proficient",
  "Extending",
]);

export const StudentProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
  grade: z.number().int().min(1).max(12),
  ealLevel: EALLevelSchema,
  interests: z.array(z.string()).min(1),
  culturalBackground: z.string(),
  learningGoals: z.array(z.string()),
  theme: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    backgroundPattern: z.enum([
      "butterflies",
      "starfield",
      "soccer",
      "ocean",
      "forest",
      "plain",
    ]),
    heroImageUrl: z.string().nullable(),
    fontPairing: z
      .enum(["whimsical", "futuristic", "classic"])
      .optional(),
  }),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  options: z.array(z.string()).optional(),
  correctAnswerIndex: z.number().int().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string(),
  learningObjectiveId: z.string(),
});

export const TextLessonContentSchema = z.object({
  studentId: z.string(),
  lessonId: z.string(),
  title: z.string(),
  bodyMarkdown: z.string(),
  diagrams: z.array(
    z.object({ caption: z.string(), emojiArt: z.string() })
  ),
  comprehensionQuestions: z.array(QuizQuestionSchema),
});

export const VideoOverlayQuestionSchema = z.object({
  pauseAtSeconds: z.number(),
  question: QuizQuestionSchema,
});

export const VideoLessonContentSchema = z.object({
  studentId: z.string(),
  lessonId: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  overlayQuestions: z.array(VideoOverlayQuestionSchema),
});

export const StoryChoiceSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean(),
  learningObjectiveId: z.string(),
  nextNodeId: z.string(),
  feedbackOnSelect: z.string(),
});

export const StoryGameNodeSchema = z.object({
  id: z.string(),
  narrative: z.string(),
  illustrationUrl: z.string().nullable(),
  illustrationFallbackEmoji: z.string().optional(),
  choices: z.array(StoryChoiceSchema),
  isTerminal: z.boolean(),
});

export const ActivitySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    id: z.string(),
    status: z.enum(["locked", "available", "in-progress", "complete"]),
  }),
  z.object({
    type: z.literal("video"),
    id: z.string(),
    status: z.enum(["locked", "available", "in-progress", "complete"]),
    youtubeId: z.string().optional(),
  }),
  z.object({
    type: z.literal("voice"),
    id: z.string(),
    status: z.enum(["locked", "available", "in-progress", "complete"]),
    activitySubtype: z.enum([
      "explain-back",
      "debate",
      "comprehension",
      "pronunciation",
    ]),
  }),
  z.object({
    type: z.literal("story"),
    id: z.string(),
    status: z.enum(["locked", "available", "in-progress", "complete"]),
    theme: z.string(),
  }),
]);

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  learningObjectives: z.array(z.string()),
  activities: z.array(ActivitySchema),
});

export const UnitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(LessonSchema),
});

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  gradeLevel: z.number().int(),
  curriculumStandard: z.string(),
  units: z.array(UnitSchema),
  textbookDocumentId: z.string(),
});

export const PersonalizedDashboardSchema = z.object({
  studentId: z.string(),
  greeting: z.string(),
  todaysRecommendation: z.object({
    lessonId: z.string(),
    title: z.string(),
    reason: z.string(),
  }),
  xp: z.number(),
  streakDays: z.number(),
  motivationalNudges: z.array(z.string()),
  themedHeroImageUrl: z.string().nullable(),
});

export const PedagogicalAuditSchema = z.object({
  blooms: z.object({
    score: z.number(),
    distribution: z.record(z.string(), z.number()),
    comment: z.string(),
  }),
  scaffolding: z.object({ score: z.number(), comment: z.string() }),
  vocabularyLoad: z.object({
    score: z.number(),
    tierDistribution: z.record(z.string(), z.number()),
    comment: z.string(),
  }),
  culturalSensitivity: z.object({
    score: z.number(),
    flags: z.array(z.string()),
    comment: z.string(),
  }),
  curriculumAlignment: z.object({
    score: z.number(),
    matches: z.array(
      z.object({
        standard: z.string(),
        lesson: z.string(),
        rationale: z.string(),
      })
    ),
    gaps: z.array(z.string()),
  }),
  recommendations: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      description: z.string(),
      suggestedAction: z.string(),
    })
  ),
});
