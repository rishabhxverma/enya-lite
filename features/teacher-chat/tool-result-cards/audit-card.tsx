"use client";

import type { PedagogicalAudit } from "@shared/types";
import { ClipboardCheck, AlertTriangle } from "lucide-react";

interface Props {
  audit: PedagogicalAudit;
}

const SCORE_LABEL: Record<string, string> = {
  blooms: "Bloom's",
  scaffolding: "Scaffolding",
  vocabularyLoad: "Vocabulary",
  culturalSensitivity: "Cultural",
  curriculumAlignment: "Curriculum",
};

function scoreColor(score: number) {
  if (score >= 80) return { ring: "stroke-green-500", text: "text-green-700" };
  if (score >= 60) return { ring: "stroke-amber-500", text: "text-amber-700" };
  return { ring: "stroke-red-500", text: "text-red-700" };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const { ring, text } = scoreColor(score);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          className="stroke-muted"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          className={ring}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`-mt-12 text-base font-bold ${text}`}>{score}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground -mt-0.5">
        {label}
      </div>
    </div>
  );
}

export function PedagogicalAuditCard({ audit }: Props) {
  const scores = [
    { key: "blooms", score: audit.blooms.score, comment: audit.blooms.comment },
    {
      key: "scaffolding",
      score: audit.scaffolding.score,
      comment: audit.scaffolding.comment,
    },
    {
      key: "vocabularyLoad",
      score: audit.vocabularyLoad.score,
      comment: audit.vocabularyLoad.comment,
    },
    {
      key: "culturalSensitivity",
      score: audit.culturalSensitivity.score,
      comment: audit.culturalSensitivity.comment,
    },
    {
      key: "curriculumAlignment",
      score: audit.curriculumAlignment.score,
      comment: "",
    },
  ];

  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-yellow-700" />
        </div>
        <div>
          <div className="font-bold text-lg">Pedagogical Audit</div>
          <div className="text-sm text-muted-foreground">
            5 dimensions scored against your textbook
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-5">
        {scores.map((s) => (
          <ScoreRing key={s.key} score={s.score} label={SCORE_LABEL[s.key]} />
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Recommendations
        </div>
        <ul className="space-y-2.5">
          {audit.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  rec.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : rec.priority === "medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {rec.priority}
              </span>
              <div className="text-sm">
                <div className="font-medium">{rec.description}</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {rec.suggestedAction}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
