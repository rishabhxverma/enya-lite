#!/usr/bin/env tsx
/**
 * Pre-demo checklist — reads required seed files + hits health endpoint.
 *
 *   npm run check
 */
import fs from "node:fs/promises";
import path from "node:path";

const HOST = process.env.HOST ?? "http://localhost:3000";
const SEED_ROOT = path.join(process.cwd(), "public", "seed");

interface Check {
  name: string;
  fn: () => Promise<boolean | string>;
}

async function fileExists(rel: string) {
  try {
    await fs.access(path.join(SEED_ROOT, rel));
    return true;
  } catch {
    return false;
  }
}

const checks: Check[] = [
  {
    name: "Server reachable on port 3000",
    fn: async () => {
      try {
        const r = await fetch(`${HOST}/`);
        return r.ok ? true : `HTTP ${r.status}`;
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    },
  },
  {
    name: "API health responds",
    fn: async () => {
      try {
        const r = await fetch(`${HOST}/api/health`);
        const d = (await r.json()) as Record<string, string>;
        return r.ok ? `backboard=${d.backboard} docling=${d.docling} elevenlabs=${d.elevenlabs} openai=${d.openai}` : `HTTP ${r.status}`;
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    },
  },
  { name: "students.json", fn: () => fileExists("students.json") },
  { name: "courses.json", fn: () => fileExists("courses.json") },
  { name: "youtube-fallbacks.json", fn: () => fileExists("youtube-fallbacks.json") },
  { name: "_progress.json", fn: () => fileExists("_progress.json") },
  { name: "dashboard-maya.json", fn: () => fileExists("dashboard-maya.json") },
  { name: "dashboard-liam.json", fn: () => fileExists("dashboard-liam.json") },
  { name: "avatars/maya.svg", fn: () => fileExists("avatars/maya.svg") },
  { name: "avatars/liam.svg", fn: () => fileExists("avatars/liam.svg") },
  { name: "themes/maya-hero.svg", fn: () => fileExists("themes/maya-hero.svg") },
  { name: "themes/liam-hero.svg", fn: () => fileExists("themes/liam-hero.svg") },
  { name: "themes/butterflies-pattern.svg", fn: () => fileExists("themes/butterflies-pattern.svg") },
  { name: "themes/starfield-pattern.svg", fn: () => fileExists("themes/starfield-pattern.svg") },
  {
    name: "lessons-maya/photosynthesis-1-text.json",
    fn: () => fileExists("lessons-maya/photosynthesis-1-text.json"),
  },
  {
    name: "lessons-maya/photosynthesis-1-video.json",
    fn: () => fileExists("lessons-maya/photosynthesis-1-video.json"),
  },
  {
    name: "lessons-maya/photosynthesis-1-story.json",
    fn: () => fileExists("lessons-maya/photosynthesis-1-story.json"),
  },
  {
    name: "lessons-liam/photosynthesis-1-text.json",
    fn: () => fileExists("lessons-liam/photosynthesis-1-text.json"),
  },
  {
    name: "lessons-liam/photosynthesis-1-video.json",
    fn: () => fileExists("lessons-liam/photosynthesis-1-video.json"),
  },
  {
    name: "lessons-liam/photosynthesis-1-story.json",
    fn: () => fileExists("lessons-liam/photosynthesis-1-story.json"),
  },
];

async function main() {
  let ok = 0;
  let fail = 0;
  for (const c of checks) {
    const start = Date.now();
    try {
      const r = await c.fn();
      if (r === false) {
        fail++;
        console.log(`❌ ${c.name}`);
      } else if (r === true) {
        ok++;
        console.log(`✅ ${c.name}  (${Date.now() - start}ms)`);
      } else {
        ok++;
        console.log(`✅ ${c.name}  ${r}`);
      }
    } catch (e) {
      fail++;
      console.log(
        `❌ ${c.name} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
  console.log(`\n${ok} ok / ${fail} failed`);
  if (fail) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
