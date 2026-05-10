import { NextResponse } from "next/server";

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] =
          1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

interface SubmitBody {
  studentId?: string;
  lessonId?: string;
  questionId?: string;
  questionType?: "multiple-choice" | "true-false" | "fill-blank";
  answer?: string | number;
  correctAnswer?: string | number;
  correctAnswerIndex?: number;
  explanation?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as SubmitBody;
  let correct = false;
  switch (body.questionType) {
    case "multiple-choice": {
      correct =
        typeof body.answer === "number" &&
        body.answer === body.correctAnswerIndex;
      break;
    }
    case "true-false": {
      const a = String(body.answer ?? "").toLowerCase();
      const c = String(body.correctAnswer ?? "").toLowerCase();
      correct = a === c;
      break;
    }
    case "fill-blank": {
      const a = String(body.answer ?? "")
        .trim()
        .toLowerCase();
      const c = String(body.correctAnswer ?? "")
        .trim()
        .toLowerCase();
      correct = a === c || levenshtein(a, c) <= 2;
      break;
    }
    default:
      correct = body.answer === body.correctAnswer;
  }

  return NextResponse.json({
    correct,
    feedback: correct
      ? "Yes! Great work."
      : body.explanation ?? "Almost! Read again carefully and try once more.",
    pointsEarned: correct ? 10 : 0,
    explanation: body.explanation ?? "",
  });
}
