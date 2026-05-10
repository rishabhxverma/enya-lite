import type { PersonalizedDashboard } from "@shared/types";
import { callForJson, recallFacts, MODELS } from "../backboard-call";
import {
  PersonalizedDashboardSchema,
  DASHBOARD_SCHEMA_SUMMARY,
} from "../schemas";
import {
  STUDENT_GENERATOR_ROLE,
  EAL_STYLE_CARDS,
  studentProfileBlock,
  jsonOnlyInstructions,
} from "../system-prompts";
import { getStudentProfile } from "./profile";

export async function getPersonalizedDashboard(
  studentId: string
): Promise<PersonalizedDashboard> {
  const profile = await getStudentProfile(studentId);
  if (!profile)
    throw new Error(`getPersonalizedDashboard: unknown studentId '${studentId}'`);

  // Pull recent progress memories so the greeting can reference real activity.
  const progressMemories = await recallFacts(
    `student:${studentId} progress activity`,
    5
  ).catch(() => []);
  const memoryDigest = progressMemories.map((m) => `- ${m.content}`).join("\n");

  const systemPrompt = `${STUDENT_GENERATOR_ROLE}

[TASK: PERSONALIZED DASHBOARD]
Produce a warm, name-personalized greeting plus today's recommendation. Use
the student's interests for emoji + tone. Calibrate vocabulary to EAL level.
Recommend a lesson grounded in either: their current course progress (if
known from memory), or photosynthesis-1 as a safe default for the demo.

${studentProfileBlock(profile)}

${EAL_STYLE_CARDS[profile.ealLevel]}

${jsonOnlyInstructions(DASHBOARD_SCHEMA_SUMMARY)}`;

  const userBody = `Build the dashboard for ${profile.name} (studentId: ${studentId}).

[RECENT ACTIVITY MEMORY]
${memoryDigest || "(no recent activity recorded yet — use a 'getting started' tone)"}`;

  const dash = await callForJson({
    systemPrompt,
    content: userBody,
    schema: PersonalizedDashboardSchema,
    model: MODELS.fastChat,
  });
  return {
    ...(dash as PersonalizedDashboard),
    studentId,
    themedHeroImageUrl: profile.theme.heroImageUrl,
  };
}
