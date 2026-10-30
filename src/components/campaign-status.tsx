import { Check, CirclePause, CircleStop, FilePen, LoaderCircle, X } from "lucide-react";
import type { Campaign, CampaignStatus } from "@/lib/api-types/leads";
import { statusText } from "@/lib/leads";
import { cn } from "@/lib/utils";

const STYLE: Record<CampaignStatus, { icon: typeof Check; className: string }> = {
  draft: { icon: FilePen, className: "bg-raised text-muted" },
  running: { icon: LoaderCircle, className: "bg-neutral-soft text-neutral-ink" },
  paused: { icon: CirclePause, className: "bg-warning-soft text-warning-ink" },
  stopped: { icon: CircleStop, className: "bg-raised text-foreground" },
  done: { icon: Check, className: "bg-positive-soft text-positive-ink" },
  failed: { icon: X, className: "bg-negative-soft text-negative-ink" },
};

// A campaign's state as an icon and words, never colour alone: "Complete",
// "Paused until tomorrow, 08:00".
export function CampaignStatusBadge({ campaign, className }: { campaign: Pick<Campaign, "status" | "resumeAt">; className?: string }) {
  const { icon: Icon, className: tone } = STYLE[campaign.status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tone, className)}>
      <Icon className={cn("size-3.5 shrink-0", campaign.status === "running" && "animate-spin")} aria-hidden />
      {statusText(campaign)}
    </span>
  );
}
