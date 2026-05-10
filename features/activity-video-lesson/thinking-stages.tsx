"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2 } from "lucide-react";

// Cosmetic timeline of the real backend pipeline:
//   • transcript fetch (~8–12s)
//   • AI agent picks pause points from transcript + student profile (~10–18s)
//   • response assembly + question alignment (~1s)
// Stage durations are tuned so the UI lands on the last stage right around
// when SWR returns. If data arrives early we skip ahead; if it's late we
// hold on the final "almost ready" stage.
const STAGES = [
  {
    id: "find",
    label: "Finding the right video",
    detail: "Picking a clip that matches today's lesson…",
    msUntilDone: 800,
  },
  {
    id: "transcript",
    label: "Reading the transcript",
    detail: "Following along word-by-word…",
    msUntilDone: 4500,
  },
  {
    id: "pauses",
    label: "Choosing smart pause moments",
    detail: "Looking for the parts worth a quick check-in…",
    msUntilDone: 9000,
  },
  {
    id: "personalize",
    label: "Personalizing for you",
    detail: "Tuning questions to your learning level…",
    msUntilDone: 13000,
  },
] as const;

interface Props {
  /** Student's first name (or fallback) — used in the personalization stage. */
  studentName?: string;
  /** When true, advance to the final "ready" state and dismiss. */
  ready?: boolean;
}

export function ThinkingStages({ studentName, ready = false }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 120);
    return () => clearInterval(tick);
  }, []);

  // Determine which stages are done / in-progress.
  const lastStageIdx = STAGES.length - 1;
  const currentIdx = ready
    ? lastStageIdx + 1 // all done
    : Math.min(
        lastStageIdx,
        STAGES.findIndex((s) => elapsed < s.msUntilDone)
      );
  // findIndex returns -1 when every stage is past its threshold — clamp
  // to the last stage so we don't render a meaningless empty state.
  const safeCurrentIdx = currentIdx === -1 ? lastStageIdx : currentIdx;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="aspect-video rounded-2xl border-2 shadow-lg bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Soft ambient glow */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(251,191,36,0.18), transparent 55%), radial-gradient(circle at 75% 70%, rgba(52,211,153,0.18), transparent 55%)",
          }}
        />

        <div className="relative w-full max-w-md">
          <div className="text-center mb-5">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200"
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              AI is thinking
            </motion.div>
            <h2 className="mt-3 text-xl sm:text-2xl font-bold text-foreground">
              Setting up your video lesson
            </h2>
          </div>

          <ul className="space-y-2">
            {STAGES.map((stage, i) => {
              const isDone = ready || i < safeCurrentIdx;
              const isActive = !ready && i === safeCurrentIdx;
              const isPending = !isDone && !isActive;

              return (
                <motion.li
                  key={stage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={[
                    "flex items-start gap-3 rounded-2xl border-2 px-3.5 py-2.5 transition-colors",
                    isDone &&
                      "bg-emerald-50 border-emerald-200 text-emerald-900",
                    isActive && "bg-white border-amber-300 text-foreground",
                    isPending && "bg-white/60 border-muted text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center shrink-0">
                    <AnimatePresence mode="wait" initial={false}>
                      {isDone ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.span>
                      ) : isActive ? (
                        <motion.span
                          key="active"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="pending"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-2 w-2 rounded-full bg-muted-foreground/40"
                        />
                      )}
                    </AnimatePresence>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">
                      {stage.id === "personalize" && studentName
                        ? `Personalizing for ${studentName}`
                        : stage.label}
                    </div>
                    {isActive && (
                      <motion.div
                        className="text-xs mt-0.5 text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {stage.detail}
                      </motion.div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Compact pill shown over the player when SWR is silently revalidating. */
export function PersonalizingPill({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 shadow-sm"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refining pause moments…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
