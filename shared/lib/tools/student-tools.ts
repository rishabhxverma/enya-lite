import type { ToolDefinition } from "@shared/types";
import {
  EAL_CAPS,
  SIOP_RULES,
  SAFETY,
  PERSONA_EXAMPLES,
} from "@shared/lib/tools/prompt-fragments";

export const STUDENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "generate_text_lesson",
      description: `<role>Generate a personalized markdown text lesson for one K-12 EAL student.</role>
<task>Produce 3-6 short paragraphs that scaffold the student toward EVERY listed learning objective. Output is rendered as markdown to the student.</task>
${EAL_CAPS}
${SIOP_RULES}
${SAFETY}
${PERSONA_EXAMPLES}
<red_flags>
- Compound sentences for Emerging — STOP, split them.
- Generic examples that ignore the student's interests — STOP, reread the profile.
- Idioms without paraphrase for Emerging/Developing — STOP.
- Front-loading the answer instead of scaffolding to it — STOP.
- More than 6 paragraphs — STOP, you are losing comprehension.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description:
              "Student identifier (e.g. 'maya' or 'liam'). Must match an existing profile — do not invent.",
          },
          lessonId: {
            type: "string",
            description:
              "Lesson identifier from the course outline (e.g. 'photosynthesis-1').",
          },
          topic: {
            type: "string",
            description: "Lesson topic in 2-6 words.",
          },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
            description:
              "1-4 student-facing 'I can…' objectives the text must scaffold toward.",
          },
          documentId: {
            type: "string",
            description:
              "Backboard documentId for RAG grounding. Strongly preferred — without it, the lesson may drift from the source textbook.",
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
      description: `<role>Generate inline overlay quiz questions tied to specific moments in a YouTube video.</role>
<task>Place exactly questionCount questions across the video. Each question MUST be answerable from what the narrator just said in the transcript at that timestamp — not from outside knowledge. Each question serves ONE learning objective.</task>
${EAL_CAPS}
<question_rules>
- Stems for Emerging: "What…?", "Which one…?" — yes/no or one-word answer.
- Stems for Proficient: "Why does…?", "What would happen if…?" — short-explanation answer.
- Three question types allowed: multiple-choice (3-4 options), true-false, fill-blank.
- Distractors must be plausible-but-wrong, not silly — silly distractors break the diagnostic value.
- Anchor wording in vocabulary the video JUST used. Don't introduce new terms in the question.
</question_rules>
${SAFETY}
<example timestamp="0:42 — narrator just defined chlorophyll">
{"type":"multiple-choice","prompt":"What is chlorophyll?","options":["The green stuff that catches sunlight","A bug that lives on leaves","A type of soil","The roots of a plant"],"correctAnswerIndex":0}
</example>
<red_flags>
- Question references something the narrator hasn't said yet — STOP.
- Distractor is obviously absurd — STOP, rewrite it.
- Question uses a word never spoken in the video — STOP.
- Question count doesn't match the requested questionCount — STOP.
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
          youtubeId: {
            type: "string",
            description:
              "YouTube video ID (the 11-char slug, e.g. 'dQw4w9WgXcQ'), NOT the full URL.",
          },
          transcript: {
            type: "string",
            description:
              "Full timestamped transcript text. Omit only if no transcript is available — quality drops sharply without it.",
          },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
            description:
              "1-4 'I can…' objectives each question must serve.",
          },
          questionCount: {
            type: "integer",
            default: 3,
            minimum: 1,
            maximum: 6,
            description:
              "How many overlay questions to place. Default 3 — increase only if the video is longer than 6 minutes.",
          },
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
      description: `<role>Search YouTube for kid-safe educational videos.</role>
<task>Return up to 3 candidates. Filter strictly: must be embeddable, have English captions, pass YouTube's safe search, be within maxDurationSeconds, and come from a known educator channel when possible (SciShow Kids, Crash Course Kids, FuseSchool, Peekaboo Kidz, Happy Learning).</task>
<red_flags>
- Returning a clickbait reaction video — STOP, prefer curriculum channels.
- Including a video without captions — STOP, captions are required for the overlay quiz layer.
- Returning more than 3 candidates — STOP.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Lesson topic in 2-6 words.",
          },
          gradeLevel: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "K-12 grade level the video must match.",
          },
          maxDurationSeconds: {
            type: "integer",
            default: 720,
            description:
              "Hard ceiling on video length. Default 12 minutes — younger grades should go shorter.",
          },
          preferredChannels: {
            type: "array",
            items: { type: "string" },
            description:
              "Preferred YouTube channels. Pass any teacher-supplied favourites.",
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
      description: `<role>Generate one node of a personalized branching-narrative learning game.</role>
