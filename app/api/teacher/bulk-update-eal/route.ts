import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const updates = (body.updates as { studentId: string; newLevel: string }[]) ?? [];
  return NextResponse.json({
    updated: updates.length,
    students: updates.map((u) => ({
      id: u.studentId,
      ealLevel: u.newLevel,
    })),
    _stub: true,
  });
}
