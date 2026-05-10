import type { StoryGameNode } from "@shared/types";
import { callForJson, MODELS } from "../backboard-call";
import { StoryNodeSchema, STORY_NODE_SCHEMA_SUMMARY } from "../schemas";
import {
  STORY_NARRATOR_ROLE,
  EAL_STYLE_CARDS,
  studentProfileBlock,
  jsonOnlyInstructions,
} from "../system-prompts";
import { getStudentProfile } from "./profile";

export interface GenerateStoryNodeArgs {
  studentId: string;
  lessonId: string;
  previousNodes?: Array<{ id: string; chosen?: string }>;
  learningObjectives?: string[];
  isFirstNode?: boolean;
  isFinalNode?: boolean;
}

export async function generateStoryNode(
  args: GenerateStoryNodeArgs
): Promise<StoryGameNode> {
  const profile = await getStudentProfile(args.studentId);
  if (!profile)
    throw new Error(
      `generateStoryNode: unknown studentId '${args.studentId}'`
    );

  const themeHook = profile.interests[0] ?? "exploration";
  const settingHint = (() => {
    const lower = themeHook.toLowerCase();
    if (/butterfly|garden/.test(lower)) return "Maya's backyard butterfly garden";
    if (/space|astronaut|rocket/.test(lower))
      return "the hydroponics bay of a space station";
    if (/soccer|sport/.test(lower)) return "a sunny soccer pitch";
    if (/animal|forest/.test(lower)) return "a sunlit forest clearing";
    if (/ocean|sea/.test(lower)) return "a coral reef";
    return "a familiar place from the student's world";
  })();

  const systemPrompt = `${STORY_NARRATOR_ROLE}

[TASK: STORY NODE]
${args.isFirstNode ? "Open the story with a vivid scene that hooks the student." : ""}
${args.isFinalNode ? "Wrap up the adventure with a satisfying conclusion that reinforces the lesson concept." : ""}

Setting hint: ${settingHint}.
The story IS a quiz disguised as narrative. Each choice maps to a learning
objective. Wrong choices trigger a kind, gentle teaching moment via
feedbackOnSelect — never punishing, never shaming.

${studentProfileBlock(profile)}

${EAL_STYLE_CARDS[profile.ealLevel]}

${jsonOnlyInstructions(STORY_NODE_SCHEMA_SUMMARY)}`;

  const previousContext = args.previousNodes?.length
    ? `\n[PREVIOUS NODES]\n${args.previousNodes.map((n, i) => `${i + 1}. ${n.id}${n.chosen ? ` → chose: "${n.chosen}"` : ""}`).join("\n")}`
    : "";

  const userBody = `Generate the next story node for lesson '${args.lessonId}'.
${args.isFirstNode ? "This is the FIRST node." : ""}
${args.isFinalNode ? "This is the FINAL node — set isTerminal: true." : ""}

Learning objectives to cover (across all choices):
${(args.learningObjectives ?? []).map((o, i) => `  ${i + 1}. ${o}`).join("\n") || "  (use the lesson's main concept)"}

${previousContext}

Node id format: ${args.studentId}-${args.lessonId}-n<number>.`;

  const node = await callForJson({
    systemPrompt,
    content: userBody,
    schema: StoryNodeSchema,
    model: MODELS.generation,
  });
  return node as StoryGameNode;
}
