import { VideoLesson } from "@features/activity-video-lesson/video-lesson";

export default async function VideoLessonPage({
  params,
}: {
  params: Promise<{ studentId: string; lessonId: string }>;
}) {
  const { studentId, lessonId } = await params;
  return <VideoLesson studentId={studentId} lessonId={lessonId} />;
}
