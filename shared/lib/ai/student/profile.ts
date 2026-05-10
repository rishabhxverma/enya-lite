/**
 * Student profile lifecycle. Profiles seeded for Maya/Liam live in the seed
 * JSON; new ones the teacher creates land in Backboard memory and are
 * recalled by the same lookup chain (memory > seed).
 */
import type { EALLevel, StudentProfile } from "@shared/types";
import {
  loadAllStudents,
  getStudentProfile as getSeedProfile,
} from "@shared/lib/student-profiles";
import {
  rememberFact,
  recallFacts,
} from "../backboard-call";
import { studentProfileMemoryString } from "../teacher/classroom";

const STUDENT_PREFIX = "[student:";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `student-${Date.now()}`
  );
}

function defaultTheme(interests: string[]): StudentProfile["theme"] {
  const lower = interests.map((i) => i.toLowerCase()).join(" ");
  if (/butterfl|garden|flower|art/.test(lower)) {
    return {
      primaryColor: "oklch(0.78 0.15 340)",
      accentColor: "oklch(0.85 0.18 50)",
      backgroundPattern: "butterflies",
      heroImageUrl: null,
      fontPairing: "whimsical",
    };
  }
  if (/space|rocket|robot|astronaut|mars|moon/.test(lower)) {
    return {
      primaryColor: "oklch(0.55 0.22 260)",
      accentColor: "oklch(0.75 0.18 195)",
      backgroundPattern: "starfield",
      heroImageUrl: null,
      fontPairing: "futuristic",
    };
  }
  if (/soccer|sport|ball|football|basketball/.test(lower)) {
    return {
      primaryColor: "oklch(0.65 0.2 145)",
      accentColor: "oklch(0.85 0.18 80)",
      backgroundPattern: "soccer",
      heroImageUrl: null,
      fontPairing: "classic",
    };
  }
  if (/animal|fox|forest|nature/.test(lower)) {
    return {
      primaryColor: "oklch(0.55 0.18 130)",
      accentColor: "oklch(0.7 0.16 50)",
      backgroundPattern: "forest",
      heroImageUrl: null,
      fontPairing: "classic",
    };
  }
  if (/ocean|sea|fish|whale/.test(lower)) {
    return {
      primaryColor: "oklch(0.55 0.16 220)",
      accentColor: "oklch(0.78 0.14 195)",
      backgroundPattern: "ocean",
      heroImageUrl: null,
      fontPairing: "classic",
    };
  }
  return {
    primaryColor: "oklch(0.83 0.18 82)",
    accentColor: "oklch(0.7 0.18 50)",
    backgroundPattern: "plain",
    heroImageUrl: null,
    fontPairing: "classic",
  };
}

export interface CreateProfileArgs {
  name: string;
  grade: number;
  ealLevel: EALLevel;
  interests: string[];
  culturalBackground?: string;
  learningGoals?: string[];
}

export async function createStudentProfile(args: CreateProfileArgs): Promise<{
  studentId: string;
  profile: StudentProfile;
}> {
  const id = slugify(args.name);
  const profile: StudentProfile = {
    id,
    name: args.name,
    grade: args.grade,
    ealLevel: args.ealLevel,
    interests: args.interests,
    culturalBackground: args.culturalBackground ?? "",
    learningGoals: args.learningGoals ?? [],
    avatarUrl: `/seed/avatars/${id}.svg`,
    theme: defaultTheme(args.interests),
  };

  await rememberFact(studentProfileMemoryString(profile), {
    kind: "student-profile",
    studentId: id,
  });

  return { studentId: id, profile };
}

function parseProfileMemory(content: string): Partial<StudentProfile> | null {
  if (!content.startsWith(STUDENT_PREFIX)) return null;
  const idMatch = content.match(/\[student:([^\]]+)\]/);
  if (!idMatch) return null;
  const grab = (k: string) =>
    content.match(new RegExp(`${k}:\\s*([^|]+?)\\s*(?:\\||$)`))?.[1]?.trim();
  const name = grab("name");
  const gradeRaw = grab("grade");
  const eal = grab("eal");
  const interests = grab("interests");
  const culture = grab("culture");
  const goals = grab("goals");
  if (!name) return null;
  return {
    id: idMatch[1],
    name,
    grade: gradeRaw ? parseInt(gradeRaw, 10) : undefined,
    ealLevel: eal as EALLevel | undefined,
    interests: interests
      ? interests.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    culturalBackground: culture && culture !== "(unspecified)" ? culture : "",
    learningGoals: goals && goals !== "(none)"
      ? goals.split(";").map((s) => s.trim()).filter(Boolean)
      : [],
  };
}

/** Look up a student by id. Memory first (latest profile-write wins), seed file fallback. */
export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  // 1. Memory.
  const memMatches = await recallFacts(`[student:${studentId}]`, 5).catch(() => []);
  const memHit = memMatches
    .map((m) => parseProfileMemory(m.content))
    .find((p) => p?.id === studentId);
  if (memHit?.name && memHit.grade && memHit.ealLevel && memHit.interests) {
    return {
      id: memHit.id!,
      name: memHit.name,
      grade: memHit.grade,
      ealLevel: memHit.ealLevel,
      interests: memHit.interests,
      culturalBackground: memHit.culturalBackground ?? "",
      learningGoals: memHit.learningGoals ?? [],
      avatarUrl: `/seed/avatars/${memHit.id}.svg`,
      theme: defaultTheme(memHit.interests),
    };
  }
  // 2. Seed.
  return getSeedProfile(studentId);
}

export async function listAllStudents(): Promise<StudentProfile[]> {
  const seed = await loadAllStudents();
  // Best-effort: also pull profiles from memory.
  const memMatches = await recallFacts("[student:", 50).catch(() => []);
  const fromMemory: StudentProfile[] = [];
  for (const m of memMatches) {
    const parsed = parseProfileMemory(m.content);
    if (
      parsed?.id &&
      parsed.name &&
      parsed.grade &&
      parsed.ealLevel &&
      parsed.interests &&
      !seed.find((s) => s.id === parsed.id) &&
      !fromMemory.find((s) => s.id === parsed.id)
    ) {
      fromMemory.push({
        id: parsed.id,
        name: parsed.name,
        grade: parsed.grade,
        ealLevel: parsed.ealLevel,
        interests: parsed.interests,
        culturalBackground: parsed.culturalBackground ?? "",
        learningGoals: parsed.learningGoals ?? [],
        avatarUrl: `/seed/avatars/${parsed.id}.svg`,
        theme: defaultTheme(parsed.interests),
      });
    }
  }
  return [...seed, ...fromMemory];
}
