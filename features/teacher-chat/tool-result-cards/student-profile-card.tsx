import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { EAL_TO_CEFR } from "@shared/types";
import type { StudentProfile } from "@shared/types";

interface Props {
  profile: Partial<StudentProfile> & { id?: string };
}

export function StudentProfileCard({ profile }: Props) {
  const id = profile.id ?? "student";
  const ealCefr = profile.ealLevel ? EAL_TO_CEFR[profile.ealLevel] : "?";

  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover ring-2 ring-yellow-300"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <UserCircle2 className="w-6 h-6 text-yellow-700" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">
            {profile.name ?? "New Student"}
          </div>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-muted">
              Grade {profile.grade ?? "?"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-900">
              EAL {profile.ealLevel ?? "?"} ({ealCefr})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(profile.interests ?? []).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
              >
                {interest}
              </span>
            ))}
          </div>
          {profile.culturalBackground && (
            <p className="text-xs text-muted-foreground italic mt-2 max-w-prose">
              {profile.culturalBackground}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Link
          href={`/student/${id}`}
          className="text-sm font-semibold text-yellow-700 hover:text-yellow-800"
        >
          View as student →
        </Link>
      </div>
    </div>
  );
}
