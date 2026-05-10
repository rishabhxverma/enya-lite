import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextLesson } from "@shared/lib/ai/student/text-lesson";
import { STUB_TEXT_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope, isSeedFallbackEnabled } from "@shared/lib/seed-loader";
import type { TextLessonContent } from "@shared/types";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  lessonId: z.string().default("photosynthesis-1"),
  topic: z.string().default("Photosynthesis"),
  learningObjectives: z.array(z.string()).optional(),
  documentId: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  const { studentId, lessonId } = parse.data;

  // 1. Seed-fallback short-circuit
  if (isSeedFallbackEnabled()) {
    const seed = await readSeedEnvelope<TextLessonContent>(
      `lessons-${studentId}/${lessonId}-text.json`
    );
    if (seed) return NextResponse.json(seed);
    const stub =
      STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
      STUB_TEXT_LESSONS.maya[lessonId] ??
      STUB_TEXT_LESSONS.maya["photosynthesis-1"];
    return NextResponse.json(stub);
  }

  // 2. Live generation
  try {
    const objectives =
      parse.data.learningObjectives ??
      (
        STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
        STUB_TEXT_LESSONS.maya[lessonId] ??
        STUB_TEXT_LESSONS.maya["photosynthesis-1"]
      ).comprehensionQuestions.map((q) => q.learningObjectiveId);
    const lesson = await generateTextLesson({
      studentId,
      lessonId,
      topic: parse.data.topic,
      learningObjectives: objectives,
      documentId: parse.data.documentId,
    });
    return NextResponse.json(lesson);
  } catch (err) {
    console.warn(
      `[api:generate-text-lesson] live failed, using stub: ${err instanceof Error ? err.message : String(err)}`
    );
    const stub =
      STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
      STUB_TEXT_LESSONS.maya[lessonId] ??
      STUB_TEXT_LESSONS.maya["photosynthesis-1"];
    return NextResponse.json({ ...stub, _stub: true });
  }
}
