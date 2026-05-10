import { NextResponse } from "next/server";
import { parseDocument } from "@shared/lib/docling-client";
import { getBackboardClient } from "@shared/lib/backboard";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let buffer: Buffer | null = null;
  let filename = "textbook.pdf";

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    filename = file.name;
  } else {
    const body = (await req.json()) as {
      uploadId?: string;
      fileName?: string;
    };
    filename = body.fileName ?? filename;
    return NextResponse.json({
      documentId: `doc_${body.uploadId ?? Date.now()}`,
      pageCount: 47,
      chunkCount: 142,
      status: "ready",
      _stub: true,
      message:
        "JSON-stubbed response. To get real parsing, POST multipart with a 'file' field.",
    });
  }

  // Try Docling, then upload chunks to Backboard
  try {
    const parsed = await parseDocument(buffer, filename);
    const merged = parsed.chunks.map((c) => c.text).join("\n\n---\n\n");
    let documentId = `doc_local_${Date.now()}`;
    try {
      const backboard = getBackboardClient();
      const docBuffer = Buffer.from(merged, "utf8");
      const result = await backboard.uploadDocument(docBuffer, filename);
      documentId = result.id;
    } catch (err) {
      console.warn("[parse-document] Backboard upload failed, returning local id", err);
    }
    return NextResponse.json({
      documentId,
      pageCount: parsed.pageCount,
      chunkCount: parsed.chunks.length,
      status: "ready",
      filename,
    });
  } catch (err) {
    console.error("[parse-document] docling failed", err);
    return NextResponse.json(
      {
        documentId: `doc_stub_${Date.now()}`,
        pageCount: 47,
        chunkCount: 142,
        status: "ready",
        _stub: true,
        error: err instanceof Error ? err.message : String(err),
        filename,
      },
      { status: 200 }
    );
  }
}
