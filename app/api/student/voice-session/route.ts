import { NextResponse } from "next/server";
import {
  buildVoiceOverrideSystemPrompt,
  getSignedConversationUrl,
} from "@shared/lib/elevenlabs";
import { getStudentProfile } from "@shared/lib/student-profiles";
import type { VoiceSubtype } from "@shared/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = (body.studentId as string) ?? "maya";
  const lessonId = (body.lessonId as string) ?? "photosynthesis-1";
  const activitySubtype = (body.activitySubtype as VoiceSubtype) ?? "explain-back";

  const student = await getStudentProfile(studentId);
  const lessonTitle = body.lessonTitle ?? "What do plants need?";
  const objectives =
    body.objectives ??
    [
      "Student names the four things plants need: sun, water, air, soil",
      "Student says the word 'photosynthesis' aloud",
    ];

  const agentPersonaPrompt = student
    ? buildVoiceOverrideSystemPrompt({
        student,
        lessonTitle,
        activitySubtype,
        objectives,
      })
    : "Default friendly tutor persona.";

  const signedUrl = await getSignedConversationUrl();

  return NextResponse.json({
    signedUrl,
    agentPersonaPrompt,
    maxDurationSeconds: 300,
    fallbackMp3: `/seed/voice-fallback-${studentId}.mp3`,
    voiceMode: process.env.NEXT_PUBLIC_VOICE_MODE ?? "live",
    studentId,
    lessonId,
    activitySubtype,
  });
}
