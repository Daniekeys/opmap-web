"use client";

import Link from "next/link";
import { useState } from "react";
import { CardDrafts, OutcomePanel } from "@/app/w/[workspace]/campaigns/[campaignId]/leads/[leadId]/outreach-panel";
import { Avatar } from "@/components/avatar";
import type { LeadOutreachResponse, MessageRow } from "@/lib/api-types/outreach";
import type { OpportunityCard } from "@/lib/api-types/research";
import { goToLogin } from "@/lib/go-to-login";

// The composer pane of /messages: the lead page's composer and outcome
// buttons for one queued lead. The queue itself refreshes on the next visit,
// so a send doesn't swap the lead out from under the user.
export function MessagesComposer({
  workspaceId,
  slug,
  campaignId,
  row,
  leadHref,
  card,
  written,
  finishedAt,
  initialOutreach,
}: {
  workspaceId: string;
  slug: string;
  campaignId: string;
  row: MessageRow;
  leadHref: string;
  card: OpportunityCard | null;
  // Whether any card of this lead has drafts (card is null when they belong
  // to a card the newest research replaced).
  written: boolean;
  finishedAt: string | null;
  initialOutreach: LeadOutreachResponse;
}) {
  const [outreach, setOutreach] = useState(initialOutreach);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}/leads/${row.leadId}`;

  async function reload() {
    const res = await fetch(`${base}/outreach`, { cache: "no-store" });
    if (res.status === 401) return goToLogin();
    if (!res.ok) throw new Error(String(res.status));
    setOutreach(await res.json());
  }

  return (
    <section aria-label={`Messages for ${row.name}`} className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Avatar name={row.name} seed={row.businessId} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h2 className="text-section font-semibold wrap-break-word">{row.name}</h2>
          <Link href={leadHref} className="self-start text-sm font-medium text-accent-ink underline-offset-4 hover:text-accent hover:underline">
            Open the lead
          </Link>
        </div>
      </div>
      {/* The composer has its own outcome buttons; without one, the lead page's. */}
      {card ? (
        <CardDrafts base={base} workspaceId={workspaceId} slug={slug} card={card} finishedAt={finishedAt} outreach={outreach} onChange={reload} />
      ) : (
        <>
          <p className="text-sm text-muted">
            {written
              ? "These messages were written from a card the newest research replaced. Open the lead to write new ones from its current cards."
              : "No messages were written for this lead. Answer them in the channel they replied on, then log what happened below."}
          </p>
          <OutcomePanel base={base} outreach={outreach} onChange={reload} />
        </>
      )}
    </section>
  );
}
