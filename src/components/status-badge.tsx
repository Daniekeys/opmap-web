import { Check, Clock, LoaderCircle, X } from "lucide-react";
import type { RunStatus } from "@/lib/api-types/pipeline";
import { cn } from "@/lib/utils";

const STATUS: Record<RunStatus, { label: string; icon: typeof Check; className: string }> = {
  queued: { label: "Queued", icon: Clock, className: "bg-muted text-muted-foreground" },
  running: { label: "Running", icon: LoaderCircle, className: "bg-sky-100 text-sky-800" },
  done: { label: "Done", icon: Check, className: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Failed", icon: X, className: "bg-destructive/10 text-destructive" },
};

// Status of a pipeline run or one of its steps: always an icon and a word,
// never colour alone.
export function StatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3.5", status === "running" && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}
