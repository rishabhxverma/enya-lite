import { TextLesson } from "@features/activity-text-lesson/text-lesson";

export default async function TextLessonPage({
  params,
}: {
  params: Promise<{ studentId: string; lessonId: string }>;
}) {
  const { studentId, lessonId } = await params;
  return <TextLesson studentId={studentId} lessonId={lessonId} />;
}
