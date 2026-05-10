import { NextResponse } from "next/server";
import { getBackboardClient } from "@shared/lib/backboard";

export async function POST() {
  try {
    const assistantId = process.env.BACKBOARD_ASSISTANT_ID;
    if (!assistantId) {
      // No assistant means no live thread — return a stub id so the client
      // can keep operating against the local stub-dispatch path.
      return NextResponse.json(
        { id: `stub_thread_${Date.now()}`, _stub: true },
        { status: 200 }
      );
    }
    const client = getBackboardClient();
    const thread = await client.createThread(assistantId);
    return NextResponse.json(thread);
  } catch (err) {
    console.error("[backboard/thread] error", err);
    return NextResponse.json(
      { id: `stub_thread_${Date.now()}`, _stub: true },
      { status: 200 }
    );
  }
}
