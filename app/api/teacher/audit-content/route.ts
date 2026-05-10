import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@shared/lib/ai/teacher/audit";
import { STUB_AUDIT } from "@shared/lib/stub-content";
import { isSeedFallbackEnabled } from "@shared/lib/seed-loader";

const BodySchema = z.object({
  documentId: z.string().optional(),
  courseId: z.string().optional(),
  targetGrade: z.number().int().default(3),
  targetEalLevels: z.array(z.string()).optional(),
  curriculumStandards: z.array(z.string()).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json().catch(() => ({})));
  if (isSeedFallbackEnabled() && !body.documentId) {
    return NextResponse.json(STUB_AUDIT);
  }
  try {
    const audit = await runAudit(body);
    return NextResponse.json(audit);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[api:audit-content] live audit failed, returning stub: ${message}`);
    return NextResponse.json({ ...STUB_AUDIT, _stub: true, _error: message });
  }
}
