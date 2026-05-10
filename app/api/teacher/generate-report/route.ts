import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReport } from "@shared/lib/ai/teacher/report";

const BodySchema = z.object({
  scope: z.enum(["student", "classroom", "course"]).default("student"),
  targetId: z.string(),
  format: z.enum(["summary", "detailed"]).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 45;

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
    return NextResponse.json(await generateReport(parse.data));
  } catch (err) {
    console.warn(
      `[api:generate-report] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      report: {
        title: `Report — ${parse.data.targetId}`,
        sections: [
          {
            heading: "Headline insight",
            bodyMarkdown:
              "Could not contact LLM. Please retry, or check API status.",
          },
        ],
      },
      _stub: true,
    });
  }
}
