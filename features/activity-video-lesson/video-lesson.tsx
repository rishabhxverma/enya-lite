"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import YouTube, { type YouTubePlayer, type YouTubeEvent } from "react-youtube";
import { motion, AnimatePresence } from "motion/react";
import { useVideoLessonSWR } from "@shared/services/swr-hooks";
import { STUB_VIDEO_LESSONS } from "@shared/lib/stub-content";
import type { VideoLessonContent, VideoOverlayQuestion } from "@shared/types";
import { ActivityNav } from "@features/activity-text-lesson/activity-nav";
import { QuizQuestion } from "@features/activity-text-lesson/quiz-question";
import { useProgressStore } from "@shared/stores/progress-store";
import { ThinkingStages, PersonalizingPill } from "./thinking-stages";

interface Props {
  studentId: string;
  lessonId: string;
}

export function VideoLesson({ studentId, lessonId }: Props) {
  // Optimistic render: stub data ships with the bundle, so we already know the
  // YouTube ID, title, and a hand-tuned set of overlay questions before any
  // network call. SWR uses this as fallback so the player shows up in <500ms
  // (just YouTube's iframe load) while the live API refines pause timestamps
  // in the background.
  const stubVideo = useMemo<VideoLessonContent | null>(() => {
    return (
      STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
      STUB_VIDEO_LESSONS.maya?.[lessonId] ??
      null
    );
  }, [studentId, lessonId]);

  const {
    data: video,
    isLoading,
    isValidating,
  } = useVideoLessonSWR(
    studentId,
    lessonId,
    "UPBMG5EYydo",
    [],
    stubVideo ? { fallbackData: stubVideo } : undefined,
  );
  // True cold load: no stub for this lesson AND fetch hasn't returned.
  const coldLoading = isLoading && !video;
  // Warm path: stub gave us the player instantly but SWR is still revalidating
  // to swap in AI-refined pause timestamps. Show a subtle pill over the video.
  const refining = !!video && isValidating && video === stubVideo;
  const [pending, setPending] = useState<VideoOverlayQuestion | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const playerRef = useRef<YouTubePlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs mirror state so the 250ms tick reads current values instead of the
  // closure captured when onPlay first ran — otherwise a stale tick can
  // re-set `pending` to the just-answered question right after we clear it.
  const pendingRef = useRef<VideoOverlayQuestion | null>(null);
  const answeredRef = useRef<Set<string>>(new Set());
  const { markActivityComplete, awardXp } = useProgressStore();

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [studentId, lessonId]);

  const onReady = (e: YouTubeEvent<unknown>) => {
    playerRef.current = e.target as YouTubePlayer;
  };

  const onPlay = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!video || pendingRef.current) return;
      const player = playerRef.current as
        | (YouTubePlayer & { getCurrentTime?: () => number })
        | null;
      const t = player?.getCurrentTime?.() ?? 0;
      const next = video.overlayQuestions.find(
        (q) =>
          q.pauseAtSeconds <= t &&
          !answeredRef.current.has(q.question.id) &&
          q.pauseAtSeconds + 5 > t,
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

  if (coldLoading || !video) {
    return (
      <>
        <ActivityNav studentId={studentId} lessonId={lessonId} />
        <ThinkingStages
          studentName={studentId.charAt(0).toUpperCase() + studentId.slice(1)}
          ready={false}
        />
      </>
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
          <PersonalizingPill visible={refining} />
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
