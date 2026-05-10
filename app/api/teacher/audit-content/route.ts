import { NextResponse } from "next/server";
import { STUB_AUDIT } from "@shared/lib/stub-content";

export async function POST() {
  // TODO: real implementation — Backboard with claude-sonnet-4-6 over the doc
  return NextResponse.json({ ...STUB_AUDIT, _stub: true });
}
