/**
 * Zod schemas for every structured output. Each `parse*` function is passed
 * to `runStructuredCall({ parser })` so the model's reply is validated
 * before being returned to the caller.
 *
 * Tolerant by design: `.passthrough()` lets the model add extra fields
 * without crashing the request. Strict-mode would crash on a single drift,
 * which during a hackathon demo means a black screen.
 */
import { z } from "zod";

// ---------- shared ----------
export const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  options: z.array(z.string()).optional(),
  correctAnswerIndex: z.number().int().optional(),
  // QuizQuestion type only allows string, but models love returning numbers
  // for numeric fill-blanks. Coerce to string at the schema boundary.
  correctAnswer: z.union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? String(v) : v))
    .optional(),
  explanation: z.string(),
  learningObjectiveId: z.string(),
}).passthrough();

// ---------- pedagogical audit ----------
export const PedagogicalAuditSchema = z.object({
  blooms: z.object({
    score: z.number().min(0).max(100),
    distribution: z.object({
      remember: z.number(),
      understand: z.number(),
      apply: z.number(),
      analyze: z.number(),
      evaluate: z.number(),
      create: z.number(),
    }),
    comment: z.string(),
  }),
  scaffolding: z.object({ score: z.number(), comment: z.string() }),
  vocabularyLoad: z.object({
    score: z.number(),
    tierDistribution: z.object({
      tier1: z.number(),
      tier2: z.number(),
      tier3: z.number(),
    }),
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
}).passthrough();

export const PEDAGOGICAL_AUDIT_SCHEMA_SUMMARY = `{
  "blooms": {
    "score": 0-100,
    "distribution": { "remember": pct, "understand": pct, "apply": pct, "analyze": pct, "evaluate": pct, "create": pct },
    "comment": "1-2 sentences"
  },
  "scaffolding": { "score": 0-100, "comment": "1-2 sentences" },
  "vocabularyLoad": {
    "score": 0-100,
    "tierDistribution": { "tier1": pct, "tier2": pct, "tier3": pct },
    "comment": "1-2 sentences"
  },
  "culturalSensitivity": {
    "score": 0-100,
    "flags": ["specific narrow-context phrase from the source", ...],
    "comment": "1-2 sentences"
  },
  "curriculumAlignment": {
    "score": 0-100,
    "matches": [{ "standard": "e.g. BC-G3-Sci-2.1", "lesson": "lesson title from source", "rationale": "why this is a match" }, ...],
    "gaps": ["specific expectation NOT covered", ...]
  },
  "recommendations": [
    { "priority": "high|medium|low", "description": "what to fix", "suggestedAction": "concrete swap" },
    ... (3-5 items, sorted by priority)
  ]
}`;

// ---------- course outline ----------
const ActivitySchema = z.union([
  z.object({ type: z.literal("text"), id: z.string(), status: z.string() }),
  z.object({
    type: z.literal("video"),
    id: z.string(),
    status: z.string(),
    youtubeId: z.string().optional(),
  }),
  z.object({
    type: z.literal("voice"),
    id: z.string(),
    status: z.string(),
    activitySubtype: z.string(),
  }),
  z.object({
    type: z.literal("story"),
    id: z.string(),
    status: z.string(),
    theme: z.string(),
  }),
]);

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  gradeLevel: z.number().int(),
  curriculumStandard: z.string(),
  textbookDocumentId: z.string(),
  units: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      lessons: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          learningObjectives: z.array(z.string()),
          activities: z.array(ActivitySchema),
        })
      ),
    })
  ),
}).passthrough();

export const COURSE_SCHEMA_SUMMARY = `{
  "id": "kebab-case-id",
  "title": "Course title",
  "topic": "Subject topic",
  "gradeLevel": int,
  "curriculumStandard": "e.g. BC Grade 3 Science 2.1",
  "textbookDocumentId": "<documentId>",
  "units": [
    {
      "id": "unit-1",
      "title": "Unit title",
      "description": "What students discover in this unit",
      "lessons": [
        {
          "id": "lesson-id",
          "title": "Lesson title from textbook",
          "learningObjectives": ["Students will identify ...", "Students will explain ...", ...],
          "activities": [
            { "type": "text", "id": "<lessonId>-text", "status": "available" },
            { "type": "video", "id": "<lessonId>-video", "status": "available" },
            { "type": "voice", "id": "<lessonId>-voice", "status": "available", "activitySubtype": "explain-back|comprehension|debate|pronunciation" },
            { "type": "story", "id": "<lessonId>-story", "status": "available", "theme": "personalized" }
          ]
        }
      ]
    }
  ]
}
Constraints: 3-5 units, 3-5 lessons per unit, each lesson MUST have all 4 activity types in order text→video→voice→story, 3-5 learning objectives per lesson written as observable behaviors.`;

