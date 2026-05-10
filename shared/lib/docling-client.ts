import axios from "axios";

export interface DoclingChunk {
  pageNumber: number;
  text: string;
  type?: string;
}

export interface DoclingParseResult {
  chunks: DoclingChunk[];
  pageCount: number;
}

const DEFAULT_URL = "http://localhost:8000";

export async function parseDocument(
  file: Buffer,
  filename: string
): Promise<DoclingParseResult> {
  const url = process.env.DOCLING_SIDECAR_URL ?? DEFAULT_URL;
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(file)]);
  formData.append("file", blob, filename);
  const { data } = await axios.post<DoclingParseResult>(
    `${url}/parse`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    }
  );
  return data;
}

export async function isHealthy(): Promise<boolean> {
  try {
    const url = process.env.DOCLING_SIDECAR_URL ?? DEFAULT_URL;
    const { status } = await axios.get(`${url}/health`, { timeout: 2_000 });
    return status === 200;
  } catch {
    return false;
  }
}
