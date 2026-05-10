import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersonalizedDashboard } from "@shared/lib/ai/student/dashboard";
import {
  STUB_DASHBOARDS,
  stubDashboardForStudent,
} from "@shared/lib/stub-content";
import { readSeedJson, isSeedFallbackEnabled } from "@shared/lib/seed-loader";
import { getStudentProfile } from "@shared/lib/ai/student/profile";

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
  const studentId = parse.data.studentId;

  // Seed fallback toggle short-circuits.
  if (isSeedFallbackEnabled()) {
    const seed = await readSeedJson(`dashboard-${studentId}.json`);
    if (seed) return NextResponse.json(seed);
    if (STUB_DASHBOARDS[studentId])
      return NextResponse.json(STUB_DASHBOARDS[studentId]);
    const profile = await getStudentProfile(studentId);
    return NextResponse.json(stubDashboardForStudent(profile));
  }

  try {
    return NextResponse.json(await getPersonalizedDashboard(studentId));
  } catch (err) {
    console.warn(
      `[api:dashboard] live failed, using stub: ${err instanceof Error ? err.message : String(err)}`
    );
    if (STUB_DASHBOARDS[studentId])
      return NextResponse.json({ ...STUB_DASHBOARDS[studentId], _stub: true });
    const profile = await getStudentProfile(studentId);
    return NextResponse.json({
      ...stubDashboardForStudent(profile),
      _stub: true,
    });
  }
}
