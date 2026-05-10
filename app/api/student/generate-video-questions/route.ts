import { NextResponse } from "next/server";
import { STUB_VIDEO_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope } from "@shared/lib/seed-loader";
import type { VideoLessonContent } from "@shared/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const lessonId = body.lessonId ?? "photosynthesis-1";
  const seed = await readSeedEnvelope<VideoLessonContent>(
    `lessons-${studentId}/${lessonId}-video.json`
  );
  if (seed) {
    return NextResponse.json({ overlayQuestions: seed.overlayQuestions });
  }
  const stub =
    STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
    STUB_VIDEO_LESSONS.maya[lessonId];
  return NextResponse.json({
    overlayQuestions: stub.overlayQuestions,
    _stub: true,
  });
}
