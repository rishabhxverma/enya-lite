import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    adjustedContent:
      typeof body.content === "string"
        ? `[${body.targetEalLevel ?? "Emerging"}-adjusted] ${body.content.slice(0, 240)}…`
        : "Content unchanged.",
    changesSummary: "Vocabulary simplified, sentence length shortened, cultural references made universal.",
    _stub: true,
  });
}
