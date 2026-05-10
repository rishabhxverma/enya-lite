import type { ToolDefinition } from "@shared/types";

export const TEACHER_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "parse_uploaded_document",
      description:
        "Parse an uploaded PDF/DOCX file via Docling and store chunks as a Backboard document for RAG. Call this immediately after a teacher uploads a file.",
      parameters: {
        type: "object",
        properties: {
          fileName: { type: "string", description: "Original filename" },
          uploadId: {
            type: "string",
            description:
              "Client-provided upload ID matching the file in temp storage",
          },
        },
        required: ["fileName", "uploadId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_course_outline",
      description:
        "Generate a course outline (units → lessons → 4 activities each) from a parsed textbook document. Use only after parse_uploaded_document succeeded. Default to 3-5 units, 3-5 lessons per unit unless the teacher specifies otherwise.",
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string" },
          topic: { type: "string" },
          gradeLevel: { type: "integer", minimum: 1, maximum: 12 },
          curriculumStandard: {
            type: "string",
            description: "e.g., 'BC Grade 3 Science 2.1'",
          },
          targetUnitCount: { type: "integer", default: 3 },
          lessonsPerUnit: { type: "integer", default: 3 },
        },
        required: ["documentId", "topic", "gradeLevel", "curriculumStandard"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_student_profile",
      description:
        "Create or update a student profile and store it in memory. Use when the teacher describes a student.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          grade: { type: "integer" },
          ealLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
          },
          interests: { type: "array", items: { type: "string" } },
          culturalBackground: { type: "string" },
          learningGoals: { type: "array", items: { type: "string" } },
        },
        required: ["name", "grade", "ealLevel", "interests"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "audit_content_pedagogically",
      description:
        "Run a pedagogical audit on a document or course. Returns Bloom's, scaffolding, vocab, culture, curriculum scores and prioritized recommendations.",
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string" },
          courseId: { type: "string" },
          targetGrade: { type: "integer" },
          targetEalLevels: { type: "array", items: { type: "string" } },
          curriculumStandards: { type: "array", items: { type: "string" } },
        },
        required: ["targetGrade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_for_eal_level",
      description:
        "Adapt a piece of content (text, quiz, activity) to a target EAL level while preserving learning objectives.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          contentType: {
            type: "string",
            enum: ["text", "quiz", "activity"],
          },
          targetEalLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
          },
          preserveLearningObjectives: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["content", "targetEalLevel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_analytics",
      description:
        "Retrieve a student's performance analytics (quiz scores, time spent, EAL growth indicators, skill mastery).",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          courseId: { type: "string" },
          timeRange: {
            type: "string",
            enum: ["7d", "30d", "all"],
            default: "all",
          },
        },
        required: ["studentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_curriculum_standards",
      description:
        "Search official curriculum standards (BC, Alberta) by keyword and grade level. Returns matching standards with descriptions.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          jurisdiction: {
            type: "string",
            enum: ["BC", "Alberta"],
          },
          gradeLevel: { type: "integer", minimum: 1, maximum: 12 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "map_to_curriculum",
      description:
        "Map a piece of content (course/lesson/activity) to specific curriculum standards. Returns mappings with rationale.",
      parameters: {
        type: "object",
        properties: {
          contentId: { type: "string" },
          jurisdictions: { type: "array", items: { type: "string" } },
        },
        required: ["contentId", "jurisdictions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_classroom",
      description:
        "Create, update, delete, or assign students/courses to a classroom. Use for any classroom roster management.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "create",
              "update",
              "delete",
              "list",
              "assign-students",
              "assign-course",
            ],
          },
          classroomId: { type: "string" },
          name: { type: "string" },
          studentIds: { type: "array", items: { type: "string" } },
          courseId: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_update_eal_levels",
      description:
        "Bulk update EAL levels for multiple students at once. Use after a placement assessment or end-of-term review.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                studentId: { type: "string" },
                newLevel: {
                  type: "string",
                  enum: [
                    "Emerging",
                    "Developing",
                    "Proficient",
                    "Extending",
                  ],
                },
              },
              required: ["studentId", "newLevel"],
            },
          },
        },
        required: ["updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_resources",
      description:
        "Search the resource library for teacher resources by keyword/tag/grade.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          gradeLevel: { type: "integer" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_quiz_from_content",
      description:
        "Generate a quiz of N questions from existing content, calibrated to a target EAL level.",
      parameters: {
        type: "object",
        properties: {
          contentId: { type: "string" },
          questionCount: { type: "integer", minimum: 1, maximum: 25 },
          types: {
            type: "array",
            items: {
              type: "string",
              enum: ["multiple-choice", "true-false", "fill-blank"],
            },
          },
          targetEalLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
          },
        },
        required: ["contentId", "questionCount", "targetEalLevel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "preview_student_experience",
      description:
        "Preview what a specific student will see for a specific lesson activity. Returns the same shape as the student-facing tool would produce, plus a narrative description.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          lessonId: { type: "string" },
          activityType: {
            type: "string",
            enum: ["text", "video", "voice", "story"],
          },
        },
        required: ["studentId", "lessonId", "activityType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description:
        "Generate a written report (summary or detailed) for a student, classroom, or course.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["student", "classroom", "course"],
          },
          targetId: { type: "string" },
          format: {
            type: "string",
            enum: ["summary", "detailed"],
            default: "summary",
          },
        },
        required: ["scope", "targetId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "simplify_text",
      description:
        "Simplify a text passage to a target reading level (grade 1-12).",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          targetReadingLevel: {
            type: "string",
            enum: [
              "grade1",
              "grade2",
              "grade3",
              "grade4",
              "grade5",
              "grade6",
              "grade7",
              "grade8",
              "grade9",
              "grade10",
              "grade11",
              "grade12",
            ],
          },
        },
        required: ["text", "targetReadingLevel"],
      },
    },
  },
];
