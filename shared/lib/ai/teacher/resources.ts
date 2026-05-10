import { callForJson, MODELS } from "../backboard-call";
import { ResourcesSchema, RESOURCES_SUMMARY } from "../schemas";
import { TEACHER_ANALYST_ROLE, jsonOnlyInstructions } from "../system-prompts";

export interface SearchResourcesArgs {
  query: string;
  tags?: string[];
  gradeLevel?: number;
}

export async function searchResources(args: SearchResourcesArgs) {
  const systemPrompt = `${TEACHER_ANALYST_ROLE}

[TASK: SUGGEST CLASSROOM RESOURCES]
Suggest 3-6 real-world educational resources matching the query. Resources
should be the kind a working K-12 teacher would actually use:
- PhET interactive simulations
- Crash Course Kids / SciShow Kids videos
- National Geographic Kids articles
- Printable worksheets (Education.com, Twinkl)
- Hands-on activities

Use real resource names where you know them (PhET, NASA, etc.). Don't
fabricate URLs.

${jsonOnlyInstructions(RESOURCES_SUMMARY)}`;

  const userBody = `Query: ${args.query}
${args.gradeLevel ? `Grade: ${args.gradeLevel}` : ""}
${args.tags?.length ? `Tags: ${args.tags.join(", ")}` : ""}`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: ResourcesSchema,
    model: MODELS.fastChat,
  });
}
