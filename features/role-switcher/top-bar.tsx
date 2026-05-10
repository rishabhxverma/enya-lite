import Link from "next/link";
import { RoleSwitcher } from "./role-switcher";
import Image from "next/image";

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="h-full px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xl"
        >
          <Image
            width={28}
            height={28}
            alt="Enya Logo Icon"
            src={"/enya_icon.svg"}
          />
          <span>Enya Lite</span>
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}
