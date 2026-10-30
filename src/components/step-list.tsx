import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The step marks of design/screens/Progress.dc.html: a filled green dot when
// done, a raspberry ring while running, an empty ring while waiting, a red dot
// when failed, and a dashed ring for a step that wasn't needed.
export type StepMarkState = "done" | "running" | "waiting" | "failed" | "skipped";

const MARKS: Record<StepMarkState, string> = {
  done: "border-positive bg-positive",
  running: "border-accent bg-surface motion-safe:animate-pulse",
  waiting: "border-control bg-surface",
  failed: "border-negative bg-negative",
  skipped: "border-dashed border-control bg-surface",
};

const STATE_TONES: Record<StepMarkState, string> = {
  done: "text-positive",
  running: "text-accent-ink",
  waiting: "text-muted",
  failed: "text-negative-ink",
  skipped: "text-muted",
};

export type StepItem = { id: string; title: string; state: StepMarkState; stateText: string; detail?: ReactNode };

// A vertical list of steps, each with its mark, its state in words and a
// line on what it did. The marks are joined by a thin rule.
export function StepList({ steps, live }: { steps: StepItem[]; live?: boolean }) {
  return (
    <ol className="flex flex-col" aria-live={live ? "polite" : undefined}>
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-3">
          <span className="flex flex-col items-center pt-1" aria-hidden>
            <span className={cn("size-3.5 shrink-0 rounded-full border-2", MARKS[s.state])} />
            {i < steps.length - 1 && <span className="min-h-5 w-px flex-1 bg-border" />}
          </span>
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", i < steps.length - 1 && "pb-4.5")}>
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold wrap-break-word">{s.title}</span>
              <span className={cn("shrink-0 text-xs", STATE_TONES[s.state])}>{s.stateText}</span>
            </p>
            {s.detail && <div className="text-sm text-muted">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
