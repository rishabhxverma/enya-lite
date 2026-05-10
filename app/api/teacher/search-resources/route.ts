import { NextResponse } from "next/server";
import { z } from "zod";
import { searchResources } from "@shared/lib/ai/teacher/resources";

const BodySchema = z.object({
  query: z.string().default("classroom resources"),
  tags: z.array(z.string()).optional(),
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
    return NextResponse.json(await searchResources(parse.data));
  } catch (err) {
    console.warn(
      `[api:search-resources] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      resources: [
        {
          id: "res_1",
          name: "PhET interactive simulations",
          type: "simulation",
          preview:
            "Free educational simulations from University of Colorado.",
        },
      ],
      _stub: true,
    });
  }
}
