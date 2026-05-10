import axios from "axios";
import type { StudentProfile, VoiceSubtype } from "@shared/types";
import { EAL_TO_CEFR } from "@shared/types";

export interface VoiceSessionResponse {
  signedUrl: string;
  agentPersonaPrompt: string;
  maxDurationSeconds: number;
}

export function buildVoiceOverrideSystemPrompt(args: {
  student: StudentProfile;
  lessonTitle: string;
  activitySubtype: VoiceSubtype;
  objectives: string[];
}): string {
  const { student, lessonTitle, activitySubtype, objectives } = args;
  return `[STUDENT PROFILE]
Name: ${student.name}
Grade: ${student.grade}
EAL Level: ${student.ealLevel} (${EAL_TO_CEFR[student.ealLevel]})
Interests: ${student.interests.join(", ")}
Cultural Background: ${student.culturalBackground}

[ACTIVITY]
Subtype: ${activitySubtype}
Objectives: ${objectives.join("; ")}
Lesson Topic: ${lessonTitle}

[CONSTRAINTS]
Maximum duration: 5 minutes.
Speech complexity for ${student.ealLevel} level — see base prompt for caps.
Weave ${student.interests[0] ?? "everyday"} examples where natural.
End the session by summarizing one thing ${student.name} did well.`;
}

export async function getSignedConversationUrl(): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  // ElevenLabs Conversational AI agents can have multiple "branches"
  // (versions / drafts). When ELEVENLABS_BRANCH_ID is set we pin to it;
  // otherwise the request resolves to whichever branch the dashboard has
  // flagged as active.
  const branchId = process.env.ELEVENLABS_BRANCH_ID;
  if (!apiKey || !agentId) return null;
  try {
    const params: Record<string, string> = { agent_id: agentId };
    if (branchId) params.branch_id = branchId;
    const { data } = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url`,
      {
        params,
        headers: { "xi-api-key": apiKey },
        timeout: 8_000,
      }
    );
    return (data as { signed_url?: string; signedUrl?: string }).signed_url ??
      (data as { signedUrl?: string }).signedUrl ??
      null;
  } catch (err) {
    console.error("[elevenlabs] signed url failed", err);
    return null;
  }
}

export async function isHealthy(): Promise<boolean> {
  return Boolean(
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID
  );
}
