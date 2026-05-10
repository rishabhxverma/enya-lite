import { NextResponse } from "next/server";
import { z } from "zod";
import { previewStudentExperience } from "@shared/lib/ai/teacher/preview";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  lessonId: z.string().default("photosynthesis-1"),
  activityType: z.enum(["text", "video", "voice", "story"]).default("text"),
  topic: z.string().optional(),
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
  try {
    return NextResponse.json(await previewStudentExperience(parse.data));
  } catch (err) {
    console.warn(
      `[api:preview-student] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      preview: null,
      narrativeDescription: `Preview unavailable for ${parse.data.studentId}.`,
      _stub: true,
    });
  }
}
