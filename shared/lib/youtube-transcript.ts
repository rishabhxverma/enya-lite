/**
 * youtube-transcript.io client.
 *
 * Fetches timestamped captions for a YouTube video and exposes helpers
 * that pick natural pause-points where the video activity can drop
 * inline overlay questions.
 *
 * Why timestamps matter for the demo: a question at 0:30 that lands
 * mid-sentence ("…and then they make their —") feels jarring. With cues
 * we can snap to the nearest cue boundary so the pause feels intentional.
 */

import axios from "axios";

export interface TranscriptCue {
  /** Start time in seconds. */
  start: number;
  /** Duration in seconds. */
  dur: number;
  /** Text spoken during this cue. */
  text: string;
}

export interface TranscriptResult {
  videoId: string;
  title: string;
  language: string;
  cues: TranscriptCue[];
  /** Best-effort total duration in seconds (last cue.start + cue.dur). */
  durationSeconds: number;
}

const API_URL = "https://www.youtube-transcript.io/api/transcripts";

interface RawCue {
  text: string;
  start: string;
  dur: string;
}
interface RawTrack {
  language: string;
  transcript: RawCue[];
}
interface RawVideo {
  id: string;
  title?: string;
  tracks?: RawTrack[];
  text?: string;
}

export async function fetchTranscript(
  videoId: string
): Promise<TranscriptResult | null> {
  const apiKey = process.env.YOUTUBE_TRANSCRIPT_API_KEY;
  if (!apiKey) return null;

  try {
    const { data } = await axios.post<RawVideo[]>(
      API_URL,
      { ids: [videoId] },
      {
        headers: {
          // youtube-transcript.io uses Authorization: Basic <token> (NOT
          // base64-encoded — the raw token goes after the word "Basic").
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 12_000,
      }
    );

    const v = Array.isArray(data) ? data[0] : null;
    if (!v) return null;

    // Prefer English; fall back to the first available track. Tracks may
    // be missing if the video has no captions — return null so the caller
    // can fall back to a heuristic / pre-baked questions.
    const tracks = v.tracks ?? [];
    const track =
      tracks.find((t) => t.language?.toLowerCase().startsWith("en")) ??
      tracks[0];
    if (!track || !Array.isArray(track.transcript)) return null;

    const cues: TranscriptCue[] = track.transcript
      .map((c) => ({
        text: c.text?.trim() ?? "",
        start: parseFloat(c.start),
        dur: parseFloat(c.dur),
      }))
      .filter((c) => c.text && Number.isFinite(c.start));

    const last = cues[cues.length - 1];
    const durationSeconds = last ? last.start + (last.dur ?? 0) : 0;

    return {
      videoId,
      title: v.title ?? "",
      language: track.language ?? "en",
      cues,
      durationSeconds,
    };
  } catch (err) {
    console.error("[youtube-transcript] fetch failed", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pause-point selection
// ---------------------------------------------------------------------------

export interface PausePoint {
  /** Seconds into the video where the pause should land. */
  atSeconds: number;
  /** Cue text that just finished — useful for question authoring. */
  precedingText: string;
  /** Concept hits — words from `keywords` that appear in `precedingText`. */
  matchedKeywords: string[];
}

/**
 * Pick N pause-points by walking the cue list and snapping each chunk
 * boundary to a cue end. We bias toward cues that mention concept
 * keywords (e.g. ["sunlight", "water", "chlorophyll"]) so the inline
 * question can ask about something the student just heard.
 *
 * Returned timestamps are the *end* of the cue — the player has already
 * played that audio, so pausing there feels like a natural beat.
 */
export function suggestPausePoints(
  transcript: TranscriptResult,
  options: {
    /** How many pause-points to return. Default 3. */
    count?: number;
    /** Concept words to bias toward. Lowercased internally. */
    keywords?: string[];
    /** Skip the first N seconds (intros). Default 8. */
    skipIntroSeconds?: number;
  } = {}
): PausePoint[] {
  const count = options.count ?? 3;
  const skip = options.skipIntroSeconds ?? 8;
  const keywords = (options.keywords ?? []).map((k) => k.toLowerCase());

  const total = transcript.durationSeconds;
  if (!total || transcript.cues.length === 0) return [];

  // Target timestamps: evenly spaced across the body of the video,
  // skipping the intro and reserving a tail margin so the last question
  // doesn't fire right before the credits.
  const tail = Math.max(8, Math.min(20, total * 0.1));
  const usable = total - skip - tail;
  if (usable <= 0) return [];

  const targets: number[] = [];
  for (let i = 1; i <= count; i++) {
    targets.push(skip + (usable * i) / (count + 1));
  }

  const picks: PausePoint[] = [];
  for (const target of targets) {
    // Window of cues within +/- 6 seconds of target. Score each by:
    //   - keyword hits (heavy bonus)
    //   - preference for ending at a cue boundary near a sentence end
    const window = transcript.cues.filter((c) => {
      const end = c.start + c.dur;
      return end >= target - 6 && end <= target + 6;
    });
    const candidates = window.length > 0 ? window : transcript.cues;

    let best: { cue: TranscriptCue; score: number; matched: string[] } | null = null;
    for (const cue of candidates) {
      const t = cue.text.toLowerCase();
      const matched = keywords.filter((k) => t.includes(k));
      const distance = Math.abs(cue.start + cue.dur - target);
      const score = matched.length * 10 - distance;
      if (!best || score > best.score) best = { cue, score, matched };
    }

    if (best) {
      const at = Math.round((best.cue.start + best.cue.dur) * 10) / 10;
      // Don't double up on the same timestamp.
      if (!picks.find((p) => Math.abs(p.atSeconds - at) < 4)) {
        picks.push({
          atSeconds: at,
          precedingText: best.cue.text,
          matchedKeywords: best.matched,
        });
      }
    }
  }

  return picks.sort((a, b) => a.atSeconds - b.atSeconds);
}
