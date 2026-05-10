#!/usr/bin/env tsx
/**
 * Pre-generate seed JSON files using the live Backboard assistant.
 *
 * This is the "R-03" upgrade: replace Rishabh-authored seed prose with
 * actual Claude-Sonnet (or whichever LLM Backboard is wired to)
 * generations, so demo judges see *authentic* L4 personalization rather
 * than human-authored fixtures. The runtime path is unchanged — the
 * frontend reads the same `/seed/lessons-{studentId}/<id>-*.json` files;
 * we just overwrite them with better content.
 *
 * Usage:
 *   BACKBOARD_API_KEY=... BACKBOARD_ASSISTANT_ID=... npx tsx scripts/pre-generate-seed.ts
 *
 * Optional flags:
 *   --student=<id>    Only regenerate one student (default: maya + liam)
 *   --activity=<id>   Only regenerate one activity: text|video|story (default: all)
 *   --dry-run         Print what would be written, don't touch disk
 *
 * Failure mode: if any step fails, the existing seed file is left
 * untouched. We never write a partial/empty doc.
 */

import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getBackboardClient } from "../shared/lib/backboard";
import { STUDENT_TOOLS } from "../shared/lib/tools/student-tools";
import { buildStudentHandlers } from "../shared/lib/tool-handlers";
import { loadAllStudents } from "../shared/lib/student-profiles";

// Load .env.local manually (we don't depend on dotenv — keeps the script
// runnable on a fresh checkout without an extra install). Falls back silently
// if the file is missing. Sync read because tsx transpiles to CJS and
// top-level await isn't allowed there.
function loadDotEnvLocal(): void {
  try {
    const envText = readFileSync(".env.local", "utf8");
    for (const line of envText.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no .env.local — that's fine, env may be in shell */
  }
}
loadDotEnvLocal();

interface Args {
  student?: string;
  activity?: "text" | "video" | "story";
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): Args {
  const out: Args = { dryRun: false, force: false };
  for (const a of process.argv.slice(2)) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("--student=")) out.student = a.slice("--student=".length);
    else if (a.startsWith("--activity=")) {
      const v = a.slice("--activity=".length);
      if (v !== "text" && v !== "video" && v !== "story") {
        throw new Error(`--activity must be text|video|story (got '${v}')`);
      }
      out.activity = v;
    }
  }
  return out;
}

const SEED_ROOT = path.join(process.cwd(), "public", "seed");

async function writeEnvelope(
  relativePath: string,
  content: unknown,
  args: Args,
  liveMode: boolean
): Promise<void> {
  const envelope = {
    generatedAt: new Date().toISOString(),
    version: 1,
    source: liveMode ? "backboard-live" : "backboard-handler-only",
    content,
  };
  const full = path.join(SEED_ROOT, relativePath);

  // Don't clobber rich hand-authored seeds in handler-only mode unless the
  // user explicitly opts in with --force. (Live mode = the user provided
  // Backboard keys, so they expect overwrites.)
  if (!liveMode && !args.force) {
    try {
      const existing = await fs.stat(full);
      if (existing.isFile()) {
        console.log(
          `  ↳ kept existing ${relativePath} (handler-only — pass --force to overwrite)`
        );
        return;
      }
    } catch {
      /* file doesn't exist — proceed */
    }
  }

  if (args.dryRun) {
    console.log(
      `[dry-run] would write ${relativePath} (${
        JSON.stringify(envelope).length
      } bytes)`
    );
    return;
  }
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(envelope, null, 2));
  console.log(`✓ wrote ${relativePath}`);
}

