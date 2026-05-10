"""
Docling FastAPI sidecar — single endpoint POST /parse that accepts a PDF/DOCX
and returns chunked text suitable for upload to Backboard for RAG.

Run:
  cd docling-sidecar
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000

Or from project root:  npm run sidecar
"""

from __future__ import annotations

import io
import re
import tempfile
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Enya Lite Docling Sidecar", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def chunk_markdown(md: str, target_words: int = 300) -> List[Dict[str, Any]]:
    """Naive paragraph-grouping chunker.

    Walks paragraphs and groups them up to the target word count.
    Each chunk records its first/last paragraph index as a `pageNumber`-ish
    placeholder when no real page metadata is available.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", md) if p.strip()]
    chunks = []
    buffer: List[str] = []
    word_count = 0
    chunk_index = 0
    for p in paragraphs:
        wc = len(p.split())
        if word_count + wc > target_words and buffer:
            chunks.append(
                {
                    "pageNumber": chunk_index + 1,
                    "text": "\n\n".join(buffer),
                    "type": "paragraph-group",
                }
            )
            chunk_index += 1
            buffer = []
            word_count = 0
        buffer.append(p)
        word_count += wc
    if buffer:
        chunks.append(
            {
                "pageNumber": chunk_index + 1,
                "text": "\n\n".join(buffer),
                "type": "paragraph-group",
            }
        )
    return chunks


def _docling_parse(path: str) -> Dict[str, Any]:
    """Try Docling first; fall back to pdfminer if Docling isn't installed."""
    try:
        from docling.document_converter import DocumentConverter  # type: ignore

        converter = DocumentConverter()
        result = converter.convert(path)
        md = result.document.export_to_markdown()
        page_count = len(getattr(result.document, "pages", []) or [])
        return {"markdown": md, "pageCount": page_count or 1, "source": "docling"}
    except ImportError:
        # Fall back: pdfminer six is small and usually pre-installed
        try:
            from pdfminer.high_level import extract_text  # type: ignore

            text = extract_text(path)
            return {"markdown": text, "pageCount": text.count("\f") + 1, "source": "pdfminer"}
        except Exception as exc:  # pragma: no cover
            raise HTTPException(
                status_code=500,
                detail=(
                    "Docling not installed and pdfminer fallback also failed: "
                    f"{exc}. Install dependencies via requirements.txt."
                ),
            ) from exc


@app.get("/health")
def health() -> Dict[str, str]:
    try:
        import docling  # noqa: F401  type: ignore

        return {"status": "ok", "engine": "docling"}
    except ImportError:
        return {"status": "ok", "engine": "pdfminer-fallback"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="missing filename")
    suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    parsed = _docling_parse(tmp_path)
    chunks = chunk_markdown(parsed["markdown"], target_words=300)
    return {
        "chunks": chunks,
        "pageCount": parsed.get("pageCount", len(chunks)),
        "source": parsed.get("source", "unknown"),
    }


@app.post("/echo")
async def echo(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Smoke-test endpoint that echoes file metadata without parsing."""
    contents = await file.read()
    return {
        "filename": file.filename,
        "size": len(contents),
        "preview": contents[:200].decode("utf-8", errors="replace"),
    }
