import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace } from "@/lib/api";
import { NewCampaign as Flow } from "./new-campaign";

type Props = PageProps<"/w/[workspace]/campaigns/new">;

// Step one of a campaign: pick a buyer segment suggested from the Brand DNA
// (or describe your own), edit it, and choose places. Each step has its own
// title. Saving makes a draft;
// nothing is searched until it is confirmed on the campaign page.
export default function NewCampaignPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewCampaign params={params} />
    </Suspense>
  );
}

async function NewCampaign({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);
  return <Flow workspaceId={workspace.id} slug={workspace.slug} />;
}
