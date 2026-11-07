"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { errorScreenText, readApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

// What every error.tsx shows: what happened in plain words, Retry (re-renders
// the section, fetching again), and the API's request id when there is one, so
// the log line can be found. `fullPage` when the shell itself failed.
export function ErrorScreen({ error, retry, fullPage = false }: { error: unknown; retry: () => void; fullPage?: boolean }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const info = readApiError(error);
  const { title, body } = errorScreenText(info);
  const Tag = fullPage ? "main" : "section";
  return (
    <Tag
      role="alert"
      aria-labelledby="error-heading"
      className={cn("flex flex-col gap-3", fullPage ? "mx-auto w-full max-w-sm flex-1 justify-center px-4 py-10" : "max-w-read py-2")}
    >
      <h1 id="error-heading" className="text-xl font-semibold">
        {title}
      </h1>
      <p className="text-sm text-muted">{body}</p>
      {info.requestId && (
        <p className="text-sm text-muted wrap-break-word">
          Quote this request id when you report it:{" "}
          <code className="rounded-control bg-raised px-1.5 py-0.5 font-mono text-ink select-all">{info.requestId}</code>
        </p>
      )}
      <Button className="h-11 self-start px-4" onClick={() => retry()}>
        Retry
      </Button>
    </Tag>
  );
}
