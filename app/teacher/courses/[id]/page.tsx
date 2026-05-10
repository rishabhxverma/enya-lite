import { STUB_COURSE_OUTLINE } from "@shared/lib/stub-content";
import { CourseOutlinePreview } from "@features/teacher-chat/tool-result-cards";

export default function CourseDetailPage() {
  const course = STUB_COURSE_OUTLINE;
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8">
      <CourseOutlinePreview course={course} />
    </div>
  );
}
