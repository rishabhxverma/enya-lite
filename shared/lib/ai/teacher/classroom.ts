/**
 * Classroom management — backed by Backboard memory rather than a DB. Each
 * classroom is one memory entry with a stable `[classroom:<id>]` prefix so
 * we can list/find them with `searchMemories`.
 */
import type { Classroom, EALLevel, StudentProfile } from "@shared/types";
import {
  rememberFact,
  recallFacts,
  listAllMemories,
} from "../backboard-call";

const CLASSROOM_PREFIX = "[classroom:";
const STUDENT_PREFIX = "[student:";

interface ClassroomMemory {
  id: string;
  name: string;
  studentIds: string[];
  courseIds: string[];
  updatedAt: string;
}

function classroomToMemoryString(c: ClassroomMemory): string {
  return `[classroom:${c.id}] name: ${c.name} | students: ${c.studentIds.join(", ") || "(none)"} | courses: ${c.courseIds.join(", ") || "(none)"} | updatedAt: ${c.updatedAt}`;
}

function parseClassroomMemory(content: string): Classroom | null {
  const idMatch = content.match(/\[classroom:([^\]]+)\]/);
  if (!idMatch) return null;
  const id = idMatch[1];
  const nameMatch = content.match(/name:\s*([^|]+?)\s*\|/);
  const studentsMatch = content.match(/students:\s*([^|]+?)\s*\|/);
  const coursesMatch = content.match(/courses:\s*([^|]+?)(?:\s*\||$)/);
  return {
    id,
    name: nameMatch?.[1].trim() ?? `Classroom ${id}`,
    studentIds: (studentsMatch?.[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "(none)"),
    courseIds: (coursesMatch?.[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "(none)"),
  };
}

export interface ManageClassroomArgs {
  action: "create" | "update" | "delete" | "list" | "assign-students" | "assign-course";
  classroomId?: string;
  name?: string;
  studentIds?: string[];
  courseId?: string;
}

export async function manageClassroom(args: ManageClassroomArgs): Promise<{
  classroom?: Classroom;
  classrooms?: Classroom[];
  message: string;
}> {
  if (args.action === "list") {
    const all = await listAllMemories({ pageSize: 100 });
    const classrooms = all.memories
      .filter((m) => m.content.startsWith(CLASSROOM_PREFIX))
      .map((m) => parseClassroomMemory(m.content))
      .filter((c): c is Classroom => c !== null);
    return {
      classrooms,
      message: `Found ${classrooms.length} classroom(s).`,
    };
  }

  if (args.action === "create") {
    const id = args.classroomId ?? `cls_${Date.now()}`;
    const memory: ClassroomMemory = {
      id,
      name: args.name ?? "Untitled Classroom",
      studentIds: args.studentIds ?? [],
      courseIds: args.courseId ? [args.courseId] : [],
      updatedAt: new Date().toISOString(),
    };
    await rememberFact(classroomToMemoryString(memory), {
      kind: "classroom",
      classroomId: id,
    });
    return {
      classroom: {
        id: memory.id,
        name: memory.name,
        studentIds: memory.studentIds,
        courseIds: memory.courseIds,
      },
      message: `Created classroom '${memory.name}'.`,
    };
  }

  // For update/assign-* we look up via search, mutate, and write a new memory
  // entry (Backboard memory is append-only via add; the latest one wins on
  // semantic search).
  if (args.action === "update" || args.action === "assign-students" || args.action === "assign-course") {
    const id = args.classroomId;
    if (!id) {
      return { message: `Action '${args.action}' requires classroomId.` };
    }
    const matches = await recallFacts(`${CLASSROOM_PREFIX}${id}`, 5);
    const existing = matches
      .map((m) => parseClassroomMemory(m.content))
      .find((c): c is Classroom => c?.id === id);
    if (!existing) {
      return { message: `Classroom '${id}' not found.` };
    }
    const updated: ClassroomMemory = {
      id,
      name: args.name ?? existing.name,
      studentIds:
        args.action === "assign-students"
          ? Array.from(new Set([...existing.studentIds, ...(args.studentIds ?? [])]))
          : args.studentIds ?? existing.studentIds,
      courseIds:
        args.action === "assign-course" && args.courseId
          ? Array.from(new Set([...existing.courseIds, args.courseId]))
          : existing.courseIds,
      updatedAt: new Date().toISOString(),
    };
    await rememberFact(classroomToMemoryString(updated), {
      kind: "classroom",
      classroomId: id,
    });
    return {
      classroom: {
        id: updated.id,
        name: updated.name,
        studentIds: updated.studentIds,
        courseIds: updated.courseIds,
      },
      message: `Updated classroom '${updated.name}'.`,
    };
  }

  // Delete: write a tombstone memory (Backboard's listing of memories is
  // additive — deletion via DELETE endpoint exists but we'd need to fetch
  // memory_ids first; tombstone is simpler for hackathon).
  if (args.action === "delete" && args.classroomId) {
    await rememberFact(
      `[classroom:${args.classroomId}] DELETED at ${new Date().toISOString()}`,
      { kind: "classroom-tombstone", classroomId: args.classroomId }
    );
    return { message: `Marked classroom '${args.classroomId}' as deleted.` };
  }

  return { message: `Action '${args.action}' not supported.` };
}

// ---------- bulk EAL update ----------

export interface BulkEalUpdate {
  studentId: string;
  newLevel: EALLevel;
}

/** Re-write each student's profile memory with the new EAL level appended.
 *  The downstream profile loader prefers the latest entry by `updatedAt`. */
export async function bulkUpdateEalLevels(
  updates: BulkEalUpdate[]
): Promise<{ updated: number; students: { studentId: string; newLevel: EALLevel }[] }> {
  for (const u of updates) {
    await rememberFact(
      `${STUDENT_PREFIX}${u.studentId}] EAL level updated to ${u.newLevel} at ${new Date().toISOString()}`,
      { kind: "student-eal-update", studentId: u.studentId, newLevel: u.newLevel }
    );
  }
  return {
    updated: updates.length,
    students: updates.map((u) => ({ studentId: u.studentId, newLevel: u.newLevel })),
  };
}

// ---------- profile (used by both teacher and student) ----------

export function studentProfileMemoryString(p: StudentProfile): string {
  return `[student:${p.id}] name: ${p.name} | grade: ${p.grade} | eal: ${p.ealLevel} | interests: ${p.interests.join(", ")} | culture: ${p.culturalBackground || "(unspecified)"} | goals: ${(p.learningGoals ?? []).join("; ") || "(none)"} | updatedAt: ${new Date().toISOString()}`;
}
