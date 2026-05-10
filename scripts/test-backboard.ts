#!/usr/bin/env tsx
/**
 * Backboard smoke test — creates a thread, sends "Hello" with no tools array,
 * prints assistant response. Requires BACKBOARD_API_KEY + BACKBOARD_ASSISTANT_ID.
 */
import { getBackboardClient } from "../shared/lib/backboard";

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
  console.log("Creating thread…");
  const thread = await client.createThread();
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
