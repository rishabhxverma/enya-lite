import type {
  Course,
  PedagogicalAudit,
  StudentAnalytics,
  StudentProfile,
} from "@shared/types";
import { UploadStatusCard } from "./upload-status-card";
import { CourseOutlinePreview } from "./course-outline-preview";
import { PedagogicalAuditCard } from "./audit-card";
import { StudentProfileCard } from "./student-profile-card";
import { AnalyticsSummaryCard } from "./analytics-card";
import { ToolResultJson } from "./json-card";

interface ToolResult {
  toolName: string;
  args: unknown;
  output: unknown;
}

export function ToolResultCard({ result }: { result: ToolResult }) {
  const { toolName, output } = result;

  if (toolName === "parse_uploaded_document") {
    const o = output as {
      documentId?: string;
      pageCount?: number;
      chunkCount?: number;
      status?: "parsing" | "ready" | "failed";
      filename?: string;
      fileName?: string;
      error?: string;
    };
    return (
      <UploadStatusCard
        status={o.status ?? "ready"}
        filename={o.filename ?? o.fileName}
        pageCount={o.pageCount}
        chunkCount={o.chunkCount}
        error={o.error}
      />
    );
  }

  if (toolName === "generate_course_outline") {
    const o = output as { course: Course };
    if (o?.course) return <CourseOutlinePreview course={o.course} />;
  }

  if (toolName === "audit_content_pedagogically") {
    return <PedagogicalAuditCard audit={output as PedagogicalAudit} />;
  }

  if (toolName === "create_student_profile") {
    const o = output as { profile: Partial<StudentProfile> };
    if (o?.profile) return <StudentProfileCard profile={o.profile} />;
  }

  if (toolName === "get_student_analytics") {
    const o = output as { analytics: StudentAnalytics };
    if (o?.analytics) return <AnalyticsSummaryCard analytics={o.analytics} />;
  }

  return <ToolResultJson toolName={toolName} output={output} />;
}

export {
  UploadStatusCard,
  CourseOutlinePreview,
  PedagogicalAuditCard,
  StudentProfileCard,
  AnalyticsSummaryCard,
  ToolResultJson,
};
