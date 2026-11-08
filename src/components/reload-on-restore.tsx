"use client";

import { useEffect } from "react";

// A page the browser restores from its back/forward cache skips the server,
// so after signing out, Back could show the signed-in screen as it was.
// Reload it instead: the proxy and the API decide again.
export function ReloadOnRestore() {
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return null;
}
