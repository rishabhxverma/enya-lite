import { VoiceActivity } from "@features/activity-voice-tutor/voice-activity";

export default async function VoiceActivityPage({
  params,
}: {
  params: Promise<{ studentId: string; lessonId: string }>;
}) {
  const { studentId, lessonId } = await params;
  return <VoiceActivity studentId={studentId} lessonId={lessonId} />;
}
