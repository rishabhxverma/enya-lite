/**
 * get_student_progress — derives XP / streak / completed activities from
 * the quiz-answer memory entries written by `submitQuizAnswer`.
 */
import type { StudentProgress } from "@shared/types";
import { recallFacts } from "../backboard-call";

interface ParsedProgress {
  studentId: string;
  lessonId: string;
  questionId: string;
  correct: boolean;
  points: number;
  at: string;
}

function parseProgressMemory(content: string): ParsedProgress | null {
  if (!content.startsWith("student:")) return null;
  const grab = (k: string) =>
    content.match(new RegExp(`${k}:([^\\s]+)`))?.[1];
  const studentId = grab("student");
  const lessonId = grab("activity");
  const questionId = grab("question");
  const correct = grab("correct") === "true";
  const points = parseInt(grab("points") ?? "0", 10);
  const at = grab("at") ?? new Date().toISOString();
  if (!studentId || !lessonId || !questionId) return null;
  return { studentId, lessonId, questionId, correct, points, at };
}

function computeStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;
  const days = new Set(activityDates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else if (i === 0) {
      // No activity today doesn't break a streak from yesterday — keep checking.
      continue;
    } else break;
  }
  return streak;
}

export async function getStudentProgress(
  studentId: string
): Promise<{ progress: StudentProgress }> {
  const memories = await recallFacts(`student:${studentId} progress`, 100).catch(
    () => []
  );
  const parsed = memories
    .map((m) => parseProgressMemory(m.content))
    .filter((p): p is ParsedProgress => p?.studentId === studentId);

  const xp = parsed.reduce((sum, p) => sum + p.points, 0);
  const streakDays = computeStreak(parsed.map((p) => new Date(p.at)));

  // Completed activities = lessonIds where ≥2 of 3 questions are correct.
  const byLesson = new Map<string, ParsedProgress[]>();
  for (const p of parsed) {
    const list = byLesson.get(p.lessonId) ?? [];
    list.push(p);
    byLesson.set(p.lessonId, list);
  }
  const completedActivities: string[] = [];
  const quizScores: Record<string, number> = {};
  for (const [lessonId, attempts] of byLesson.entries()) {
    const correct = attempts.filter((a) => a.correct).length;
    quizScores[lessonId] = Math.round((correct / Math.max(attempts.length, 1)) * 100);
    if (correct >= 2) completedActivities.push(lessonId);
  }

  return {
    progress: {
      studentId,
      xp,
      streakDays,
      completedActivities,
      quizScores,
      skillMastery: {},
    },
  };
}
