import type { ToolDefinition } from "@shared/types";
import {
  EAL_CAPS,
  SIOP_RULES,
  SAFETY,
} from "@shared/lib/tools/prompt-fragments";

// v: 2026-05-10
// Teacher tools — the assistant uses these when chatting with a teacher.
// Most teacher tools generate STAFF-FACING output (audits, reports,
// outlines), not student-facing content. The SIOP/EAL fragments are
// pulled in only where the tool produces something a student will see
// (lesson generation, simplify_text, adjust_for_eal_level, quiz from
// content) — saves tokens on the rest.

export const TEACHER_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "parse_uploaded_document",
      description: `<role>Parse an uploaded textbook (PDF/DOCX) via Docling and index it as a Backboard RAG document.</role>
<task>Call this IMMEDIATELY after a teacher uploads a file. The output documentId is the handle every downstream tool (generate_course_outline, audit_content_pedagogically, generate_text_lesson) must reference.</task>
<red_flags>
- Calling generate_course_outline before parsing — STOP, you need a documentId first.
- Inventing a documentId — STOP, the real one is returned by this tool.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description:
              "Original filename including extension (.pdf or .docx). Used for the document display name.",
          },
          uploadId: {
            type: "string",
            description:
              "Client-provided upload ID matching the file in temp storage. Comes from the upload UI — do not invent.",
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
      description: `<role>Generate a course outline (units → lessons → 4 activities each) from a parsed textbook.</role>
