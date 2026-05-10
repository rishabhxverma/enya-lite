import type { EALLevel } from "@shared/types";
import { callForJson, withDocumentRef, MODELS } from "../backboard-call";
import { QuizGenerationSchema, QUIZ_GENERATION_SUMMARY } from "../schemas";
import {
  TEACHER_ANALYST_ROLE,
  EAL_STYLE_CARDS,
  jsonOnlyInstructions,
} from "../system-prompts";

export interface QuizGenArgs {
  contentId?: string;
  documentId?: string;
  questionCount?: number;
  types?: ("multiple-choice" | "true-false" | "fill-blank")[];
  targetEalLevel?: EALLevel;
}

export async function generateQuizFromContent(args: QuizGenArgs) {
  const count = args.questionCount ?? 5;
  const types = args.types ?? ["multiple-choice", "fill-blank", "true-false"];
  const ealCard = args.targetEalLevel ? EAL_STYLE_CARDS[args.targetEalLevel] : "";

  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: GENERATE QUIZ]
Generate ${count} questions from the source material. Question types allowed:
${types.join(", ")}. Each question must:
- Test a specific concept from the source (not generic knowledge).
- Have a clear correct answer.
- Include an "explanation" that teaches, not just confirms.
- Be at the appropriate EAL level.

${ealCard}

${jsonOnlyInstructions(QUIZ_GENERATION_SUMMARY)}`;

  const userBody = `Generate ${count} quiz questions covering distinct concepts from the source.
Mix the types: ${types.join(", ")}.
${args.targetEalLevel ? `Target EAL: ${args.targetEalLevel}.` : ""}

Each question must be answerable from the source content alone — no
outside knowledge required.`;

  return callForJson({
    systemPrompt,
    content: withDocumentRef(args.documentId, userBody),
    schema: QuizGenerationSchema,
    // GPT-4o is the strongest at structured quiz JSON per architecture §4.4.
    model: MODELS.quizJson,
  });
}
