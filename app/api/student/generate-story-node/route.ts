import { NextResponse } from "next/server";
import {
  STUB_STORY_NODE_LIAM,
  STUB_STORY_NODE_MAYA,
} from "@shared/lib/stub-content";
import { readSeedJson } from "@shared/lib/seed-loader";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const lessonId = body.lessonId ?? "photosynthesis-1";

  // For full story arcs, look up seed first
  type StorySeed = {
    content: {
      initialNode: unknown;
      allNodes?: Record<string, unknown>;
    };
  };
  const seed = await readSeedJson<StorySeed>(
    `lessons-${studentId}/${lessonId}-story.json`
  );
  if (seed) {
    if (body.isFirstNode || body.isFirstNode === undefined) {
      return NextResponse.json({
        node: seed.content.initialNode,
        allNodes: seed.content.allNodes,
      });
    }
    const requested = body.requestedNodeId as string | undefined;
    if (requested && seed.content.allNodes?.[requested]) {
      return NextResponse.json({
        node: seed.content.allNodes[requested],
        allNodes: seed.content.allNodes,
      });
    }
  }

  return NextResponse.json({
    node: studentId === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA,
    _stub: true,
  });
}
