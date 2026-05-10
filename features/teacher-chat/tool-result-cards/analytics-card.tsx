"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { StudentAnalytics } from "@shared/types";
import { TrendingUp } from "lucide-react";

interface Props {
  analytics: StudentAnalytics;
}

export function AnalyticsSummaryCard({ analytics }: Props) {
  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-yellow-700" />
        </div>
        <div>
          <div className="font-bold text-lg">Student analytics</div>
          <div className="text-sm text-muted-foreground">
            {analytics.studentId}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Quiz avg</div>
          <div className="font-bold text-2xl">{analytics.quizAverage}%</div>
        </div>
        <div className="rounded-xl bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Time on task</div>
          <div className="font-bold text-2xl">
            {analytics.timeSpentMinutes}m
          </div>
        </div>
        <div className="rounded-xl bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">EAL trend</div>
          <div className="font-bold text-2xl">
            {analytics.ealTrend === "up"
              ? "↑"
              : analytics.ealTrend === "down"
                ? "↓"
                : "→"}
          </div>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={analytics.skillRadar}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              dataKey="mastery"
              stroke="oklch(0.83 0.17 82)"
              fill="oklch(0.9 0.18 96)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
