# Docling Sidecar

FastAPI service that parses PDFs/DOCX into chunked markdown for the Enya Lite
backend to upload to Backboard for RAG.

## Quickstart

```bash
cd docling-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

From the project root you can also run `npm run sidecar`.

## Endpoints

| Method | Path     | Body              | Returns                         |
|--------|----------|-------------------|---------------------------------|
| GET    | /health  | —                 | `{ status, engine }`            |
| POST   | /parse   | multipart `file`  | `{ chunks[], pageCount, source }` |
| POST   | /echo    | multipart `file`  | `{ filename, size, preview }`   |

## Fallback

If `docling` cannot be installed (Python deps hell on Apple Silicon), the
sidecar falls back to `pdfminer.six`. It's less accurate but still produces
usable text for RAG.
