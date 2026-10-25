import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace } from "@/lib/api";
import { CampaignForm } from "./campaign-form";

type Props = PageProps<"/w/[workspace]/campaigns/new">;

// Step one of a campaign: what to look for and where. Saving makes a draft;
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
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">New campaign</h1>
        <p className="text-sm text-muted-foreground">
          Say what kind of business you want and where. You&apos;ll see what the search costs before anything runs.
        </p>
      </div>
      <CampaignForm workspaceId={workspace.id} slug={workspace.slug} />
    </>
  );
}
