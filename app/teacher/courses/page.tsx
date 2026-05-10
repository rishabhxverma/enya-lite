import { STUB_COURSE_OUTLINE } from "@shared/lib/stub-content";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function TeacherCoursesPage() {
  const course = STUB_COURSE_OUTLINE;
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <h1 className="text-3xl font-bold mb-1">Courses</h1>
      <p className="text-muted-foreground mb-6">
        Generated and curated courses, grounded in your textbooks.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href={`/teacher/courses/${course.id}`}
          className="rounded-2xl border-2 bg-card p-5 hover:shadow-md transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-yellow-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {course.curriculumStandard.split("—")[0].trim()}
            </span>
          </div>
          <h2 className="font-bold text-xl">{course.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grade {course.gradeLevel} • {course.units.length} unit •{" "}
            {course.units.reduce((s, u) => s + u.lessons.length, 0)} lessons
          </p>
        </Link>
      </div>
    </div>
  );
}
