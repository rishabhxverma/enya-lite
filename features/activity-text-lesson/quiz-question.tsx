"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { studentService } from "@shared/services/student-service";
import type { QuizQuestion as Q } from "@shared/types";
import { cn } from "@shared/lib/utils";

interface Props {
  studentId: string;
  lessonId: string;
  question: Q;
  onResolve?: (correct: boolean) => void;
}

export function QuizQuestion({
  studentId,
  lessonId,
  question,
  onResolve,
}: Props) {
  const [selected, setSelected] = useState<number | string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    feedback: string;
  } | null>(null);

  const submit = async (answer: number | string) => {
    if (submitted) return;
    setSubmitted(true);
    setSelected(answer);
    try {
      const res = (await studentService.submitQuizAnswer({
        studentId,
        lessonId,
        questionId: question.id,
        questionType: question.type,
        answer,
        correctAnswer: question.correctAnswer,
        correctAnswerIndex: question.correctAnswerIndex,
        explanation: question.explanation,
      })) as { correct: boolean; feedback: string };
      setFeedback({ correct: res.correct, feedback: res.feedback });
      onResolve?.(res.correct);
    } catch {
      // Local fallback grading
      let correct = false;
      if (question.type === "multiple-choice")
        correct = answer === question.correctAnswerIndex;
      else if (question.type === "true-false")
        correct = String(answer).toLowerCase() === question.correctAnswer;
      else
        correct =
          String(answer).trim().toLowerCase() ===
          (question.correctAnswer ?? "").toLowerCase();
      setFeedback({
        correct,
        feedback: correct ? "Yes! Great work." : question.explanation,
      });
      onResolve?.(correct);
    }
  };

  return (
    <div className="rounded-3xl border-2 bg-card p-5">
      <p className="text-lg font-semibold leading-relaxed mb-4">
        {question.prompt}
      </p>

      {question.type === "multiple-choice" && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {question.options?.map((opt, idx) => {
            const isCorrect = idx === question.correctAnswerIndex;
            const showResult = submitted;
            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => submit(idx)}
                className={cn(
                  "text-left rounded-2xl border-2 px-4 py-3 font-medium text-sm transition-all",
                  !showResult && "hover:bg-muted/40 active:scale-[0.98]",
                  showResult && isCorrect && "bg-green-100 border-green-500 text-green-900",
                  showResult &&
                    !isCorrect &&
                    selected === idx &&
                    "bg-amber-100 border-amber-500 text-amber-900",
                  showResult && !isCorrect && selected !== idx && "opacity-60"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "true-false" && (
        <div className="grid grid-cols-2 gap-2.5">
          {["true", "false"].map((v) => {
            const isCorrect = v === question.correctAnswer;
            const showResult = submitted;
            return (
              <button
                key={v}
                disabled={submitted}
                onClick={() => submit(v)}
                className={cn(
                  "rounded-2xl border-2 py-4 font-bold text-base transition-all uppercase",
                  !showResult && "hover:bg-muted/40 active:scale-[0.98]",
                  showResult && isCorrect && "bg-green-100 border-green-500 text-green-900",
                  showResult && !isCorrect && selected === v && "bg-amber-100 border-amber-500 text-amber-900"
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "fill-blank" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(textAnswer);
          }}
          className="flex gap-2"
        >
          <input
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer…"
            className="flex-1 rounded-xl border-2 px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={submitted || !textAnswer.trim()}
            className="rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_3px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[3px] transition-all px-5 disabled:opacity-50"
          >
            Submit
          </button>
        </form>
      )}

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-4 rounded-2xl px-4 py-3 flex items-start gap-2 text-sm",
            feedback.correct
              ? "bg-green-100 text-green-900"
              : "bg-amber-100 text-amber-900"
          )}
        >
          {feedback.correct ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{feedback.feedback}</span>
        </motion.div>
      )}
    </div>
  );
}
