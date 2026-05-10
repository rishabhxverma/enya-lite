import { NextResponse } from "next/server";
import { z } from "zod";
import { bulkUpdateEalLevels } from "@shared/lib/ai/teacher/classroom";
import type { EALLevel } from "@shared/types";

const BodySchema = z.object({
  updates: z.array(
    z.object({
      studentId: z.string(),
      newLevel: z.enum(["Emerging", "Developing", "Proficient", "Extending"]),
    })
  ),
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
    const result = await bulkUpdateEalLevels(
      parse.data.updates as { studentId: string; newLevel: EALLevel }[]
    );
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:bulk-update-eal] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      updated: 0,
      students: [],
      _stub: true,
    });
  }
}