// ---------- text lesson ----------
export const TextLessonSchema = z.object({
  studentId: z.string(),
  lessonId: z.string(),
  title: z.string(),
  bodyMarkdown: z.string(),
  diagrams: z.array(z.object({ caption: z.string(), emojiArt: z.string() })),
  comprehensionQuestions: z.array(QuizQuestionSchema),
}).passthrough();

export const TEXT_LESSON_SCHEMA_SUMMARY = `{
  "studentId": "<id>",
  "lessonId": "<id>",
  "title": "Lesson title themed to student interests",
  "bodyMarkdown": "Markdown with 3-4 short sections, each with one ## sub-header and 2-3 short paragraphs.",
  "diagrams": [{ "caption": "What it shows", "emojiArt": "☀️ → 🌳 → 🍇" }, ...],
  "comprehensionQuestions": [
    { "id": "q1", "prompt": "...", "type": "multiple-choice", "options": ["A","B","C","D"], "correctAnswerIndex": 0, "explanation": "...", "learningObjectiveId": "lo-1" },
    { "id": "q2", "prompt": "...", "type": "fill-blank", "correctAnswer": "...", "explanation": "...", "learningObjectiveId": "lo-2" },
    { "id": "q3", "prompt": "...", "type": "true-false", "correctAnswer": "true|false", "explanation": "...", "learningObjectiveId": "lo-1" }
  ]
}
Constraints: bodyMarkdown must adhere strictly to the EAL style card. 3 questions exactly. At least one example per section uses the student's interests.`;

// ---------- video overlay questions ----------
export const VideoOverlayQuestionsSchema = z.object({
  overlayQuestions: z.array(
    z.object({
      pauseAtSeconds: z.number(),
      question: QuizQuestionSchema,
    })
  ),
}).passthrough();

export const VIDEO_OVERLAY_SCHEMA_SUMMARY = `{
  "overlayQuestions": [
    { "pauseAtSeconds": int, "question": <QuizQuestion> },
    ... (3-5 items)
  ]
}
Constraints: pauseAtSeconds distributed across the video duration (not bunched). Each question targets one learningObjective. Mix MC and fill-blank. For Emerging students prefer multiple-choice.`;

// ---------- story node ----------
export const StoryNodeSchema = z.object({
  id: z.string(),
  narrative: z.string(),
  illustrationUrl: z.string().nullable(),
  illustrationFallbackEmoji: z.string().optional(),
  isTerminal: z.boolean(),
  choices: z.array(
    z.object({
      text: z.string(),
      isCorrect: z.boolean(),
      learningObjectiveId: z.string(),
      nextNodeId: z.string(),
      feedbackOnSelect: z.string(),
    })
  ),
}).passthrough();

export const STORY_NODE_SCHEMA_SUMMARY = `{
  "id": "kebab-id e.g. maya-1-n2",
  "narrative": "2-3 short paragraphs of personalized narrative at the student's EAL level",
  "illustrationUrl": null,
  "illustrationFallbackEmoji": "4-6 emoji scene e.g. 🌸🦋☀️🌿",
  "isTerminal": false,
  "choices": [
    {
      "text": "Choice text the student picks",
      "isCorrect": true|false,
      "learningObjectiveId": "lo-1",
      "nextNodeId": "next node id (or this node's id for retry)",
      "feedbackOnSelect": "Empty for correct; gentle teaching feedback for wrong (NEVER shame)"
    },
    ... (2-4 choices)
  ]
}
Constraints: at least one choice MUST be correct. Wrong-choice nextNodeId points back to THIS node so student can retry. The story converges to terminal within 5-7 nodes total.`;

// ---------- dashboard ----------
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
}).passthrough();

export const DASHBOARD_SCHEMA_SUMMARY = `{
  "studentId": "<id>",
  "greeting": "Personalized greeting using student name + interest emoji",
  "todaysRecommendation": { "lessonId": "<id>", "title": "lesson title", "reason": "personalized reason" },
  "xp": int, "streakDays": int,
  "motivationalNudges": ["short message", "short message"],
  "themedHeroImageUrl": null
}`;

// ---------- analytics & progress ----------
export const StudentAnalyticsSchema = z.object({
  studentId: z.string(),
  quizAverage: z.number(),
  timeSpentMinutes: z.number(),
  ealTrend: z.enum(["up", "flat", "down"]),
  skillRadar: z.array(
    z.object({ skill: z.string(), mastery: z.number() })
  ),
  activityHistory: z.array(
    z.object({ date: z.string(), activitiesCompleted: z.number() })
  ),
}).passthrough();

