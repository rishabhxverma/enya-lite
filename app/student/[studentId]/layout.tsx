import { ThemedContainer } from "@features/student-shell/themed-container";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <ThemedContainer studentId={studentId}>{children}</ThemedContainer>;
}
