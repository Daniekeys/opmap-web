import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getLeadResearch, getWorkspace } from "@/lib/api";
import { LeadView } from "./lead-view";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]/leads/[leadId]">;

// One lead: who they are, and the deep-dive's opportunity cards. The first
// view starts the deep-dive (LeadView); after that the saved cards load free.
export default function LeadPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <LeadPageView params={params} />
    </Suspense>
  );
}

async function LeadPageView({ params }: { params: Props["params"] }) {
  const { workspace: slug, campaignId, leadId } = await params;
  const workspace = await getWorkspace(slug);
  const research = await getLeadResearch(workspace.id, campaignId, leadId);
  return (
    <>
      <Link
        href={`/w/${slug}/campaigns/${campaignId}`}
        className="-mt-2 -ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Campaign
      </Link>
      <LeadView key={leadId} workspaceId={workspace.id} slug={slug} campaignId={campaignId} initial={research} />
    </>
  );
}
