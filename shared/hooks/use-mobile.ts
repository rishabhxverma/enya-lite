"use client";

import * as React from "react";

// Tracks viewport width against the Tailwind `md` breakpoint. Used by the
// shadcn Sidebar primitive (which is in the codebase but not currently
// rendered — keeps the component file compiling).
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () =>
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