<task>Output is a Course tree: 3-5 units by default, each with 3-5 lessons, each lesson with exactly four activities (text / video / voice / story). Map every lesson to the supplied curriculumStandard.</task>
<outline_rules>
- Each unit is one "big idea" — not a chapter dump. Group lessons by concept.
- Each lesson has 1-4 "I can…" learning objectives. State them in plain student-facing language.
- The four activities per lesson must address the SAME objectives — multimodal reinforcement, not four different topics.
- Order lessons so that later lessons build on earlier ones — name the prerequisite when it exists.
</outline_rules>
${SAFETY}
<red_flags>
- Calling without a real documentId from parse_uploaded_document — STOP.
- More than 8 units or more than 8 lessons per unit — STOP, comprehension drops.
- Activities that don't share objectives with their parent lesson — STOP.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          documentId: {
            type: "string",
            description:
              "Backboard documentId returned by parse_uploaded_document. Must already exist — do not invent.",
          },
          topic: {
            type: "string",
            description:
              "Subject of the course in 2-6 words, e.g. 'Photosynthesis' or 'Fractions and Decimals'.",
          },
          gradeLevel: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description:
              "K-12 grade level. Use the teacher's stated grade — do not guess from topic.",
          },
          curriculumStandard: {
            type: "string",
            description:
              "Curriculum reference, e.g. 'BC Grade 3 Science 2.1' or 'Alberta Grade 6 Math N1'. Ask if the teacher hasn't specified one.",
          },
          targetUnitCount: {
            type: "integer",
            default: 3,
            minimum: 1,
            maximum: 8,
            description:
              "How many top-level units. Default 3-5; respect the teacher if they ask for a specific count.",
          },
          lessonsPerUnit: {
            type: "integer",
            default: 3,
            minimum: 1,
            maximum: 8,
            description: "Lessons per unit. Default 3-5.",
          },
        },
        required: ["documentId", "topic", "gradeLevel", "curriculumStandard"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_student_profile",
      description: `<role>Create or update a student profile from teacher description.</role>
<task>Extract the structured fields from what the teacher said. Do NOT infer culturalBackground from name or interests — only record what the teacher explicitly stated. EAL level defaults: ask if not stated, do not guess.</task>
<red_flags>
- Inferring culture from a student's name — STOP, this is stereotyping.
- Assigning an EAL level the teacher did not state — STOP, ask the teacher.
- Storing fewer than 3 interests — STOP, ask for more; personalization needs material.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Student's full name as the teacher wrote it.",
          },
          grade: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "K-12 grade level.",
          },
          ealLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
            description:
              "English-As-Additional-Language band. Emerging≈A1, Developing≈A2, Proficient≈B1, Extending≈B2.",
          },
          interests: {
            type: "array",
            items: { type: "string" },
            description:
              "3-5 specific student interests (e.g. 'butterflies', 'robotics'). Used to personalize examples.",
          },
          culturalBackground: {
            type: "string",
            description:
              "Short factual note — e.g. 'Newcomer from Aleppo, Arabic L1' or 'Born in Toronto, trilingual home'. Used for culturally-relevant examples, not for stereotypes.",
          },
          learningGoals: {
            type: "array",
            items: { type: "string" },
            description: "Optional learning goals the teacher stated.",
          },
        },
        required: ["name", "grade", "ealLevel", "interests"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "audit_content_pedagogically",
      description: `<role>Run a pedagogical audit on a document or course and return structured scores plus prioritized fixes.</role>
<task>Score the content on five dimensions, each 0-100:
1. Bloom's coverage — does it span Remember → Apply → Analyze, or stall at Remember?
2. Scaffolding — is there a gradual release from modeled to independent practice?
3. Vocabulary load — are tier-2/3 terms introduced with definition + example + non-example?
4. Cultural sensitivity — are examples universal, or do they assume a default cultural frame?
5. Curriculum alignment — does it map to the supplied standards with evidence?

Then return 3-5 PRIORITIZED recommendations, ordered by leverage. Each recommendation has: dimension, severity (Critical/Major/Polish), description, and a concrete rewrite or activity suggestion.</task>
<audit_rules>
- Cite specific passages by chunk/page when calling out a problem.
- Don't flag "needs more pictures" without naming what the picture should show.
- Critical = blocks comprehension for ≥1 target EAL level. Major = degrades but doesn't block. Polish = nice-to-have.
</audit_rules>
${SAFETY}
<red_flags>
- Returning audit scores without recommendations — STOP, scores alone aren't actionable.
- Returning recommendations without citing source passages — STOP.
- All 100s or all <30s — STOP, you're not scoring, you're rubber-stamping.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          documentId: {
            type: "string",
            description:
              "Backboard documentId of the source textbook. Provide either documentId OR courseId — not both.",
          },
          courseId: {
            type: "string",
            description:
              "Course identifier to audit (e.g. 'photosynthesis-101'). Provide either documentId OR courseId — not both.",
          },
          targetGrade: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "K-12 grade the audit should benchmark against.",
          },
          targetEalLevels: {
            type: "array",
            items: {
              type: "string",
              enum: ["Emerging", "Developing", "Proficient", "Extending"],
            },
            description:
              "EAL bands to score for. Default to ['Emerging','Proficient'] (the two demo personas) if unspecified.",
          },
          curriculumStandards: {
            type: "array",
            items: { type: "string" },
            description:
              "Curriculum standard codes to map against, e.g. ['BC Grade 3 Science 2.1'].",
          },
        },
        required: ["targetGrade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_for_eal_level",
      description: `<role>Rewrite a piece of content to match a target EAL level while preserving every learning objective.</role>
<task>Take the input content and rewrite it to the targetEalLevel's cap. The output must STILL teach every objective listed in preserveLearningObjectives — measure success by "can a student at the target level still answer questions about the original objectives after reading this?"</task>
${EAL_CAPS}
${SIOP_RULES}
${SAFETY}
<red_flags>
- Output that drops an objective — STOP, every objective must survive.
- Output that exceeds the EAL cap — STOP, split sentences.
- Output that swaps technical terms for vague ones (e.g. "photosynthesis" → "the plant thing") — STOP, define the term instead of removing it.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The original content to be adapted. Verbatim.",
          },
          contentType: {
            type: "string",
            enum: ["text", "quiz", "activity"],
            description:
              "Shape of the input. 'text' = prose. 'quiz' = questions + answer keys. 'activity' = structured activity definition.",
          },
          targetEalLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
            description: "Target EAL band the output must respect.",
          },
          preserveLearningObjectives: {
            type: "array",
            items: { type: "string" },
            description:
              "'I can…' objectives that MUST survive the rewrite. Pass them all — losing one is a critical failure.",
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
      description: `<role>Retrieve a student's performance analytics.</role>
<task>Return quiz scores (by activity type), time spent (by activity type), EAL growth indicators (vocabulary acquisition rate, sentence complexity in voice activities), and skill-mastery map. Read-only.</task>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description:
              "Student identifier (e.g. 'maya', 'liam'). Must match an existing profile.",
          },
          courseId: {
            type: "string",
            description:
              "Optional course filter. Omit to return analytics across all courses.",
          },
          timeRange: {
            type: "string",
            enum: ["7d", "30d", "all"],
            default: "all",
            description: "Rolling window for the metrics.",
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
      description: `<role>Look up official curriculum standards by keyword and grade level.</role>
<task>Return up to 5 matching standards. Each result includes the standard code (e.g. 'BC-G3-Sci-2.1'), the standard's plain-language description, and the subject area.</task>
<red_flags>
- Inventing standard codes — STOP, only return real codes from the supported jurisdictions.
- Returning more than 5 results — STOP, narrow the query.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Keyword search string. Use the teacher's exact phrasing — do not paraphrase.",
          },
          jurisdiction: {
            type: "string",
            enum: ["BC", "Alberta"],
            description:
              "Curriculum jurisdiction. Default to 'BC' if unspecified.",
          },
          gradeLevel: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "Restrict to a specific K-12 grade.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "map_to_curriculum",
      description: `<role>Map a course / lesson / activity to specific curriculum standards.</role>
<task>For each jurisdiction provided, return 1-3 standards the content addresses. Each mapping includes: standard code, rationale (one sentence citing what in the content addresses the standard), and confidence score 0-1.</task>
<red_flags>
- Confidence ≥0.8 without a specific rationale — STOP, justify or lower it.
- Returning a standard the content doesn't actually address — STOP, prefer fewer-but-true mappings.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          contentId: {
            type: "string",
            description:
              "ID of the course, lesson, or activity to map. Must exist.",
          },
          jurisdictions: {
            type: "array",
            items: { type: "string", enum: ["BC", "Alberta"] },
            description:
              "List of curriculum jurisdictions to map against.",
          },
        },
        required: ["contentId", "jurisdictions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_classroom",
      description: `<role>Manage classroom roster: create, update, delete, list, or assign students/courses.</role>
<task>Branch on 'action'. Read-only actions ('list') need no other params. Mutating actions return the resulting classroom shape so the UI can re-render.</task>
<red_flags>
- 'delete' without classroomId — STOP, ask which classroom.
- 'assign-students' without studentIds — STOP, ask the teacher which students.
- Inventing classroomIds — STOP, they come from prior list/create calls.
</red_flags>`,
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
            description:
              "What to do. 'list' needs no other params; 'create' needs name; 'update'/'delete'/'assign-*' need classroomId.",
          },
          classroomId: {
            type: "string",
            description:
              "Existing classroom ID. Required for update/delete/assign-students/assign-course.",
          },
          name: {
            type: "string",
            description:
              "Classroom display name. Required for 'create'; optional for 'update'.",
          },
          studentIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Student IDs (e.g. 'maya', 'liam') to add. Used by 'assign-students'.",
          },
          courseId: {
            type: "string",
            description:
              "Course ID to attach to the classroom. Used by 'assign-course'.",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_update_eal_levels",
      description: `<role>Bulk update EAL levels for multiple students at once.</role>
<task>Apply each level change. Use after a placement assessment, end-of-term review, or when the teacher wants to re-band the class. Return the count of updated rows plus the new state.</task>
<red_flags>
- Updates array empty — STOP, ask the teacher which students.
- Same level for everyone in the update — STOP, confirm this is intentional (it usually isn't).
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            description:
              "One entry per student to update. Pass them as a single batch.",
            items: {
              type: "object",
              properties: {
                studentId: {
                  type: "string",
                  description: "Student identifier (e.g. 'maya').",
                },
                newLevel: {
                  type: "string",
                  enum: [
                    "Emerging",
                    "Developing",
                    "Proficient",
                    "Extending",
                  ],
                  description: "New EAL band for this student.",
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
      description: `<role>Search the teacher resource library.</role>
<task>Return matching resources by keyword, tags, and/or grade level. Each result has name, type (simulation/worksheet/video/article), and a one-line preview.</task>`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Keyword search string. Use the teacher's exact phrasing — do not paraphrase.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional resource tags, e.g. ['warm-up','vocabulary','assessment'].",
          },
          gradeLevel: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "Restrict to a specific K-12 grade level.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_quiz_from_content",
      description: `<role>Generate a quiz from existing content, calibrated to a target EAL level.</role>
<task>Produce questionCount questions across the requested types. Each question is grounded in the source content (no outside knowledge), serves a stated learning objective, and respects the targetEalLevel cap in stem AND distractors.</task>
${EAL_CAPS}
<question_rules>
- Distractors must be plausible misconceptions, not silly options.
- Multiple-choice: 3-4 options. True-false: never use trick wording. Fill-blank: one missing word per blank, exact-match expected (Levenshtein 2 tolerance applied at grading time).
- Each question has an 'explanation' field that names WHY the right answer is right, in the student's EAL cap.
</question_rules>
${SAFETY}
<red_flags>
- Question count mismatch — STOP.
- Distractors above the EAL cap when the stem is below it — STOP, match the cap.
- Questions answerable without reading the content — STOP, you're testing prior knowledge.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          contentId: {
            type: "string",
            description:
              "ID of the source content (lesson, document, or activity). Must exist.",
          },
          questionCount: {
            type: "integer",
            minimum: 1,
            maximum: 25,
            description: "How many questions to generate.",
          },
          types: {
            type: "array",
            items: {
              type: "string",
              enum: ["multiple-choice", "true-false", "fill-blank"],
            },
            description:
              "Allowed question types. Mix at least two when questionCount ≥4 for assessment variety.",
          },
          targetEalLevel: {
            type: "string",
            enum: ["Emerging", "Developing", "Proficient", "Extending"],
            description:
              "EAL band the questions and distractors must respect.",
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
      description: `<role>Show the teacher what a specific student will see for a specific lesson activity.</role>
<task>Return the activity payload (same shape the student-facing tool would return), plus a narrativeDescription that explains in 1-2 sentences how this version was personalized: which EAL cap it respects, which interest it leans on, and any culturally-tuned framing.</task>
<red_flags>
- Returning the activity without the narrativeDescription — STOP, the teacher needs the "why".
- narrativeDescription longer than 2 sentences — STOP, it's a preview, not a report.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "Student identifier (e.g. 'maya', 'liam').",
          },
          lessonId: {
            type: "string",
            description: "Lesson identifier from the course outline.",
          },
          activityType: {
            type: "string",
            enum: ["text", "video", "voice", "story"],
            description: "Which of the four activity modes to preview.",
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
      description: `<role>Generate a written progress report for a student, classroom, or course.</role>
<task>Produce 2-4 sections. Each has a heading and a bodyMarkdown block. Sections vary by scope:
- student: headline insight, EAL growth, time-on-task, recommended next step.
- classroom: distribution of EAL levels, mastery hotspots, who needs intervention.
- course: completion rates by activity type, hardest lessons, suggested pacing fixes.

Use the teacher's voice (analytical, concise). Never report raw scores without interpretation.</task>
<red_flags>
- Report longer than 4 sections — STOP, trim to the highest-leverage findings.
- Sections that repeat the same number in prose form — STOP, the dashboard does that.
- Recommending "more practice" without naming the specific skill — STOP, be concrete.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["student", "classroom", "course"],
            description: "Which entity the report covers.",
          },
          targetId: {
            type: "string",
            description:
              "ID of the student / classroom / course to report on.",
          },
          format: {
            type: "string",
            enum: ["summary", "detailed"],
            default: "summary",
            description:
              "'summary' = 2 sections. 'detailed' = 3-4 sections with deeper breakdowns.",
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
      description: `<role>Simplify a text passage to a target reading level.</role>
<task>Rewrite the passage to match the targetReadingLevel. Preserve every fact and named term — define unfamiliar terms inline rather than removing them. Return the simplified text plus the estimated original grade level for reference.</task>
${EAL_CAPS}
<red_flags>
- Dropping a named technical term instead of defining it — STOP, define.
- Output grade level doesn't match the target — STOP, run another pass.
- Adding facts not in the original — STOP, simplification is not augmentation.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The original passage to simplify. Verbatim.",
          },
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
            description: "Target reading-grade for the output.",
          },
        },
        required: ["text", "targetReadingLevel"],
      },
    },
  },
];
