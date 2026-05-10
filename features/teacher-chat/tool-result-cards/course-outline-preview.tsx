"use client";

import type { Course } from "@shared/types";
import { BookOpen, FileText, Video, Mic, Sparkles } from "lucide-react";
import { useState } from "react";

const ACTIVITY_ICONS = {
  text: FileText,
  video: Video,
  voice: Mic,
  story: Sparkles,
} as const;

interface Props {
  course: Course;
}

export function CourseOutlinePreview({ course }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-yellow-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">{course.title}</div>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-muted">
              Grade {course.gradeLevel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-900">
              {course.curriculumStandard.split("—")[0].trim()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {course.units.map((unit) => (
          <div key={unit.id} className="border rounded-xl">
            <button
              onClick={() => setOpen((s) => ({ ...s, [unit.id]: !s[unit.id] }))}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50 rounded-xl"
            >
              <div>
                <div className="font-semibold">{unit.title}</div>
                <div className="text-xs text-muted-foreground">
                  {unit.lessons.length} lessons
                </div>
              </div>
              <div className="text-muted-foreground">
                {open[unit.id] ? "−" : "+"}
              </div>
            </button>
            {open[unit.id] && (
              <ul className="px-3 pb-3 space-y-2">
                {unit.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="border-l-2 border-yellow-300 pl-3 py-1.5"
                  >
                    <div className="font-medium text-sm">{lesson.title}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {lesson.activities.map((a) => {
                        const Icon = ACTIVITY_ICONS[a.type];
                        return (
                          <span
                            key={a.id}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted"
                            title={`${a.type} (${a.status})`}
                          >
                            <Icon className="w-3 h-3 text-muted-foreground" />
                          </span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button className="rounded-xl border-2 border-[hsl(var(--button-success-border))] bg-[hsl(var(--button-success))] text-[hsl(var(--button-success-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-success-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-5 h-10 text-sm">
          Approve outline
        </button>
        <button className="rounded-xl border-2 border-[hsl(var(--button-neutral-border))] bg-[hsl(var(--button-neutral))] text-[hsl(var(--button-neutral-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-neutral-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-5 h-10 text-sm">
          Edit
        </button>
      </div>
    </div>
  );
}
