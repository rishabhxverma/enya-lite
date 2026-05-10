import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStoryImage } from "@shared/lib/ai/student/story-image";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  sceneDescription: z.string().default("A friendly scene"),
  theme: z.string().default("fantasy"),
  fallbackEmoji: z.string().optional(),
  curatedPath: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  const mode = process.env.NEXT_PUBLIC_IMAGE_MODE ?? "auto";
  const fallbackEmoji = parse.data.fallbackEmoji ?? "🌟📖🌙✨";

  if (mode === "emoji") {
    return NextResponse.json({
      imageUrl: null,
      fallbackEmoji,
      source: "emoji-only",
    });
  }
  if (mode === "curated") {
    return NextResponse.json({
      imageUrl: parse.data.curatedPath ?? null,
      fallbackEmoji,
      source: parse.data.curatedPath ? "curated" : "emoji-only",
    });
  }

  try {
    const result = await generateStoryImage({
      studentId: parse.data.studentId,
      sceneDescription: parse.data.sceneDescription,
      theme: parse.data.theme,
    });
    return NextResponse.json({
      imageUrl: result.imageUrl,
      fallbackEmoji: result.fallbackEmoji ?? fallbackEmoji,
      source: result.source,
    });
  } catch (err) {
    console.warn(
      `[api:generate-story-image] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      imageUrl: null,
      fallbackEmoji,
      source: "emoji-only",
      _stub: true,
    });
  }
}
