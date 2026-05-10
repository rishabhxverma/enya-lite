import { NextResponse } from "next/server";
import {
  STUB_DASHBOARDS,
  stubDashboardForStudent,
} from "@shared/lib/stub-content";
import { readSeedJson } from "@shared/lib/seed-loader";
import { getStudentProfile } from "@shared/lib/student-profiles";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  // 1. Try seeded dashboard JSON
  const seed = await readSeedJson(`dashboard-${studentId}.json`);
  if (seed) return NextResponse.json(seed);
  // 2. Stub map
  if (STUB_DASHBOARDS[studentId])
    return NextResponse.json(STUB_DASHBOARDS[studentId]);
  // 3. Build from profile
  const profile = await getStudentProfile(studentId);
  return NextResponse.json(stubDashboardForStudent(profile));
}
