import { NextResponse } from "next/server";
import { z } from "zod";
import { simplifyText } from "@shared/lib/ai/teacher/simplify";

const BodySchema = z.object({
  text: z.string(),
  targetReadingLevel: z.string().default("grade3"),
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
  try {
    const result = await simplifyText(parse.data);
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:simplify-text] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      simplified: parse.data.text,
      originalGrade: 7,
      newGrade: 3,
      _stub: true,
    });
  }
}
