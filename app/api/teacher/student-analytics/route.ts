import { NextResponse } from "next/server";
import { STUB_ANALYTICS } from "@shared/lib/stub-content";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  return NextResponse.json({
    analytics: STUB_ANALYTICS[studentId] ?? STUB_ANALYTICS.maya,
    _stub: true,
  });
}
