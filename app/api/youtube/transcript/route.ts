import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Stubbed transcript — real implementation would use youtube-transcript npm
  return NextResponse.json({
    youtubeId: body.youtubeId ?? "UPBMG5EYydo",
    transcript:
      "Plants need sunlight to make food. They take in water and air. They make sugar and release oxygen.",
    _stub: true,
  });
}
