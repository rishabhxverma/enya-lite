import fs from "node:fs/promises";
import path from "node:path";

const SEED_ROOT = path.join(process.cwd(), "public", "seed");

export async function readSeedJson<T>(relativePath: string): Promise<T | null> {
  try {
    const full = path.join(SEED_ROOT, relativePath);
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readSeedEnvelope<T>(
  relativePath: string
): Promise<T | null> {
  const env = await readSeedJson<{ content: T }>(relativePath);
  return env?.content ?? null;
}

export function isSeedFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_SEED_FALLBACK === "true";
}