<task>Each node is a short scene (2-4 sentences) followed by 2-4 choices. ONE choice advances the story correctly (encodes a learning objective). Other choices are plausible misconceptions — picking them triggers a "teaching moment" rather than a hard fail. The student is the protagonist; the setting matches their interests.</task>
${EAL_CAPS}
${SIOP_RULES}
${SAFETY}
<choice_design>
- Correct choice = applies an objective.
- Wrong choices = real misconceptions students hold (not silly options).
- Each wrong choice has a feedbackOnSelect string that names the misconception and redirects without shaming.
- isFirstNode=true: open the world, no quiz logic — just hook the student in.
- isFinalNode=true: wrap the story with a one-line recap of what they learned. No choices.
</choice_design>
<example student="Maya" topic="photosynthesis">
{"narrative":"You walk into your garden. The butterfly on the rose looks tired. The rose has no sun today.","choices":[
  {"label":"Move the rose to the sunny spot","feedbackOnSelect":"Yes! Plants need sunlight to make food.","isCorrect":true},
  {"label":"Give the rose more water","feedbackOnSelect":"Water helps, but the rose needs sun first. Sun is the missing piece today.","isCorrect":false}
]}
</example>
<red_flags>
- Wrong choices that are obviously silly — STOP, rewrite them as real misconceptions.
- Feedback that says "wrong" or "no" — STOP, scaffold instead.
- Setting that ignores the student's interests — STOP, reread the profile.
- More than 4 choices — STOP, comprehension drops.
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
          previousNodes: {
            type: "array",
            items: { type: "object" },
            description:
              "Prior nodes plus the student's chosen option for each — full chain so the story stays coherent. Empty array if isFirstNode is true.",
          },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
            description: "1-4 'I can…' objectives the story must scaffold.",
          },
          isFirstNode: {
            type: "boolean",
            description:
              "True if this is the opening node. Opens the story world — no quiz logic yet.",
          },
          isFinalNode: {
            type: "boolean",
            description:
              "Force a terminal (no-choices) node that wraps the story. Set true after roughly 4-6 nodes or when the student has answered all objectives.",
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
      description: `<role>Provide an illustration for a story-game scene.</role>
<task>Return one of three forms (in order of preference): an AI-generated image URL, a curated asset path, or an emoji-scene fallback. Image content must match the student's interests and be appropriate for their grade.</task>
${SAFETY}
<red_flags>
- Photorealistic image of any real person — STOP.
- Image content that doesn't match the scene description — STOP.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "Student identifier (e.g. 'maya', 'liam').",
          },
          sceneDescription: {
            type: "string",
            description:
              "1-2 sentence prose description of the scene to illustrate. Use the same vocabulary the story node uses.",
          },
          theme: {
            type: "string",
            description:
              "Visual theme keyword (e.g. 'garden', 'space-station', 'underwater'). Drives style and palette.",
          },
        },
        required: ["studentId", "sceneDescription", "theme"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_quiz_answer",
      description: `<role>Grade a student's quiz answer and return EAL-appropriate feedback.</role>
<task>Compare the answer to the question's correct value. For fill-blank, use Levenshtein distance ≤2 so close spellings (e.g. "fotosintesis" → "photosynthesis") are accepted — EAL students often have the concept before the orthography. Return correctness, feedback in the student's EAL cap, and points (10 if correct, 0 if not).</task>
${EAL_CAPS}
<feedback_rules>
- Correct: name what they got right, link it to the objective. Never just "Yes!".
- Wrong: never say "wrong" or "no". Use "close — what about…" and point at the right idea.
- One sentence for Emerging/Developing. Up to two for Proficient/Extending.
</feedback_rules>
<red_flags>
- Feedback longer than the EAL cap allows — STOP.
- Awarding points for "almost right" on multiple-choice — STOP, MC is exact-match.
- Rejecting a fill-blank answer that's within Levenshtein 2 — STOP, accept it.
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
            description: "Lesson identifier the question belongs to.",
          },
          questionId: {
            type: "string",
            description:
              "Quiz question identifier from the rendered activity. Must reference a real question — do not invent.",
          },
          answer: {
            description:
              "Student's raw answer. Numeric index (0-based) for multiple-choice; lowercase string for fill-blank or true/false. Fill-blank is graded with Levenshtein tolerance of 2, so close spellings are accepted.",
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
      description: `<role>Retrieve current progress state for one student.</role>
<task>Return XP, current streak, completed activity IDs, recent quiz scores, and skill-mastery map. Read-only — never modify state from this tool.</task>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "Student identifier (e.g. 'maya', 'liam').",
          },
        },
        required: ["studentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_placement_quiz",
      description: `<role>Step through an adaptive placement quiz to assess a new student's EAL level.</role>
<task>action='next' returns the next question, branching on prior answers (adaptive). action='submit' finalizes and returns the assessed EAL level (Emerging/Developing/Proficient/Extending) plus 2-3 suggested interest tags inferred from the answers. Questions are themselves EAL-calibrated: a struggling student should see simpler stems, not harder ones.</task>
${SAFETY}
<red_flags>
- Asking grade-9 vocabulary of a grade-3 student — STOP.
- Inferring interests from cultural background instead of from answer content — STOP, this is stereotyping.
- Returning a level without enough evidence (≥4 answers) — STOP.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          studentName: {
            type: "string",
            description: "Student's full name.",
          },
          grade: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "K-12 grade level.",
          },
          action: {
            type: "string",
            enum: ["next", "submit"],
            description:
              "'next' to fetch the next placement question; 'submit' to finalize and return the assessed EAL level.",
          },
          currentAnswers: {
            type: "object",
            description:
              "Map of questionId -> student's answer so far. Pass the full accumulating object on each call so the adaptive logic can branch.",
          },
        },
        required: ["studentName", "grade", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_voice_conversation",
      description: `<role>Provision an ElevenLabs voice tutor session.</role>
<task>Returns a signed WebSocket URL, the per-session persona prompt, and the max duration (300s). The persona prompt is constructed server-side from the student profile + lesson + EAL caps — do NOT pass instructions inline here, only the structured parameters below.</task>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "Student identifier (e.g. 'maya', 'liam').",
          },
          lessonId: {
            type: "string",
            description: "Lesson identifier the voice session belongs to.",
          },
          activitySubtype: {
            type: "string",
            enum: [
              "explain-back",
              "debate",
              "comprehension",
              "pronunciation",
            ],
            description:
              "What the voice session asks the student to do. 'explain-back' = teach the concept back; 'debate' = defend a position; 'comprehension' = answer questions; 'pronunciation' = practice target words.",
          },
          objectives: {
            type: "array",
            items: { type: "string" },
            description:
              "Learning objectives this session should reinforce. Inherit from the lesson when not specified.",
          },
        },
        required: ["studentId", "lessonId", "activitySubtype"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personalized_dashboard",
      description: `<role>Build the personalized student dashboard payload.</role>
<task>Return greeting (in the student's EAL cap and using their name), one "today's recommendation" (the next un-mastered activity), current XP and streak, 1-3 nudges (e.g. "you haven't done a voice activity this week"), and a themed hero image keyed to their interests.</task>
${EAL_CAPS}
<red_flags>
- Greeting longer than the EAL cap — STOP.
- Recommending an activity the student has already mastered — STOP.
- Nudges that shame ("you're falling behind") — STOP, reframe as invitation.
</red_flags>`,
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "Student identifier (e.g. 'maya', 'liam').",
          },
        },
        required: ["studentId"],
      },
    },
  },
];

export const STORY_GAME_TOOLS: ToolDefinition[] = STUDENT_TOOLS.filter((t) =>
  ["generate_story_game_node", "generate_story_image"].includes(t.function.name)
);
