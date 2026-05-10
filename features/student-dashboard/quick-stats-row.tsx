"use client";

import { motion } from "motion/react";
import { Flame, Trophy, Sparkles, Clock } from "lucide-react";
import type { StudentProfile } from "@shared/types";

interface Props {
  profile: StudentProfile;
  xp: number;
  streakDays: number;
}

export function QuickStatsRow({ profile, xp, streakDays }: Props) {
  const isMaya = profile.id === "maya";
  const stats = [
    {
      icon: isMaya ? "🦋" : "🚀",
      label: "Total XP",
      value: xp.toLocaleString(),
      tone: "var(--student-primary)",
      lucide: Trophy,
    },
    {
      icon: isMaya ? "💖" : "⚡",
      label: "Day streak",
      value: `${streakDays}`,
      tone: "var(--student-accent)",
      lucide: Flame,
    },
    {
      icon: "✨",
      label: "Skills",
      value: isMaya ? "5" : "8",
      tone: "var(--student-primary)",
      lucide: Sparkles,
    },
    {
      icon: "⏱️",
      label: "Minutes this week",
      value: isMaya ? "145" : "312",
      tone: "var(--student-accent)",
      lucide: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => {
        const Icon = s.lucide;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border-2 bg-card p-4 flex items-center gap-3 shadow-sm"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `color-mix(in oklch, ${s.tone}, transparent 80%)` }}
            >
              <Icon className="w-5 h-5" style={{ color: s.tone }} />
            </div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
