// Client-side seed-fallback loader.
//
// When a demo presenter wants to bypass live API routes — e.g., the network
// is flaky on stage, or an upstream provider is rate-limiting — they can flip:
//
//   localStorage.USE_SEED_FALLBACK = 'true'; location.reload();
//
// (Or set NEXT_PUBLIC_USE_SEED_FALLBACK=true at build time.) The services in
// this folder check `isSeedFallbackEnabled()` first and short-circuit to
// pre-generated JSON files in /public/seed/ before hitting /api/*.
//
// All seed files use the envelope shape `{ generatedAt, version, content }`.
// `readSeedEnvelope` unwraps `.content`; `readSeedJson` returns the raw doc.

const ENV_FLAG =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_USE_SEED_FALLBACK === "true"
    : false;

export function isSeedFallbackEnabled(): boolean {
  if (ENV_FLAG) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("USE_SEED_FALLBACK") === "true";
  } catch {
    return false;
  }
}

export function setSeedFallback(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem("USE_SEED_FALLBACK", "true");
    else window.localStorage.removeItem("USE_SEED_FALLBACK");
  } catch {
    /* no-op */
  }
}

async function fetchSeed<T>(relativePath: string): Promise<T | null> {
  try {
    const url = `/seed/${relativePath.replace(/^\//, "")}`;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function readSeedJsonClient<T>(
  relativePath: string
): Promise<T | null> {
  return fetchSeed<T>(relativePath);
}

export async function readSeedEnvelopeClient<T>(
  relativePath: string
): Promise<T | null> {
  const env = await fetchSeed<{ content: T }>(relativePath);
  return env?.content ?? null;
}
