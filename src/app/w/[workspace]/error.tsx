"use client";

import { ErrorScreen } from "@/components/error-screen";

// An API failure in this section: plain words, Retry and the request id, inside
// the app shell (components/error-screen.tsx).
export default function SectionError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
