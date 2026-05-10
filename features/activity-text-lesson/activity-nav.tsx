"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Video, Mic, Sparkles } from "lucide-react";
import { cn } from "@shared/lib/utils";

const TABS = [
  { type: "text", label: "Read", icon: FileText },
  { type: "video", label: "Watch", icon: Video },
  { type: "voice", label: "Speak", icon: Mic },
  { type: "story", label: "Apply", icon: Sparkles },
] as const;

interface Props {
  studentId: string;
  lessonId: string;
}

export function ActivityNav({ studentId, lessonId }: Props) {
  const pathname = usePathname();
  return (
    <nav className="max-w-3xl mx-auto px-4 sm:px-0 mt-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => {
          const href = `/student/${studentId}/lesson/${lessonId}/${t.type}`;
          const active = pathname?.endsWith(`/${t.type}`);
          const Icon = t.icon;
          return (
            <Link
              key={t.type}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-10 rounded-full border-2 text-sm font-bold transition-all whitespace-nowrap",
                active
                  ? "bg-[hsl(var(--button-primary))] border-[hsl(var(--button-primary-border))] text-[hsl(var(--button-primary-text))] shadow-[0_3px_0_0_hsl(var(--button-primary-shadow))]"
                  : "bg-background border-border hover:bg-muted/40"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
