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

// Re-reads the page once, just after `at`: a paused campaign left open shows
// that its limit has lifted (and an owner's Resume search) without a reload.
export function RefreshAt({ at }: { at: string }) {
  const router = useRouter();
  useEffect(() => {
    const delay = new Date(at).getTime() - Date.now() + 2_000;
    const timer = setTimeout(() => router.refresh(), Math.min(Math.max(delay, 0), MAX_DELAY));
    return () => clearTimeout(timer);
  }, [router, at]);
  return null;
}
