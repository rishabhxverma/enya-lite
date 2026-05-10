"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubePlayer, type YouTubeEvent } from "react-youtube";
import { motion, AnimatePresence } from "motion/react";
import { studentService } from "@shared/services/student-service";
import type { VideoLessonContent, VideoOverlayQuestion } from "@shared/types";
import { ActivityNav } from "@features/activity-text-lesson/activity-nav";
import { QuizQuestion } from "@features/activity-text-lesson/quiz-question";
import { useProgressStore } from "@shared/stores/progress-store";

interface Props {
  studentId: string;
  lessonId: string;
}

export function VideoLesson({ studentId, lessonId }: Props) {
  const [video, setVideo] = useState<VideoLessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<VideoOverlayQuestion | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const playerRef = useRef<YouTubePlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { markActivityComplete, awardXp } = useProgressStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studentService
      .generateVideoQuestions({
        studentId,
        lessonId,
        youtubeId: "UPBMG5EYydo",
        learningObjectives: [],
      })
      .then(async (qData) => {
        const seedRes = await fetch(
          `/seed/lessons-${studentId}/${lessonId}-video.json`
        );
        let video: VideoLessonContent;
        if (seedRes.ok) {
          const seed = await seedRes.json();
          video = seed.content as VideoLessonContent;
        } else {
          video = {
            studentId,
            lessonId,
            youtubeId: "UPBMG5EYydo",
            title: "How Plants Make Food",
            overlayQuestions:
              (qData as { overlayQuestions: VideoOverlayQuestion[] })
                .overlayQuestions ?? [],
          };
        }
        if (!cancelled) setVideo(video);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [studentId, lessonId]);

  const onReady = (e: YouTubeEvent<unknown>) => {
    playerRef.current = e.target as YouTubePlayer;
  };

  const onPlay = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!video || pending) return;
      const player = playerRef.current as
        | (YouTubePlayer & { getCurrentTime?: () => number })
        | null;
      const t = player?.getCurrentTime?.() ?? 0;
      const next = video.overlayQuestions.find(
        (q) =>
          q.pauseAtSeconds <= t &&
          !answered.has(q.question.id) &&
          q.pauseAtSeconds + 5 > t
      );
      if (next) {
        const player = playerRef.current as
          | (YouTubePlayer & { pauseVideo?: () => void })
          | null;
        player?.pauseVideo?.();
        setPending(next);
      }
    }, 250);
  };

  const onPauseQuestionResolved = (correct: boolean) => {
    if (!pending) return;
    setAnswered((prev) => new Set(prev).add(pending.question.id));
    if (correct) awardXp(studentId, 10);
    // Wait 1.2s for feedback, then close + resume
    setTimeout(() => {
      const player = playerRef.current as
        | (YouTubePlayer & { playVideo?: () => void })
        | null;
      player?.playVideo?.();
      setPending(null);
    }, 1400);
  };

  // Mark complete when all questions answered
  useEffect(() => {
    if (
      video &&
      video.overlayQuestions.length > 0 &&
      answered.size >= video.overlayQuestions.length
    ) {
      markActivityComplete(studentId, `${lessonId}-video`);
    }
  }, [answered, video, studentId, lessonId, markActivityComplete]);

  if (loading || !video) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="aspect-video bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <ActivityNav studentId={studentId} lessonId={lessonId} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-4"
          style={{ color: "var(--student-primary, inherit)" }}
        >
          {video.title}
        </h1>

        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 shadow-lg bg-black">
          <YouTube
            videoId={video.youtubeId}
            opts={{
              width: "100%",
              height: "100%",
              playerVars: { rel: 0, modestbranding: 1 },
            }}
            onReady={onReady}
            onPlay={onPlay}
            iframeClassName="w-full h-full"
            className="w-full h-full"
          />
          <AnimatePresence>
            {pending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.94, y: 12 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.94, y: 12 }}
                  className="w-full max-w-lg"
                >
                  <QuizQuestion
                    studentId={studentId}
                    lessonId={lessonId}
                    question={pending.question}
                    onResolve={onPauseQuestionResolved}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 rounded-2xl border-2 bg-card p-4">
          <div className="font-semibold text-sm mb-2">Pause checkpoints</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {video.overlayQuestions.map((q) => (
              <li key={q.question.id}>
                ⏱ {Math.floor(q.pauseAtSeconds / 60)}:
                {String(q.pauseAtSeconds % 60).padStart(2, "0")} —{" "}
                {answered.has(q.question.id) ? "✅ answered" : "pending"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
