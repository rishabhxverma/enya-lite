/**
 * Server-side tool dispatch maps. Backboard's runToolLoop calls these
 * functions when the assistant returns a tool_call. Each handler delegates
 * to the matching function in `shared/lib/ai/*` — that module owns the
 * actual nested Backboard call, schema validation, and memory I/O.
 *
 * On any failure we fall back to the matching seed file or stub so the
 * demo never shows a black screen — failures are logged loudly so we know
 * to fix in cooldown.
 */
import type { EALLevel } from "@shared/types";
import type { ToolHandlerMap } from "@shared/lib/backboard";
import {
  STUB_AUDIT,
  STUB_COURSE_OUTLINE,
  STUB_DOCUMENT_ID,
  STUB_TEXT_LESSONS,
  STUB_VIDEO_LESSONS,
  STUB_STORY_NODE_LIAM,
  STUB_STORY_NODE_MAYA,
  STUB_DASHBOARDS,
  STUB_ANALYTICS,
  stubDashboardForStudent,
} from "@shared/lib/stub-content";

import { runAudit } from "@shared/lib/ai/teacher/audit";
import { generateCourseOutline } from "@shared/lib/ai/teacher/course-outline";
import { adjustForEalLevel } from "@shared/lib/ai/teacher/eal-adjust";
import { simplifyText } from "@shared/lib/ai/teacher/simplify";
import {
  searchCurriculumStandards,
  mapToCurriculum,
} from "@shared/lib/ai/teacher/curriculum";
import { generateQuizFromContent } from "@shared/lib/ai/teacher/quiz";
import {
  manageClassroom,
  bulkUpdateEalLevels,
} from "@shared/lib/ai/teacher/classroom";
import { getStudentAnalytics } from "@shared/lib/ai/teacher/analytics";
import { generateReport } from "@shared/lib/ai/teacher/report";
import { searchResources } from "@shared/lib/ai/teacher/resources";
import { previewStudentExperience } from "@shared/lib/ai/teacher/preview";
import {
  createStudentProfile,
  getStudentProfile,
} from "@shared/lib/ai/student/profile";
import { generateTextLesson } from "@shared/lib/ai/student/text-lesson";
import { generateVideoLessonQuestions } from "@shared/lib/ai/student/video-questions";
import { searchYouTubeVideo } from "@shared/lib/ai/student/youtube-search";
import { generateStoryNode } from "@shared/lib/ai/student/story-node";
import { generateStoryImage } from "@shared/lib/ai/student/story-image";
import { submitQuizAnswer } from "@shared/lib/ai/student/quiz-grader";
import { getStudentProgress } from "@shared/lib/ai/student/progress";
import { runPlacementQuiz } from "@shared/lib/ai/student/placement";
import { startVoiceConversation } from "@shared/lib/ai/student/voice-session";
import { getPersonalizedDashboard } from "@shared/lib/ai/student/dashboard";

export interface TeacherHandlerContext {
  attachments?: {
    documentId?: string;
    uploadId?: string;
    filename?: string;
    pageCount?: number;
    chunkCount?: number;
  }[];
}

/** Wrap an async handler so failures never break the tool loop — log + fall
 *  back to the supplied stub. */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(
      `[tool-handler:${label}] error, returning fallback: ${err instanceof Error ? err.message : String(err)}`
    );
    return fallback;
  }
}

