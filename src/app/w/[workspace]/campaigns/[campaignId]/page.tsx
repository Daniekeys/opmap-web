import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CampaignStatusBadge } from "@/components/campaign-status";
import { PageLoading } from "@/components/page-loading";
import { getCampaign, getCampaignEstimate, getCampaignLeads, getWorkspace } from "@/lib/api";
import type { Campaign } from "@/lib/api-types/leads";
import { pausedUntil, TARGET_KINDS } from "@/lib/leads";
import { AutoRefresh } from "./auto-refresh";
import { ConfirmPanel } from "./confirm-panel";
import { LeadsList } from "./leads-list";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]">;

// One campaign: where its search stands, the confirm button with its cost
// while it is a draft, and its leads.
export default function CampaignPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <CampaignView params={params} />
    </Suspense>
  );
}

async function CampaignView({ params }: { params: Props["params"] }) {
  const { workspace: slug, campaignId } = await params;
  const workspace = await getWorkspace(slug);
  const [{ campaign, possibleCount }, { leads }] = await Promise.all([
    getCampaign(workspace.id, campaignId),
    getCampaignLeads(workspace.id, campaignId),
  ]);
  const startable = campaign.status === "draft" || campaign.status === "failed";
  const estimate = startable ? await getCampaignEstimate(workspace.id, campaignId) : null;
  const kind = TARGET_KINDS.find((t) => t.kind === campaign.targetKind);

  return (
    <>
      <Link
        href={`/w/${slug}/campaigns`}
        className="-mt-2 -ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Campaigns
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">{campaign.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CampaignStatusBadge campaign={campaign} />
          {kind && <span>{kind.label}</span>}
          <span>Searching for: {campaign.queries.join(", ")}</span>
        </div>
      </div>

      <StatusNote campaign={campaign} leadCount={leads.length} />
      {campaign.status === "running" && <AutoRefresh seconds={15} />}

      {estimate && (
        <ConfirmPanel
          workspaceId={workspace.id}
          campaignId={campaign.id}
          isOwner={workspace.role === "owner"}
          estimate={estimate}
          supported={kind?.supported ?? true}
        />
      )}

      <LeadsList
        key={campaign.id}
        workspaceId={workspace.id}
        campaignId={campaign.id}
        leads={leads}
        possibleCount={possibleCount}
        searched={!startable}
      />
    </>
  );
}

// What the campaign's state means for the user, in a sentence.
function StatusNote({ campaign, leadCount }: { campaign: Campaign; leadCount: number }) {
  if (campaign.status === "paused") {
    return (
      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">
          Paused until {campaign.resumeAt ? pausedUntil(campaign.resumeAt) : "the limit resets"} (Lagos time)
        </p>
        <p className="mt-1">
          {campaign.pauseReason ?? "Today's Google searches are used up."} It carries on by itself; the {leadCount}{" "}
          {leadCount === 1 ? "lead" : "leads"} found so far are below.
        </p>
      </div>
    );
  }
  if (campaign.status === "done") {
    return (
      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Complete. The search covered every place in this campaign and found {leadCount} {leadCount === 1 ? "lead" : "leads"} that fit.
      </p>
    );
  }
  if (campaign.status === "running") {
    return (
      <p role="status" className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Searching. Leads appear here as they are found and checked; this page updates by itself.
      </p>
    );
  }
  if (campaign.status === "failed") {
    return (
      <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        The search stopped with an error. What it found is kept below; an owner can start it again.
      </p>
    );
  }
  return null;
}
