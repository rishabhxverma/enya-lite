import type { ActivityType, QuizQuestion } from "@shared/types";

export interface GradeResult {
  correct: boolean;
  feedback: string;
  pointsEarned: number;
}

export function levenshtein(a: string, b: string): number {
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

export function gradeAnswer(
  question: QuizQuestion,
  answer: string | number
): GradeResult {
  switch (question.type) {
    case "multiple-choice": {
      const correct = answer === question.correctAnswerIndex;
      return mkResult(correct, question);
    }
    case "true-false": {
      const a = String(answer).toLowerCase();
      const c = String(question.correctAnswer ?? "").toLowerCase();
      return mkResult(a === c, question);
    }
    case "fill-blank": {
      const a = String(answer).trim().toLowerCase();
      const c = String(question.correctAnswer ?? "").trim().toLowerCase();
      const correct = a === c || levenshtein(a, c) <= 2;
      return mkResult(correct, question);
    }
    default:
      return {
        correct: false,
        feedback: "Unknown question type",
        pointsEarned: 0,
      };
  }
}

function mkResult(correct: boolean, q: QuizQuestion): GradeResult {
  return {
    correct,
    feedback: correct
      ? "Yes! Great work."
      : q.explanation || "Not quite — read again carefully and try once more.",
    pointsEarned: correct ? 10 : 0,
  };
}

export interface CompletionTelemetry {
  questionsAnswered: number;
  questionsCorrect: number;
  videoPercentWatched?: number;
  voiceDurationSec?: number;
  reachedTerminalNode?: boolean;
}

export function isActivityComplete(
  type: ActivityType,
  t: CompletionTelemetry
): boolean {
  switch (type) {
    case "text":
      return t.questionsCorrect >= 2 && t.questionsAnswered >= 3;
    case "video":
      return (
        (t.videoPercentWatched ?? 0) >= 0.9 &&
        t.questionsAnswered >= t.questionsCorrect &&
        t.questionsAnswered >= 1
      );
    case "voice":
      return (t.voiceDurationSec ?? 0) >= 60;
    case "story":
      return Boolean(t.reachedTerminalNode);
    default:
      return false;
  }
}
