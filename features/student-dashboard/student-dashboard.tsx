"use client";

import Link from "next/link";
import { useStudentDashboard } from "./use-dashboard";
import { DashboardHero } from "./dashboard-hero";
import { QuickStatsRow } from "./quick-stats-row";
import { TodaysLessonCard } from "./todays-lesson-card";

interface Props {
  studentId: string;
}

export function StudentDashboard({ studentId }: Props) {
  const { profile, dashboard, loading } = useStudentDashboard(studentId);

  if (loading || !dashboard) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-72 rounded-3xl bg-muted" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-44 rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Student not found</h1>
        <p className="text-muted-foreground mt-2">
          We couldn&apos;t find a profile for &quot;{studentId}&quot;. Try Maya
          or Liam from the role pills.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-xl border-2 px-5 h-10 leading-[2rem]"
        >
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <DashboardHero profile={profile} dashboard={dashboard} />
      <QuickStatsRow
        profile={profile}
        xp={dashboard.xp}
        streakDays={dashboard.streakDays}
      />
      <TodaysLessonCard
        studentId={studentId}
        recommendation={dashboard.todaysRecommendation}
      />
      {dashboard.motivationalNudges.length > 1 && (
        <div className="rounded-2xl border-2 bg-card p-5">
          <div className="font-semibold mb-2">Notes from your tutor</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {dashboard.motivationalNudges.slice(1).map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
