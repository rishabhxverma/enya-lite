"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface HealthState {
  backboard: "ok" | "degraded" | "down" | "unknown";
  docling: "ok" | "degraded" | "down" | "unknown";
  elevenlabs: "ok" | "degraded" | "down" | "unknown";
  openai: "ok" | "degraded" | "down" | "unknown";
}

const initial: HealthState = {
  backboard: "unknown",
  docling: "unknown",
  elevenlabs: "unknown",
  openai: "unknown",
};

export function HealthBanner() {
  const [state, setState] = useState<HealthState>(initial);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as HealthState;
        if (!cancelled) setState(data);
      } catch {
        /* ignore */
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const degraded = Object.entries(state).filter(
    ([, v]) => v === "degraded" || v === "down"
  );

  if (degraded.length === 0) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-2">
      <AlertTriangle className="w-4 h-4" aria-hidden />
      <span>
        Some services degraded:{" "}
        <strong>{degraded.map(([k]) => k).join(", ")}</strong>. Demo will use
        seed fallback where possible.
      </span>
    </div>
  );
}
