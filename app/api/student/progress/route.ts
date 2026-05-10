import { NextResponse } from "next/server";
import { readSeedJson } from "@shared/lib/seed-loader";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const seedAll = await readSeedJson<Record<string, unknown>>("_progress.json");
  const seed = seedAll?.[studentId];
  if (seed) {
    return NextResponse.json({ progress: seed });
  }
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
