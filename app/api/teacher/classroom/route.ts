import { NextResponse } from "next/server";
import { z } from "zod";
import { manageClassroom } from "@shared/lib/ai/teacher/classroom";

const BodySchema = z.object({
  action: z
    .enum(["create", "update", "delete", "list", "assign-students", "assign-course"])
    .default("list"),
  classroomId: z.string().optional(),
  name: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  courseId: z.string().optional(),
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
  try {
    return NextResponse.json(await manageClassroom(parse.data));
  } catch (err) {
    console.warn(
      `[api:classroom] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      message: `Could not ${parse.data.action} classroom — memory write failed.`,
      _stub: true,
    });
  }
}
