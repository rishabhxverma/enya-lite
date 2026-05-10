import type { ToolDefinition } from "@shared/types";

export const STUDENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "generate_text_lesson",
      description:
        "Generate a personalized text lesson for a student. Output adheres strictly to the student's EAL level and weaves in their interests.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          topic: { type: "string" },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
          },
          documentId: {
            type: "string",
            description: "Backboard document for RAG context",
          },
        },
        required: ["studentId", "lessonId", "topic", "learningObjectives"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_video_lesson_questions",
      description:
        "Generate overlay quiz questions for a YouTube video, distributed across the runtime, calibrated to the student's EAL level.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          youtubeId: { type: "string" },
          transcript: { type: "string" },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
          },
          questionCount: { type: "integer", default: 3 },
        },
        required: [
          "studentId",
          "lessonId",
          "youtubeId",
          "learningObjectives",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_youtube_video",
      description:
        "Search YouTube for kid-friendly, embeddable, captioned videos for a topic. Returns the top 3 candidates filtered by safe search.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          gradeLevel: { type: "integer", minimum: 1, maximum: 12 },
          maxDurationSeconds: { type: "integer", default: 720 },
          preferredChannels: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["topic", "gradeLevel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_story_game_node",
      description:
        "Generate the next node in a personalized story game (a quiz disguised as a choose-your-adventure). Each node has 2-4 choices, wrong choices become teaching moments.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          previousNodes: {
            type: "array",
            items: { type: "object" },
            description: "Prior nodes + choices the student made",
          },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
          },
          isFirstNode: { type: "boolean" },
          isFinalNode: {
            type: "boolean",
            description: "Force a terminal node",
          },
        },
        required: ["studentId", "lessonId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_story_image",
      description:
        "Generate or look up an illustration for a story scene. Returns AI-generated image, curated path, OR a fallback emoji scene.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          sceneDescription: { type: "string" },
          theme: { type: "string" },
        },
        required: ["studentId", "sceneDescription", "theme"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_quiz_answer",
      description:
        "Evaluate a student's quiz answer, return correctness, EAL-appropriate feedback, points earned, and an optional next hint.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          questionId: { type: "string" },
          answer: {
            description: "Either a string or a numeric option index",
          },
        },
        required: ["studentId", "lessonId", "questionId", "answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_progress",
      description:
        "Retrieve a student's current progress (XP, streak, completed activities, mastery).",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
        },
        required: ["studentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_placement_quiz",
      description:
        "Step through an adaptive placement quiz. Returns next question OR final assessed EAL level + suggested interests.",
      parameters: {
        type: "object",
        properties: {
          studentName: { type: "string" },
          grade: { type: "integer" },
          action: { type: "string", enum: ["next", "submit"] },
          currentAnswers: { type: "object" },
        },
        required: ["studentName", "grade", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_voice_conversation",
      description:
        "Provision an ElevenLabs voice tutor session for a student activity. Returns signed URL, persona prompt, and max duration.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          activitySubtype: {
            type: "string",
            enum: [
              "explain-back",
              "debate",
              "comprehension",
              "pronunciation",
            ],
          },
          objectives: { type: "array", items: { type: "string" } },
        },
        required: ["studentId", "lessonId", "activitySubtype"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personalized_dashboard",
      description:
        "Build the personalized dashboard payload (greeting, today's recommendation, XP, nudges, themed hero image) for a student.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
        },
        required: ["studentId"],
      },
    },
  },
];

export const STORY_GAME_TOOLS: ToolDefinition[] = STUDENT_TOOLS.filter((t) =>
  ["generate_story_game_node", "generate_story_image"].includes(t.function.name)
);
