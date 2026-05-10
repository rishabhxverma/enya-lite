import { NextResponse } from "next/server";
import { isHealthy as doclingHealthy } from "@shared/lib/docling-client";
import { isHealthy as elevenLabsHealthy } from "@shared/lib/elevenlabs";

export async function GET() {
  const [docling, elevenlabs] = await Promise.all([
    doclingHealthy(),
    elevenLabsHealthy(),
  ]);
  const backboard = process.env.BACKBOARD_API_KEY ? "ok" : "down";
  const openai = process.env.OPENAI_API_KEY ? "ok" : "down";
  return NextResponse.json({
    backboard,
    docling: docling ? "ok" : "down",
    elevenlabs: elevenlabs ? "ok" : "down",
    openai,
  });
}