export const ANALYTICS_SCHEMA_SUMMARY = `{
  "studentId": "<id>",
  "quizAverage": 0-100,
  "timeSpentMinutes": int,
  "ealTrend": "up|flat|down",
  "skillRadar": [{ "skill": "Reading|Vocabulary|Speaking|Writing|Listening|...", "mastery": 0-100 }, ...],
  "activityHistory": [{ "date": "YYYY-MM-DD", "activitiesCompleted": int }, ... last 5 days]
}`;

// ---------- curriculum ----------
export const CurriculumStandardsSchema = z.object({
  standards: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      subject: z.string(),
    })
  ),
  query: z.string().optional(),
}).passthrough();

export const CURRICULUM_STANDARDS_SUMMARY = `{
  "standards": [
    { "id": "BC-G3-Sci-2.1", "description": "...", "subject": "Science" },
    ...
  ],
  "query": "<echo of query>"
}`;

export const CurriculumMappingSchema = z.object({
  mappings: z.array(
    z.object({
      standardId: z.string(),
      rationale: z.string(),
      confidence: z.number(),
    })
  ),
}).passthrough();

export const CURRICULUM_MAPPING_SUMMARY = `{
  "mappings": [
    { "standardId": "BC-G3-Sci-2.1", "rationale": "1-2 sentences", "confidence": 0.0-1.0 },
    ...
  ]
}`;

// ---------- quiz generation ----------
export const QuizGenerationSchema = z.object({
  questions: z.array(QuizQuestionSchema),
}).passthrough();

export const QUIZ_GENERATION_SUMMARY = `{
  "questions": [<QuizQuestion>, ... (matches requested count)]
}`;

// ---------- quiz answer evaluation ----------
export const QuizAnswerEvaluationSchema = z.object({
  correct: z.boolean(),
  feedback: z.string(),
  pointsEarned: z.number(),
  nextHint: z.string().optional(),
}).passthrough();

export const QUIZ_ANSWER_EVAL_SUMMARY = `{
  "correct": bool,
  "feedback": "warm EAL-appropriate explanation",
  "pointsEarned": 0 or 10,
  "nextHint": "only if appropriate, otherwise omit"
}`;

// ---------- placement quiz ----------
export const PlacementQuizSchema = z.object({
  complete: z.boolean(),
  nextQuestion: QuizQuestionSchema.optional(),
  assessedEalLevel: z.enum(["Emerging", "Developing", "Proficient", "Extending"]).optional(),
  suggestedInterests: z.array(z.string()).optional(),
  learningGoals: z.array(z.string()).optional(),
}).passthrough();

export const PLACEMENT_QUIZ_SUMMARY = `{
  "complete": bool,
  "nextQuestion": <QuizQuestion> (only if not complete),
  "assessedEalLevel": "Emerging|Developing|Proficient|Extending" (only if complete),
  "suggestedInterests": ["..."] (only if complete),
  "learningGoals": ["..."] (only if complete)
}`;

// ---------- EAL adjust / simplify ----------
export const EalAdjustSchema = z.object({
  adjustedContent: z.string(),
  changesSummary: z.string(),
}).passthrough();

export const EAL_ADJUST_SUMMARY = `{
  "adjustedContent": "the rewritten content at the new EAL level",
  "changesSummary": "1-2 sentences describing what changed"
}`;

export const SimplifyTextSchema = z.object({
  simplified: z.string(),
  originalGrade: z.number(),
  newGrade: z.number(),
}).passthrough();

export const SIMPLIFY_TEXT_SUMMARY = `{
  "simplified": "rewritten text at the target reading level",
  "originalGrade": int (estimated original reading grade),
  "newGrade": int (target reading grade)
}`;

// ---------- report ----------
export const ReportSchema = z.object({
  report: z.object({
    title: z.string(),
    sections: z.array(
      z.object({ heading: z.string(), bodyMarkdown: z.string() })
    ),
  }),
}).passthrough();

export const REPORT_SUMMARY = `{
  "report": {
    "title": "...",
    "sections": [{ "heading": "...", "bodyMarkdown": "..." }, ...]
  }
}
Constraints: lead with a Headline Insight section, then Supporting Data, then Recommended Actions. Total under 300 words.`;

// ---------- resources ----------
export const ResourcesSchema = z.object({
  resources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      preview: z.string(),
    })
  ),
}).passthrough();

export const RESOURCES_SUMMARY = `{
  "resources": [
    { "id": "res_1", "name": "Resource name", "type": "simulation|video|worksheet|article|interactive", "preview": "1-2 sentence description" },
    ... (3-6 items)
  ]
}`;

// ---------- preview ----------
export const PreviewSchema = z.object({
  preview: z.unknown(),
  narrativeDescription: z.string(),
}).passthrough();
