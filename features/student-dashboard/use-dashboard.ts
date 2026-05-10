"use client";

import { useEffect } from "react";
import type { StudentProfile } from "@shared/types";
import { useStudentDashboardSWR } from "@shared/services/swr-hooks";
import { useStudentStore } from "@shared/stores/student-store";

export function useStudentDashboard(studentId: string) {
  const { hydrate, hydrated, getById } = useStudentStore();
  // SWR caches by `student:<id>:dashboard` so flipping Maya↔Liam doesn't
  // re-hit the API; the previous student's data is held while the new one
  // revalidates → no skeleton flash.
  const { data: dashboard, isLoading } = useStudentDashboardSWR(studentId);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const profile: StudentProfile | undefined = getById(studentId);
  return { profile, dashboard: dashboard ?? null, loading: isLoading };
}
