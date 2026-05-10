"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "motion/react";
import { useTextLessonSWR } from "@shared/services/swr-hooks";
import { ActivityNav } from "./activity-nav";
import { DiagramCard } from "./diagram-card";
import { QuizQuestion } from "./quiz-question";
import { useProgressStore } from "@shared/stores/progress-store";
import { PinataReward } from "@features/reward-pinata/pinata-reward";

interface Props {
  studentId: string;
  lessonId: string;
}

export function TextLesson({ studentId, lessonId }: Props) {
  // SWR keeps the previous lesson on screen while a new student's content
  // loads — no skeleton flash when a presenter flips Maya↔Liam mid-demo.
  const { data: lesson, isLoading } = useTextLessonSWR(studentId, lessonId);
  const loading = isLoading && !lesson;
  const [correctCount, setCorrectCount] = useState(0);
  const { markActivityComplete, awardXp } = useProgressStore();

  // Mark complete when 2/3 answered correctly. The piñata reward
  // component drives its own per-correct hit animation + full-streak
  // candy burst — see <PinataReward /> mounted below.
  useEffect(() => {
    if (correctCount >= 2 && lesson) {
      markActivityComplete(studentId, `${lessonId}-text`);
      awardXp(studentId, 30);
    }
  }, [correctCount, studentId, lessonId, lesson, markActivityComplete, awardXp]);

  const totalQuestions = lesson?.comprehensionQuestions?.length ?? 0;

  if (loading || !lesson) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  // Split markdown by diagram inserts — simple approach: render markdown, then diagrams below
  return (
    <>
      <ActivityNav studentId={studentId} lessonId={lessonId} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl lg:text-4xl font-bold tracking-tight"
          style={{ color: "var(--student-primary, inherit)" }}
        >
          {lesson.title}
        </motion.h1>

        <div className="prose prose-zinc mt-4 max-w-none text-base leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-3 [&_strong]:text-[color:var(--student-accent,inherit)] [&_ul]:my-4 [&_li]:my-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.bodyMarkdown}
          </ReactMarkdown>
        </div>

        {lesson.diagrams.map((d, i) => (
          <DiagramCard key={i} caption={d.caption} emojiArt={d.emojiArt} />
        ))}

        <section className="mt-10">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--student-primary, inherit)" }}
          >
            Check your understanding
          </h2>
          <div className="space-y-4">
            {lesson.comprehensionQuestions.map((q) => (
              <QuizQuestion
                key={q.id}
                studentId={studentId}
                lessonId={lessonId}
                question={q}
                onResolve={(correct) =>
                  setCorrectCount((c) => (correct ? c + 1 : c))
                }
              />
            ))}
          </div>
        </section>
      </article>
      <PinataReward
        total={totalQuestions}
        correct={correctCount}
        studentId={studentId}
      />
    </>
  );
}
