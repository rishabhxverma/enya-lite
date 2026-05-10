# Docling Sidecar

FastAPI service that parses PDFs/DOCX into chunked markdown for the Enya Lite
backend to upload to Backboard for RAG.

## Quickstart (local, full parser)

```bash
cd docling-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-full.txt    # ~2GB; pulls torch + transformers
uvicorn main:app --reload --port 8000
```

From the project root you can also run `npm run sidecar` once the venv is
populated.

The Next.js app reaches the sidecar via the `DOCLING_SIDECAR_URL` env var —
default `http://localhost:8000`.

## Endpoints

| Method | Path     | Body              | Returns                            |
|--------|----------|-------------------|------------------------------------|
| GET    | /health  | —                 | `{ status, engine }`               |
| POST   | /parse   | multipart `file`  | `{ chunks[], pageCount, source }`  |
| POST   | /echo    | multipart `file`  | `{ filename, size, preview }`      |

## Fallback

`main.py` tries `docling` first; if not installed, falls back to
`pdfminer.six`. Same code, two engines — `/health` reports which one is live.

---

## Deploy

The sidecar runs as a long-lived FastAPI server. Pick a host based on which
parser you want in production:

### Option A — Vercel (pdfminer-only, no docling)

Vercel Python serverless functions cap at **250 MB unzipped** (Pro) or
**50 MB** (Hobby). The full docling install is ~2 GB, so Vercel can only
run the pdfminer fallback. Acceptable when the Backboard RAG pipeline can
tolerate lower-fidelity extraction.

Layout already wired up:
- `requirements.txt` — light deps only (fastapi + pdfminer)
- `api/index.py` — re-exports the FastAPI app for Vercel's @vercel/python runtime
- `vercel.json` — rewrites every path to `/api/index`, sets memory + 300s timeout
- `.vercelignore` — excludes the venv, Dockerfile, requirements-full.txt

```bash
cd docling-sidecar
vercel link        # one-time: link a new Vercel project (separate from the Next.js app)
vercel --prod      # deploys; copy the *.vercel.app URL it prints
```

Then in the Next.js app's environment:
```
DOCLING_SIDECAR_URL=https://your-sidecar.vercel.app
```

Verify: `curl https://your-sidecar.vercel.app/health` →
`{"status":"ok","engine":"pdfminer-fallback"}`

### Option B — Container host (full docling)

Use the included `Dockerfile` on any host that runs containers and gives you
~2 GB of disk. The image listens on `$PORT` (default 8000).

```bash
docker build -t enya-docling-sidecar .
docker run --rm -p 8000:8000 enya-docling-sidecar
```

Tested deploy targets:
- **Cloud Run** — `gcloud run deploy docling-sidecar --source .` (matches the
  main app's existing GCP / Firebase footprint via `apphosting.yaml`).
- **Fly.io** — `fly launch --dockerfile`
- **Render** — point a Web Service at this directory, runtime: Docker
- **Railway** — `railway up`

After deploy, set `DOCLING_SIDECAR_URL` in the Next.js app's env to the new URL.

### Why two paths?

Splitting into `requirements.txt` (light) and `requirements-full.txt` (heavy)
lets the same codebase fit both deploy shapes without conditional logic in
`main.py`. The graceful docling-or-pdfminer fallback was already there — we
just exposed it as a deploy choice.
