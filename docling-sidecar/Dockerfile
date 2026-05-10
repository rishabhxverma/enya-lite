# Container image for the FULL sidecar (docling + pdfminer fallback).
# Use this when deploying to a host that can hold ~2GB (Render, Fly.io,
# Cloud Run, Railway, Modal, Beam). Vercel cannot — its Python serverless
# functions cap at 250MB unzipped.
#
# Build:   docker build -t enya-docling-sidecar .
# Run:     docker run --rm -p 8000:8000 enya-docling-sidecar
# Health:  curl http://localhost:8000/health   → {"status":"ok","engine":"docling"}

FROM python:3.12-slim

# System deps for docling: opencv needs libgl, pdfminer is pure-python.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libgl1 \
      libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first to maximize Docker layer cache hits.
COPY requirements.txt requirements-full.txt ./
RUN pip install --no-cache-dir -r requirements-full.txt

# App code
COPY main.py ./

# Cloud Run / Render / Fly all set $PORT; default to 8000 for local docker run.
ENV PORT=8000
EXPOSE 8000

# Use shell form so $PORT expands at runtime.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
