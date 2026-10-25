import { Check, CirclePause, FilePen, LoaderCircle, X } from "lucide-react";
import type { Campaign, CampaignStatus } from "@/lib/api-types/leads";
import { statusText } from "@/lib/leads";
import { cn } from "@/lib/utils";

const STYLE: Record<CampaignStatus, { icon: typeof Check; className: string }> = {
  draft: { icon: FilePen, className: "bg-muted text-muted-foreground" },
  running: { icon: LoaderCircle, className: "bg-sky-100 text-sky-800" },
  paused: { icon: CirclePause, className: "bg-amber-100 text-amber-900" },
  done: { icon: Check, className: "bg-emerald-100 text-emerald-800" },
  failed: { icon: X, className: "bg-destructive/10 text-destructive" },
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
