import { NextResponse } from "next/server";
import {
  fetchTranscript,
  suggestPausePoints,
} from "@shared/lib/youtube-transcript";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    youtubeId?: string;
    keywords?: string[];
    pauseCount?: number;
  };
  const youtubeId = body.youtubeId ?? "UPBMG5EYydo";

  const transcript = await fetchTranscript(youtubeId);
  if (!transcript) {
    // Live API unreachable / no key / no captions on the video.
    // Return the legacy stub shape so callers don't break.
    return NextResponse.json({
      youtubeId,
      transcript:
        "Plants need sunlight to make food. They take in water and air. They make sugar and release oxygen.",
      _stub: true,
    });
  }

  const pausePoints = suggestPausePoints(transcript, {
    count: body.pauseCount ?? 3,
    keywords: body.keywords ?? [
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

  return NextResponse.json({
    youtubeId,
    title: transcript.title,
    language: transcript.language,
    durationSeconds: transcript.durationSeconds,
    cues: transcript.cues,
    pausePoints,
    transcript: transcript.cues.map((c) => c.text).join(" "),
  });
}
