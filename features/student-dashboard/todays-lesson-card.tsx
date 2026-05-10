"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FileText, Video, Mic, Sparkles, ArrowRight } from "lucide-react";
import type { PersonalizedDashboard } from "@shared/types";

interface Props {
  studentId: string;
  recommendation: PersonalizedDashboard["todaysRecommendation"];
}

const ACTIVITIES = [
  { type: "text", label: "Read", icon: FileText },
  { type: "video", label: "Watch", icon: Video },
  { type: "voice", label: "Speak", icon: Mic },
  { type: "story", label: "Apply", icon: Sparkles },
] as const;

export function TodaysLessonCard({ studentId, recommendation }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border-2 bg-card p-6 shadow-md relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: "var(--student-primary, #fbbf24)" }}
      />
      <div className="relative">
        <div className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
          Today&apos;s lesson
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1">
          {recommendation.title}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-prose">
          {recommendation.reason}
        </p>

        <div className="flex items-center gap-2 mt-5">
          {ACTIVITIES.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.type}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium"
              >
                <Icon className="w-3.5 h-3.5" />
                {a.label}
              </div>
            );
          })}
        </div>

        <Link
          href={`/student/${studentId}/lesson/${recommendation.lessonId}/text`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-6 h-12"
        >
          Continue learning
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </motion.div>
  );
}
