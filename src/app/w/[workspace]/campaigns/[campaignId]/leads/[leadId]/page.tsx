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
        className="-mt-2 -ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm text-muted hover:text-foreground lg:hidden"
      >
        <ChevronLeft className="size-4" aria-hidden /> All businesses
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
      <div className="h-40 animate-pulse rounded-2xl bg-raised" />
      <div className="h-12 animate-pulse rounded-xl bg-raised" />
      <div className="h-64 animate-pulse rounded-2xl bg-raised" />
    </div>
  );
}
