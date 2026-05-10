import { callForJson, MODELS } from "../backboard-call";
import { SimplifyTextSchema, SIMPLIFY_TEXT_SUMMARY } from "../schemas";
import { TEACHER_ANALYST_ROLE, jsonOnlyInstructions } from "../system-prompts";

export interface SimplifyArgs {
  text: string;
  targetReadingLevel: string; // e.g. "grade3"
}

export async function simplifyText(args: SimplifyArgs) {
  const targetGrade = parseInt(args.targetReadingLevel.replace(/[^0-9]/g, ""), 10) || 3;

  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: SIMPLIFY TEXT]
Rewrite the provided text at the target US reading grade level. Apply Flesch-Kincaid heuristics:
- Grade 1-2: ≤8 words/sentence, top-500 vocabulary, present tense.
- Grade 3-4: ≤12 words/sentence, top-1000 vocabulary, simple past+future.
- Grade 5-6: ≤16 words/sentence, top-2000 vocabulary, multi-clause OK.
- Grade 7+: natural complexity.

Preserve the meaning. Replace jargon with everyday equivalents in context.

${jsonOnlyInstructions(SIMPLIFY_TEXT_SUMMARY)}`;

  const userBody = `Target reading level: grade ${targetGrade}.

[ORIGINAL TEXT]
${args.text}

Estimate the original reading grade in your response.`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: SimplifyTextSchema,
    model: MODELS.generation,
  });
}
