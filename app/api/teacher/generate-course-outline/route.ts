import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCourseOutline } from "@shared/lib/ai/teacher/course-outline";
import { STUB_COURSE_OUTLINE } from "@shared/lib/stub-content";
import { isSeedFallbackEnabled } from "@shared/lib/seed-loader";

const BodySchema = z.object({
  documentId: z.string(),
  topic: z.string(),
  gradeLevel: z.number().int(),
  curriculumStandard: z.string(),
  targetUnitCount: z.number().int().optional(),
  lessonsPerUnit: z.number().int().optional(),
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
  const body = parse.data;
  if (isSeedFallbackEnabled()) {
    return NextResponse.json({
      course: { ...STUB_COURSE_OUTLINE, textbookDocumentId: body.documentId },
    });
  }
  try {
    const result = await generateCourseOutline(body);
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:generate-course-outline] live failed, returning stub: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      course: { ...STUB_COURSE_OUTLINE, textbookDocumentId: body.documentId },
      _stub: true,
    });
  }
}
