import { NextResponse } from "next/server";
import { getSignedConversationUrl } from "@shared/lib/elevenlabs";
import {
  buildMissionSystemPrompt,
  getMissionForStudent,
} from "@shared/lib/voice-missions";
import { getStudentProfile } from "@shared/lib/student-profiles";
import type { VoiceSubtype } from "@shared/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = (body.studentId as string) ?? "maya";
  const lessonId = (body.lessonId as string) ?? "photosynthesis-1";
  const activitySubtype = (body.activitySubtype as VoiceSubtype) ?? "explain-back";

  const student = await getStudentProfile(studentId);
  const lessonTitle = body.lessonTitle ?? "What do plants need?";

  // Hand-authored Mission for Maya/Liam; generic fallback for any other id.
  // In a fuller build this would be LLM-generated per session — see
  // VOICE-GAME-DESIGN.md §2.3.
  const mission = getMissionForStudent(studentId, lessonId, student);
  const agentPersonaPrompt = buildMissionSystemPrompt({
    mission,
    student,
    lessonTitle,
  });

  const signedUrl = await getSignedConversationUrl();

  return NextResponse.json({
    signedUrl,
    agentPersonaPrompt,
    maxDurationSeconds: mission.maxDurationSeconds,
    fallbackMp3: `/seed/voice-fallback-${studentId}.mp3`,
    voiceMode: process.env.NEXT_PUBLIC_VOICE_MODE ?? "live",
    studentId,
    lessonId,
    activitySubtype,
    // Mission payload — used by the activity UI to render task progress.
    mission: {
      missionFrame: mission.missionFrame,
      openingLine: mission.openingLine,
      tasks: mission.tasks.map((t) => ({
        id: t.id,
        shortLabel: t.shortLabel,
      })),
    },
  });
}
