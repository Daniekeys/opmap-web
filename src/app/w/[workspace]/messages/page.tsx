import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { TileMark } from "@/components/logo";
import { PageLoading } from "@/components/page-loading";
import { getLeadOutreach, getLeadResearch, getMessages, getWorkspace } from "@/lib/api";
import type { MessageRow } from "@/lib/api-types/outreach";
import { messagesFinding, rowLine, rowStatus } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { MessagesComposer } from "./messages-composer";

type Props = PageProps<"/w/[workspace]/messages">;

// Messages to send (design/screens/Composer.dc.html): every campaign's new
// replies, then the leads whose messages are ready. On wide screens the
// queue sits beside the chosen lead's composer (?lead=); on a phone a row
// opens the lead's Messages tab (MobileComposer.dc.html).
export default function MessagesPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <MessagesView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MessagesView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const workspace = await getWorkspace((await params).workspace);
  const asked = (await searchParams).lead;
  const messages = await getMessages(workspace.id);
  const chosen = messages.queue.find((r) => r.leadId === asked) ?? messages.queue[0] ?? null;
  const leadHref = (r: MessageRow) => `/w/${workspace.slug}/campaigns/${r.campaignId}/leads/${r.leadId}`;
  const total = messages.toSend + messages.newReplies;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">Messages to send</h1>
        <p className="text-sm text-muted wrap-break-word sm:text-body">{messagesFinding(messages)}</p>
      </div>

      {!chosen ? (
        <div className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4 sm:p-6">
          <TileMark className="size-6 opacity-60" />
          <p className="font-semibold">No messages waiting</p>
          <p className="max-w-md text-sm text-muted">
            Open a lead in one of your{" "}
            <Link href={`/w/${workspace.slug}/campaigns`} className="font-medium text-accent-ink underline-offset-4 hover:text-accent hover:underline">
              campaigns
            </Link>{" "}
            and write its messages. Replies you log show here too.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <section aria-label="Queue" className="flex w-full shrink flex-col gap-2 lg:sticky lg:top-8 lg:w-list lg:min-w-list-min">
            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {messages.queue.map((r) => (
                <li key={r.leadId} className="border-b border-rule last:border-b-0">
                  {/* Phones open the lead's Messages tab; wide screens pick the row. */}
                  <QueueRow row={r} href={`${leadHref(r)}?tab=messages`} className="lg:hidden" />
                  <QueueRow row={r} href={`?lead=${r.leadId}`} selected={r.leadId === chosen.leadId} className="hidden lg:flex" />
                </li>
              ))}
            </ul>
            {total > messages.queue.length && <p className="px-1 text-xs text-muted">Showing the first {messages.queue.length} of {total}.</p>}
          </section>

          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="flex w-full max-w-detail flex-col">
              <Suspense key={chosen.leadId} fallback={<PageLoading />}>
                <Pane workspaceId={workspace.id} slug={workspace.slug} row={chosen} leadHref={leadHref(chosen)} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRow({ row, href, selected = false, className }: { row: MessageRow; href: string; selected?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={cn("flex min-h-16 items-center gap-3 px-3.5 py-3", selected ? "bg-accent-soft" : "hover:bg-raised", className)}
    >
      <Avatar name={row.name} seed={row.businessId} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{row.name}</span>
        <span className="truncate text-xs text-muted">{rowLine(row)}</span>
      </span>
      <span
        className={cn(
          "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
          row.kind === "reply" ? "bg-positive-soft text-positive-ink" : "bg-accent-soft text-accent-ink",
          selected && row.kind === "draft" && "bg-surface",
        )}
      >
        {rowStatus(row)}
      </span>
    </Link>
  );
}

// The chosen lead's composer: the card its drafts were written from, with
// the same composer and outcome buttons as the lead page.
async function Pane({ workspaceId, slug, row, leadHref }: { workspaceId: string; slug: string; row: MessageRow; leadHref: string }) {
  const [research, outreach] = await Promise.all([getLeadResearch(workspaceId, row.campaignId, row.leadId), getLeadOutreach(workspaceId, row.campaignId, row.leadId)]);
  const cards = research.result?.cards ?? [];
  const written = outreach.cards.find((c) => c.drafts.length > 0 && cards.some((k) => k.id === c.opportunityId));
  const card = cards.find((k) => k.id === written?.opportunityId) ?? null;
  return (
    <MessagesComposer
      key={row.leadId}
      workspaceId={workspaceId}
      slug={slug}
      campaignId={row.campaignId}
      row={row}
      leadHref={leadHref}
      card={card}
      written={outreach.cards.some((c) => c.drafts.length > 0)}
      finishedAt={research.result?.finishedAt ?? null}
      initialOutreach={outreach}
    />
  );
}
