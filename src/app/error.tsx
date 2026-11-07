"use client";

import { ErrorScreen } from "@/components/error-screen";

// Anything outside a workspace (the start page, a new workspace, an invite).
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} fullPage />;
}
