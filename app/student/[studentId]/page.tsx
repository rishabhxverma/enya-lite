import { StudentDashboard } from "@features/student-dashboard/student-dashboard";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentDashboard studentId={studentId} />;
}
