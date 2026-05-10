import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    simplified:
      "Plants make food from sun. They need water and air too. This is photosynthesis.",
    originalGrade: 7,
    newGrade: 3,
    requested: body,
    _stub: true,
  });
}
