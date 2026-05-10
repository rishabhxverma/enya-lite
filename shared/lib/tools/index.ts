export { TEACHER_TOOLS } from "./teacher-tools";
export { STUDENT_TOOLS, STORY_GAME_TOOLS } from "./student-tools";

import { TEACHER_TOOLS } from "./teacher-tools";
import { STUDENT_TOOLS } from "./student-tools";
import type { ToolDefinition } from "@shared/types";

export const ALL_TOOLS: ToolDefinition[] = [...TEACHER_TOOLS, ...STUDENT_TOOLS];

export function findTool(name: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.function.name === name);
}
