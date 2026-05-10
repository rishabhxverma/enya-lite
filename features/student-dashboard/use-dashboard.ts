"use client";

import { useEffect, useState } from "react";
import type { PersonalizedDashboard, StudentProfile } from "@shared/types";
import { studentService } from "@shared/services/student-service";
import { useStudentStore } from "@shared/stores/student-store";

export function useStudentDashboard(studentId: string) {
  const { hydrate, hydrated, getById } = useStudentStore();
  const [dashboard, setDashboard] = useState<PersonalizedDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studentService
      .getDashboard(studentId)
      .then((data) => {
        if (!cancelled)
          setDashboard(data as PersonalizedDashboard);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const profile: StudentProfile | undefined = getById(studentId);
  return { profile, dashboard, loading };
}
