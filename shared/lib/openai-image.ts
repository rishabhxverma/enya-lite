import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cached = new OpenAI({ apiKey });
  return cached;
}

export const STYLE_PREFIX = `Children's storybook illustration, soft watercolor and pastel palette, warm golden lighting, friendly cartoon style, no text, no letters, safe for children ages 6-12, clean composition, single focal scene.`;

export interface GeneratedImage {
  url: string | null;
  source: "dall-e" | "curated" | "emoji-only" | "unavailable";
  fallbackEmoji?: string;
  error?: string;
}

export async function generateStoryImage(args: {
  sceneDescription: string;
  theme?: string;
}): Promise<GeneratedImage> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      url: null,
      source: "unavailable",
      error: "OPENAI_API_KEY missing",
    };
  }
  const prompt = `${STYLE_PREFIX}\n\nScene: ${args.sceneDescription}`;
  try {
    const res = await client.images.generate({
      model: "dall-e-3",
      quality: "hd",
      style: "natural",
      size: "1024x1024",
      n: 1,
      prompt,
    });
    const url = res.data?.[0]?.url ?? null;
    return { url, source: url ? "dall-e" : "unavailable" };
  } catch (err) {
    return {
      url: null,
      source: "unavailable",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
