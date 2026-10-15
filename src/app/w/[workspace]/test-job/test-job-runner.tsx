"use client";

import { useState } from "react";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { StartTestPipelineResponse } from "@/lib/api-types/pipeline";
import { goToLogin } from "@/lib/go-to-login";

const START_ERRORS: Record<number, string> = {
  // The page only renders this for owners, but a role can change mid-session.
  403: "Owners only. Your role in this workspace no longer allows starting the test job.",
};

export function TestJobRunner({ workspaceId, initialRunId }: { workspaceId: string; initialRunId: string | null }) {
  const [runId, setRunId] = useState(initialRunId);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/test-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const { run }: StartTestPipelineResponse = await res.json();
        setRunId(run.id);
        // So a reload comes back to the same run.
        window.history.replaceState(null, "", `?run=${run.id}`);
      } else {
        setError(START_ERRORS[res.status] ?? "The test job could not be started. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setStarting(false);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Test job</h1>
        <p className="text-sm text-muted-foreground">
          Queues the three-step demo pipeline in the worker. It uses the fake adapters only, so it costs nothing.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button className="h-11 w-full text-base sm:w-auto sm:self-start sm:px-5" disabled={starting} onClick={start}>
          {starting ? "Starting" : runId ? "Start another test job" : "Start test job"}
        </Button>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <ProgressPanel workspaceId={workspaceId} runId={runId} />
    </>
  );
}
