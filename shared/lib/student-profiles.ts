import type { StudentProfile } from "@shared/types";
import { readSeedJson } from "./seed-loader";

let cache: StudentProfile[] | null = null;
let lastLoad = 0;
const TTL_MS = 60_000;

export async function loadAllStudents(): Promise<StudentProfile[]> {
  const now = Date.now();
  if (cache && now - lastLoad < TTL_MS) return cache;
  const data =
    (await readSeedJson<StudentProfile[]>("students.json")) ?? [];
  cache = data;
  lastLoad = now;
  return data;
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentProfile | null> {
  const all = await loadAllStudents();
  return all.find((s) => s.id === studentId) ?? null;
}
