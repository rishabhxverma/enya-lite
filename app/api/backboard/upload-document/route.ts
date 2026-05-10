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
    // Wait for the document to finish indexing — without this, the next chat
    // turn that references documentId can fire before Backboard has chunks
    // ready, returning empty RAG context. 30s ceiling matches the route's
    // 120s budget with margin for the model call afterwards.
    const status = await client.waitForDocumentIndexed(result.id, {
      maxMs: 30_000,
      intervalMs: 1500,
    });
    return NextResponse.json({
      documentId: result.id,
      filename: file.name,
      size: buffer.length,
      indexStatus: status.status,
      chunkCount: status.chunkCount,
      totalTokens: status.totalTokens,
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
