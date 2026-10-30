import { ChevronDown, MousePointerClick } from "lucide-react";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getCampaign, getCampaignEstimate, getCampaignLeads, getWorkspace } from "@/lib/api";
import type { Campaign } from "@/lib/api-types/leads";
import { pausedUntil, resumeDue, TARGET_KINDS } from "@/lib/leads";
import { cn } from "@/lib/utils";
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
      {leads.length > 0 && <PickHint count={leads.length} />}
      <StatusNote campaign={campaign} leadCount={leads.length} workspaceId={workspace.id} isOwner={isOwner} />
      {campaign.status === "running" && <AutoRefresh seconds={15} />}

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

      <NameWordsPanel campaign={campaign} />
      {campaign.status !== "draft" && <Possibles workspaceId={workspace.id} campaignId={campaign.id} count={possibleCount} />}
    </>
  );
}

// From 1024px the list sits beside this pane: nothing is opened for the user,
// since opening a lead that isn't researched yet starts its paid deep-dive.
function PickHint({ count }: { count: number }) {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl border bg-card p-8 shadow-xs lg:block">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br from-indigo-400/25 via-fuchsia-400/20 to-amber-300/20 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/30" aria-hidden>
          <MousePointerClick className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">Pick a business to see its opportunity</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {count} {count === 1 ? "business" : "businesses"} on the left, best fit first. Opening one researches it (about a minute, the first time), then writes
          messages you can send on WhatsApp, email or a call.
        </p>
        <ol className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          {[
            ["1", "Open a business", "from-indigo-500 to-violet-500"],
            ["2", "Check the opportunity", "from-fuchsia-500 to-pink-500"],
            ["3", "Send and log the outcome", "from-emerald-500 to-teal-500"],
          ].map(([n, text, tone]) => (
            <li key={n} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
              <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white", tone)}>{n}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>
    </div>
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
    <details className="group rounded-2xl border bg-card text-sm shadow-xs">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 font-medium">
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        Words used to check names
      </summary>
      <div className="flex flex-col gap-3 border-t px-4 py-3">
        {!words ? (
          <p className="text-muted-foreground">Not made yet. They are made from this campaign&apos;s segment before its first fit check.</p>
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
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-muted-foreground">{hint}</p>
      {words.length === 0 ? (
        <p className="text-muted-foreground">None</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <li key={w} className="rounded-full bg-muted px-2 py-1 text-xs">
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
      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
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
      <div role="status" className="rounded-2xl border px-4 py-3 text-sm">
        <p className="font-medium">Stopped</p>
        <p className="mt-1 text-muted-foreground">
          {campaign.pauseReason ?? "Stopped by an owner."} It used {campaign.callsUsed} Google {campaign.callsUsed === 1 ? "search" : "searches"}, and the{" "}
          {leadCount} {leadCount === 1 ? "lead" : "leads"} it found {leadCount === 1 ? "is" : "are"} in the list.{" "}
          {isOwner ? "Edit it, or change its settings below and continue the search." : "An owner can edit it and continue the search."}
        </p>
      </div>
    );
  }
  if (campaign.status === "done") {
    return (
      <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Complete. The search covered every place in this campaign and found {leadCount} {leadCount === 1 ? "lead" : "leads"} that fit.
      </p>
    );
  }
  if (campaign.status === "running") {
    const budget = campaign.settings.maxCalls;
    return (
      <div role="status" className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
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
      <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        The search stopped with an error. What it found is kept in the list; an owner can start it again.
      </p>
    );
  }
  return null;
}
