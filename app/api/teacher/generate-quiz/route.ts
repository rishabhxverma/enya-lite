import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuizFromContent } from "@shared/lib/ai/teacher/quiz";
import type { EALLevel } from "@shared/types";

const BodySchema = z.object({
  contentId: z.string().optional(),
  documentId: z.string().optional(),
  questionCount: z.number().int().min(1).max(20).default(5),
  types: z
    .array(z.enum(["multiple-choice", "true-false", "fill-blank"]))
    .optional(),
  targetEalLevel: z
    .enum(["Emerging", "Developing", "Proficient", "Extending"])
    .optional(),
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
    const result = await generateQuizFromContent({
      ...parse.data,
      targetEalLevel: parse.data.targetEalLevel as EALLevel | undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[api:generate-quiz] failed: ${message}`);
    return NextResponse.json({
      _error: message,
      questions: [
        {
          id: "gq1",
          prompt: "What do plants need to make food?",
          type: "multiple-choice",
          options: ["Sun", "Sound", "Plastic", "Iron"],
          correctAnswerIndex: 0,
          explanation: "Plants need sunlight to drive photosynthesis.",
          learningObjectiveId: "lo-1",
        },
      ],
      _stub: true,
    });
  }
}
