import type { EALLevel } from "@shared/types";
import { callForJson, MODELS } from "../backboard-call";
import { EalAdjustSchema, EAL_ADJUST_SUMMARY } from "../schemas";
import {
  TEACHER_ANALYST_ROLE,
  EAL_STYLE_CARDS,
  jsonOnlyInstructions,
} from "../system-prompts";

export interface EalAdjustArgs {
  content: string;
  contentType?: "text" | "quiz" | "activity";
  targetEalLevel: EALLevel;
  preserveLearningObjectives?: string[];
}

export async function adjustForEalLevel(args: EalAdjustArgs) {
  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: ADAPT CONTENT TO EAL LEVEL]
Rewrite the provided content for the target EAL proficiency level. Apply:
- Vocabulary: replace tier-2/3 words with tier-1 equivalents at the level cap.
- Syntax: break long sentences into shorter ones at the level's word-count cap.
- Cultural references: replace narrow references with universal alternatives.
- Add visual cues, examples, repetition where appropriate.
- PRESERVE learning objectives — never dilute the LEARNING, only the linguistic load.

${EAL_STYLE_CARDS[args.targetEalLevel]}

${jsonOnlyInstructions(EAL_ADJUST_SUMMARY)}`;

  const userBody = `Adapt the following ${args.contentType ?? "content"} to ${args.targetEalLevel} EAL level.

${args.preserveLearningObjectives?.length ? `Preserve these learning objectives:\n${args.preserveLearningObjectives.map((o) => `- ${o}`).join("\n")}\n` : ""}

[ORIGINAL CONTENT]
${args.content}`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: EalAdjustSchema,
    model: MODELS.generation,
  });
}
