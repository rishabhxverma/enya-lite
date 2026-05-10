import { Users } from "lucide-react";

export default function TeacherClassroomPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
        <Users className="w-7 h-7 text-yellow-700" />
        Classroom
      </h1>
      <p className="text-muted-foreground mb-6">
        Manage roster, assign courses, run bulk EAL updates.
      </p>
      <div className="rounded-2xl border-2 bg-card p-6 text-muted-foreground">
        Use the chat to: <em className="text-foreground">&quot;create a classroom called Mrs. Lee&apos;s Grade 3, with Maya and Liam&quot;</em>.
      </div>
    </div>
  );
}
