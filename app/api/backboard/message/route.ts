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
        pageCount: z.number().optional(),
        chunkCount: z.number().optional(),
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
    // Keyword-dispatched stub fallback so the demo runs without live API keys.
    return NextResponse.json(
      await stubReply(body)
    );
  }

  const tools = body.role === "teacher" ? TEACHER_TOOLS : STUDENT_TOOLS;
  const handlers =
    body.role === "teacher"
      ? buildTeacherHandlers({ attachments: body.attachments })
      : buildStudentHandlers(body.studentId ?? "maya");

  let attachmentsBlock = "";
  if (body.attachments?.length) {
    // Surface the real parse stats inline so the model doesn't re-invoke
    // parse_uploaded_document on an already-indexed file (and so the
    // tool-result card it does emit matches the upload card the user saw).
    attachmentsBlock = `\n\n[ATTACHMENTS — already parsed and indexed; do NOT call parse_uploaded_document again]\n${body.attachments
      .map((a) => {
        const id = a.documentId ?? a.uploadId ?? "?";
        const stats =
          a.pageCount != null && a.chunkCount != null
            ? ` — ${a.pageCount} pages, ${a.chunkCount} chunks`
            : "";
        return `- ${a.filename ?? "file"} (documentId: ${id})${stats}`;
      })
      .join("\n")}`;
  }

  try {
    const client = getBackboardClient();

    // Auto-rotate stub thread IDs. The /api/backboard/thread route falls
    // back to `stub_thread_*` IDs when Backboard create-thread fails (or
    // the env vars are missing at create time). Once the live key is set,
    // those persisted stub IDs poison every subsequent message because
    // Backboard 500s on a thread that doesn't exist. Detect and rotate
    // transparently — frontend reads the new threadId out of the response.
    let activeThreadId = body.threadId;
    if (activeThreadId.startsWith("stub_thread_")) {
      console.warn(
        `[backboard/message] rotating stub thread ${activeThreadId} → fresh Backboard thread`
      );
      const fresh = await client.createThread(assistantId);
      activeThreadId = fresh.id;
    }

    const { final, toolResults } = await client.runToolLoop(
      {
        threadId: activeThreadId,
        assistantId,
        content: body.content + attachmentsBlock,
        tools,
        memory: body.role === "teacher" ? "Auto" : "Readonly",
      },
      handlers
    );
    return NextResponse.json({
      threadId: activeThreadId,
      threadRotated: activeThreadId !== body.threadId,
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

interface StubInput {
  threadId: string;
  content: string;
  role: "teacher" | "student";
  studentId?: string;
  attachments?: { documentId?: string; uploadId?: string; filename?: string }[];
}

async function stubReply(body: StubInput) {
  const lower = body.content.toLowerCase();
  const handlers =
    body.role === "teacher"
      ? buildTeacherHandlers()
      : buildStudentHandlers(body.studentId ?? "maya");
  const toolResults: { toolName: string; args: unknown; output: unknown }[] = [];

  // Match user intent to tools by keyword.
  if (body.role === "teacher") {
    if (
      body.attachments?.length &&
      !lower.includes("audit") &&
      !lower.includes("course")
    ) {
      // Just an upload acknowledgment — already shown via system message
      return {
        threadId: body.threadId,
        content:
          "Thanks — your textbook is parsed and indexed. From here we can build a course outline, audit it for Bloom's alignment, or pull specific passages. What would you like to do?",
        toolResults,
      };
    }
    if (
      lower.includes("course") ||
      lower.includes("outline") ||
      lower.includes("lesson plan") ||
      lower.includes("photosynthesis course")
    ) {
      const out = await handlers.generate_course_outline({});
      toolResults.push({
        toolName: "generate_course_outline",
        args: {},
        output: out,
      });
      return {
        threadId: body.threadId,
        content:
          "Here's a course outline grounded in your textbook and mapped to BC Grade 3 Science 2.1. Each lesson includes the four-activity arc — read, watch, speak, apply. Approve below or tell me what to change.",
        toolResults,
      };
    }
    if (
      lower.includes("audit") ||
      lower.includes("bloom") ||
      lower.includes("scaffold") ||
      lower.includes("cultural")
    ) {
      const out = await handlers.audit_content_pedagogically({ targetGrade: 3 });
      toolResults.push({
        toolName: "audit_content_pedagogically",
        args: { targetGrade: 3 },
        output: out,
      });
      return {
        threadId: body.threadId,
        content:
          "I audited the textbook against Bloom's, scaffolding, vocab load, cultural sensitivity, and BC curriculum alignment. Here are the scores plus four prioritized recommendations — the cultural-sensitivity flag is the most actionable.",
        toolResults,
      };
    }
    if (
      lower.includes("create student") ||
      lower.includes("add student") ||
      /\badd\s+\w+,/.test(lower) ||
      /\b(maya|liam|new student)\b/.test(lower)
    ) {
      // Try to extract a name
      const nameMatch =
        body.content.match(/(?:add|create)\s+([A-Za-z][A-Za-z'-]+)/i) ??
        body.content.match(/profile\.\s*([A-Za-z][A-Za-z'-]+)/i);
      const name = nameMatch?.[1] ?? "New Student";
      const isMaya = lower.includes("maya");
      const isLiam = lower.includes("liam");
      const args = {
        name: isMaya ? "Maya Haddad" : isLiam ? "Liam Chen-Patel" : name,
        grade: isMaya ? 3 : isLiam ? 6 : 3,
        ealLevel: isMaya ? "Emerging" : isLiam ? "Proficient" : "Developing",
        interests: isMaya
          ? ["butterflies", "art", "drawing", "gardens"]
          : isLiam
            ? ["space exploration", "robotics", "video games"]
            : ["learning"],
        culturalBackground: isMaya
          ? "Newcomer from Aleppo, Syria. Arabic is her first language."
          : isLiam
            ? "Born in Toronto. Trilingual home (English, Cantonese, Hindi)."
            : "",
        learningGoals: [],
      };
      const out = await handlers.create_student_profile(args);
      toolResults.push({
        toolName: "create_student_profile",
        args,
        output: out,
      });
      return {
        threadId: body.threadId,
        content: `Got it — I've stored ${args.name}'s profile. The personalization layer will now produce content uniquely shaped to their interests and EAL level. Click "View as student" below to preview.`,
        toolResults,
      };
    }
    if (
      lower.includes("analytic") ||
      lower.includes("progress") ||
      lower.includes("report")
    ) {
      const studentId = lower.includes("liam") ? "liam" : "maya";
      const out = await handlers.get_student_analytics({ studentId });
      toolResults.push({
        toolName: "get_student_analytics",
        args: { studentId },
        output: out,
      });
      return {
        threadId: body.threadId,
        content: `Here are ${studentId}'s analytics. Quiz performance is steady; the EAL trend is up — let me know if you want a written report.`,
        toolResults,
      };
    }
    if (lower.includes("classroom") || lower.includes("class")) {
      const out = await handlers.manage_classroom({ action: "list" });
      toolResults.push({
        toolName: "manage_classroom",
        args: { action: "list" },
        output: out,
      });
      return {
        threadId: body.threadId,
        content:
          "Here's your classroom. You can add students, assign a course, or run a bulk EAL update — just ask.",
        toolResults,
      };
    }

    return {
      threadId: body.threadId,
      content:
        "I can help with course design, content audits, student profiles, and analytics. Try one of the suggestion chips below the chat, or upload a textbook to get started.",
      toolResults,
    };
  }

  // student role
  return {
    threadId: body.threadId,
    content:
      "Hi there! I'm your Enya tutor. Ready to learn together? Pick an activity from your dashboard.",
    toolResults,
  };
}
