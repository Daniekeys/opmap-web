import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getCampaignLeads, getLeadOutreach, getLeadResearch, getWorkspace } from "@/lib/api";
import { LeadView } from "./lead-view";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]/leads/[leadId]">;

// One lead: who they are, the deep-dive's opportunity cards, the messages
// written from them and the outcome buttons. The first view starts the
// deep-dive (LeadView); after that the saved cards and messages load free.
export default function LeadPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailLoading />}>
      <LeadPageView params={params} />
    </Suspense>
  );
}

async function LeadPageView({ params }: { params: Props["params"] }) {
  const { workspace: slug, campaignId, leadId } = await params;
  const workspace = await getWorkspace(slug);
  // The list's row (shared with the campaign layout's read) has every contact
  // point with its label; the research has the cards.
  const [research, outreach, { leads }] = await Promise.all([
    getLeadResearch(workspace.id, campaignId, leadId),
    getLeadOutreach(workspace.id, campaignId, leadId),
    getCampaignLeads(workspace.id, campaignId),
  ]);
  return (
    <>
      <Link
        href={`/w/${slug}/campaigns/${campaignId}`}
        className="-mt-1 -ml-1.5 inline-flex h-11 items-center gap-0.5 self-start pr-2 text-body font-medium text-ink lg:hidden"
      >
        <ChevronLeft className="size-5.5" strokeWidth={1.75} aria-hidden /> Leads
      </Link>
      <LeadView
        key={leadId}
        workspaceId={workspace.id}
        slug={slug}
        campaignId={campaignId}
        initial={research}
        initialOutreach={outreach}
        listLead={leads.find((l) => l.leadId === leadId) ?? null}
      />
    </>
  );
}

function DetailLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="flex items-center gap-3.5">
        <div className="size-12 animate-pulse rounded-control bg-raised" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-5 w-1/2 animate-pulse rounded-control bg-raised" />
          <div className="h-4 w-1/3 animate-pulse rounded-control bg-raised" />
        </div>
      </div>
      <div className="h-11 animate-pulse rounded-control bg-raised" />
      <div className="h-64 animate-pulse rounded-card bg-raised" />
    </div>
  );
}
