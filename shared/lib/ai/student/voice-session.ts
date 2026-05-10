/**
 * Voice session — mints an ElevenLabs signed URL plus the per-conversation
 * persona override prompt (architecture §2.4 of ultraplan-02).
 */
import type { VoiceSubtype } from "@shared/types";
import { EAL_TO_CEFR } from "@shared/types";
import { getSignedConversationUrl } from "@shared/lib/elevenlabs";
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

  const signedUrl = await getSignedConversationUrl();
  if (!signedUrl) {
    console.warn(
      "[voice-session] signed URL unavailable — returning empty signedUrl (frontend will fall back to simulated mode)"
    );
    return {
      signedUrl: "",
      agentPersonaPrompt: personaPrompt,
      maxDurationSeconds: 300,
    };
  }
  return {
    signedUrl,
    agentPersonaPrompt: personaPrompt,
    maxDurationSeconds: 300,
  };
}