export function buildTeacherHandlers(
  ctx: TeacherHandlerContext = {}
): ToolHandlerMap {
  // Match an attachment to the model's args. The model may pass fileName
  // (matching the upload) or just rely on the single attached doc.
  const findAttachment = (args: Record<string, unknown>) => {
    const list = ctx.attachments ?? [];
    if (list.length === 0) return undefined;
    const fileName = args.fileName as string | undefined;
    const uploadId = args.uploadId as string | undefined;
    return (
      list.find(
        (a) =>
          (fileName && a.filename === fileName) ||
          (uploadId && a.uploadId === uploadId)
      ) ?? list[0]
    );
  };
  const documentIdFromArgs = (args: Record<string, unknown>): string | undefined => {
    const fromArg = args.documentId as string | undefined;
    if (fromArg && !fromArg.startsWith("stub_")) return fromArg;
    return findAttachment(args)?.documentId;
  };

  return {
    parse_uploaded_document: async (args) => {
      // Already parsed/indexed before this turn ran; echo real upload stats.
      const att = findAttachment(args);
      const filename =
        att?.filename ??
        (args.fileName as string) ??
        (args.uploadId as string) ??
        "textbook.pdf";
      return {
        documentId: att?.documentId ?? STUB_DOCUMENT_ID,
        pageCount: att?.pageCount ?? 47,
        chunkCount: att?.chunkCount ?? 142,
        status: "ready",
        fileName: filename,
        alreadyIndexed: Boolean(att?.documentId),
      };
    },
    generate_course_outline: async (args) => {
      const documentId = documentIdFromArgs(args);
      if (!documentId) return { course: STUB_COURSE_OUTLINE };
      return safe(
        "generate_course_outline",
        () =>
          generateCourseOutline({
            documentId,
            topic: (args.topic as string) ?? "the textbook topic",
            gradeLevel: (args.gradeLevel as number) ?? 3,
            curriculumStandard:
              (args.curriculumStandard as string) ?? "BC Grade 3 Science 2.1",
            targetUnitCount: args.targetUnitCount as number | undefined,
            lessonsPerUnit: args.lessonsPerUnit as number | undefined,
          }),
        { course: STUB_COURSE_OUTLINE }
      );
    },
    create_student_profile: (args) =>
      safe(
        "create_student_profile",
        () =>
          createStudentProfile({
            name: args.name as string,
            grade: args.grade as number,
            ealLevel: args.ealLevel as EALLevel,
            interests: (args.interests as string[]) ?? [],
            culturalBackground: args.culturalBackground as string | undefined,
            learningGoals: args.learningGoals as string[] | undefined,
          }),
        {
          studentId: `student-${Date.now()}`,
          profile: {
            id: `student-${Date.now()}`,
            name: (args.name as string) ?? "New Student",
            grade: (args.grade as number) ?? 3,
            ealLevel: (args.ealLevel as EALLevel) ?? "Developing",
            interests: (args.interests as string[]) ?? [],
            culturalBackground: (args.culturalBackground as string) ?? "",
            learningGoals: (args.learningGoals as string[]) ?? [],
            avatarUrl: "",
            theme: {
              primaryColor: "oklch(0.83 0.18 82)",
              accentColor: "oklch(0.7 0.18 50)",
              backgroundPattern: "plain" as const,
              heroImageUrl: null,
            },
          },
        }
      ),
    audit_content_pedagogically: (args) => {
      const documentId = documentIdFromArgs(args);
      return safe(
        "audit_content_pedagogically",
        () =>
          runAudit({
            documentId,
            courseId: args.courseId as string | undefined,
            targetGrade: (args.targetGrade as number) ?? 3,
            targetEalLevels: args.targetEalLevels as string[] | undefined,
            curriculumStandards: args.curriculumStandards as string[] | undefined,
          }),
        STUB_AUDIT
      );
    },
    adjust_for_eal_level: (args) =>
      safe(
        "adjust_for_eal_level",
        () =>
          adjustForEalLevel({
            content: (args.content as string) ?? "",
            contentType: args.contentType as "text" | "quiz" | "activity" | undefined,
            targetEalLevel: (args.targetEalLevel as EALLevel) ?? "Developing",
            preserveLearningObjectives: args.preserveLearningObjectives as
              | string[]
              | undefined,
          }),
        {
          adjustedContent: (args.content as string) ?? "",
          changesSummary: "Could not contact LLM; content returned unchanged.",
        }
      ),
    get_student_analytics: (args) =>
      safe(
        "get_student_analytics",
        () =>
          getStudentAnalytics({
            studentId: (args.studentId as string) ?? "maya",
            courseId: args.courseId as string | undefined,
            timeRange: args.timeRange as "7d" | "30d" | "all" | undefined,
          }),
        {
          analytics:
            STUB_ANALYTICS[(args.studentId as string) ?? "maya"] ??
            STUB_ANALYTICS.maya,
        }
      ),
    search_curriculum_standards: (args) =>
      safe(
        "search_curriculum_standards",
        () =>
          searchCurriculumStandards({
            query: (args.query as string) ?? "",
            jurisdiction: args.jurisdiction as "BC" | "Alberta" | undefined,
            gradeLevel: args.gradeLevel as number | undefined,
          }),
        {
          standards: [
            {
              id: "BC-G3-Sci-2.1",
              description:
                "Living things have features and behaviours that help them survive in their environment.",
              subject: "Science",
            },
          ],
          query: (args.query as string) ?? "",
        }
      ),
    map_to_curriculum: (args) => {
      const documentId = documentIdFromArgs(args);
      return safe(
        "map_to_curriculum",
        () =>
          mapToCurriculum({
            contentId: args.contentId as string | undefined,
            documentId,
            jurisdictions: args.jurisdictions as string[] | undefined,
          }),
        {
          mappings: [
            {
              standardId: "BC-G3-Sci-2.1",
              rationale:
                "Could not contact LLM — fallback mapping based on common textbook content.",
              confidence: 0.5,
            },
          ],
        }
      );
    },
    manage_classroom: (args) =>
      safe(
        "manage_classroom",
        () =>
          manageClassroom({
            action: args.action as Parameters<
              typeof manageClassroom
            >[0]["action"],
            classroomId: args.classroomId as string | undefined,
            name: args.name as string | undefined,
            studentIds: args.studentIds as string[] | undefined,
            courseId: args.courseId as string | undefined,
          }),
        {
          message: "Classroom action could not be persisted.",
        }
      ),
    bulk_update_eal_levels: (args) =>
      safe(
        "bulk_update_eal_levels",
        () =>
          bulkUpdateEalLevels(
            ((args.updates as unknown[]) ?? []) as {
              studentId: string;
              newLevel: EALLevel;
            }[]
          ),
        { updated: 0, students: [] }
      ),
    search_resources: (args) =>
      safe(
        "search_resources",
        () =>
          searchResources({
            query: (args.query as string) ?? "",
            tags: args.tags as string[] | undefined,
            gradeLevel: args.gradeLevel as number | undefined,
          }),
        { resources: [] }
      ),
    generate_quiz_from_content: (args) => {
      const documentId = documentIdFromArgs(args);
      return safe(
        "generate_quiz_from_content",
        () =>
          generateQuizFromContent({
            contentId: args.contentId as string | undefined,
            documentId,
            questionCount: args.questionCount as number | undefined,
            types: args.types as Parameters<
              typeof generateQuizFromContent
            >[0]["types"],
            targetEalLevel: args.targetEalLevel as EALLevel | undefined,
          }),
        { questions: [] }
      );
    },
    preview_student_experience: (args) => {
      const studentId = (args.studentId as string) ?? "maya";
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const activityType = (args.activityType as
        | "text"
        | "video"
        | "voice"
        | "story") ?? "text";
      const documentId = documentIdFromArgs(args);
      return safe(
        "preview_student_experience",
        () =>
          previewStudentExperience({
            studentId,
            lessonId,
            activityType,
            topic: args.topic as string | undefined,
            learningObjectives: args.learningObjectives as string[] | undefined,
            documentId,
          }),
        {
          preview:
            activityType === "text"
              ? STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
                STUB_TEXT_LESSONS.maya[lessonId]
              : activityType === "video"
                ? STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
                  STUB_VIDEO_LESSONS.maya[lessonId]
                : null,
          narrativeDescription: `Preview unavailable — using seed content for ${studentId}.`,
        }
      );
    },
    generate_report: (args) =>
      safe(
        "generate_report",
        () =>
          generateReport({
            scope: (args.scope as "student" | "classroom" | "course") ?? "student",
            targetId: (args.targetId as string) ?? "maya",
            format: args.format as "summary" | "detailed" | undefined,
          }),
        {
          report: {
            title: "Report unavailable",
            sections: [
              {
                heading: "Note",
                bodyMarkdown:
                  "Could not contact LLM. Try again in a moment.",
              },
            ],
          },
        }
      ),
    simplify_text: (args) =>
      safe(
        "simplify_text",
        () =>
          simplifyText({
            text: (args.text as string) ?? "",
            targetReadingLevel:
              (args.targetReadingLevel as string) ?? "grade3",
          }),
        {
          simplified: (args.text as string) ?? "",
          originalGrade: 7,
          newGrade: 3,
        }
      ),
  };
}

