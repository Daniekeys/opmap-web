import { ChevronDown } from "lucide-react";
import { Fragment, Suspense } from "react";
import { Container } from "@/components/container";
import { TileMark } from "@/components/logo";
import { PageLoading } from "@/components/page-loading";
import { getCampaign, getCampaignEstimate, getCampaignLeads, getWorkspace } from "@/lib/api";
import type { Campaign } from "@/lib/api-types/leads";
import { pausedUntil, resumeDue, TARGET_KINDS } from "@/lib/leads";
import { AutoRefresh, RefreshAt } from "./auto-refresh";
import { ConfirmPanel } from "./confirm-panel";
import { EditCampaign } from "./edit-campaign";
import { Possibles } from "./possibles";
import { ResumeButton } from "./resume-button";
import { StopButton } from "./stop-button";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]">;

// One campaign, beside its list of leads (the layout): where its search
// stands (with Stop search while it runs or waits), the confirm button with
// its cost and settings while it is a draft or stopped, the edit panel
// whenever it is not searching, and the businesses it was unsure about.
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
  const startable = campaign.status === "draft" || campaign.status === "failed" || campaign.status === "stopped";
  const editable = startable || campaign.status === "paused";
  const isOwner = workspace.role === "owner";
  const estimate = startable ? await getCampaignEstimate(workspace.id, campaignId) : null;
  const kind = TARGET_KINDS.find((t) => t.kind === campaign.targetKind);

  return (
    <>
      <StatusNote campaign={campaign} leadCount={leads.length} workspaceId={workspace.id} isOwner={isOwner} />
      {leads.length > 0 && <PickHint count={leads.length} />}
      {campaign.status === "running" && <AutoRefresh seconds={15} />}

      <Container size="read" className="flex flex-col gap-5 empty:hidden">
        {estimate && (
          <ConfirmPanel
            key={`confirm:${editKey(campaign)}`}
            workspaceId={workspace.id}
            campaignId={campaign.id}
            isOwner={isOwner}
            estimate={estimate}
            supported={kind?.supported ?? true}
            continuing={campaign.status === "stopped"}
          />
        )}

        {editable && isOwner && (
          <EditCampaign
            key={`edit:${editKey(campaign)}`}
            workspaceId={workspace.id}
            campaign={campaign}
            withSettings={campaign.status === "paused"}
          />
        )}
      </Container>

      <SearchSummary campaign={campaign} />
      <NameWordsPanel campaign={campaign} />
      {campaign.status !== "draft" && <Possibles workspaceId={workspace.id} campaignId={campaign.id} count={possibleCount} />}
    </>
  );
}

// From 1024px the list sits beside this pane: nothing is opened for the user,
// since opening a lead that isn't researched yet starts its paid deep-dive.
function PickHint({ count }: { count: number }) {
  return (
    <div className="hidden flex-col gap-3 rounded-card border border-border bg-surface px-6 py-8 lg:flex">
      <TileMark className="size-8" />
      <h2 className="text-section font-semibold">Pick a business to see its opportunity</h2>
      <p className="max-w-lg text-muted">
        {count} {count === 1 ? "business" : "businesses"} on the left, best fit first. Opening one for the first time researches it, which takes about a minute
        and a few cents. After that it opens for free, with messages you can send on WhatsApp, email or a call.
      </p>
    </div>
  );
}

