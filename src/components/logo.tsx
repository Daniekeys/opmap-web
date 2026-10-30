import { cn } from "@/lib/utils";

// The mark: a pin on a map grid, in the brand gradient.
export function Logo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="size-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 21s-6-5.3-6-10.2A6 6 0 0 1 18 10.8C18 15.7 12 21 12 21Z" />
          <circle cx="12" cy="10.5" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={cn("text-[15px] font-semibold tracking-tight", onDark ? "text-white" : "text-foreground")}>Opportunity Map</span>
    </span>
  );
}
