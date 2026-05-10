"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRoleStore } from "@shared/stores/role-store";
import { useStudentStore } from "@shared/stores/student-store";
import { cn } from "@shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface Pill {
  key: string;
  label: string;
  emoji: string;
  href: string;
}

export function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, currentStudentId, setRole, setStudent } = useRoleStore();
  const { hydrate, hydrated, students } = useStudentStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const pills: Pill[] = [
    { key: "teacher", label: "Teacher", emoji: "👩‍🏫", href: "/teacher" },
    { key: "maya", label: "Maya", emoji: "🦋", href: "/student/maya" },
    { key: "liam", label: "Liam", emoji: "🚀", href: "/student/liam" },
  ];

  const activeKey = role === "teacher" ? "teacher" : currentStudentId ?? "maya";

  const onSelect = (p: Pill) => {
    if (p.key === "teacher") setRole("teacher");
    else setStudent(p.key);
    router.push(p.href);
  };

  // Sync role from URL on first mount
  useEffect(() => {
    if (pathname?.startsWith("/teacher")) setRole("teacher");
    else if (pathname?.startsWith("/student/")) {
      const id = pathname.split("/")[2];
      if (id && id !== currentStudentId) setStudent(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="flex items-center gap-2">
      {pills.map((p) => {
        const isActive = activeKey === p.key;
        const profile = students.find((s) => s.id === p.key);
        return (
          <Button
            asChild
            key={p.key}
            variant={isActive ? "enya_primary" : "enya_neutral"}
            size="sm"
          >
            <Link key={p.key} href={p.href} onClick={() => onSelect(p)}>
              <span aria-hidden>{profile?.avatarUrl ? "" : p.emoji}</span>
              {/* {profile?.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              )} */}
              <span>{p.label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
