/**
 * Teacher "preview student experience" — composes a student-side generation
 * (text/video/voice/story) for the teacher to inspect, plus a narrative
 * description of what the student would see.
 */
import { generateTextLesson } from "../student/text-lesson";
import { generateStoryNode } from "../student/story-node";
import { getStudentProfile } from "../student/profile";

export interface PreviewArgs {
  studentId: string;
  lessonId: string;
  activityType: "text" | "video" | "voice" | "story";
  topic?: string;
  learningObjectives?: string[];
  documentId?: string;
}

export async function previewStudentExperience(args: PreviewArgs) {
  const profile = await getStudentProfile(args.studentId);
  const studentName = profile?.name ?? args.studentId;
  const interest = profile?.interests[0] ?? "their interests";
  const ealLevel = profile?.ealLevel ?? "Developing";

  let preview: unknown = null;
  let narrativeDescription = "";

  if (args.activityType === "text") {
    preview = await generateTextLesson({
      studentId: args.studentId,
      lessonId: args.lessonId,
      topic: args.topic ?? "this lesson",
      learningObjectives: args.learningObjectives ?? [],
      documentId: args.documentId,
    });
    narrativeDescription = `Text lesson for ${studentName} (${ealLevel}) — themed around ${interest}, vocabulary calibrated to ${ealLevel} level. Body markdown plus 3 comprehension questions.`;
  } else if (args.activityType === "story") {
    preview = await generateStoryNode({
      studentId: args.studentId,
      lessonId: args.lessonId,
      isFirstNode: true,
      learningObjectives: args.learningObjectives ?? [],
    });
    narrativeDescription = `Opening story node for ${studentName} — branching narrative with ${interest}-themed setting. Wrong choices trigger gentle teaching moments.`;
  } else if (args.activityType === "video") {
    narrativeDescription = `Video lesson preview for ${studentName} — would render the YouTube player with overlay quiz questions paused at scripted timestamps. Run a search to choose a video first.`;
    preview = { _placeholder: "video preview requires a chosen youtubeId" };
  } else {
    narrativeDescription = `Voice activity preview for ${studentName} — would launch ElevenLabs conversation with EAL-adapted persona prompt. Bounded to 5 minutes.`;
    preview = { _placeholder: "voice preview requires a live ElevenLabs session" };
  }

  return { preview, narrativeDescription };
}
