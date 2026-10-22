"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { PipelineRunDetailResponse, StepRun } from "@/lib/api-types/pipeline";
import { formatDuration } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";

const POLL_MS = 1000;
// The worker retries a failed job (twice, 5 seconds apart) and the API does not
// say whether a failure is final, so a failed run is watched a little longer.
const WATCH_AFTER_FAILED_MS = 15_000;
// Failed requests in a row before polling gives up and offers a retry button.
const MAX_FETCH_FAILURES = 5;

type Poll = {
  data: PipelineRunDetailResponse | null;
  // When `data` was fetched; the clock for steps that are still running.
  at: number;
  problem: "not_found" | "unreachable" | null;
  polling: boolean;
};

type Finished = (status: "done" | "failed") => void;

// Live view of one pipeline run: polls the run and its step_runs until the run
// finishes. `runId` is null before a run has been started. `onFinished` is
// called once when polling stops on a finished run.
export function ProgressPanel({
  workspaceId,
  runId,
  onFinished,
}: {
  workspaceId: string;
  runId: string | null;
  onFinished?: Finished;
}) {
  return (
    <section aria-labelledby="progress-heading" className="flex flex-col gap-2">
      <h2 id="progress-heading" className="text-sm font-medium text-muted-foreground">
        Progress
      </h2>
      {runId ? (
        // Keyed, so a new run starts from a clean loading state.
        <RunProgress key={runId} workspaceId={workspaceId} runId={runId} onFinished={onFinished} />
      ) : (
        <Notice>No run yet. Start one and its steps will show up here.</Notice>
      )}
    </section>
  );
}

function RunProgress({ workspaceId, runId, onFinished }: { workspaceId: string; runId: string; onFinished?: Finished }) {
  const [poll, setPoll] = useState<Poll>({ data: null, at: 0, problem: null, polling: true });
  const [restarts, setRestarts] = useState(0);
  // Kept in a ref so a new callback from the parent doesn't restart polling.
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    finishedRef.current = onFinished;
  });

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fetchFailures = 0;
    let failedSince: number | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/w/${workspaceId}/pipeline-runs/${runId}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (res.status === 401) {
          goToLogin();
          return;
        }
        if (res.status === 404) {
          setPoll({ data: null, at: Date.now(), problem: "not_found", polling: false });
          return;
        }
        if (!res.ok) throw new Error(`API answered ${res.status}`);
        const data: PipelineRunDetailResponse = await res.json();
        if (controller.signal.aborted) return;

        const now = Date.now();
        fetchFailures = 0;
        failedSince = data.run.status === "failed" ? (failedSince ?? now) : null;
        // A run failed with an errorCode failed for good: the worker won't retry it.
        const finalFailure =
          data.run.status === "failed" && typeof (data.run.output as { errorCode?: unknown } | null)?.errorCode === "string";
        const finished =
          data.run.status === "done" ||
          finalFailure ||
          (failedSince !== null && now - failedSince >= WATCH_AFTER_FAILED_MS);
        setPoll({ data, at: now, problem: null, polling: !finished });
        if (!finished) timer = setTimeout(tick, POLL_MS);
        else finishedRef.current?.(data.run.status === "done" ? "done" : "failed");
      } catch {
        if (controller.signal.aborted) return;
        fetchFailures += 1;
        const polling = fetchFailures < MAX_FETCH_FAILURES;
        setPoll((previous) => ({ ...previous, problem: "unreachable", polling }));
        if (polling) timer = setTimeout(tick, POLL_MS * 2);
      }
    }

    tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [workspaceId, runId, restarts]);

  function retry() {
    setPoll((previous) => ({ ...previous, problem: null, polling: true }));
    setRestarts((n) => n + 1);
  }

  const { data, at, problem, polling } = poll;

  if (problem === "not_found") {
    return <Notice tone="error">This run was not found in this workspace.</Notice>;
  }

  const connection = problem === "unreachable" && (
    <Notice tone="error">
      {polling ? "Could not reach the server. Trying again." : "Could not reach the server. Updates have stopped."}
      {!polling && (
        <Button variant="outline" className="mt-3 h-11 w-full px-4 sm:w-auto" onClick={retry}>
          Try again
        </Button>
      )}
    </Notice>
  );

  if (!data) {
    return (
      connection || (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4" role="status" aria-label="Loading run">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
        </div>
      )
    );
  }

  const { run, steps } = data;
  const finishedSteps = steps.filter((step) => step.status === "done").length;
  const runMs = run.durationMs ?? (run.status === "done" ? null : at - Date.parse(run.createdAt));

  return (
    <div className="flex flex-col gap-2">
      {connection}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium capitalize">{run.type} run</p>
            <p className="text-sm text-muted-foreground">
              {finishedSteps} {finishedSteps === 1 ? "step" : "steps"} done
              {runMs !== null && `, ${formatDuration(runMs)}`}
            </p>
          </div>
          <StatusBadge status={run.status} />
        </div>

        {run.status === "failed" && (
          <p className="border-b bg-destructive/5 px-4 py-3 text-sm wrap-break-word text-destructive">
            {run.error ?? "The run failed."}
            {polling && " The worker may retry it, so this is still being watched."}
          </p>
        )}

        {steps.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {run.status === "queued"
              ? "Waiting for the worker to pick this run up."
              : run.status === "running"
                ? "The run has started. No steps logged yet."
                : "This run finished without logging any steps."}
          </p>
        ) : (
          <ol className="divide-y" aria-live="polite">
            {steps.map((step, index) => (
              <StepRow key={step.id} step={step} number={index + 1} now={at} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function StepRow({ step, number, now }: { step: StepRun; number: number; now: number }) {
  // A finished step has its saved duration. A running one counts up from when
  // it started, which is only known for its first attempt.
  const ms =
    step.durationMs ?? (step.status === "running" && step.attempts === 1 ? now - Date.parse(step.createdAt) : null);

  return (
    <li className="flex min-h-11 items-start gap-3 px-4 py-3">
      <span className="w-5 shrink-0 pt-0.5 text-sm text-muted-foreground tabular-nums">{number}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium wrap-break-word">{step.name}</p>
        {step.attempts > 1 && <p className="text-sm text-muted-foreground">Attempt {step.attempts}</p>}
        {step.error && <p className="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-destructive">{step.error}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={step.status} />
        {ms !== null && <span className="text-sm text-muted-foreground tabular-nums">{formatDuration(ms)}</span>}
      </div>
    </li>
  );
}

function Notice({ tone = "muted", children }: { tone?: "muted" | "error"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={
        tone === "error"
          ? "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive"
          : "rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground"
      }
    >
      {children}
    </div>
  );
}
