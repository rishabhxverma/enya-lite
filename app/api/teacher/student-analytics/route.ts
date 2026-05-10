import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentAnalytics } from "@shared/lib/ai/teacher/analytics";
import { STUB_ANALYTICS } from "@shared/lib/stub-content";
import { isSeedFallbackEnabled } from "@shared/lib/seed-loader";

const BodySchema = z.object({
  studentId: z.string(),
  courseId: z.string().optional(),
  timeRange: z.enum(["7d", "30d", "all"]).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  if (isSeedFallbackEnabled()) {
    return NextResponse.json({
      analytics:
        STUB_ANALYTICS[parse.data.studentId] ?? STUB_ANALYTICS.maya,
    });
  }
  try {
    return NextResponse.json(await getStudentAnalytics(parse.data));
  } catch (err) {
    console.warn(
      `[api:student-analytics] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      analytics:
        STUB_ANALYTICS[parse.data.studentId] ?? STUB_ANALYTICS.maya,
      _stub: true,
    });
  }
}
