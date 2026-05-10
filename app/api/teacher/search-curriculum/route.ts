import { NextResponse } from "next/server";
import { z } from "zod";
import { searchCurriculumStandards } from "@shared/lib/ai/teacher/curriculum";

const BodySchema = z.object({
  query: z.string(),
  jurisdiction: z.enum(["BC", "Alberta"]).optional(),
  gradeLevel: z.number().int().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 30;

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
    const result = await searchCurriculumStandards(parse.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[api:search-curriculum] failed: ${message}`);
    return NextResponse.json({
      standards: [
        {
          id: "BC-G3-Sci-2.1",
          description:
            "Living things have features and behaviours that help them survive in their environment.",
          subject: "Science",
        },
      ],
      query: parse.data.query,
      _stub: true,
      _error: message,
    });
  }
}