// What the campaign searches for, where, and what it has spent.
function SearchSummary({ campaign }: { campaign: Campaign }) {
  const kind = TARGET_KINDS.find((t) => t.kind === campaign.targetKind);
  const budget = campaign.settings.maxCalls;
  const rows: [string, string][] = [
    ["Searching for", campaign.queries.join(", ") || "Not set"],
    ["Places", campaign.locations.map((l) => l.name).join(", ") || "Not set"],
    ...(kind ? ([["Kind", kind.label]] as [string, string][]) : []),
    ["Google searches", `${campaign.callsUsed}${budget !== null ? ` of ${budget}` : ""} used`],
  ];
  return (
    <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2.5 rounded-card border border-border bg-surface px-5 py-4 text-sm sm:px-6">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 wrap-break-word tabular-nums">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

// Remounts the forms after a save, so they start from what was saved.
const editKey = (c: Campaign) => [c.queries.join(","), c.locations.map((l) => l.id).join(","), JSON.stringify(c.settings)].join("|");

// The words the fit check classifies business names with, read-only, so the
// user can see why a name passed or failed. A name with a word for this kind
// counts as this kind; one with only a word for another kind doesn't.
function NameWordsPanel({ campaign }: { campaign: Campaign }) {
  const words = campaign.nameWords;
  return (
    <details className="group rounded-card border border-border bg-surface text-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 font-medium">
        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
        Words used to check names
      </summary>
      <div className="flex flex-col gap-3 border-t px-4 py-3">
        {!words ? (
          <p className="text-muted">Not made yet. They are made from this campaign&apos;s segment before its first fit check.</p>
        ) : (
          <>
            <WordList
              label="This kind"
              hint="A name with one of these is this kind of business, even if it also names another kind."
              words={words.thisKind}
            />
            <WordList label="Other kinds" hint="A name with only one of these is another kind of business." words={words.otherKinds} />
          </>
        )}
      </div>
    </details>
  );
}

function WordList({ label, hint, words }: { label: string; hint: string; words: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-medium">{label}</p>
      <p className="text-muted">{hint}</p>
      {words.length === 0 ? (
        <p className="text-muted">None</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <li key={w} className="rounded-control bg-raised px-2 py-1 text-xs">
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// What the campaign's state means for the user, in a sentence.
function StatusNote({ campaign, leadCount, workspaceId, isOwner }: { campaign: Campaign; leadCount: number; workspaceId: string; isOwner: boolean }) {
  if (campaign.status === "paused") {
    // The limit has lifted: an owner can restart it (the only way in
    // development, where nothing restarts it by itself).
    const due = resumeDue(campaign.resumeAt);
    return (
      <div role="status" className="rounded-card bg-warning-soft px-5 py-4 text-sm text-warning-ink">
        <p className="font-medium">
          {due ? "Paused: the limit has lifted" : `Paused until ${campaign.resumeAt ? pausedUntil(campaign.resumeAt) : "the limit resets"} (Lagos time)`}
        </p>
        <p className="mt-1">
          {campaign.pauseReason ?? "Today's Google searches are used up."} The {leadCount} {leadCount === 1 ? "lead" : "leads"} found so far{" "}
          {leadCount === 1 ? "is" : "are"} in the list.
        </p>
        {due && isOwner && <ResumeButton workspaceId={workspaceId} campaignId={campaign.id} />}
        {!due && campaign.resumeAt && <RefreshAt at={campaign.resumeAt} />}
        {isOwner && <StopButton workspaceId={workspaceId} campaignId={campaign.id} />}
      </div>
    );
  }
  if (campaign.status === "stopped") {
    return (
      <div role="status" className="rounded-card border border-border bg-surface px-5 py-4 text-sm">
        <p className="font-medium">Stopped</p>
        <p className="mt-1 text-muted">
          {campaign.pauseReason ?? "Stopped by an owner."} It used {campaign.callsUsed} Google {campaign.callsUsed === 1 ? "search" : "searches"}, and the{" "}
          {leadCount} {leadCount === 1 ? "lead" : "leads"} it found {leadCount === 1 ? "is" : "are"} in the list.{" "}
          {isOwner ? "Edit it, or change its settings below and continue the search." : "An owner can edit it and continue the search."}
        </p>
      </div>
    );
  }
  if (campaign.status === "done") {
    return (
      <p role="status" className="rounded-card bg-positive-soft px-5 py-4 text-sm text-positive-ink">
        Complete. The search covered every place in this campaign and found {leadCount} {leadCount === 1 ? "lead" : "leads"} that fit.
      </p>
    );
  }
  if (campaign.status === "running") {
    const budget = campaign.settings.maxCalls;
    return (
      <div role="status" className="rounded-card border border-border bg-surface px-5 py-4 text-sm text-muted">
        <p>
          Searching. Leads appear in the list as they are found and checked; this page updates by itself. {campaign.callsUsed}
          {budget !== null ? ` of ${budget}` : ""} Google searches used so far.
        </p>
        {isOwner && <StopButton workspaceId={workspaceId} campaignId={campaign.id} />}
      </div>
    );
  }
  if (campaign.status === "failed") {
    return (
      <p role="alert" className="rounded-card bg-negative-soft px-5 py-4 text-sm text-negative-ink">
        The search stopped with an error. What it found is kept in the list; an owner can start it again.
      </p>
    );
  }
  return null;
}
