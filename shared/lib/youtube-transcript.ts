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

// ---------------------------------------------------------------------------
// AI-driven pause-point selection (Backboard / Claude)
//
// The heuristic above is fast and offline-capable, but it can't tell that
// 1:55 is a cliffhanger or that the narrator just introduced a new
// vocabulary word for the very first time. An LLM with the full transcript
// + the student's profile can.
//
// We ask the LLM for `count` pauses, each with:
//   - atSeconds (snapped to a cue boundary)
//   - rationale (why this moment, what the student just heard)
//   - questionPrompt (a question grounded in what the video just said)
//
// JSON response mode is enabled so we can parse without regex. On any
// failure (timeout, malformed JSON, fewer points than asked) the caller
// falls back to `suggestPausePoints` — fail-open, never break the demo.
// ---------------------------------------------------------------------------

import type { StudentProfile } from "@shared/types";
import { getBackboardClient } from "@shared/lib/backboard";

export interface AiPausePoint {
  atSeconds: number;
  rationale: string;
  questionPrompt: string;
}

export async function aiSelectPausePoints(args: {
  transcript: TranscriptResult;
  count: number;
  student?: StudentProfile;
  learningObjectives?: string[];
}): Promise<AiPausePoint[] | null> {
  const apiKey = process.env.BACKBOARD_API_KEY;
  const assistantId = process.env.BACKBOARD_ASSISTANT_ID;
  if (!apiKey || !assistantId) return null;

  const { transcript, count, student, learningObjectives = [] } = args;
  if (transcript.cues.length === 0) return null;

  // Compact cue representation so we don't blow up the token budget. Keep
  // the cue index as a stable handle so the model can return "use cue 42".
  const compactCues = transcript.cues
    .map((c, i) => `[${i}] ${c.start.toFixed(1)}s: ${c.text}`)
    .join("\n");

  const studentLine = student
    ? `Name: ${student.name}, Grade ${student.grade}, EAL ${student.ealLevel}, interests: ${student.interests.join(", ")}.`
    : "(no student profile — use grade 4 / Developing defaults)";
  const objectivesLine =
    learningObjectives.length > 0
      ? learningObjectives.map((o) => `- ${o}`).join("\n")
      : "- Identify what plants need to grow\n- Use the word photosynthesis";

  const systemAddendum = `OUTPUT FORMAT — CRITICAL
Reply with ONE JSON object and NOTHING else. No prose. No "Based on…" preamble. No markdown fences. Your entire reply must start with the character '{' and end with '}'. If you include any other text, the parser fails and the user is shown a broken UI.

TASK
Pick ${count} pause-points for an inline overlay quiz that fires while a student watches a YouTube video. Each pause should:
1. Land at the END of a cue (audio finishes a thought, not mid-word).
2. Sit just after a teaching moment — a key concept, vocabulary introduction, or a visual the narrator pointed to.
3. Be tied to ONE of the learning objectives below.
4. Match the student's EAL level — simpler vocab for Emerging, scientific terms for Proficient.

REQUIRED JSON SHAPE
{"pauses":[{"cueIndex":<int>,"rationale":"<one sentence, plain text>","questionPrompt":"<a question the student can answer based on what they just heard>"}]}

The cueIndex must be a valid index from the list. Return exactly ${count} pauses, ordered by ascending time.

EXAMPLE (do not reuse, just follow the shape):
{"pauses":[{"cueIndex":12,"rationale":"Narrator just defined photosynthesis","questionPrompt":"What word did the video just teach for how plants make food?"},{"cueIndex":34,"rationale":"All four ingredients (sun, water, air, soil) just listed","questionPrompt":"Name two of the four things plants need."}]}`;

  const userMessage = `STUDENT
${studentLine}

LEARNING OBJECTIVES
${objectivesLine}

VIDEO TITLE: ${transcript.title}
VIDEO DURATION: ${transcript.durationSeconds.toFixed(0)}s

TRANSCRIPT CUES (index, start time, text):
${compactCues}

Pick ${count} pause-points.`;

  // Tool-call pattern for structured output: define a `submit_pause_points`
  // tool whose arguments ARE the JSON we want. The model is much more likely
  // to call this tool (with valid JSON args) than to emit JSON as message
  // content — both Claude and GPT-4o respect tool schemas reliably even
  // when the assistant persona biases toward conversational replies.
  const submitTool = {
    type: "function" as const,
    function: {
      name: "submit_pause_points",
      description:
        "Submit the chosen pause-points to the player. Call this exactly once with all pauses.",
      parameters: {
        type: "object",
        properties: {
          pauses: {
            type: "array",
            minItems: count,
            maxItems: count,
            items: {
              type: "object",
              required: ["cueIndex", "rationale", "questionPrompt"],
              properties: {
                cueIndex: {
                  type: "integer",
                  description: "Index from the transcript cue list",
                },
                rationale: {
                  type: "string",
                  description:
                    "One sentence explaining what the student just heard",
                },
                questionPrompt: {
                  type: "string",
                  description:
                    "A question the student can answer based on what they just heard",
                },
              },
            },
          },
        },
        required: ["pauses"],
      },
    },
  };

  try {
    const client = getBackboardClient();
    const thread = await client.createThread(assistantId);
    const res = await client.sendMessage({
      threadId: thread.id,
      assistantId,
      content: userMessage,
      systemPrompt: systemAddendum,
      memory: "Off",
      llmProvider: "anthropic",
      modelName: "claude-sonnet-4-5-20250929",
      tools: [submitTool],
    });

    // Prefer the tool call. Fall back to parsing the content as JSON if
    // the model decided to answer in prose despite having the tool.
    const call = res.toolCalls?.find(
      (c) => c.name === "submit_pause_points"
    );
    let pauses: { cueIndex?: number; rationale?: string; questionPrompt?: string }[] = [];
    if (call) {
      // Models sometimes rename schema fields — Claude has been observed
      // to emit `{ index, reason, ... }` instead of `{ cueIndex, rationale,
      // questionPrompt }` even with explicit descriptions. Be tolerant:
      // accept any of the known synonyms.
      const args = call.arguments as { pauses?: Record<string, unknown>[] };
      const raw = args.pauses ?? [];
      pauses = raw.map((p) => ({
        cueIndex:
          (p.cueIndex as number) ??
          (p.cue_index as number) ??
          (p.index as number) ??
          (p.cueIdx as number) ??
          -1,
        rationale:
          (p.rationale as string) ??
          (p.reason as string) ??
          (p.why as string) ??
          "",
        questionPrompt:
          (p.questionPrompt as string) ??
          (p.question_prompt as string) ??
          (p.question as string) ??
          (p.prompt as string) ??
          "",
      }));
    } else {
      const content = res.content?.trim();
      const jsonText = content ? extractJsonObject(content) : null;
      if (jsonText) {
        try {
          const parsed = JSON.parse(jsonText) as {
            pauses?: { cueIndex?: number; rationale?: string; questionPrompt?: string }[];
          };
          pauses = parsed?.pauses ?? [];
        } catch {
          /* fall through */
        }
      }
    }

    if (pauses.length === 0) {
      console.error(
        "[youtube-transcript] aiSelectPausePoints: no pauses returned",
        { hadToolCall: !!call, content: res.content?.slice(0, 200) }
      );
      return null;
    }

    const out: AiPausePoint[] = [];
    for (const p of pauses) {
      const idx = typeof p.cueIndex === "number" ? p.cueIndex : -1;
      if (idx < 0 || idx >= transcript.cues.length) continue;
      const cue = transcript.cues[idx];
      out.push({
        atSeconds: Math.round((cue.start + cue.dur) * 10) / 10,
        rationale: p.rationale ?? "",
        questionPrompt: p.questionPrompt ?? "",
      });
    }
    return out.length > 0 ? out.sort((a, b) => a.atSeconds - b.atSeconds) : null;
  } catch (err) {
    console.error("[youtube-transcript] aiSelectPausePoints failed", err);
    return null;
  }
}

/**
 * Pull the first balanced JSON object from arbitrary text. Handles cases
 * where the model wraps the JSON in markdown fences ("```json"), prefixes
 * it with prose ("Based on the transcript, here is…"), or appends a
 * trailing comment. Returns the substring or null if no balanced block.
 *
 * We track strings explicitly so a `{` inside a string literal doesn't
 * mess up the brace count.
 */
function extractJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
