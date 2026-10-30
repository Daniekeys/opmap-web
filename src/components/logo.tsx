import { cn } from "@/lib/utils";

// The 2x2 tile mark with the top-right tile lit, beside the wordmark.
export function TileMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" className={cn("size-5.5 shrink-0", className)} aria-hidden>
      <rect x="0" y="0" width="10" height="10" rx="2" className="fill-border" />
      <rect x="12" y="0" width="10" height="10" rx="2" className="fill-accent" />
      <rect x="0" y="12" width="10" height="10" rx="2" className="fill-border" />
      <rect x="12" y="12" width="10" height="10" rx="2" className="fill-border" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <TileMark />
      <span className="text-base font-bold tracking-[-0.01em]">Opportunity Map</span>
    </span>
  );
}
