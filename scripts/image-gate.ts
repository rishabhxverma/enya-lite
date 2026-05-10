#!/usr/bin/env tsx
/**
 * Image-gen quality gate — runs the 5 test prompts from
 * `ultraplan-00-architecture.md` §7 against DALL-E 3 and saves outputs to
 * `public/seed/gate-test/<theme>.png` for visual review.
 *
 * Run after OPENAI_API_KEY is set in .env.local:
 *   npm run image-gate
 *
 * The gate result drives `NEXT_PUBLIC_IMAGE_MODE` in .env.local.
 */
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const STYLE_PREFIX = `Children's storybook illustration, soft watercolor and pastel palette, warm golden lighting, friendly cartoon style, no text, no letters, safe for children ages 6-12, clean composition, single focal scene.`;

const SCENES: { name: string; description: string }[] = [
  {
    name: "butterflies",
    description:
      "A young girl with curly black hair gently watching a monarch butterfly land on a sunflower in a garden",
  },
  {
    name: "space",
    description:
      "A child in an astronaut suit floating outside a colorful space station, distant Earth visible",
  },
  {
    name: "soccer",
    description:
      "A kid in a soccer uniform celebrating a goal in a stadium with confetti raining down",
  },
  {
    name: "animals",
    description:
      "A young explorer with binoculars peeking at a family of foxes in a sunlit forest clearing",
  },
  {
    name: "fantasy",
    description:
      "A young wizard with a glowing book on a stone bridge over a starlit river",
  },
];

async function downloadTo(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY missing — cannot run image gate.");
    console.error(
      "Set it in .env.local, then run again. Until then, set NEXT_PUBLIC_IMAGE_MODE=emoji to use the always-on tertiary fallback."
    );
    process.exit(2);
  }
  const outDir = path.join(process.cwd(), "public", "seed", "gate-test");
  await fs.mkdir(outDir, { recursive: true });

  const client = new OpenAI({ apiKey });
  const summary: { name: string; durationMs: number; ok: boolean; error?: string }[] = [];

  for (const scene of SCENES) {
    const start = Date.now();
    try {
      const res = await client.images.generate({
        model: "dall-e-3",
        quality: "hd",
        style: "natural",
        size: "1024x1024",
        n: 1,
        prompt: `${STYLE_PREFIX}\n\nScene: ${scene.description}`,
      });
      const url = res.data?.[0]?.url;
      if (!url) throw new Error("no url returned");
      const dest = path.join(outDir, `${scene.name}.png`);
      await downloadTo(url, dest);
      const durationMs = Date.now() - start;
      summary.push({ name: scene.name, durationMs, ok: true });
      console.log(`✅ ${scene.name} -> ${dest} (${durationMs}ms)`);
    } catch (err) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      summary.push({ name: scene.name, durationMs, ok: false, error: msg });
      console.error(`❌ ${scene.name} failed after ${durationMs}ms: ${msg}`);
    }
  }

  console.log("\n══════ SUMMARY ══════");
  for (const r of summary) {
    console.log(
      `${r.ok ? "✅" : "❌"} ${r.name.padEnd(12)} ${r.durationMs}ms${
        r.error ? `  ${r.error}` : ""
      }`
    );
  }
  const passed = summary.filter((s) => s.ok).length;
  console.log(`\n${passed}/${SCENES.length} passed.`);
  if (passed === SCENES.length) {
    console.log(
      "✅  All 5 generated successfully. Set NEXT_PUBLIC_IMAGE_MODE=auto in .env.local."
    );
  } else if (passed >= 3) {
    console.log(
      "⚠️  Some failed. Use NEXT_PUBLIC_IMAGE_MODE=auto for passing themes; populate public/seed/illustrations/<theme>/ for failing ones and switch to mode=curated."
    );
  } else {
    console.log(
      "❌  Most generations failed. Set NEXT_PUBLIC_IMAGE_MODE=curated and use the curated fallback library + emoji tertiary."
    );
  }
  await fs.writeFile(
    path.join(outDir, "gate-summary.json"),
    JSON.stringify({ ranAt: new Date().toISOString(), summary }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
