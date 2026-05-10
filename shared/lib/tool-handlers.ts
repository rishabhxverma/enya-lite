/**
 * Server-side tool dispatch maps. The Backboard runToolLoop calls these
 * functions when the assistant returns a tool_call. They're isomorphic — they
 * call the relevant API route logic directly (NOT via fetch — these run on the
 * server and the API routes are just thin wrappers around the same logic).
 */
import type { ToolHandlerMap } from "@shared/lib/backboard";
import {
  STUB_AUDIT,
  STUB_COURSE_OUTLINE,
  STUB_DASHBOARDS,
  STUB_DOCUMENT_ID,
  STUB_STORY_NODE_LIAM,
  STUB_STORY_NODE_MAYA,
  STUB_TEXT_LESSONS,
  STUB_VIDEO_LESSONS,
  STUB_ANALYTICS,
  stubDashboardForStudent,
} from "@shared/lib/stub-content";
import { getStudentProfile } from "@shared/lib/student-profiles";
import {
  fetchTranscript,
  suggestPausePoints,
} from "@shared/lib/youtube-transcript";

export function buildTeacherHandlers(): ToolHandlerMap {
  return {
    parse_uploaded_document: async (args) => {
      const filename =
        (args.fileName as string) ?? (args.uploadId as string) ?? "textbook.pdf";
      return {
        documentId: STUB_DOCUMENT_ID,
        pageCount: 47,
        chunkCount: 142,
        status: "ready",
        fileName: filename,
      };
    },
    generate_course_outline: async () => ({
      course: STUB_COURSE_OUTLINE,
    }),
    create_student_profile: async (args) => {
      const id = (args.name as string)
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ?? `student-${Date.now()}`;
      return {
        studentId: id,
        profile: {
          id,
          name: args.name,
          grade: args.grade,
          ealLevel: args.ealLevel,
          interests: args.interests,
          culturalBackground: args.culturalBackground ?? "",
          learningGoals: args.learningGoals ?? [],
          avatarUrl: `/seed/avatars/${id}.svg`,
          theme: {
            primaryColor: "oklch(0.83 0.18 82)",
            accentColor: "oklch(0.7 0.18 50)",
            backgroundPattern: "plain",
            heroImageUrl: null,
          },
        },
      };
    },
    audit_content_pedagogically: async () => STUB_AUDIT,
    adjust_for_eal_level: async (args) => ({
      adjustedContent:
        (args.content as string) ?? "Content unchanged (no live LLM available).",
      changesSummary:
        "Vocabulary simplified, sentence length shortened, cultural references made universal.",
    }),
    get_student_analytics: async (args) => {
      const id = (args.studentId as string) ?? "maya";
      return { analytics: STUB_ANALYTICS[id] ?? STUB_ANALYTICS.maya };
    },
    search_curriculum_standards: async (args) => ({
      standards: [
        {
          id: "BC-G3-Sci-2.1",
          description:
            "Living things have features and behaviours that help them survive in their environment.",
          subject: "Science",
        },
        {
          id: "BC-G3-Sci-2.2",
          description:
            "Living things adapt to changes in their environments to survive.",
          subject: "Science",
        },
      ],
      query: args.query,
    }),
    map_to_curriculum: async () => ({
      mappings: [
        {
          standardId: "BC-G3-Sci-2.1",
          rationale:
            "This activity addresses BC G3 Sci 2.1 because students explicitly identify the inputs and outputs of photosynthesis through guided observation.",
          confidence: 0.92,
        },
      ],
    }),
    manage_classroom: async (args) => {
      const action = args.action as string;
      const id =
        (args.classroomId as string) ?? `classroom_${Date.now()}`;
      return {
        classroom: {
          id,
          name: (args.name as string) ?? "Mrs. Lee's Grade 3 Class",
          studentIds: (args.studentIds as string[]) ?? ["maya", "liam"],
          courseIds: args.courseId ? [args.courseId as string] : ["photosynthesis-101"],
        },
        message: `Classroom action '${action}' applied successfully.`,
      };
    },
    bulk_update_eal_levels: async (args) => ({
      updated: ((args.updates as unknown[]) ?? []).length,
      students: [],
    }),
    search_resources: async () => ({
      resources: [
        {
          id: "res_1",
          name: "Photosynthesis interactive simulator",
          type: "simulation",
          preview: "PhET interactive that lets students manipulate light/water levels.",
        },
      ],
    }),
    generate_quiz_from_content: async () => ({
      questions: [
        {
          id: "gq1",
          prompt: "What do plants need to make food?",
          type: "multiple-choice",
          options: ["Sun", "Sound", "Plastic", "Iron"],
          correctAnswerIndex: 0,
          explanation: "Plants need sunlight to drive photosynthesis.",
          learningObjectiveId: "lo-1",
        },
      ],
    }),
    preview_student_experience: async (args) => {
      const studentId = (args.studentId as string) ?? "maya";
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const activityType = args.activityType as string;
      const profile = await getStudentProfile(studentId);
      const preview =
        activityType === "text"
          ? STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
            STUB_TEXT_LESSONS.maya[lessonId]
          : activityType === "video"
            ? STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
              STUB_VIDEO_LESSONS.maya[lessonId]
            : null;
      return {
        preview,
        narrativeDescription: `For ${profile?.name ?? studentId} (${profile?.ealLevel ?? "Emerging"}), the ${activityType} lesson is themed around ${profile?.interests[0] ?? "their interests"} with vocabulary calibrated to their EAL level.`,
      };
    },
    generate_report: async () => ({
      report: {
        title: "Weekly progress summary",
        sections: [
          {
            heading: "Headline insight",
            bodyMarkdown:
              "Maya's quiz performance is steady but her time-on-task in voice activities is the lowest in the class — let's adjust her voice activity difficulty.",
          },
        ],
      },
    }),
    simplify_text: async (args) => ({
      simplified:
        "Plants make food from sun. They need water and air too. This is photosynthesis.",
      originalGrade: 7,
      newGrade: 3,
      requested: args,
    }),
  };
}

