import { NextResponse } from "next/server";
import { STUB_VIDEO_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope } from "@shared/lib/seed-loader";
import {
  aiSelectPausePoints,
  fetchTranscript,
  suggestPausePoints,
} from "@shared/lib/youtube-transcript";
import { getStudentProfile } from "@shared/lib/student-profiles";
import type { VideoLessonContent } from "@shared/types";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const lessonId = body.lessonId ?? "photosynthesis-1";

  // Source the question payload — seed first, stub last.
  const seed = await readSeedEnvelope<VideoLessonContent>(
    `lessons-${studentId}/${lessonId}-video.json`
  );
  const stub =
    STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
    STUB_VIDEO_LESSONS.maya[lessonId];
  const overlayQuestions =
    seed?.overlayQuestions ?? stub?.overlayQuestions ?? [];
  const youtubeId =
    body.youtubeId ?? seed?.youtubeId ?? stub?.youtubeId ?? "UPBMG5EYydo";

  // Three-tier alignment strategy:
  //   1. AI Agent picks pause-points from the transcript + student profile.
  //      Best signal — knows when narrator just introduced "chlorophyll",
  //      pauses right after, and writes a question targeting that vocab
  //      at the student's EAL level.
  //   2. Heuristic on the transcript (keyword + even spacing). Cheap and
  //      always available when the transcript fetches.
  //   3. Seed timestamps. Hand-tuned, work without any live API.
  //
  // Question *wording* always comes from the seed/stub (they're hand-tuned
  // for Maya's butterflies / Liam's space framing). The AI only moves
  // timestamps. If the AI returns its own question prompts, we expose them
  // as `aiAlternateQuestions` so the UI can preview them in dev mode.
  let aligned = overlayQuestions;
  let pauseSource: "seed" | "heuristic" | "ai" = "seed";
  let aiNotes: { rationale: string; aiQuestionPrompt: string }[] = [];

  if (overlayQuestions.length > 0 && process.env.YOUTUBE_TRANSCRIPT_API_KEY) {
    try {
      const transcript = await fetchTranscript(youtubeId);
      if (transcript) {
        // Tier 1: AI agent
        const student = await getStudentProfile(studentId);
        const aiPoints = await aiSelectPausePoints({
          transcript,
          count: overlayQuestions.length,
          student: student ?? undefined,
          learningObjectives: body.learningObjectives ?? [],
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
          // Tier 2: heuristic
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
      /* fall through to seed timestamps */
    }
  }

  return NextResponse.json({
    overlayQuestions: aligned,
    youtubeId,
    pauseSource,
    aiNotes,
    _stub: !seed,
  });
}
