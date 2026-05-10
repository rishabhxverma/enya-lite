import { callForJson, withDocumentRef, MODELS } from "../backboard-call";
import {
  CurriculumStandardsSchema,
  CURRICULUM_STANDARDS_SUMMARY,
  CurriculumMappingSchema,
  CURRICULUM_MAPPING_SUMMARY,
} from "../schemas";
import {
  TEACHER_ANALYST_ROLE,
  jsonOnlyInstructions,
  BC_G3_SCIENCE_STANDARDS,
} from "../system-prompts";

export interface CurriculumSearchArgs {
  query: string;
  jurisdiction?: "BC" | "Alberta";
  gradeLevel?: number;
}

export async function searchCurriculumStandards(args: CurriculumSearchArgs) {
  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: SEARCH CURRICULUM STANDARDS]
Return curriculum standards matching the query. Use the embedded BC reference
list as your source of truth — do NOT invent standard IDs that aren't there.
If the query has no good matches in the reference list, return the closest
adjacent standards rather than fabricating.

${BC_G3_SCIENCE_STANDARDS}

${jsonOnlyInstructions(CURRICULUM_STANDARDS_SUMMARY)}`;

  const userBody = `Query: ${args.query}
Jurisdiction: ${args.jurisdiction ?? "BC"}
${args.gradeLevel ? `Grade level: ${args.gradeLevel}` : ""}

Return up to 5 most relevant standards from the embedded reference list.`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: CurriculumStandardsSchema,
    model: MODELS.fastChat,
  });
}

export interface CurriculumMapArgs {
  contentId?: string;
  documentId?: string;
  jurisdictions?: string[];
}

export async function mapToCurriculum(args: CurriculumMapArgs) {
  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: MAP CONTENT TO CURRICULUM]
Identify which curriculum standards the source material addresses. For each
mapping, give a 1-2 sentence rationale grounded in specific evidence from
the content. Confidence is your honest estimate (0.0-1.0).

${BC_G3_SCIENCE_STANDARDS}

${jsonOnlyInstructions(CURRICULUM_MAPPING_SUMMARY)}`;

  const userBody = `Map the source material to ${args.jurisdictions?.join(", ") ?? "BC"} curriculum standards.

Return 2-5 mappings, each with confidence ≥0.5.`;

  return callForJson({
    systemPrompt,
    content: withDocumentRef(args.documentId, userBody),
    schema: CurriculumMappingSchema,
    model: MODELS.generation,
  });
}
