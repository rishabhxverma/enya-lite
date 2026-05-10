import { callForJson, recallFacts, MODELS } from "../backboard-call";
import { ReportSchema, REPORT_SUMMARY } from "../schemas";
import { TEACHER_ANALYST_ROLE, jsonOnlyInstructions } from "../system-prompts";

export interface ReportArgs {
  scope: "student" | "classroom" | "course";
  targetId: string;
  format?: "summary" | "detailed";
}

export async function generateReport(args: ReportArgs) {
  const memories = await recallFacts(`${args.scope}:${args.targetId}`, 15);
  const memoryDigest = memories.map((m) => `- ${m.content}`).join("\n");

  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: GENERATE REPORT]
Write a ${args.format ?? "summary"} report for ${args.scope} '${args.targetId}'.

Structure:
1. Headline Insight — the single most actionable takeaway, 1-2 sentences.
2. Supporting Data — 2-3 bullet points of evidence.
3. Recommended Actions — 2-3 concrete next steps for the teacher.

Total length: under 300 words.

${jsonOnlyInstructions(REPORT_SUMMARY)}`;

  const userBody = `[MEMORY DIGEST]
${memoryDigest || "(no memory found — produce a baseline report appropriate for a fresh learner/classroom)"}`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: ReportSchema,
    model: MODELS.fastChat,
  });
}
