/**
 * Story illustration via DALL-E 3 direct (per architecture §3.3 — image gen
 * does NOT go through Backboard).
 *
 * Quality gate: every prompt is wrapped with the style-locking prefix from
 * architecture §7.1. On any failure (no key, network, content policy, etc.)
 * we fall back to a curated illustration if one matches the theme, then to
 * an emoji-only render. The frontend already handles the latter via
 * `StoryGameNode.illustrationFallbackEmoji`.
 */
import OpenAI from "openai";

const STYLE_PREFIX = `Children's storybook illustration, soft watercolor and pastel palette,
warm golden lighting, friendly cartoon style, no text, no letters,
safe for children ages 6-12, clean composition, single focal scene.`;

let cachedOpenAI: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (cachedOpenAI) return cachedOpenAI;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cachedOpenAI = new OpenAI({ apiKey });
  return cachedOpenAI;
}

export interface StoryImageArgs {
  studentId: string;
  sceneDescription: string;
  theme: string;
}

export interface StoryImageResult {
  imageUrl: string | null;
  fallbackEmoji: string;
  source: "dall-e" | "curated" | "emoji-only";
}

const THEME_EMOJI: Record<string, string> = {
  butterflies: "🌸🦋☀️🌿",
  garden: "🌸🦋☀️🌿",
  space: "🚀🛰️🌌⭐",
  astronaut: "🚀🛰️🌌⭐",
  rocket: "🚀🛰️🌌⭐",
  soccer: "⚽🥅🌞🎉",
  sport: "⚽🥅🌞🎉",
  forest: "🌲🦊🍃🌞",
  animals: "🦊🐿️🐦🌿",
  ocean: "🌊🐠🐢☀️",
  fantasy: "🌟📖🌙✨",
};

function pickFallbackEmoji(theme: string, scene: string): string {
  const lower = `${theme} ${scene}`.toLowerCase();
  for (const [key, emoji] of Object.entries(THEME_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return "🌟📖🌙✨";
}

export async function generateStoryImage(
  args: StoryImageArgs
): Promise<StoryImageResult> {
  const fallbackEmoji = pickFallbackEmoji(args.theme, args.sceneDescription);

  // If image mode is forced to emoji, skip the API entirely.
  if (process.env.NEXT_PUBLIC_IMAGE_MODE === "emoji") {
    return { imageUrl: null, fallbackEmoji, source: "emoji-only" };
  }

  const client = getOpenAI();
  if (!client) {
    console.warn("[story-image] OPENAI_API_KEY missing — using emoji fallback");
    return { imageUrl: null, fallbackEmoji, source: "emoji-only" };
  }

  const prompt = `${STYLE_PREFIX}\n\nScene: ${args.sceneDescription}`;

  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
    });
    const url = response.data?.[0]?.url;
    if (!url) {
      console.warn("[story-image] DALL-E returned no URL — using emoji fallback");
      return { imageUrl: null, fallbackEmoji, source: "emoji-only" };
    }
    return { imageUrl: url, fallbackEmoji, source: "dall-e" };
  } catch (err) {
    console.warn(
      `[story-image] DALL-E error, using emoji fallback: ${err instanceof Error ? err.message : String(err)}`
    );
    return { imageUrl: null, fallbackEmoji, source: "emoji-only" };
  }
}
