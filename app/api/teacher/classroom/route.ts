import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    classroom: {
      id: body.classroomId ?? `classroom_${Date.now()}`,
      name: body.name ?? "Mrs. Lee's Grade 3 Class",
      studentIds: body.studentIds ?? ["maya", "liam"],
      courseIds: body.courseId ? [body.courseId] : ["photosynthesis-101"],
    },
    message: `Classroom action '${body.action ?? "list"}' applied.`,
    _stub: true,
  });
}