export function buildStudentHandlers(studentId: string): ToolHandlerMap {
  return {
    generate_text_lesson: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const fallback =
        STUB_TEXT_LESSONS[id]?.[lessonId] ??
        STUB_TEXT_LESSONS.maya[lessonId] ??
        STUB_TEXT_LESSONS.maya["photosynthesis-1"];
      return safe(
        "generate_text_lesson",
        () =>
          generateTextLesson({
            studentId: id,
            lessonId,
            topic: (args.topic as string) ?? "Photosynthesis",
            learningObjectives:
              (args.learningObjectives as string[]) ??
              fallback.comprehensionQuestions.map((q) => q.learningObjectiveId),
            documentId: args.documentId as string | undefined,
          }),
        fallback
      );
    },
    generate_video_lesson_questions: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const youtubeId = (args.youtubeId as string) ?? "UPBMG5EYydo";
      const fallback =
        STUB_VIDEO_LESSONS[id]?.[lessonId] ??
        STUB_VIDEO_LESSONS.maya[lessonId];
      return safe(
        "generate_video_lesson_questions",
        () =>
          generateVideoLessonQuestions({
            studentId: id,
            lessonId,
            youtubeId,
            transcript: args.transcript as string | undefined,
            learningObjectives:
              (args.learningObjectives as string[]) ??
              fallback.overlayQuestions.map(
                (q) => q.question.learningObjectiveId
              ),
            questionCount: args.questionCount as number | undefined,
          }),
        { overlayQuestions: fallback?.overlayQuestions ?? [] }
      );
    },
    search_youtube_video: (args) =>
      safe(
        "search_youtube_video",
        () =>
          searchYouTubeVideo({
            topic: (args.topic as string) ?? "photosynthesis",
            gradeLevel: (args.gradeLevel as number) ?? 3,
            maxDurationSeconds: args.maxDurationSeconds as number | undefined,
            preferredChannels: args.preferredChannels as string[] | undefined,
          }),
        {
          candidates: [
            {
              youtubeId: "UPBMG5EYydo",
              title: "Photosynthesis | Educational Video for Kids",
              channel: "Happy Learning English",
              duration: 240,
              thumbnailUrl:
                "https://i.ytimg.com/vi/UPBMG5EYydo/hqdefault.jpg",
            },
          ],
        }
      ),
    generate_story_game_node: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const fallback = id === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA;
      return safe(
        "generate_story_game_node",
        () =>
          generateStoryNode({
            studentId: id,
            lessonId,
            previousNodes: args.previousNodes as
              | { id: string; chosen?: string }[]
              | undefined,
            learningObjectives: args.learningObjectives as string[] | undefined,
            isFirstNode: args.isFirstNode as boolean | undefined,
            isFinalNode: args.isFinalNode as boolean | undefined,
          }),
        fallback
      );
    },
    generate_story_image: (args) =>
      safe(
        "generate_story_image",
        () =>
          generateStoryImage({
            studentId: (args.studentId as string) ?? studentId,
            sceneDescription: (args.sceneDescription as string) ?? "",
            theme: (args.theme as string) ?? "fantasy",
          }),
        { imageUrl: null, fallbackEmoji: "🌟📖🌙✨", source: "emoji-only" as const }
      ),
    submit_quiz_answer: (args) =>
      safe(
        "submit_quiz_answer",
        () =>
          submitQuizAnswer({
            studentId: (args.studentId as string) ?? studentId,
            lessonId: (args.lessonId as string) ?? "photosynthesis-1",
            questionId: (args.questionId as string) ?? "q1",
            answer: args.answer as string | number,
            questionPrompt: args.questionPrompt as string | undefined,
            questionType: args.questionType as
              | "multiple-choice"
              | "true-false"
              | "fill-blank"
              | undefined,
            correctAnswer: args.correctAnswer as string | number | undefined,
            correctAnswerIndex: args.correctAnswerIndex as number | undefined,
            options: args.options as string[] | undefined,
            explanation: args.explanation as string | undefined,
          }),
        {
          correct: false,
          feedback: "Could not grade your answer right now.",
          pointsEarned: 0,
        }
      ),
    get_student_progress: (args) => {
      const id = (args.studentId as string) ?? studentId;
      return safe("get_student_progress", () => getStudentProgress(id), {
        progress: {
          studentId: id,
          xp: 0,
          streakDays: 0,
          completedActivities: [],
          quizScores: {},
          skillMastery: {},
        },
      });
    },
    run_placement_quiz: (args) =>
      safe(
        "run_placement_quiz",
        () =>
          runPlacementQuiz({
            studentName: (args.studentName as string) ?? "Student",
            grade: (args.grade as number) ?? 3,
            action: (args.action as "next" | "submit") ?? "next",
            currentAnswers: args.currentAnswers as
              | Record<string, unknown>
              | undefined,
          }),
        {
          complete: true,
          assessedEalLevel: "Developing" as const,
          suggestedInterests: ["learning"],
        }
      ),
    start_voice_conversation: (args) =>
      safe(
        "start_voice_conversation",
        () =>
          startVoiceConversation({
            studentId: (args.studentId as string) ?? studentId,
            lessonId: (args.lessonId as string) ?? "photosynthesis-1",
            activitySubtype: (args.activitySubtype as
              | "explain-back"
              | "debate"
              | "comprehension"
              | "pronunciation") ?? "explain-back",
            objectives: args.objectives as string[] | undefined,
          }),
        {
          signedUrl: "",
          agentPersonaPrompt: "Voice session unavailable.",
          maxDurationSeconds: 300,
        }
      ),
    get_personalized_dashboard: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const profile = await getStudentProfile(id);
      const fallback =
        STUB_DASHBOARDS[id] ?? stubDashboardForStudent(profile);
      return safe(
        "get_personalized_dashboard",
        () => getPersonalizedDashboard(id),
        fallback
      );
    },
  };
}
