import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getShares, getWorkspace } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ShareActions } from "./share-actions";

type Props = PageProps<"/w/[workspace]/shared">;

// Owners only: every campaign shared by link, live or turned off, with its
// views, so it's easy to see what has been shared and stop a link.
export default function SharedCampaignsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Shared params={params} />
    </Suspense>
  );
}

const pill = "inline-flex shrink-0 items-center rounded-full px-2 text-xs/[22px] font-medium";

async function Shared({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);
  const heading = (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Shared campaigns</h1>
      <p className="text-sm text-muted">Campaigns shared by link. Anyone with a live link can see that campaign&apos;s leads and messages, read-only.</p>
    </div>
  );
  if (workspace.role !== "owner") {
    return (
      <>
        {heading}
        <p role="alert" className="rounded-lg bg-raised px-3 py-2 text-sm">
          Owners only. Ask an owner of {workspace.name} for a campaign&apos;s link.
        </p>
      </>
    );
  }
  const { shares } = await getShares(workspace.id);
  const zone = workspace.timeZone;
  const campaignHref = (id: string) => `/w/${workspace.slug}/campaigns/${id}`;

  return (
    <>
      {heading}
      {shares.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Nothing shared yet. Open a campaign with leads and use Share or download.
        </p>
      ) : (
        <>
          {/* Phones: one card per link. */}
          <ul className="flex flex-col gap-3 md:hidden" aria-label="Shared campaigns">
            {shares.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-card border border-border bg-surface px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <Link href={campaignHref(s.campaignId)} className="min-w-0 font-medium wrap-break-word hover:underline">
                    {s.campaignName}
                  </Link>
                  <span className={cn(pill, s.revokedAt ? "bg-neutral-soft text-neutral-ink" : "bg-positive-soft text-positive-ink")}>{s.revokedAt ? "Turned off" : "Live"}</span>
                </div>
                <p className="text-muted">
                  Shared {formatDateTime(s.createdAt, zone)} · Downloads {s.allowDownloads ? "on" : "off"} · Opened {s.viewCount} {s.viewCount === 1 ? "time" : "times"}
                </p>
                {!s.revokedAt && <ShareActions workspaceId={workspace.id} campaignId={s.campaignId} link={s.link} />}
              </li>
            ))}
          </ul>
          {/* Wider screens: a table. */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Campaign</th>
                  <th className="px-4 py-2.5 font-medium">Shared</th>
                  <th className="px-4 py-2.5 font-medium">Link</th>
                  <th className="px-4 py-2.5 font-medium">Downloads</th>
                  <th className="px-4 py-2.5 font-medium">Opened</th>
                  <th className="px-4 py-2.5 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id} className="border-b border-rule last:border-b-0">
                    <td className="max-w-64 px-4 py-3">
                      <Link href={campaignHref(s.campaignId)} className="font-medium wrap-break-word hover:underline">
                        {s.campaignName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(s.createdAt, zone)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(pill, s.revokedAt ? "bg-neutral-soft text-neutral-ink" : "bg-positive-soft text-positive-ink")}>
                        {s.revokedAt ? "Turned off" : "Live"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{s.allowDownloads ? "On" : "Off"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted tabular-nums">
                      {s.viewCount} {s.viewCount === 1 ? "time" : "times"}
                      {s.lastViewedAt ? `, last ${formatDateTime(s.lastViewedAt, zone)}` : ""}
                    </td>
                    <td className="px-4 py-3">{!s.revokedAt && <ShareActions workspaceId={workspace.id} campaignId={s.campaignId} link={s.link} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
