import { Crosshair, Layers } from "lucide-react";
import { TAILORING, type Tailoring } from "@/lib/tailoring";
import { cn } from "@/lib/utils";

// Tailored (accent, a crosshair: aimed at a specific gap) or General
// (neutral, layers: the general offer). Icon and word both, so it reads at
// 380px and without colour.
export function TailoringBadge({ tailoring, size = "sm", className }: { tailoring: Tailoring | null; size?: "sm" | "md"; className?: string }) {
  if (!tailoring) return null;
  const t = TAILORING[tailoring];
  const Icon = tailoring === "tailored" ? Crosshair : Layers;
  return (
    <span
      title={t.title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-semibold",
        size === "sm" ? "px-1.5 text-xs/[18px]" : "px-2.5 text-xs/[24px]",
        tailoring === "tailored" ? "bg-accent text-on-primary" : "border border-control bg-surface text-neutral-ink",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {t.word}
      <span className="sr-only">: {t.title}</span>
    </span>
  );
}
