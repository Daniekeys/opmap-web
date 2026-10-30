import { Check, Clock, LoaderCircle, X } from "lucide-react";
import type { RunStatus } from "@/lib/api-types/pipeline";
import { cn } from "@/lib/utils";

const STATUS: Record<RunStatus, { label: string; icon: typeof Check; className: string }> = {
  queued: { label: "Waiting", icon: Clock, className: "bg-neutral-soft text-neutral-ink" },
  running: { label: "Running", icon: LoaderCircle, className: "bg-accent-soft text-accent-ink" },
  done: { label: "Done", icon: Check, className: "bg-positive-soft text-positive-ink" },
  failed: { label: "Failed", icon: X, className: "bg-negative-soft text-negative-ink" },
};

// Status of a pipeline run or one of its steps: a pale pill with an icon and a
// word, never colour alone.
export function StatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 text-xs/[22px] font-medium", tone, className)}>
      <Icon className={cn("size-3.5", status === "running" && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}
