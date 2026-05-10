import { NextResponse } from "next/server";
import { z } from "zod";
import { submitQuizAnswer } from "@shared/lib/ai/student/quiz-grader";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  lessonId: z.string().default("photosynthesis-1"),
  questionId: z.string().default("q1"),
  answer: z.union([z.string(), z.number()]),
  questionPrompt: z.string().optional(),
  questionType: z
    .enum(["multiple-choice", "true-false", "fill-blank"])
    .optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  correctAnswerIndex: z.number().int().optional(),
  options: z.array(z.string()).optional(),
  explanation: z.string().optional(),
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
    return NextResponse.json(await submitQuizAnswer(parse.data));
  } catch (err) {
    console.warn(
      `[api:submit-quiz-answer] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      correct: false,
      feedback:
        parse.data.explanation ?? "Could not grade the answer right now.",
      pointsEarned: 0,
      _stub: true,
    });
  }
}
