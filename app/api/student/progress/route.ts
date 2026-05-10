import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentProgress } from "@shared/lib/ai/student/progress";
import { readSeedJson, isSeedFallbackEnabled } from "@shared/lib/seed-loader";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
});

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  const { studentId } = parse.data;

  if (isSeedFallbackEnabled()) {
    const seedAll = await readSeedJson<Record<string, unknown>>(
      "_progress.json"
    );
    const seed = seedAll?.[studentId];
    if (seed) return NextResponse.json({ progress: seed });
  }

  try {
    return NextResponse.json(await getStudentProgress(studentId));
  } catch (err) {
    console.warn(
      `[api:progress] failed, using fallback: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      progress: {
        studentId,
        xp: studentId === "liam" ? 720 : 240,
        streakDays: studentId === "liam" ? 7 : 3,
        completedActivities: [],
        quizScores: {},
        skillMastery: {},
      },
      _stub: true,
    });
  }
}
