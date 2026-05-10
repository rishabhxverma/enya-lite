import { NextResponse } from "next/server";
import { STUB_TEXT_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope } from "@shared/lib/seed-loader";
import type { TextLessonContent } from "@shared/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const lessonId = body.lessonId ?? "photosynthesis-1";

  // 1. Try seed file (real-LLM-derived content saved during R-03 pre-generation)
  const seed = await readSeedEnvelope<TextLessonContent>(
    `lessons-${studentId}/${lessonId}-text.json`
  );
  if (seed) {
    return NextResponse.json(seed);
  }

  // 2. Fall back to in-memory stub
  const stub =
    STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
    STUB_TEXT_LESSONS.maya[lessonId] ??
    STUB_TEXT_LESSONS.maya["photosynthesis-1"];
  return NextResponse.json({ ...stub, _stub: true });
}
