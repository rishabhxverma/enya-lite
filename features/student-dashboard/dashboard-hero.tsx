"use client";

import { motion } from "motion/react";
import type { PersonalizedDashboard, StudentProfile } from "@shared/types";

interface Props {
  profile: StudentProfile;
  dashboard: PersonalizedDashboard;
}

export function DashboardHero({ profile, dashboard }: Props) {
  const heroUrl = dashboard.themedHeroImageUrl ?? profile.theme.heroImageUrl;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative h-[280px] sm:h-[320px] rounded-3xl overflow-hidden border-2 shadow-md"
      style={{
        background: heroUrl
          ? `url(${heroUrl}) center/cover`
          : "linear-gradient(135deg, var(--student-primary), var(--student-accent))",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div
        aria-hidden
        className="absolute -top-24 -left-12 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: "var(--student-accent, #fde68a)" }}
      />
      <div className="relative z-10 flex flex-col h-full justify-end p-6 sm:p-10 text-white">
        <p className="text-sm font-semibold opacity-90">
          {profile.grade
            ? `Grade ${profile.grade} • EAL ${profile.ealLevel}`
            : profile.ealLevel}
        </p>
        <h1
          className="text-3xl sm:text-5xl font-bold mt-1 drop-shadow-md"
          style={{
            fontFamily:
              "var(--student-greeting-font, var(--font-inter), sans-serif)",
          }}
        >
          {dashboard.greeting}
        </h1>
        {dashboard.motivationalNudges?.[0] && (
          <p className="text-base sm:text-lg mt-3 opacity-90 max-w-xl">
            {dashboard.motivationalNudges[0]}
          </p>
        )}
      </div>
    </motion.div>
  );
}
