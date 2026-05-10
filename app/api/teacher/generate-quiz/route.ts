import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const count = Math.max(1, Math.min(10, body.questionCount ?? 3));
  const questions = Array.from({ length: count }, (_, i) => ({
    id: `gq${i + 1}`,
    prompt:
      i === 0
        ? "What do plants need to make food?"
        : i === 1
          ? "What gas do plants release as a byproduct?"
          : `Sample generated question ${i + 1}`,
    type: "multiple-choice",
    options: ["Sun", "Sound", "Plastic", "Iron"],
    correctAnswerIndex: 0,
    explanation: "Plants need sunlight to drive photosynthesis.",
    learningObjectiveId: "lo-1",
  }));
  return NextResponse.json({ questions, _stub: true });
}
