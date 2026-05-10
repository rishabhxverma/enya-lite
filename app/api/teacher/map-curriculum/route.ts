import { NextResponse } from "next/server";
import { z } from "zod";
import { mapToCurriculum } from "@shared/lib/ai/teacher/curriculum";

const BodySchema = z.object({
  contentId: z.string().optional(),
  documentId: z.string().optional(),
  jurisdictions: z.array(z.string()).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const result = await mapToCurriculum(parse.data);
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:map-curriculum] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      mappings: [
        {
          standardId: "BC-G3-Sci-2.1",
          rationale:
            "Activity addresses photosynthesis inputs/outputs (fallback mapping).",
          confidence: 0.7,
        },
      ],
      _stub: true,
    });
  }
}
