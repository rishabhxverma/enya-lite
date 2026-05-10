/**
 * Student analytics — synthesizes from progress memory entries written by
 * `submit_quiz_answer` + activity completion. Falls back to LLM-synthesized
 * plausible numbers if no memory exists yet (so a fresh demo has something
 * to show, while real demo prep that submits answers gets real numbers).
 */
import { recallFacts } from "../backboard-call";
import { callForJson, MODELS } from "../backboard-call";
import { StudentAnalyticsSchema, ANALYTICS_SCHEMA_SUMMARY } from "../schemas";
import { TEACHER_ANALYST_ROLE, jsonOnlyInstructions } from "../system-prompts";

export interface AnalyticsArgs {
  studentId: string;
  courseId?: string;
  timeRange?: "7d" | "30d" | "all";
}

export async function getStudentAnalytics(args: AnalyticsArgs) {
  // Pull all progress + profile memory for this student.
  const memories = await recallFacts(`student:${args.studentId} progress`, 20);
  const profileMemories = await recallFacts(`[student:${args.studentId}]`, 5);

  const memoryDigest = [...memories, ...profileMemories]
    .map((m) => `- ${m.content}`)
    .join("\n");

  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: STUDENT ANALYTICS]
Synthesize a student analytics summary. Use the provided memory entries as
your evidence base. Where the memories don't contain a specific number, fall
back to plausible defaults appropriate for the student's grade and EAL
level — but flag in the comment if you had to invent.

Skill radar dimensions for EAL: Reading, Vocabulary, Speaking, Writing,
Listening (plus optional subject-specific skill).

${jsonOnlyInstructions(ANALYTICS_SCHEMA_SUMMARY)}`;

  const userBody = `Synthesize analytics for studentId: ${args.studentId}
${args.courseId ? `Course: ${args.courseId}` : ""}
Time range: ${args.timeRange ?? "all"}

[MEMORY DIGEST]
${memoryDigest || "(no progress memory found — synthesize plausible numbers for a learner at this stage)"}`;

  const analytics = await callForJson({
    systemPrompt,
    content: userBody,
    schema: StudentAnalyticsSchema,
    model: MODELS.fastChat,
  });
  return { analytics };
}
