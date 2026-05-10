#!/usr/bin/env tsx
/**
 * Backboard smoke test — creates a thread, sends "Hello" with no tools array,
 * prints assistant response. Requires BACKBOARD_API_KEY + BACKBOARD_ASSISTANT_ID.
 *
 * Auto-loads .env.local (we don't depend on dotenv to keep the bin runnable
 * on a fresh checkout).
 */
import { readFileSync } from "node:fs";
import { getBackboardClient } from "../shared/lib/backboard";

function loadDotEnvLocal(): void {
  try {
    const envText = readFileSync(".env.local", "utf8");
    for (const line of envText.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]])
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* env may live in shell */
  }
}
loadDotEnvLocal();

async function main() {
  const apiKey = process.env.BACKBOARD_API_KEY;
  const assistantId = process.env.BACKBOARD_ASSISTANT_ID;
  if (!apiKey || !assistantId) {
    console.error(
      "BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID required. Set them in .env.local."
    );
    process.exit(2);
  }
  const client = getBackboardClient();
  console.log("Creating thread under assistant", assistantId, "…");
  const thread = await client.createThread(assistantId);
  console.log(`Thread ${thread.id}`);
  console.log("Sending message…");
  const res = await client.sendMessage({
    threadId: thread.id,
    assistantId,
    content: "Hello! What can you help me with?",
  });
  console.log("\nResponse:");
  console.log(res.content || "(empty)");
  console.log(`\nstatus=${res.status}`);
  if (res.toolCalls?.length) {
    console.log(
      `tool_calls: ${res.toolCalls.map((c) => c.name).join(", ")}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
