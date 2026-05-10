import { NextResponse } from "next/server";
import { generateStoryImage } from "@shared/lib/openai-image";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode = process.env.NEXT_PUBLIC_IMAGE_MODE ?? "auto";
  const fallbackEmoji = body.fallbackEmoji ?? "🌸🦋☀️🌿";

  if (mode === "emoji") {
    return NextResponse.json({
      imageUrl: null,
      fallbackEmoji,
      source: "emoji-only",
    });
  }

  // Curated mode would look up from manifest; for now we degrade gracefully
  if (mode === "curated") {
    return NextResponse.json({
      imageUrl: body.curatedPath ?? null,
      fallbackEmoji,
      source: body.curatedPath ? "curated" : "emoji-only",
    });
  }

  // auto: try DALL-E
  const result = await generateStoryImage({
    sceneDescription: body.sceneDescription ?? "A garden with butterflies and flowers",
    theme: body.theme ?? "butterflies",
  });
  if (result.url) {
    return NextResponse.json({
      imageUrl: result.url,
      fallbackEmoji,
      source: result.source,
    });
  }
  return NextResponse.json({
    imageUrl: null,
    fallbackEmoji,
    source: "emoji-only",
    error: result.error,
  });
}
