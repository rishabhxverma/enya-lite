import { NextResponse } from "next/server";
import { z } from "zod";
import { getBackboardClient } from "@shared/lib/backboard";
import { TEACHER_TOOLS } from "@shared/lib/tools/teacher-tools";
import { STUDENT_TOOLS } from "@shared/lib/tools/student-tools";
import { buildTeacherHandlers, buildStudentHandlers } from "@shared/lib/tool-handlers";

const BodySchema = z.object({
  threadId: z.string(),
  content: z.string(),
  role: z.enum(["teacher", "student"]).default("teacher"),
  studentId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        documentId: z.string().optional(),
        uploadId: z.string().optional(),
        filename: z.string().optional(),
      })
    )
    .optional(),
});

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: String(err) },
      { status: 400 }
    );
  }

  const assistantId = process.env.BACKBOARD_ASSISTANT_ID;
  if (!assistantId || !process.env.BACKBOARD_API_KEY) {
    // Stub fallback: return canned greeting
    return NextResponse.json({
      threadId: body.threadId,
      content:
        body.role === "teacher"
          ? "Hi! I'm Enya. I can help you create a course from your textbook, audit your materials for Bloom's alignment, set up a classroom, or review student progress. What would you like to do today?"
          : "Hi there! I'm your Enya tutor. Ready to learn together?",
      toolResults: [],
      _stub: true,
    });
  }

  const tools = body.role === "teacher" ? TEACHER_TOOLS : STUDENT_TOOLS;
  const handlers =
    body.role === "teacher"
      ? buildTeacherHandlers()
      : buildStudentHandlers(body.studentId ?? "maya");

  let attachmentsBlock = "";
  if (body.attachments?.length) {
    attachmentsBlock = `\n\n[ATTACHMENTS]\n${body.attachments
      .map(
        (a) =>
          `- ${a.filename ?? "file"} (documentId: ${a.documentId ?? a.uploadId ?? "?"})`
      )
      .join("\n")}`;
  }

  try {
    const client = getBackboardClient();
    const { final, toolResults } = await client.runToolLoop(
      {
        threadId: body.threadId,
        assistantId,
        content: body.content + attachmentsBlock,
        tools,
        memory: body.role === "teacher" ? "Auto" : "Readonly",
      },
      handlers
    );
    return NextResponse.json({
      threadId: body.threadId,
      content: final.content,
      toolResults,
    });
  } catch (err) {
    console.error("[backboard/message] error", err);
    return NextResponse.json(
      {
        threadId: body.threadId,
        content:
          "I hit a snag reaching the assistant. Try again in a moment, or use the seed-fallback toggle.",
        toolResults: [],
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
