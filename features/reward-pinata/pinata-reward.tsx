"use client";

/**
 * PinataReward — themed gamified reward bar for activity pages.
 *
 * Replaces the old "fire confetti when streak hits 3" pattern with a
 * single coherent visual narrative:
 *   - Piñata sits at the bottom-right of the activity page
 *   - Each correct answer = visible "hit" (shake + scale pulse + a single
 *     candy emoji pops out and arcs away)
 *   - Final correct answer = the piñata bursts open and a wave of candy
 *     emoji rains across the screen via canvas-confetti
 *
 * Theme-aware: the piñata's body color uses --student-primary, the
 * sash/fringe uses --student-accent, the candy emoji set is per-student
 * (butterflies + flowers + sweets for Maya; rockets + planets + stars
 * for Liam). Falls back to a neutral gold/pink set if no student attr.
 *
 * The component is controlled — parent owns `correct` and `total`. We
 * only animate transitions; that lets multiple activity pages plug it in
 * without coupling to their question-state shape.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  /** Total number of questions / opportunities. */
  total: number;
  /** How many have been answered correctly so far. */
  correct: number;
  /** Theme id — "maya", "liam", or anything else (falls back to neutral). */
  studentId?: string;
  /** Optional className for outer wrapper. */
  className?: string;
}

const CANDY_BY_STUDENT: Record<string, string[]> = {
  maya: ["🦋", "🌸", "🌼", "🌺", "🍬", "🍭", "💖", "🌈"],
  liam: ["🚀", "🌟", "🛸", "✨", "🪐", "⚡", "🌌", "🌠"],
  default: ["🎉", "🍬", "🍭", "⭐", "💫", "🎁", "🌟", "✨"],
};

