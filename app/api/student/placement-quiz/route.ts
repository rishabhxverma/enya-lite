import { NextResponse } from "next/server";

interface PlacementBody {
  studentName?: string;
  grade?: number;
  action?: "next" | "submit";
  currentAnswers?: Record<string, unknown>;
}

const QUESTIONS = [
  {
    id: "p1",
    prompt: "Pick the picture that shows 'butterfly'.",
    type: "multiple-choice" as const,
    options: ["🦋", "🐢", "🚗", "🍎"],
    correctAnswerIndex: 0,
    explanation: "🦋 is a butterfly.",
    learningObjectiveId: "vocab-1",
  },
  {
    id: "p2",
    prompt: "I ___ a book yesterday. (read / reads)",
    type: "fill-blank" as const,
    correctAnswer: "read",
    explanation: "We use 'read' for past tense.",
    learningObjectiveId: "grammar-1",
  },
  {
    id: "p3",
    prompt: "Which best describes photosynthesis?",
    type: "multiple-choice" as const,
    options: [
      "Plants making food from sunlight, water, and air",
      "Plants sleeping at night",
      "Plants growing in soil only",
      "Plants moving in the wind",
    ],
    correctAnswerIndex: 0,
    explanation: "Photosynthesis is how plants make food.",
    learningObjectiveId: "science-1",
  },
];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PlacementBody;
  const answered = Object.keys(body.currentAnswers ?? {}).length;

  if (body.action === "submit" || answered >= QUESTIONS.length) {
    const correct = QUESTIONS.filter((q) => {
      const a = body.currentAnswers?.[q.id];
      if (q.type === "multiple-choice")
        return typeof a === "number" && a === q.correctAnswerIndex;
      if (q.type === "fill-blank")
        return (
          String(a ?? "")
            .trim()
            .toLowerCase() === q.correctAnswer.toLowerCase()
        );
      return false;
    }).length;
    const ealLevel =
      correct >= 3 ? "Proficient" : correct >= 2 ? "Developing" : "Emerging";
    return NextResponse.json({
      complete: true,
      assessedEalLevel: ealLevel,
      suggestedInterests: ["plants", "drawing"],
      score: correct,
    });
  }

  const next = QUESTIONS[answered] ?? QUESTIONS[0];
  return NextResponse.json({
    nextQuestion: next,
    progress: { current: answered + 1, total: QUESTIONS.length },
    complete: false,
  });
}