export function buildStudentHandlers(studentId: string): ToolHandlerMap {
  return {
    generate_text_lesson: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      return (
        STUB_TEXT_LESSONS[id]?.[lessonId] ??
        STUB_TEXT_LESSONS.maya[lessonId] ??
        STUB_TEXT_LESSONS.maya["photosynthesis-1"]
      );
    },
    generate_video_lesson_questions: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const lessonId = (args.lessonId as string) ?? "photosynthesis-1";
      const youtubeId = (args.youtubeId as string) ?? "UPBMG5EYydo";
      const seed =
        STUB_VIDEO_LESSONS[id]?.[lessonId] ??
        STUB_VIDEO_LESSONS.maya[lessonId];
      const seedQuestions = seed?.overlayQuestions ?? [];

      // If we can fetch a real transcript, realign each seed question's
      // `pauseAtSeconds` to the nearest cue boundary that mentions a
      // relevant concept. The wording and answer keys stay intact —
      // only the timestamp moves. This way Maya's hand-tuned questions
      // still feel personalized but the pause never lands mid-sentence.
      try {
        const transcript = await fetchTranscript(youtubeId);
        if (transcript && seedQuestions.length > 0) {
          const points = suggestPausePoints(transcript, {
            count: seedQuestions.length,
            keywords: [
              "sunlight",
              "water",
              "air",
              "carbon dioxide",
              "chlorophyll",
              "photosynthesis",
              "leaves",
              "roots",
              "oxygen",
            ],
          });
          if (points.length === seedQuestions.length) {
            const aligned = seedQuestions.map((q, i) => ({
              ...q,
              pauseAtSeconds: points[i].atSeconds,
            }));
            return { overlayQuestions: aligned };
          }
        }
      } catch {
        /* fall through to seed timestamps */
      }
      return { overlayQuestions: seedQuestions };
    },
    search_youtube_video: async () => ({
      candidates: [
        {
          youtubeId: "UPBMG5EYydo",
          title: "Photosynthesis | Educational Video for Kids",
          channel: "Happy Learning English",
          duration: 240,
          thumbnailUrl: "https://i.ytimg.com/vi/UPBMG5EYydo/hqdefault.jpg",
        },
        {
          youtubeId: "D1Ymc311XS8",
          title: "Photosynthesis For Kids",
          channel: "Peekaboo Kidz",
          duration: 312,
          thumbnailUrl: "https://i.ytimg.com/vi/D1Ymc311XS8/hqdefault.jpg",
        },
        {
          youtubeId: "g78utcLQrJ4",
          title: "How Do Plants Make Food",
          channel: "FuseSchool",
          duration: 350,
          thumbnailUrl: "https://i.ytimg.com/vi/g78utcLQrJ4/hqdefault.jpg",
        },
      ],
    }),
    generate_story_game_node: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      return id === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA;
    },
    generate_story_image: async (args) => ({
      imageUrl: null,
      fallbackEmoji: "🌸🦋☀️🌿",
      source: "emoji-only" as const,
      requested: args,
    }),
    submit_quiz_answer: async (args) => {
      const correct = true; // optimistic stub — real route does evaluation
      return {
        correct,
        feedback: correct
          ? "Yes! Plants need sunlight to make food."
          : "Almost! Plants need sunlight, not just air.",
        pointsEarned: correct ? 10 : 0,
        requested: args,
      };
    },
    get_student_progress: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      return {
        progress: {
          studentId: id,
          xp: id === "liam" ? 720 : 240,
          streakDays: id === "liam" ? 7 : 3,
          completedActivities: [],
          quizScores: {},
          skillMastery: {},
        },
      };
    },
    run_placement_quiz: async () => ({
      complete: true,
      assessedEalLevel: "Developing",
      suggestedInterests: ["plants", "drawing"],
    }),
    start_voice_conversation: async () => ({
      signedUrl: "https://example.com/stub-signed-url",
      agentPersonaPrompt: "Stub persona prompt",
      maxDurationSeconds: 300,
    }),
    get_personalized_dashboard: async (args) => {
      const id = (args.studentId as string) ?? studentId;
      const profile = await getStudentProfile(id);
      return STUB_DASHBOARDS[id] ?? stubDashboardForStudent(profile);
    },
  };
}
