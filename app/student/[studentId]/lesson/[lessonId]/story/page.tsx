import { StoryGame } from "@features/activity-story-game/story-game";

export default async function StoryGamePage({
  params,
}: {
  params: Promise<{ studentId: string; lessonId: string }>;
}) {
  const { studentId, lessonId } = await params;
  return <StoryGame studentId={studentId} lessonId={lessonId} />;
}
