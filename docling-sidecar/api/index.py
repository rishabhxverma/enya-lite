"""Vercel Python entry point.

Vercel auto-discovers Python functions under `api/`. By exposing `app` here
as the FastAPI instance from `main.py`, Vercel's @vercel/python runtime
serves the whole ASGI app behind the rewrites in `vercel.json`.

The `main.py` parser already gracefully falls back from docling → pdfminer
when docling is not installed, so the same code path runs locally (full
docling) and on Vercel (pdfminer-only).
"""

import sys
from pathlib import Path

# Make sibling `main.py` importable when Vercel invokes this file as a function.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app  # noqa: E402, F401
