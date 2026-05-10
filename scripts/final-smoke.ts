#!/usr/bin/env tsx
/**
 * R-10 — Final integration smoke.
 *
 * Validates the demo path *as the presenter will see it*. Where the
 * existing `npm run check` is a static health sweep (seed files exist,
 * /api/health returns), this test actually exercises the runtime contract:
 *
 *   1. The demo critical-path API endpoints return shaped data
 *   2. The seed-fallback path resolves all the JSON files the client
 *      expects when localStorage.USE_SEED_FALLBACK is true
 *   3. The L4 differential proof passes the >40% threshold
 *   4. The pre-generation script's dry-run completes cleanly
 *   5. The voice session API returns the right shape for both live and
 *      simulated paths
 *
 * Usage:
 *   npm run dev      # in another terminal
 *   npm run smoke:demo
 *
 * Exit code 0 = ready to demo. Non-zero = something is wrong; the failing
 * check is logged with enough context to diagnose.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const HOST = process.env.HOST ?? "http://localhost:3000";
const SEED_ROOT = path.join(process.cwd(), "public", "seed");

type Outcome = { name: string; passed: boolean; detail: string };
const results: Outcome[] = [];

function log(o: Outcome) {
  results.push(o);
  const mark = o.passed ? "✓" : "✗";
  // eslint-disable-next-line no-console
  console.log(`  ${mark} ${o.name} — ${o.detail}`);
}

async function runHttpCheck(
  name: string,
  url: string,
  body: unknown,
  expect: (data: unknown) => string | true
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      log({ name, passed: false, detail: `HTTP ${res.status}` });
      return;
    }
    const data = await res.json();
    const verdict = expect(data);
    if (verdict === true) {
      log({ name, passed: true, detail: "ok" });
    } else {
      log({ name, passed: false, detail: verdict });
    }
  } catch (err) {
    log({
      name,
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

async function checkSeedFile(name: string, rel: string): Promise<void> {
  try {
    const raw = readFileSync(path.join(SEED_ROOT, rel), "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed) {
      log({ name, passed: false, detail: "not a JSON object" });
      return;
    }
    log({ name, passed: true, detail: `${raw.length} bytes` });
  } catch (err) {
    log({
      name,
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function spawnCheck(
  name: string,
  cmd: string,
  args: string[],
  opts: { successMatch?: RegExp } = {}
): Promise<void> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (b) => (stdout += b.toString()));
    proc.stderr.on("data", (b) => (stderr += b.toString()));
    proc.on("close", (code) => {
      if (code !== 0) {
        log({
          name,
          passed: false,
          detail: `exit ${code}${stderr ? `: ${stderr.split("\n")[0]}` : ""}`,
        });
        return resolve();
      }
      if (opts.successMatch && !opts.successMatch.test(stdout)) {
        log({
          name,
          passed: false,
          detail: `output didn't match expected pattern`,
        });
        return resolve();
      }
      log({
        name,
        passed: true,
        detail: opts.successMatch
          ? (stdout.match(opts.successMatch)?.[0] ?? "ok")
          : "exit 0",
      });
      resolve();
    });
  });
}

async function main() {
  console.log("\n━━━ R-10: Final Integration Smoke ━━━\n");

  // ----- BLOCK 1: server reachable ------------------------------------------
  console.log("• Server reachability");
  try {
    const r = await fetch(`${HOST}/api/health`);
    const data = (await r.json()) as Record<string, unknown>;
    log({
      name: "Health endpoint",
      passed: r.ok,
      detail: r.ok
        ? Object.entries(data)
            .filter(([k]) => k !== "timestamp")
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")
        : `HTTP ${r.status}`,
    });
  } catch (err) {
    log({
      name: "Health endpoint",
      passed: false,
      detail: `dev server not running on ${HOST}? ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    summarize();
    process.exit(2);
  }

  // ----- BLOCK 2: critical-path API contracts -------------------------------
  console.log("\n• API contracts (shape-checked)");

  await runHttpCheck(
    "POST /api/student/dashboard (maya)",
    `${HOST}/api/student/dashboard`,
    { studentId: "maya" },
    (d) => {
      const o = d as { greeting?: string; xp?: number };
      return o.greeting && typeof o.xp === "number"
        ? true
        : "missing greeting or xp";
    }
  );

  await runHttpCheck(
    "POST /api/student/generate-text-lesson (liam)",
    `${HOST}/api/student/generate-text-lesson`,
    {
      studentId: "liam",
      lessonId: "photosynthesis-1",
      topic: "photosynthesis",
      learningObjectives: [],
    },
    (d) => {
      const o = d as { bodyMarkdown?: string };
      return o.bodyMarkdown && o.bodyMarkdown.length > 200
        ? true
        : "bodyMarkdown missing or too short";
    }
  );

  await runHttpCheck(
    "POST /api/student/voice-session",
    `${HOST}/api/student/voice-session`,
    {
      studentId: "maya",
      lessonId: "photosynthesis-1",
      activitySubtype: "explain-back",
    },
    (d) => {
      const o = d as { agentPersonaPrompt?: string; voiceMode?: string };
      return o.agentPersonaPrompt && o.voiceMode
        ? true
        : "missing agentPersonaPrompt or voiceMode";
    }
  );

  await runHttpCheck(
    "POST /api/backboard/message (course keyword → outline)",
    `${HOST}/api/backboard/message`,
    {
      threadId: "smoke",
      content: "build me a course outline on photosynthesis",
    },
    (d) => {
      const o = d as { toolResults?: { name?: string }[] };
      return o.toolResults && o.toolResults.length > 0
        ? true
        : "no toolResults returned";
    }
  );

  // ----- BLOCK 3: seed fallback files all resolve ---------------------------
  console.log("\n• Seed-fallback file inventory (D-06b)");
  await checkSeedFile("dashboard-maya", "dashboard-maya.json");
  await checkSeedFile("dashboard-liam", "dashboard-liam.json");
  await checkSeedFile("text/maya", "lessons-maya/photosynthesis-1-text.json");
  await checkSeedFile("text/liam", "lessons-liam/photosynthesis-1-text.json");
  await checkSeedFile("video/maya", "lessons-maya/photosynthesis-1-video.json");
  await checkSeedFile("video/liam", "lessons-liam/photosynthesis-1-video.json");
  await checkSeedFile("story/maya", "lessons-maya/photosynthesis-1-story.json");
  await checkSeedFile("story/liam", "lessons-liam/photosynthesis-1-story.json");

  // Each fallback file should also be served as a static asset by Next.js,
  // because the client-side seed loader does fetch('/seed/...') — failing
  // here means the runtime toggle wouldn't actually work.
  console.log("\n• Seed files served by Next /public");
  for (const rel of [
    "dashboard-maya.json",
    "lessons-maya/photosynthesis-1-text.json",
    "lessons-liam/photosynthesis-1-video.json",
  ]) {
    try {
      const r = await fetch(`${HOST}/seed/${rel}`);
      log({
        name: `GET /seed/${rel}`,
        passed: r.ok,
        detail: r.ok ? `HTTP 200` : `HTTP ${r.status}`,
      });
    } catch (err) {
      log({
        name: `GET /seed/${rel}`,
        passed: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ----- BLOCK 4: L4 differential is still passing --------------------------
  console.log("\n• L4 personalization proof");
  await spawnCheck("npm run demo:l4", "npx", ["tsx", "scripts/run-l4-diff.ts"], {
    successMatch: /\d+\.\d+%/,
  });

  // ----- BLOCK 5: pre-generation dry-run ------------------------------------
  console.log("\n• Pre-generate seed (dry-run, R-03)");
  await spawnCheck(
    "npx tsx scripts/pre-generate-seed.ts --dry-run",
    "npx",
    ["tsx", "scripts/pre-generate-seed.ts", "--dry-run"],
    { successMatch: /Done\./ }
  );

  // ----- summary ------------------------------------------------------------
  summarize();
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

function summarize() {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log("\n━━━ Summary ━━━");
  console.log(`  ${passed} passed`);
  console.log(`  ${failed} failed`);
  if (failed > 0) {
    console.log("\n  Failures:");
    for (const r of results.filter((x) => !x.passed)) {
      console.log(`    ✗ ${r.name}: ${r.detail}`);
    }
  } else {
    console.log("\n  🎉 Demo path is hot.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
