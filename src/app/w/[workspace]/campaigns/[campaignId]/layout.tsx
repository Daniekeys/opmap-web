import { ChevronLeft, MapPin, MessageSquareReply, Search, SquareKanban, Sparkles, Store, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CampaignStatusBadge } from "@/components/campaign-status";
import { PageLoading } from "@/components/page-loading";
import { getCampaign, getCampaignLeads, getPipeline, getWorkspace } from "@/lib/api";
import type { Stage } from "@/lib/api-types/outcomes";
import { TARGET_KINDS } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { CampaignFrame } from "./campaign-frame";
import { LeadRail } from "./lead-rail";

type Props = LayoutProps<"/w/[workspace]/campaigns/[campaignId]">;

// A campaign's workspace: its header and numbers, the list of its leads, and
// beside it whatever is open (the campaign itself, a lead, or the pipeline).
export default function CampaignLayout({ params, children }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Workspace params={params}>{children}</Workspace>
    </Suspense>
  );
}

async function Workspace({ params, children }: { params: Props["params"]; children: React.ReactNode }) {
  const { workspace: slug, campaignId } = await params;
  const workspace = await getWorkspace(slug);
  const [{ campaign }, { leads }, pipeline] = await Promise.all([
    getCampaign(workspace.id, campaignId),
    getCampaignLeads(workspace.id, campaignId),
    getPipeline(workspace.id, campaignId),
  ]);
  const stages: Record<string, Stage> = {};
  for (const s of pipeline.stages) for (const l of s.leads) stages[l.leadId] = s.stage;
  const count = (wanted: Stage[]) => pipeline.stages.filter((s) => wanted.includes(s.stage)).reduce((n, s) => n + s.count, 0);
  const kind = TARGET_KINDS.find((t) => t.kind === campaign.targetKind);
  const base = `/w/${slug}/campaigns/${campaign.id}`;
  const budget = campaign.settings.maxCalls;

  const header = (
    <div className="flex flex-col gap-5">
      <Link
        href={`/w/${slug}/campaigns`}
        className="-mt-2 -ml-2 inline-flex h-9 items-center gap-1 self-start px-2 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> All campaigns
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">{campaign.name}</h1>
            <CampaignStatusBadge campaign={campaign} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {kind && <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">{kind.label}</span>}
            {campaign.queries.map((q) => (
              <span key={q} className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-muted">
                <Search className="size-3" aria-hidden /> {q}
              </span>
            ))}
            {campaign.locations.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-muted">
                <MapPin className="size-3" aria-hidden /> {l.name}
              </span>
            ))}
          </div>
        </div>
        {leads.length > 0 && (
          <Link
            href={`${base}/pipeline`}
            className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl border bg-card px-4 text-sm font-medium hover:bg-raised"
          >
            <SquareKanban className="size-4 text-accent-ink" aria-hidden /> Pipeline
          </Link>
        )}
      </div>
    </div>
  );

  const stats = (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Store className="size-4" />} tone="" label="Leads" value={leads.length} />
        <Stat icon={<Sparkles className="size-4" />} tone="" label="Researched" value={leads.filter((l) => l.researched).length} />
        <Stat icon={<Users className="size-4" />} tone="" label="Contacted" value={count(["sent", "replied", "meeting", "won", "lost"])} />
        <Stat icon={<MessageSquareReply className="size-4" />} tone="" label="Replied or better" value={count(["replied", "meeting", "won"])} />
      </div>
      <p className="text-xs text-muted">
        {campaign.callsUsed}
        {budget !== null ? ` of ${budget}` : ""} Google {campaign.callsUsed === 1 ? "search" : "searches"} used
      </p>
    </div>
  );

  return (
    <CampaignFrame
      base={base}
      header={header}
      stats={stats}
      rail={<LeadRail base={base} leads={leads} stages={stages} searched={campaign.status !== "draft" && campaign.status !== "failed"} />}
    >
      {children}
    </CampaignFrame>
  );
}

function Stat({ icon, tone, label, value }: { icon: React.ReactNode; tone: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4">
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised text-ink", tone)} aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xl font-semibold tabular-nums leading-tight">{value}</span>
        <span className="truncate text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}
