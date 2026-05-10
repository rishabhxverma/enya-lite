import type { TextLessonContent } from "@shared/types";
import { callForJson, withDocumentRef, MODELS } from "../backboard-call";
import { TextLessonSchema, TEXT_LESSON_SCHEMA_SUMMARY } from "../schemas";
import {
  STUDENT_GENERATOR_ROLE,
  EAL_STYLE_CARDS,
  studentProfileBlock,
  jsonOnlyInstructions,
} from "../system-prompts";
import { getStudentProfile } from "./profile";

export interface GenerateTextLessonArgs {
  studentId: string;
  lessonId: string;
  topic: string;
  learningObjectives: string[];
  documentId?: string;
}

export async function generateTextLesson(
  args: GenerateTextLessonArgs
): Promise<TextLessonContent> {
  const profile = await getStudentProfile(args.studentId);
  if (!profile) {
    throw new Error(`generateTextLesson: unknown studentId '${args.studentId}'`);
  }

  const systemPrompt = `${STUDENT_GENERATOR_ROLE}

[TASK: TEXT LESSON]
Generate a personalized text lesson. Structure:
TITLE → 3-4 short SECTIONS (each with one ## sub-header and 2-3 short
paragraphs at level-appropriate complexity) → 1-2 EMBEDDED EMOJI DIAGRAMS
that illustrate a concept visually → 3 COMPREHENSION QUESTIONS.

Embed student INTEREST hooks in the opening AND at least one example per
section. Honor EAL caps STRICTLY.

${studentProfileBlock(profile)}

${EAL_STYLE_CARDS[profile.ealLevel]}

${jsonOnlyInstructions(TEXT_LESSON_SCHEMA_SUMMARY)}`;

  const userBody = `Generate the text lesson for:
- lessonId: ${args.lessonId}
- Topic: ${args.topic}
- Learning objectives:
${args.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join("\n")}

Use the document as your source of truth for facts. Personalize examples to
${profile.name}'s interests: ${profile.interests.join(", ")}.`;

  const lesson = await callForJson({
    systemPrompt,
    content: withDocumentRef(args.documentId, userBody),
    schema: TextLessonSchema,
    model: MODELS.generation,
  });
  // Pin the studentId/lessonId — the model occasionally echoes placeholders.
  return {
    ...(lesson as TextLessonContent),
    studentId: args.studentId,
    lessonId: args.lessonId,
  };
}
