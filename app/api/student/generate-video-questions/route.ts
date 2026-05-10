import { NextResponse } from "next/server";
import { z } from "zod";
import { generateVideoLessonQuestions } from "@shared/lib/ai/student/video-questions";
import { STUB_VIDEO_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope, isSeedFallbackEnabled } from "@shared/lib/seed-loader";
import {
  aiSelectPausePoints,
  fetchTranscript,
  suggestPausePoints,
} from "@shared/lib/youtube-transcript";
import { getStudentProfile } from "@shared/lib/student-profiles";
import type { VideoLessonContent } from "@shared/types";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  lessonId: z.string().default("photosynthesis-1"),
  youtubeId: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  questionCount: z.number().int().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  const { studentId, lessonId } = parse.data;

  // Seed-fallback path: hand-tuned questions, transcript-aligned timestamps.
  if (isSeedFallbackEnabled()) {
    const seed = await readSeedEnvelope<VideoLessonContent>(
      `lessons-${studentId}/${lessonId}-video.json`
    );
    const stub =
      STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
      STUB_VIDEO_LESSONS.maya[lessonId];
    const overlayQuestions = seed?.overlayQuestions ?? stub?.overlayQuestions ?? [];
    const youtubeId = parse.data.youtubeId ?? seed?.youtubeId ?? stub?.youtubeId ?? "UPBMG5EYydo";

    let aligned = overlayQuestions;
    let pauseSource: "seed" | "heuristic" | "ai" = "seed";
    let aiNotes: { rationale: string; aiQuestionPrompt: string }[] = [];
    if (overlayQuestions.length > 0 && process.env.YOUTUBE_TRANSCRIPT_API_KEY) {
      try {
        const transcript = await fetchTranscript(youtubeId);
        if (transcript) {
          const student = await getStudentProfile(studentId);
          const aiPoints = await aiSelectPausePoints({
            transcript,
            count: overlayQuestions.length,
            student: student ?? undefined,
            learningObjectives: parse.data.learningObjectives ?? [],
          });
          if (aiPoints && aiPoints.length === overlayQuestions.length) {
            aligned = overlayQuestions.map((q, i) => ({
              ...q,
              pauseAtSeconds: aiPoints[i].atSeconds,
            }));
            aiNotes = aiPoints.map((p) => ({
              rationale: p.rationale,
              aiQuestionPrompt: p.questionPrompt,
            }));
            pauseSource = "ai";
          } else {
            const points = suggestPausePoints(transcript, {
              count: overlayQuestions.length,
              keywords: [
                "sunlight",
                "water",
                "air",
                "carbon dioxide",
                "chlorophyll",
                "photosynthesis",
                "leaves",
                "roots",
                "oxygen",
              ],
            });
            if (points.length === overlayQuestions.length) {
              aligned = overlayQuestions.map((q, i) => ({
                ...q,
                pauseAtSeconds: points[i].atSeconds,
              }));
              pauseSource = "heuristic";
            }
          }
        }
      } catch {
        /* fall through */
      }
    }
    return NextResponse.json({
      overlayQuestions: aligned,
      youtubeId,
      pauseSource,
      aiNotes,
    });
  }

  // Live generation path: brand-new questions grounded in the transcript.
  const youtubeId = parse.data.youtubeId ?? "UPBMG5EYydo";
  try {
    const stub =
      STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
      STUB_VIDEO_LESSONS.maya[lessonId];
    const objectives =
      parse.data.learningObjectives ??
      stub?.overlayQuestions.map((q) => q.question.learningObjectiveId) ??
      ["lo-1", "lo-2"];
    const result = await generateVideoLessonQuestions({
      studentId,
      lessonId,
      youtubeId,
      learningObjectives: objectives,
      questionCount: parse.data.questionCount,
    });
    return NextResponse.json({
      ...result,
      youtubeId,
      pauseSource: "ai-generated",
    });
  } catch (err) {
    console.warn(
      `[api:generate-video-questions] live failed, using stub: ${err instanceof Error ? err.message : String(err)}`
    );
    const stub =
      STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
      STUB_VIDEO_LESSONS.maya[lessonId];
    return NextResponse.json({
      overlayQuestions: stub?.overlayQuestions ?? [],
      youtubeId,
      pauseSource: "seed",
      _stub: true,
    });
  }
}
