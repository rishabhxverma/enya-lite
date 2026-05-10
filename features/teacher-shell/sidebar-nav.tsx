"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  BookOpen,
  Library,
  Users,
  School,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@shared/lib/utils";

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Section {
  heading: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    heading: "TEACH",
    items: [
      { href: "/teacher", label: "Chat", icon: MessageCircle },
      { href: "/teacher/courses", label: "Courses", icon: BookOpen },
      { href: "/teacher/resources", label: "Resources", icon: Library },
    ],
  },
  {
    heading: "MANAGE",
    items: [
      { href: "/teacher/classroom", label: "Classroom", icon: School },
      { href: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/teacher" ? pathname === "/teacher" : pathname?.startsWith(href);

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r bg-white text-sidebar-foreground h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 overflow-auto p-4 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <div className="text-xs font-semibold tracking-wider text-muted-foreground px-3 mb-2">
              {section.heading}
            </div>
            <ul className="space-y-1">
              {section.items.map((it) => {
                const Icon = it.icon;
                const active = isActive(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 px-3 h-9 rounded-md text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/40"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
