import type { PedagogicalAudit } from "@shared/types";
import { callForJson, withDocumentRef, MODELS } from "../backboard-call";
import {
  PedagogicalAuditSchema,
  PEDAGOGICAL_AUDIT_SCHEMA_SUMMARY,
} from "../schemas";
import {
  TEACHER_ANALYST_ROLE,
  jsonOnlyInstructions,
  BC_G3_SCIENCE_STANDARDS,
} from "../system-prompts";

export interface AuditArgs {
  documentId?: string;
  courseId?: string;
  targetGrade: number;
  targetEalLevels?: string[];
  curriculumStandards?: string[];
}

export async function runAudit(args: AuditArgs): Promise<PedagogicalAudit> {
  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: PEDAGOGICAL AUDIT]
Audit the source material against five dimensions and produce a structured
report with prioritized recommendations.

[DIMENSIONS]
1. BLOOM'S TAXONOMY ALIGNMENT — distribute observed cognitive demand across
   Remember/Understand/Apply/Analyze/Evaluate/Create. Score 0-100 for balance
   appropriate to the target grade.
2. SCAFFOLDING QUALITY — are concepts introduced before being used? Is
   complexity gradual? Score 0-100.
3. VOCABULARY LOAD — density of tier-2/3 vocabulary, abstract terms, academic
   language. Calibrate against the target grade. Score 0-100 (where 100 =
   appropriate, NOT maximum).
4. CULTURAL SENSITIVITY — narrow cultural assumptions, lack of representation,
   excluding language. Score 0-100. List specific phrases from the source
   that are problematic.
5. CURRICULUM ALIGNMENT — map content to specific curriculum expectations.
   List specific matches AND specific gaps.

[GROUNDING REQUIREMENT]
Every flag, match, gap, and recommendation MUST be grounded in the actual
content of the source document. Quote specific phrases when listing flags.
Do NOT invent examples that are not present in the source.

${BC_G3_SCIENCE_STANDARDS}

${jsonOnlyInstructions(PEDAGOGICAL_AUDIT_SCHEMA_SUMMARY)}`;

  const userBody = `Audit this source material for a Grade ${args.targetGrade} class.
${args.targetEalLevels?.length ? `EAL profile: ${args.targetEalLevels.join(", ")}.` : ""}
${args.curriculumStandards?.length ? `Curriculum focus: ${args.curriculumStandards.join(", ")}.` : "Curriculum focus: BC Grade " + args.targetGrade + " Science."}

Produce 3-5 prioritized recommendations, sorted high → low.`;

  return callForJson({
    systemPrompt,
    content: withDocumentRef(args.documentId, userBody),
    schema: PedagogicalAuditSchema,
    model: MODELS.generation,
  });
}
