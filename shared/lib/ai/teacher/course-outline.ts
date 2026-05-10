import type { Course } from "@shared/types";
import { callForJson, withDocumentRef, MODELS } from "../backboard-call";
import { CourseSchema, COURSE_SCHEMA_SUMMARY } from "../schemas";
import {
  TEACHER_ANALYST_ROLE,
  jsonOnlyInstructions,
  BC_G3_SCIENCE_STANDARDS,
} from "../system-prompts";

export interface CourseOutlineArgs {
  documentId: string;
  topic: string;
  gradeLevel: number;
  curriculumStandard: string;
  targetUnitCount?: number;
  lessonsPerUnit?: number;
}

export async function generateCourseOutline(
  args: CourseOutlineArgs
): Promise<{ course: Course }> {
  const unitCount = args.targetUnitCount ?? 3;
  const lessonsPerUnit = args.lessonsPerUnit ?? 3;

  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: COURSE OUTLINE]
Generate a course outline grounded in the uploaded textbook. Structure:
Course → Units (thematic groupings) → Lessons. Every Lesson MUST have
exactly 4 activities in this order: text → video → voice → story (the
pedagogical arc Read → Watch → Speak → Apply).

Each lesson includes 3-5 explicit learning objectives written as observable
student behaviors ("students will identify...", "students will explain...").

Lesson titles should reflect the actual chapter/section structure of the
uploaded textbook — not invented.

${BC_G3_SCIENCE_STANDARDS}

${jsonOnlyInstructions(COURSE_SCHEMA_SUMMARY)}`;

  const userBody = `Generate a course outline for:
- Topic: ${args.topic}
- Grade: ${args.gradeLevel}
- Standard: ${args.curriculumStandard}
- Target structure: ${unitCount} units, ${lessonsPerUnit} lessons per unit
- textbookDocumentId: ${args.documentId}

The course id should be a kebab-case slug derived from the topic and grade.`;

  const course = await callForJson({
    systemPrompt,
    content: withDocumentRef(args.documentId, userBody),
    schema: CourseSchema,
    model: MODELS.generation,
  });

  // Ensure textbookDocumentId is correct (model sometimes echoes the placeholder).
  return { course: { ...course, textbookDocumentId: args.documentId } as Course };
}
