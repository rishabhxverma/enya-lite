import { NextResponse } from "next/server";
import { getBackboardClient } from "@shared/lib/backboard";

export async function POST() {
  try {
    const client = getBackboardClient();
    const thread = await client.createThread();
    return NextResponse.json(thread);
  } catch (err) {
    console.error("[backboard/thread] error", err);
    return NextResponse.json(
      { id: `stub_thread_${Date.now()}`, _stub: true },
      { status: 200 }
    );
  }
}
