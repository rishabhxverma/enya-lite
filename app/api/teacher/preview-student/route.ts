import { NextResponse } from "next/server";
import {
  STUB_TEXT_LESSONS,
  STUB_VIDEO_LESSONS,
  STUB_STORY_NODE_MAYA,
  STUB_STORY_NODE_LIAM,
} from "@shared/lib/stub-content";
import { getStudentProfile } from "@shared/lib/student-profiles";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId ?? "maya";
  const lessonId = body.lessonId ?? "photosynthesis-1";
  const activityType = body.activityType ?? "text";
  const profile = await getStudentProfile(studentId);

  let preview: unknown = null;
  if (activityType === "text") {
    preview =
      STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
      STUB_TEXT_LESSONS.maya[lessonId];
  } else if (activityType === "video") {
    preview =
      STUB_VIDEO_LESSONS[studentId]?.[lessonId] ??
      STUB_VIDEO_LESSONS.maya[lessonId];
  } else if (activityType === "story") {
    preview = studentId === "liam" ? STUB_STORY_NODE_LIAM : STUB_STORY_NODE_MAYA;
  } else {
    preview = {
      activitySubtype: "explain-back",
      objectives: ["Student explains photosynthesis in their own words."],
      maxDurationSeconds: 300,
    };
  }

  return NextResponse.json({
    preview,
    narrativeDescription: `For ${profile?.name ?? studentId} (${profile?.ealLevel ?? "Emerging"}), the ${activityType} lesson is themed around ${profile?.interests?.[0] ?? "their interests"} with vocabulary calibrated to their EAL level.`,
    _stub: true,
  });
}
