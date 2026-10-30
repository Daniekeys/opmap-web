import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { CampaignStatusBadge } from "@/components/campaign-status";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace, listCampaigns } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type Props = PageProps<"/w/[workspace]/campaigns">;

// The workspace's lead-finding campaigns, newest first.
export default function CampaignsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Campaigns params={params} />
    </Suspense>
  );
}

async function Campaigns({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);
  const { campaigns } = await listCampaigns(workspace.id);
  const base = `/w/${workspace.slug}/campaigns`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Find local businesses by type and place, with their contacts checked and labelled.</p>
        </div>
        <Link
          href={`${base}/new`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 shadow-md shadow-primary/25 text-base font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="size-4" aria-hidden />
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No campaigns yet. Start one to find businesses to contact.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link href={`${base}/${c.id}`} className="flex h-full min-h-11 items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md">
                <Avatar name={c.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-semibold wrap-break-word">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <CampaignStatusBadge campaign={c} />
                    <span>
                      {c.leadCount} {c.leadCount === 1 ? "lead" : "leads"}
                    </span>
                    <span>Created {formatDateTime(c.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
