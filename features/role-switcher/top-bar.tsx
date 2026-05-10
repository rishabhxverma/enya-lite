import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500">
            <Sparkles className="w-4 h-4 text-yellow-950" />
          </span>
          <span>Enya</span>
          <span className="text-muted-foreground text-sm font-medium">
            Lite
          </span>
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}
