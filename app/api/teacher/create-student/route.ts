import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudentProfile } from "@shared/lib/ai/student/profile";
import type { EALLevel } from "@shared/types";

const BodySchema = z.object({
  name: z.string(),
  grade: z.number().int(),
  ealLevel: z.enum(["Emerging", "Developing", "Proficient", "Extending"]),
  interests: z.array(z.string()).default([]),
  culturalBackground: z.string().optional(),
  learningGoals: z.array(z.string()).optional(),
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
    const result = await createStudentProfile({
      ...parse.data,
      ealLevel: parse.data.ealLevel as EALLevel,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      `[api:create-student] failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json(
      {
        error: "Could not persist student profile to memory.",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
