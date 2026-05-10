/**
 * Submit-quiz-answer evaluation. Uses Claude for semantic grading on
 * fill-blank / short-answer (allows synonyms, accepts misspellings if intent
 * is clear). Multiple-choice / true-false get exact-match grading without an
 * LLM round-trip.
 */
import { callForJson, MODELS, rememberFact } from "../backboard-call";
import {
  QuizAnswerEvaluationSchema,
  QUIZ_ANSWER_EVAL_SUMMARY,
} from "../schemas";
import {
  STUDENT_GENERATOR_ROLE,
  EAL_STYLE_CARDS,
  studentProfileBlock,
  jsonOnlyInstructions,
} from "../system-prompts";
import { getStudentProfile } from "./profile";

export interface SubmitQuizAnswerArgs {
  studentId: string;
  lessonId: string;
  questionId: string;
  answer: string | number;
  // Optional context about the question — passed by routes that have it on
  // hand (e.g. text lesson hook stores the active question). Without it,
  // we fall back to LLM grading without ground truth (it'll be lenient).
  questionPrompt?: string;
  questionType?: "multiple-choice" | "true-false" | "fill-blank";
  correctAnswer?: string | number;
  correctAnswerIndex?: number;
  options?: string[];
  explanation?: string;
}

function recordProgress(
  studentId: string,
  lessonId: string,
  questionId: string,
  correct: boolean,
  pointsEarned: number
): Promise<{ memoryId: string }> {
  return rememberFact(
    `student:${studentId} progress activity:${lessonId} question:${questionId} correct:${correct} points:${pointsEarned} at:${new Date().toISOString()}`,
    {
      kind: "quiz-answer",
      studentId,
      lessonId,
      questionId,
      correct,
      pointsEarned,
    }
  ).catch((err) => {
    console.warn(`[quiz-grader] memory write failed: ${err}`);
    return { memoryId: "" };
  });
}

export async function submitQuizAnswer(args: SubmitQuizAnswerArgs) {
  // Exact-match path for MC/TF when we have the ground truth.
  if (
    args.questionType === "multiple-choice" &&
    typeof args.correctAnswerIndex === "number"
  ) {
    const submittedIdx =
      typeof args.answer === "number"
        ? args.answer
        : args.options
          ? args.options.findIndex(
              (o) => o.toLowerCase() === String(args.answer).toLowerCase()
            )
          : -1;
    const correct = submittedIdx === args.correctAnswerIndex;
    const pointsEarned = correct ? 10 : 0;
    await recordProgress(
      args.studentId,
      args.lessonId,
      args.questionId,
      correct,
      pointsEarned
    );
    return {
      correct,
      feedback: correct
        ? args.explanation ?? "Correct!"
        : args.explanation ?? "Not quite — give it another think.",
      pointsEarned,
    };
  }
  if (
    args.questionType === "true-false" &&
    args.correctAnswer !== undefined
  ) {
    const correct =
      String(args.answer).toLowerCase() ===
      String(args.correctAnswer).toLowerCase();
    const pointsEarned = correct ? 10 : 0;
    await recordProgress(
      args.studentId,
      args.lessonId,
      args.questionId,
      correct,
      pointsEarned
    );
    return {
      correct,
      feedback: correct
        ? args.explanation ?? "Correct!"
        : args.explanation ?? "Not quite — try the other option.",
      pointsEarned,
    };
  }

  // LLM-graded path for fill-blank / short-answer.
  const profile = await getStudentProfile(args.studentId);
  const systemPrompt = `${STUDENT_GENERATOR_ROLE}

[TASK: GRADE QUIZ ANSWER]
Evaluate the student's answer. Be lenient on spelling and synonyms — if the
intent is clearly correct, mark it correct. Be strict on factual errors.
Provide warm, EAL-appropriate feedback that teaches.

${profile ? studentProfileBlock(profile) : ""}

${profile ? EAL_STYLE_CARDS[profile.ealLevel] : ""}

${jsonOnlyInstructions(QUIZ_ANSWER_EVAL_SUMMARY)}`;

  const userBody = `Question: ${args.questionPrompt ?? "(prompt unavailable)"}
Question type: ${args.questionType ?? "fill-blank"}
${args.correctAnswer !== undefined ? `Correct answer: ${args.correctAnswer}` : ""}

Student's answer: ${args.answer}

Award 10 points if correct, 0 if incorrect.`;

  const result = await callForJson({
    systemPrompt,
    content: userBody,
    schema: QuizAnswerEvaluationSchema,
    model: MODELS.fastChat,
  });

  await recordProgress(
    args.studentId,
    args.lessonId,
    args.questionId,
    result.correct,
    result.pointsEarned
  );
  return result;
}
