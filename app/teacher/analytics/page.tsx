import { STUB_ANALYTICS } from "@shared/lib/stub-content";
import { AnalyticsSummaryCard } from "@features/teacher-chat/tool-result-cards";

export default function TeacherAnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">
        Performance overview across your students.
      </p>
      <div className="grid lg:grid-cols-2 gap-6">
        <AnalyticsSummaryCard analytics={STUB_ANALYTICS.maya} />
        <AnalyticsSummaryCard analytics={STUB_ANALYTICS.liam} />
      </div>
    </div>
  );
}
