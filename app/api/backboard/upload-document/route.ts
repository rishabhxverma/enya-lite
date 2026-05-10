import { NextResponse } from "next/server";
import { getBackboardClient } from "@shared/lib/backboard";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getBackboardClient();
    const result = await client.uploadDocument(buffer, file.name);
    return NextResponse.json({
      documentId: result.id,
      filename: file.name,
      size: buffer.length,
    });
  } catch (err) {
    console.error("[backboard/upload-document] error", err);
    return NextResponse.json(
      {
        documentId: `stub_doc_${Date.now()}`,
        _stub: true,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