export function PinataReward({ total, correct, studentId, className }: Props) {
  const candySet = CANDY_BY_STUDENT[studentId ?? ""] ?? CANDY_BY_STUDENT.default;
  // Keep a ref of the last `correct` we animated against, so we only fire
  // a hit-pulse on *new* correct answers (not re-renders).
  const prevCorrectRef = useRef(correct);
  const [hitNonce, setHitNonce] = useState(0);
  const [poppedCandy, setPoppedCandy] = useState<{ id: number; emoji: string }[]>([]);
  const [burst, setBurst] = useState(false);
  const burstFiredRef = useRef(false);

  useEffect(() => {
    if (correct > prevCorrectRef.current) {
      // A new correct answer just landed.
      setHitNonce((n) => n + 1);
      const emoji = candySet[Math.floor(Math.random() * candySet.length)];
      const id = Date.now() + Math.random();
      setPoppedCandy((prev) => [...prev, { id, emoji }]);
      // Remove the piece after its arc finishes so the DOM doesn't grow.
      setTimeout(() => {
        setPoppedCandy((prev) => prev.filter((p) => p.id !== id));
      }, 1400);
    }
    prevCorrectRef.current = correct;
  }, [correct, candySet]);

  // When all questions are correct, fire the big burst (once).
  useEffect(() => {
    if (correct >= total && total > 0 && !burstFiredRef.current) {
      burstFiredRef.current = true;
      setBurst(true);
      // Big confetti rain using emoji shapes from the per-student set.
      import("canvas-confetti").then((m) => {
        const confetti = m.default;
        const emojiShapes = candySet.map((e) =>
          confetti.shapeFromText({ text: e, scalar: 2 })
        );
        confetti({
          particleCount: 60,
          spread: 100,
          startVelocity: 45,
          origin: { x: 0.85, y: 0.85 },
          shapes: emojiShapes,
          scalar: 2,
        });
        // Second wave a tick later for that "candy raining" feel.
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 140,
            startVelocity: 30,
            origin: { x: 0.85, y: 0.9 },
            shapes: emojiShapes,
            scalar: 1.6,
            gravity: 0.7,
          });
        }, 350);
      });
    }
  }, [correct, total, candySet]);

  // Progress dots (same count as `total`) — fill as the user gets each one.
  const dots = Array.from({ length: total }, (_, i) => i < correct);

  return (
    <div
      className={`fixed bottom-4 right-4 z-30 flex items-end gap-3 select-none pointer-events-none ${
        className ?? ""
      }`}
    >
      {/* Progress dots */}
      <div className="flex flex-col gap-1.5 items-end">
        <div className="flex gap-1">
          {dots.map((filled, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                filled ? "scale-110" : "scale-100 opacity-30"
              }`}
              style={{
                backgroundColor: filled
                  ? "var(--student-accent, #f59e0b)"
                  : "rgba(0,0,0,0.2)",
                boxShadow: filled
                  ? "0 0 8px var(--student-accent, #f59e0b)"
                  : "none",
              }}
            />
          ))}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          {correct}/{total}
        </div>
      </div>

      {/* The piñata */}
      <motion.div
        key={hitNonce} /* re-mount each hit so the keyframe restarts */
        animate={
          burst
            ? { rotate: [0, -25, 25, 0], scale: [1, 1.4, 0.6, 0] }
            : hitNonce > 0
              ? { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, 0] }
              : { rotate: [0, -2, 2, 0] }
        }
        transition={
          burst
            ? { duration: 0.7, ease: "easeOut" }
            : hitNonce > 0
              ? { duration: 0.5 }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative"
      >
        <PinataSvg studentId={studentId} />

        {/* Single-candy pops on each hit — small arc upward + fade */}
        <AnimatePresence>
          {poppedCandy.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: (Math.random() - 0.5) * 80,
                y: -90,
                scale: [0.5, 1.2, 1, 0.8],
                rotate: (Math.random() - 0.5) * 60,
              }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 text-2xl"
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG piñata
//
// Simple geometric construction so it renders crisply at any size and is
// easy to theme. Body is a rounded blob using the student's primary color;
// fringe layers use the accent color. Eyes + smile keep it friendly.
// ---------------------------------------------------------------------------

function PinataSvg({ studentId }: { studentId?: string }) {
  // Rope at the top (so the piñata "hangs" from somewhere off-screen).
  return (
    <svg
      width="92"
      height="110"
      viewBox="0 0 92 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Piñata"
      role="img"
    >
      <title>Piñata reward</title>
      {/* Hanging rope */}
      <line
        x1="46"
        y1="0"
        x2="46"
        y2="14"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.5"
      />
      {/* Body */}
      <ellipse
        cx="46"
        cy="58"
        rx="38"
        ry="42"
        fill="var(--student-primary, oklch(0.78 0.15 340))"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1.5"
      />
      {/* Fringe stripes */}
      <FringeStripe y={32} />
      <FringeStripe y={52} />
      <FringeStripe y={72} />
      {/* Eyes */}
      <circle cx="36" cy="52" r="3" fill="white" />
      <circle cx="36" cy="52" r="1.5" fill="black" />
      <circle cx="56" cy="52" r="3" fill="white" />
      <circle cx="56" cy="52" r="1.5" fill="black" />
      {/* Smile */}
      <path
        d="M 38 64 Q 46 70 54 64"
        fill="none"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Top tassel */}
      <path
        d="M 42 18 L 46 14 L 50 18 L 50 24 L 42 24 Z"
        fill="var(--student-accent, oklch(0.85 0.18 50))"
      />
      {/* Per-student decoration */}
      {studentId === "maya" && (
        <text x="46" y="92" textAnchor="middle" fontSize="14">
          🦋
        </text>
      )}
      {studentId === "liam" && (
        <text x="46" y="92" textAnchor="middle" fontSize="14">
          🚀
        </text>
      )}
    </svg>
  );
}

function FringeStripe({ y }: { y: number }) {
  // A row of small triangles to fake the paper-fringe look.
  const triangles = [];
  for (let x = 10; x < 82; x += 6) {
    triangles.push(
      <path
        key={x}
        d={`M ${x} ${y} L ${x + 3} ${y + 4} L ${x + 6} ${y} Z`}
        fill="var(--student-accent, oklch(0.85 0.18 50))"
        opacity="0.85"
      />
    );
  }
  return <>{triangles}</>;
}
