import { NextResponse } from "next/server";
import { z } from "zod";
import { adjustForEalLevel } from "@shared/lib/ai/teacher/eal-adjust";
import type { EALLevel } from "@shared/types";

const BodySchema = z.object({
  content: z.string(),
  contentType: z.enum(["text", "quiz", "activity"]).optional(),
  targetEalLevel: z.enum(["Emerging", "Developing", "Proficient", "Extending"]),
  preserveLearningObjectives: z.array(z.string()).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const result = await adjustForEalLevel({
      ...parse.data,
      targetEalLevel: parse.data.targetEalLevel as EALLevel,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:adjust-eal] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      adjustedContent: parse.data.content,
      changesSummary: "Could not adjust — content returned unchanged.",
      _stub: true,
    });
  }
}
