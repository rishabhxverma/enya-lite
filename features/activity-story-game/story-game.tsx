"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ActivityNav } from "@features/activity-text-lesson/activity-nav";
import { studentService } from "@shared/services/student-service";
import type { StoryGameNode, StoryChoice } from "@shared/types";
import { useProgressStore } from "@shared/stores/progress-store";
import { cn } from "@shared/lib/utils";
import { PinataReward } from "@features/reward-pinata/pinata-reward";

interface Props {
  studentId: string;
  lessonId: string;
}

export function StoryGame({ studentId, lessonId }: Props) {
  const [allNodes, setAllNodes] = useState<Record<string, StoryGameNode>>({});
  const [current, setCurrent] = useState<StoryGameNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [teachingMoment, setTeachingMoment] = useState<StoryChoice | null>(
    null
  );
  const [disabledChoices, setDisabledChoices] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  // Piñata tracks per-node correct choices. Story arcs have 3-4 nodes;
  // we treat the user's first correct choice on each node as one "hit",
  // and the completion screen as the final hit that triggers the burst.
  const [correctCount, setCorrectCount] = useState(0);
  const { awardXp, markActivityComplete } = useProgressStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studentService
      .generateStoryNode({ studentId, lessonId, isFirstNode: true })
      .then((data) => {
        const d = data as {
          node?: StoryGameNode;
          allNodes?: Record<string, StoryGameNode>;
          _stub?: boolean;
        };
        if (cancelled) return;
        if (d.node) setCurrent(d.node);
        if (d.allNodes)
          setAllNodes(d.allNodes as Record<string, StoryGameNode>);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, lessonId]);

  const choose = async (choice: StoryChoice) => {
    if (!current) return;
    if (!choice.isCorrect) {
      setTeachingMoment(choice);
      setDisabledChoices((d) => [...d, choice.text]);
      return;
    }
    awardXp(studentId, 15);
    // Piñata hit for this correct choice — the component picks it up via
    // the controlled `correct` prop below and animates accordingly.
    setCorrectCount((c) => c + 1);
    // Advance: try local map first, then API
    const next =
      allNodes[choice.nextNodeId] ??
      ((await studentService
        .generateStoryNode({
          studentId,
          lessonId,
          requestedNodeId: choice.nextNodeId,
        })
        .then((d) => (d as { node?: StoryGameNode }).node ?? null)
        .catch(() => null)) as StoryGameNode | null);
    if (!next || next.isTerminal) {
      setCurrent(next ?? current);
      setCompleted(true);
      markActivityComplete(studentId, `${lessonId}-story`);
      // The piñata burst fires automatically when correctCount hits the
      // node total — no separate confetti call needed.
      return;
    }
    setCurrent(next);
    setDisabledChoices([]);
  };

  if (loading || !current) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-72 bg-muted rounded-3xl" />
        <div className="h-24 bg-muted rounded-3xl" />
        <div className="h-12 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (completed) {
    const isMaya = studentId === "maya";
    return (
      <>
        <ActivityNav studentId={studentId} lessonId={lessonId} />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-7xl">🎉</div>
          <h1 className="text-3xl font-bold mt-4">
            You completed{" "}
            {isMaya ? "Maya's butterfly garden adventure" : "Liam's space station mission"}!
          </h1>
          <p className="text-muted-foreground mt-3">
            +50 XP • Skill unlocked: Photosynthesis basics
          </p>
          <ul className="mt-6 space-y-2 text-sm inline-block text-left">
            <li>✓ You named what plants need to grow</li>
            <li>✓ You explained why sunlight matters</li>
            <li>✓ You used the word &quot;photosynthesis&quot;</li>
          </ul>
        </div>
        <PinataReward
          total={Math.max(correctCount, 1)}
          correct={correctCount}
          studentId={studentId}
        />
      </>
    );
  }

  return (
    <>
      <ActivityNav studentId={studentId} lessonId={lessonId} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <StoryIllustration node={current} />

            <div
              className="text-lg sm:text-xl leading-loose font-serif italic max-w-2xl mx-auto"
              style={{ color: "var(--foreground)" }}
            >
              {current.narrative}
            </div>

            <div className="space-y-2.5 max-w-2xl mx-auto">
              {current.choices.map((c) => {
                const disabled = disabledChoices.includes(c.text);
                return (
                  <button
                    key={c.text}
                    onClick={() => choose(c)}
                    disabled={disabled}
                    className={cn(
                      "w-full text-left rounded-2xl border-2 px-5 py-4 font-medium text-base transition-all",
                      "border-[hsl(var(--button-secondary-border))] bg-[hsl(var(--button-secondary))] text-[hsl(var(--button-secondary-text))] shadow-[0_4px_0_0_hsl(var(--button-secondary-shadow))]",
                      "hover:scale-[1.01] active:translate-y-[3px] active:shadow-none",
                      disabled && "opacity-40 cursor-not-allowed hover:scale-100"
                    )}
                  >
                    {c.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {teachingMoment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 16 }}
                className="rounded-3xl bg-amber-50 border-2 border-amber-300 max-w-md p-6 shadow-xl"
              >
                <div className="text-5xl mb-2">
                  {studentId === "liam" ? "🤖" : "🦉"}
                </div>
                <div className="font-bold text-amber-900 mb-1">
                  Hmm, let&apos;s think about this differently…
                </div>
                <p className="text-amber-900/90 text-sm">
                  {teachingMoment.feedbackOnSelect}
                </p>
                <button
                  onClick={() => setTeachingMoment(null)}
                  className="mt-5 inline-flex items-center rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_3px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[3px] transition-all px-5 h-10 text-sm"
                >
                  Try again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PinataReward
        total={Math.max(Object.keys(allNodes).length || 3, correctCount + 1)}
        correct={correctCount}
        studentId={studentId}
      />
    </>
  );
}

function StoryIllustration({ node }: { node: StoryGameNode }) {
  const [errored, setErrored] = useState(false);
  if (node.illustrationUrl && !errored) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border-2 overflow-hidden aspect-[4/3] bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.illustrationUrl}
          onError={() => setErrored(true)}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  // Emoji fallback
  return (
    <div
      className="max-w-2xl mx-auto rounded-3xl border-2 border-dashed aspect-[4/3] flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, var(--student-primary, #fbbf24), white 70%), color-mix(in oklch, var(--student-accent, #fde68a), white 70%))`,
      }}
    >
      <div className="text-8xl">
        {node.illustrationFallbackEmoji ?? "✨"}
      </div>
    </div>
  );
}
