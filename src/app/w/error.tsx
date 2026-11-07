"use client";

import { ErrorScreen } from "@/components/error-screen";

// The workspace shell itself failed (its sidebar reads the session, campaigns
// and messages): the whole page is the error, with Retry and the request id.
export default function WorkspaceShellError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} fullPage />;
}
