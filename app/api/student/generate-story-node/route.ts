import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStoryNode } from "@shared/lib/ai/student/story-node";
import {
  STUB_STORY_NODE_LIAM,
  STUB_STORY_NODE_MAYA,
} from "@shared/lib/stub-content";
import { readSeedJson, isSeedFallbackEnabled } from "@shared/lib/seed-loader";

const BodySchema = z.object({
  studentId: z.string().default("maya"),
  lessonId: z.string().default("photosynthesis-1"),
  previousNodes: z
    .array(z.object({ id: z.string(), chosen: z.string().optional() }))
    .optional(),
  learningObjectives: z.array(z.string()).optional(),
  isFirstNode: z.boolean().optional(),
  isFinalNode: z.boolean().optional(),
  requestedNodeId: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const parse = BodySchema.safeParse(raw);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parse.error.message },
      { status: 400 }
    );
  }
  const { studentId, lessonId } = parse.data;

  // 1. Seed-fallback path — for full pre-built story arcs.
  if (isSeedFallbackEnabled()) {
    type StorySeed = {
      content: { initialNode: unknown; allNodes?: Record<string, unknown> };
    };
    const seed = await readSeedJson<StorySeed>(
      `lessons-${studentId}/${lessonId}-story.json`
    );
    if (seed) {
      if (parse.data.isFirstNode || parse.data.isFirstNode === undefined) {
        return NextResponse.json({
          node: seed.content.initialNode,
          allNodes: seed.content.allNodes,
        });
      }
      if (
        parse.data.requestedNodeId &&
        seed.content.allNodes?.[parse.data.requestedNodeId]
      ) {
        return NextResponse.json({
          node: seed.content.allNodes[parse.data.requestedNodeId],
          allNodes: seed.content.allNodes,
        });
      }
    }
    return NextResponse.json({
      node: studentId === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA,
    });
  }

  try {
    const node = await generateStoryNode(parse.data);
    return NextResponse.json({ node });
  } catch (err) {
    console.warn(
      `[api:generate-story-node] live failed, using stub: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json({
      node: studentId === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA,
      _stub: true,
    });
  }
}
