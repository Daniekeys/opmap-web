"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Rerun } from "@/app/w/[workspace]/campaigns/[campaignId]/leads/[leadId]/brand-dna-notice";
import { CardDrafts, OutcomePanel } from "@/app/w/[workspace]/campaigns/[campaignId]/leads/[leadId]/outreach-panel";
import { Avatar } from "@/components/avatar";
import { TailoringBadge } from "@/components/tailoring-badge";
import { ProgressPanel } from "@/components/progress-panel";
import type { LeadOutreachResponse, MessageRow } from "@/lib/api-types/outreach";
import type { OpenLeadBody, OpenLeadResponse, OpportunityCard } from "@/lib/api-types/research";
import { goToLogin } from "@/lib/go-to-login";

type Ask = { state: "idle" } | { state: "asking" } | { state: "limit"; reason: string } | { state: "error" };

// The composer pane of /messages: the lead page's composer and outcome
// buttons for one queued lead. The queue itself refreshes on the next visit,
// so a send doesn't swap the lead out from under the user. A card whose offer
// left the approved Brand DNA can be re-run here, the same deep-dive request
// as the lead page's button; the pane reloads when it finishes.
export function MessagesComposer({
  workspaceId,
  slug,
  campaignId,
  row,
  leadHref,
  card,
  written,
  cardCount,
  finishedAt,
  brandDnaRerun,
  initialOutreach,
}: {
  workspaceId: string;
  slug: string;
  campaignId: string;
  row: MessageRow;
  leadHref: string;
  card: OpportunityCard | null;
  // Whether this lead has drafts on any card, now or from earlier research
  // (card is null when they belong to a card the newest research replaced).
  written: boolean;
  // Cards in the newest research: none when a re-run found no opportunity.
  cardCount: number;
  finishedAt: string | null;
  // The research result's brandDnaRerun: the cards may be rewritten.
  brandDnaRerun: boolean;
  initialOutreach: LeadOutreachResponse;
}) {
  const router = useRouter();
  const [outreach, setOutreach] = useState(initialOutreach);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  const [runId, setRunId] = useState<string | null>(null);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}/leads/${row.leadId}`;

  async function reload() {
    const res = await fetch(`${base}/outreach`, { cache: "no-store" });
    if (res.status === 401) return goToLogin();
    if (!res.ok) throw new Error(String(res.status));
    setOutreach(await res.json());
  }

  async function rerunCards() {
    setAsk({ state: "asking" });
    try {
      const body: OpenLeadBody = { brandDna: true };
      const res = await fetch(`${base}/deep-dive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      const result: OpenLeadResponse = await res.json();
      if (result.state === "limit") return setAsk({ state: "limit", reason: result.reason });
      setAsk({ state: "idle" });
      if ((result.state === "started" || result.state === "running") && result.runId) setRunId(result.runId);
      // Nothing to follow: show what the API has now.
      else router.refresh();
    } catch {
      setAsk({ state: "error" });
    }
  }

  const rerun: Rerun = { allowed: brandDnaRerun, busy: ask.state === "asking" || runId !== null, onRerun: () => void rerunCards() };

  return (
    <section aria-label={`Messages for ${row.name}`} className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Avatar name={row.name} seed={row.businessId} size="lg" />
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-section font-semibold wrap-break-word">{row.name}</h2>
            <TailoringBadge tailoring={row.tailoring} size="md" />
          </div>
          <Link href={leadHref} className="self-start text-sm font-medium text-accent-ink underline-offset-4 hover:text-accent hover:underline">
            Open the lead
          </Link>
        </div>
      </div>
      {runId ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted" role="status">
            Writing new opportunity cards from your current Brand DNA, from what was already read about this business. About a minute.
          </p>
          <ProgressPanel workspaceId={workspaceId} runId={runId} title="Research" onFinished={() => router.refresh()} />
        </div>
      ) : card ? (
        /* The composer has its own outcome buttons; without one, the lead page's. */
        <CardDrafts base={base} workspaceId={workspaceId} slug={slug} card={card} finishedAt={finishedAt} outreach={outreach} onChange={reload} rerun={rerun} brandLink />
      ) : (
        <>
          <p className="text-sm text-muted">
            {!written
              ? "No messages were written for this lead. Answer them in the channel they replied on, then log what happened below."
              : cardCount === 0
                ? "This lead's messages were written from an earlier card. The newest research found no opportunity to write from, so there's nothing new to send here. Open the lead to see why."
                : "These messages were written from a card the newest research replaced. Open the lead to write new ones from its current cards."}
          </p>
          <OutcomePanel base={base} outreach={outreach} onChange={reload} />
        </>
      )}
      {ask.state === "limit" && (
        <p className="text-sm text-warning-ink">
          {ask.reason} The cards can be rewritten once there is budget again.
        </p>
      )}
      {ask.state === "error" && <p className="text-sm text-negative-ink">Couldn&apos;t start the research. Check your connection and try again.</p>}
    </section>
  );
}
