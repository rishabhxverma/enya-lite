/**
 * Voice session — mints an ElevenLabs signed URL plus the per-conversation
 * persona override prompt (architecture §2.4 of ultraplan-02).
 */
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { VoiceSubtype } from "@shared/types";
import { EAL_TO_CEFR } from "@shared/types";
import { getStudentProfile } from "./profile";

export interface VoiceSessionArgs {
  studentId: string;
  lessonId: string;
  activitySubtype: VoiceSubtype;
  objectives?: string[];
}

export interface VoiceSessionResult {
  signedUrl: string;
  agentPersonaPrompt: string;
  maxDurationSeconds: number;
}

let cachedClient: ElevenLabsClient | null = null;
function getClient(): ElevenLabsClient | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  cachedClient = new ElevenLabsClient({ apiKey });
  return cachedClient;
}

export async function startVoiceConversation(
  args: VoiceSessionArgs
): Promise<VoiceSessionResult> {
  const profile = await getStudentProfile(args.studentId);
  if (!profile)
    throw new Error(
      `startVoiceConversation: unknown studentId '${args.studentId}'`
    );

  const personaPrompt = `[STUDENT PROFILE]
Name: ${profile.name}
Grade: ${profile.grade}
EAL Level: ${profile.ealLevel} (${EAL_TO_CEFR[profile.ealLevel]})
Interests: ${profile.interests.join(", ")}
Cultural Background: ${profile.culturalBackground || "(unspecified)"}

[ACTIVITY]
Subtype: ${args.activitySubtype}
Objectives: ${(args.objectives ?? ["explore the lesson topic"]).join("; ")}
Lesson: ${args.lessonId}

[CONSTRAINTS]
Maximum duration: 5 minutes.
Speech complexity for ${profile.ealLevel} level — see base prompt for caps.
Weave ${profile.interests[0] ?? "their interests"} into examples where natural.
End the session by summarizing one thing ${profile.name} did well.`;

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const client = getClient();

  if (!client || !agentId) {
    console.warn(
      "[voice-session] ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID missing — returning empty signedUrl (frontend will fall back to simulated mode)"
    );
    return {
      signedUrl: "",
      agentPersonaPrompt: personaPrompt,
      maxDurationSeconds: 300,
    };
  }

  try {
    const resp = await client.conversationalAi.conversations.getSignedUrl({
      agentId,
    });
    return {
      signedUrl: resp.signedUrl,
      agentPersonaPrompt: personaPrompt,
      maxDurationSeconds: 300,
    };
  } catch (err) {
    console.warn(
      `[voice-session] ElevenLabs error, returning empty signedUrl: ${err instanceof Error ? err.message : String(err)}`
    );
    return {
      signedUrl: "",
      agentPersonaPrompt: personaPrompt,
      maxDurationSeconds: 300,
    };
  }
}
