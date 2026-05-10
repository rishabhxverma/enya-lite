import type { VideoOverlayQuestion } from "@shared/types";
import { callForJson, MODELS } from "../backboard-call";
import {
  VideoOverlayQuestionsSchema,
  VIDEO_OVERLAY_SCHEMA_SUMMARY,
} from "../schemas";
import {
  STUDENT_GENERATOR_ROLE,
  EAL_STYLE_CARDS,
  studentProfileBlock,
  jsonOnlyInstructions,
} from "../system-prompts";
import { getStudentProfile } from "./profile";
import { fetchTranscript, suggestPausePoints } from "@shared/lib/youtube-transcript";

export interface GenerateVideoQuestionsArgs {
  studentId: string;
  lessonId: string;
  youtubeId: string;
  transcript?: string;
  learningObjectives: string[];
  questionCount?: number;
}

export async function generateVideoLessonQuestions(
  args: GenerateVideoQuestionsArgs
): Promise<{ overlayQuestions: VideoOverlayQuestion[] }> {
  const profile = await getStudentProfile(args.studentId);
  if (!profile)
    throw new Error(
      `generateVideoLessonQuestions: unknown studentId '${args.studentId}'`
    );

  // Pull transcript so the model can ground questions in actual video content.
  let transcriptText = args.transcript ?? "";
  let durationHint = "unknown duration";
  if (!transcriptText) {
    const t = await fetchTranscript(args.youtubeId).catch(() => null);
    if (t) {
      transcriptText = t.cues
        .map((c) => `[${Math.round(c.start)}s] ${c.text}`)
        .join("\n");
      durationHint = `~${Math.round(t.durationSeconds)}s total`;
    }
  }

  const count = args.questionCount ?? 4;

  const systemPrompt = `${STUDENT_GENERATOR_ROLE}

[TASK: VIDEO OVERLAY QUESTIONS]
Generate ${count} overlay quiz questions to pause the video at natural
moments. Each question targets exactly ONE learning objective. Distribute
pause timestamps across the video duration — never bunched at the end.

For Emerging students, prefer multiple-choice with concrete options.
For higher levels, mix in fill-blank and short-answer.

${studentProfileBlock(profile)}

${EAL_STYLE_CARDS[profile.ealLevel]}

${jsonOnlyInstructions(VIDEO_OVERLAY_SCHEMA_SUMMARY)}`;

  const userBody = `Video: ${args.youtubeId} (${durationHint})

Learning objectives:
${args.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join("\n")}

[TRANSCRIPT]
${transcriptText || "(transcript unavailable — pick pauseAtSeconds based on typical kid-video pacing: 30s, 90s, 150s, 210s)"}

Place each question at a moment where the relevant concept has just been
discussed in the transcript.`;

  const result = await callForJson({
    systemPrompt,
    content: userBody,
    schema: VideoOverlayQuestionsSchema,
    model: MODELS.generation,
  });

  // Snap pauseAtSeconds to actual transcript cue boundaries when possible
  // — borrows the existing helper so the pause never lands mid-sentence.
  const t = await fetchTranscript(args.youtubeId).catch(() => null);
  if (t && result.overlayQuestions.length > 0) {
    const points = suggestPausePoints(t, {
      count: result.overlayQuestions.length,
      keywords: args.learningObjectives.slice(0, 3),
    });
    if (points.length === result.overlayQuestions.length) {
      return {
        overlayQuestions: result.overlayQuestions.map((q, i) => ({
          ...q,
          pauseAtSeconds: points[i].atSeconds,
        })) as VideoOverlayQuestion[],
      };
    }
  }
  return { overlayQuestions: result.overlayQuestions as VideoOverlayQuestion[] };
}
