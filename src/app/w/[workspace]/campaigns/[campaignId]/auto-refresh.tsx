"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-reads the page every few seconds while a search runs.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}

// The longest delay setTimeout takes (about 24.8 days); longer ones fire at once.
const MAX_DELAY = 2_147_483_647;

// After `at`, re-read every 30 s until the server shows the limit lifted.
const AFTER_EVERY = 30_000;

// Re-reads the page just after `at`: a paused campaign left open shows that
// its limit has lifted (and an owner's Resume search) without a reload. The
// page stops rendering this once the server agrees the pause is over, so the
// re-reads after `at` cover a browser clock ahead of the server's.
export function RefreshAt({ at }: { at: string }) {
  const router = useRouter();
  useEffect(() => {
    const target = new Date(at).getTime() + 2_000;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      const left = target - Date.now();
      if (left > 0) {
        // Waits longer than setTimeout allows are made in steps.
        timer = setTimeout(arm, Math.min(left, MAX_DELAY));
        return;
      }
      router.refresh();
      timer = setTimeout(arm, AFTER_EVERY);
    };
    arm();
    return () => clearTimeout(timer);
  }, [router, at]);
  return null;
}