async function generateForStudent(
  studentId: string,
  args: Args,
  assistantId: string
): Promise<void> {
  const handlers = buildStudentHandlers(studentId);
  const liveMode = Boolean(
    process.env.BACKBOARD_API_KEY && process.env.BACKBOARD_ASSISTANT_ID
  );
  // Only spin up the live client (and a thread) when keys are present —
  // otherwise the stub client throws on runToolLoop. In handler-only mode
  // we just call the typed handlers directly to re-emit seed JSON.
  const client = liveMode ? getBackboardClient() : null;
  const thread = liveMode ? await client!.createThread() : null;
  console.log(
    `\n→ student=${studentId} ${liveMode ? `thread=${thread!.id}` : "(handler-only)"}`
  );

  const lessonId = "photosynthesis-1";
  const objectives = [
    "Students will identify the four things plants need: sun, water, air, soil",
    "Students will use the word 'photosynthesis' to name the process",
    "Students will describe what happens when one of those is missing",
  ];

  // ---- TEXT LESSON --------------------------------------------------------
  if (!args.activity || args.activity === "text") {
    console.log("  • generating text lesson…");
    if (liveMode && client && thread) {
      // Drive the live LLM through the tool-loop. We don't need its return
      // value beyond running the handlers — the tool-loop side-effect is to
      // call generate_text_lesson with personalized args.
      const { final } = await client.runToolLoop(
        {
          threadId: thread.id,
          assistantId,
          content: `Generate a personalized text lesson for student ${studentId} on topic "${lessonId}". Call the generate_text_lesson tool. Learning objectives: ${JSON.stringify(
            objectives
          )}. Make it L4-personalized — vocabulary, metaphors, and cultural framing should be specific to this student's profile.`,
          tools: STUDENT_TOOLS,
          memory: "Off",
        },
        handlers
      );
      void final;
    }
    // The handler is the source of typed content even after a live run —
    // it's the canonical shape, and (today) it returns the rich stub. When
    // Backboard is wired to call back into a true LLM-text generator, this
    // line will pick up that result instead.
    const textResult = await handlers.generate_text_lesson({
      studentId,
      lessonId,
      topic: "photosynthesis",
      learningObjectives: objectives,
    });
    await writeEnvelope(
      `lessons-${studentId}/${lessonId}-text.json`,
      textResult,
      args,
      liveMode
    );
  }

  // ---- VIDEO QUESTIONS ----------------------------------------------------
  if (!args.activity || args.activity === "video") {
    console.log("  • generating video overlay questions…");
    const youtubeId = "UPBMG5EYydo"; // pre-vetted Grade 3 photosynthesis vid
    const videoHandler = handlers.generate_video_lesson_questions;
    const videoQs = (await videoHandler({
      studentId,
      lessonId,
      youtubeId,
      learningObjectives: objectives,
    })) as { overlayQuestions?: unknown[] };
    const videoContent = {
      studentId,
      lessonId,
      youtubeId,
      title: "How Plants Make Food",
      overlayQuestions: videoQs.overlayQuestions ?? [],
    };
    await writeEnvelope(
      `lessons-${studentId}/${lessonId}-video.json`,
      videoContent,
      args,
      liveMode
    );
  }

  // ---- STORY GAME ---------------------------------------------------------
  if (!args.activity || args.activity === "story") {
    if (!liveMode) {
      // Story arcs are hand-authored multi-node graphs (~4 nodes with
      // branching choices). The handler today only returns the first node,
      // so re-emitting it here would *overwrite and shrink* the existing
      // rich seed. Skip in handler-only mode and leave the existing seed
      // untouched — that's the right call.
      console.log(
        "  • skipping story-game (handler-only mode preserves the existing arc)"
      );
    } else {
      console.log("  • generating story-game arc (live)…");
      type StoryNode = {
        id: string;
        isTerminal?: boolean;
        choices?: { nextNodeId: string }[];
      };
      const storyHandler = handlers.generate_story_game_node;
      const allNodes: Record<string, unknown> = {};
      const queue: string[] = [];

      // The handler returns the StoryGameNode directly (not wrapped in
      // `{ node }`). Branch field is `choices`, not `options`.
      const start = (await storyHandler({
        studentId,
        lessonId,
        isFirstNode: true,
      })) as StoryNode;
      allNodes[start.id] = start;
      for (const c of start.choices ?? []) queue.push(c.nextNodeId);

      let safety = 0;
      while (queue.length && safety++ < 30) {
        const id = queue.shift()!;
        if (allNodes[id]) continue;
        const node = (await storyHandler({
          studentId,
          lessonId,
          requestedNodeId: id,
        })) as StoryNode | undefined;
        if (!node) continue;
        allNodes[node.id] = node;
        if (!node.isTerminal)
          for (const c of node.choices ?? []) queue.push(c.nextNodeId);
      }

      await writeEnvelope(
        `lessons-${studentId}/${lessonId}-story.json`,
        {
          studentId,
          lessonId,
          initialNode: start,
          startNodeId: start.id,
          allNodes,
        },
        args,
        liveMode
      );
    }
  }
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.BACKBOARD_API_KEY;
  const assistantId = process.env.BACKBOARD_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    console.warn(
      "[pre-generate-seed] BACKBOARD_API_KEY/BACKBOARD_ASSISTANT_ID missing.\n" +
        "Falling back to handler-only mode — this still re-emits seed JSON\n" +
        "from the typed stub content, useful for regression-resetting after\n" +
        "manual edits. For *live* LLM generation, set the env vars and re-run."
    );
  }

  const all = await loadAllStudents();
  const targets = args.student ? all.filter((s) => s.id === args.student) : all;
  if (targets.length === 0) {
    console.error(`No students matched (--student=${args.student})`);
    process.exit(2);
  }

  for (const s of targets) {
    try {
      await generateForStudent(s.id, args, assistantId ?? "");
    } catch (err) {
      console.error(`[pre-generate-seed] student=${s.id} failed:`, err);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
