"use client";

import { useEffect } from "react";
import { useStudentStore } from "@shared/stores/student-store";

interface Props {
  studentId: string;
  children: React.ReactNode;
}

export function ThemedContainer({ studentId, children }: Props) {
  const { hydrate, hydrated } = useStudentStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <div data-student={studentId} className="min-h-[calc(100vh-4rem)] relative">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30 bg-repeat"
        style={{ backgroundImage: "var(--student-bg-pattern)" }}
      />
      <div className="relative z-0">{children}</div>
    </div>
  );
}
