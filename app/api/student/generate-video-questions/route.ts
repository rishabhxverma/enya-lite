import { NextResponse } from "next/server";
import { STUB_VIDEO_LESSONS } from "@shared/lib/stub-content";
import { readSeedEnvelope } from "@shared/lib/seed-loader";
import {
  fetchTranscript,
  suggestPausePoints,
} from "@shared/lib/youtube-transcript";
import type { VideoLessonContent } from "@shared/types";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  // Realign hand-tuned questions to live transcript pause-points so the
  // pause never lands mid-sentence. Question wording / answer keys are
  // preserved — only `pauseAtSeconds` moves. If the transcript fetch
  // fails for any reason (no key, no captions, network), we silently
  // keep the seed timestamps. That's why this is wrapped in try/catch.
  let aligned = overlayQuestions;
  if (overlayQuestions.length > 0 && process.env.YOUTUBE_TRANSCRIPT_API_KEY) {
    try {
      const transcript = await fetchTranscript(youtubeId);
      if (transcript) {
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
        }
      }
    } catch {
      /* fall through to seed timestamps */
    }
  }

  return NextResponse.json({
    overlayQuestions: aligned,
    youtubeId,
    _stub: !seed,
  });
}
