import Link from "next/link";
import { Suspense } from "react";
import { CampaignStatusBadge } from "@/components/campaign-status";
import { getCampaign, getCampaignLeads, getPipeline, getWorkspace } from "@/lib/api";
import type { Stage } from "@/lib/api-types/outcomes";
import { findingSentence } from "@/lib/campaign-view";
import { cn } from "@/lib/utils";
import { CampaignFrame } from "./campaign-frame";
import { LeadRail } from "./lead-rail";

type Props = LayoutProps<"/w/[workspace]/campaigns/[campaignId]">;

// A campaign's workspace (design/screens/Main.dc.html): its title, the one
// finding that matters, its figures, the list of its leads, and beside it
// whatever is open (the campaign itself, a lead, or the pipeline).
export default function CampaignLayout({ params, children }: Props) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <Workspace params={params}>{children}</Workspace>
    </Suspense>
  );
}

async function Workspace({ params, children }: { params: Props["params"]; children: React.ReactNode }) {
  const { workspace: slug, campaignId } = await params;
  const workspace = await getWorkspace(slug);
  const [{ campaign, possibleCount }, { leads }, pipeline] = await Promise.all([
    getCampaign(workspace.id, campaignId),
    getCampaignLeads(workspace.id, campaignId),
    getPipeline(workspace.id, campaignId),
  ]);
  const stages: Record<string, Stage> = {};
  for (const s of pipeline.stages) for (const l of s.leads) stages[l.leadId] = s.stage;
  const count = (wanted: Stage[]) => pipeline.stages.filter((s) => wanted.includes(s.stage)).reduce((n, s) => n + s.count, 0);
  const base = `/w/${slug}/campaigns/${campaign.id}`;
  const messaged = count(["sent", "replied", "meeting", "won", "lost"]);
  const replied = count(["replied", "meeting", "won"]);
  const meetings = count(["meeting", "won"]);

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] wrap-break-word sm:text-title sm:tracking-[-0.02em]">{campaign.name}</h1>
          <CampaignStatusBadge campaign={campaign} />
        </div>
        <p className="text-sm text-muted sm:text-body">{findingSentence({ leads, stages, status: campaign.status })}</p>
      </div>
      {leads.length > 0 && (
        <Link
          href={`${base}/pipeline`}
          className="inline-flex h-11 shrink-0 items-center rounded-control border border-control bg-surface px-3.5 text-sm font-medium hover:bg-raised sm:h-9"
        >
          Replies and deals
        </Link>
      )}
    </div>
  );

  const stats = (
    <section aria-label="Campaign figures" className="grid grid-cols-3 rounded-card border border-border bg-surface sm:grid-cols-4">
      <Figure label="Good fits" value={leads.length} note={`of ${leads.length + possibleCount} found`} />
      <Figure label="Researched" value={leads.filter((l) => l.researched).length} note="opened so far" className="hidden sm:flex" />
      <Figure label="Messaged" value={messaged} note={messaged === 1 ? "business" : "businesses"} />
      <Figure
        label="Replied"
        value={replied}
        of={messaged > 0 ? `of ${messaged}` : undefined}
        note={meetings > 0 ? `${meetings} ${meetings === 1 ? "meeting" : "meetings"} booked` : "no meetings yet"}
        noteClass={meetings > 0 ? "text-positive" : undefined}
      />
    </section>
  );

  return (
    <CampaignFrame
      base={base}
      header={header}
      stats={stats}
      rail={<LeadRail base={base} leads={leads} stages={stages} searched={campaign.status !== "draft" && campaign.status !== "failed"} />}
      paneFirst={campaign.status === "running" || campaign.status === "paused"}
    >
      {children}
    </CampaignFrame>
  );
}

// A figure: small muted label, big tabular number, and a short note.
function Figure({ label, value, of, note, noteClass, className }: { label: string; value: number; of?: string; note: string; noteClass?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 border-l border-rule px-3 py-2.5 first:border-l-0 sm:px-5 sm:py-4.5", className)}>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[20px] leading-[26px] font-medium tabular-nums sm:text-figure">
        {value}
        {of && <span className="ml-1 text-sm font-normal text-muted sm:text-body">{of}</span>}
      </span>
      <span className={cn("hidden truncate text-xs text-muted sm:block", noteClass)}>{note}</span>
    </div>
  );
}

function WorkspaceLoading() {
  return (
    <div className="flex w-full max-w-workspace flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 animate-pulse rounded-control bg-raised" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-control bg-raised" />
      </div>
      <div className="h-24 animate-pulse rounded-card bg-raised" />
      <div className="flex gap-6">
        <div className="h-96 w-full animate-pulse rounded-card bg-raised lg:w-list" />
        <div className="hidden h-96 flex-1 animate-pulse rounded-card bg-raised lg:block" />
      </div>
    </div>
  );
}
