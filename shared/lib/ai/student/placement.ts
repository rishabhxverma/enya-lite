import { callForJson, MODELS } from "../backboard-call";
import { PlacementQuizSchema, PLACEMENT_QUIZ_SUMMARY } from "../schemas";
import {
  STUDENT_GENERATOR_ROLE,
  jsonOnlyInstructions,
} from "../system-prompts";

export interface PlacementQuizArgs {
  studentName: string;
  grade: number;
  action: "next" | "submit";
  currentAnswers?: Record<string, unknown>;
}

export async function runPlacementQuiz(args: PlacementQuizArgs) {
  const answerCount = args.currentAnswers ? Object.keys(args.currentAnswers).length : 0;

  const systemPrompt = `${STUDENT_GENERATOR_ROLE}

[TASK: PLACEMENT QUIZ]
You are running a 5-7 question adaptive placement assessment for an EAL
learner. Goals:
1. Gauge reading level (cloze + comprehension).
2. Discover interests (multi-select).
3. Brief self-assessment.
4. Get one short writing sample.

Adapt: if the student struggled on prior questions, simplify subsequent ones.
If they ace, escalate.

If action is 'next' and we have <6 prior answers, return ONE next question
with complete=false.
If action is 'submit' OR we have ≥6 answers, return complete=true with the
assessed EAL level, suggested interests (3-5 tags), and 2-3 learning goals.

${jsonOnlyInstructions(PLACEMENT_QUIZ_SUMMARY)}`;

  const userBody = `Student: ${args.studentName}, Grade ${args.grade}.
Action: ${args.action}
Answers so far (${answerCount}):
${
  args.currentAnswers
    ? Object.entries(args.currentAnswers)
        .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
        .join("\n")
    : "(none)"
}`;

  return callForJson({
    systemPrompt,
    content: userBody,
    schema: PlacementQuizSchema,
    model: MODELS.fastChat,
  });
}
