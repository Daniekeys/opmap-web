"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import {
  Ban,
  CalendarCheck,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  ExternalLink,
  Info,
  Mail,
  MessageCircle,
  MessageSquareReply,
  PenLine,
  Phone,
  RotateCw,
  Send,
  ShieldAlert,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useState, useSyncExternalStore } from "react";
import { ProgressPanel } from "@/components/progress-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { OutcomeBody, OutcomeResponse, Stage } from "@/lib/api-types/outcomes";
import type { Channel, ContactRow, Draft, DraftLine, LeadOutreachResponse, SendVia, StartDraftsResponse, Target } from "@/lib/api-types/outreach";
import type { Cite, OpportunityCard } from "@/lib/api-types/research";
import { citeName, readOn } from "@/lib/campaign-view";
import { formatDateTime } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { formatPhone, labelText, telHref } from "@/lib/leads";
import {
  canMarkSent,
  type Check as DraftCheck,
  draftChecks,
  gmailHref,
  outcomeText,
  outlookHref,
  sourceReadDates,
  STAGE_NAMES,
  STAGE_TONES,
  whatsappSendHref,
} from "@/lib/outreach";
import { cn } from "@/lib/utils";

type CardOutreach = LeadOutreachResponse["cards"][number];
type ReadDates = Map<string, string | null>;

const linkClass = "text-accent-ink underline-offset-4 hover:underline wrap-anywhere";
// Every button a thumb has to hit: at least 48 px tall.
const bigTap = "h-12 w-full justify-center gap-2 text-sm";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });

const showValue = (kind: string, value: string) => (kind === "phone" || kind === "whatsapp" ? formatPhone(value) : value);

// Below the sm breakpoint a claim's source opens as a bottom sheet, not a popover.
const PHONE = "(max-width: 639px)";
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useIsPhone = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);

// ---- drafts under one card -------------------------------------------------

type Ask = { state: "idle" } | { state: "asking" } | { state: "limit"; reason: string } | { state: "blocked"; reason: string } | { state: "error" };

// "Write messages" on a card, its progress, then the composer for the four
// drafts (Composer.dc.html; MobileComposer.dc.html on a phone). Drafts are
// written only when asked, once; opening the page again shows the saved ones.
export function CardDrafts({
  base,
  workspaceId,
  slug,
  card: opportunity,
  finishedAt,
  outreach,
  onChange,
}: {
  base: string;
  workspaceId: string;
  slug: string;
  card: OpportunityCard;
  // When the research finished: the read date of a page read again since.
  finishedAt: string | null;
  outreach: LeadOutreachResponse;
  onChange: () => Promise<void>;
}) {
  const card = outreach.cards.find((c) => c.opportunityId === opportunity.id);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  const [runId, setRunId] = useState<string | null>(null);
  const offer = <OfferLine text={opportunity.offer?.text ?? "Opportunity"} />;

  async function write() {
    setAsk({ state: "asking" });
    try {
      const res = await post(`${base}/drafts`, { opportunityId: opportunity.id });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      const result: StartDraftsResponse = await res.json();
      if (result.state === "limit") return setAsk({ state: "limit", reason: result.reason });
      if (result.state === "blocked") return setAsk({ state: "blocked", reason: result.reason });
      setAsk({ state: "idle" });
      if ((result.state === "started" || result.state === "running") && result.runId) setRunId(result.runId);
      else await onChange();
    } catch {
      setAsk({ state: "error" });
    }
  }

  const following = runId ?? (card?.run?.status === "running" ? card.run.runId : null);
  const drafts = card?.drafts ?? [];

  if (outreach.suppressed) {
    return (
      <div className="flex flex-col gap-3">
        {offer}
        <Box icon={<Ban className="size-4" aria-hidden />} title="On your opt-out list" tone="negative">
          They asked not to be contacted, so no messages are written or shown, and there is nothing to copy or send.
        </Box>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {following ? (
        <div className="flex flex-col gap-3">
          {offer}
          <p className="text-sm text-muted" role="status">
            Writing four messages from this card, then checking every sentence against its source. About 15 seconds.
          </p>
          <ProgressPanel
            workspaceId={workspaceId}
            runId={following}
            title="Messages"
            onFinished={() => {
              setRunId(null);
              void onChange().catch(() => setAsk({ state: "error" }));
            }}
          />
        </div>
      ) : drafts.length > 0 ? (
        <DraftTabs base={base} offer={offer} drafts={drafts} dates={sourceReadDates(opportunity, finishedAt)} outreach={outreach} onChange={onChange} />
      ) : (
        <>
          {offer}
          <Start blocked={outreach.blocked} slug={slug} card={card} ask={ask} onWrite={() => void write()} />
        </>
      )}
      {ask.state === "limit" && (
        <Box icon={<ShieldAlert className="size-4" aria-hidden />} title="Spending limit reached">
          {ask.reason} Messages can be written once there is budget again.
        </Box>
      )}
      {ask.state === "blocked" && <p className="text-sm text-warning-ink">{ask.reason}</p>}
      {ask.state === "error" && <p className="text-sm text-negative-ink">Couldn&apos;t write the messages. Check your connection and try again.</p>}
    </div>
  );
}

function OfferLine({ text }: { text: string }) {
  return (
    <p className="min-w-0 text-sm text-muted">
      Offer: <span className="text-ink">{text}</span>
    </p>
  );
}

function Start({ blocked, slug, card, ask, onWrite }: { blocked: LeadOutreachResponse["blocked"]; slug: string; card: CardOutreach | undefined; ask: Ask; onWrite: () => void }) {
  if (blocked === "no_target") {
    return (
      <Box icon={<Phone className="size-4" aria-hidden />} title="No checked contact to send to">
        A WhatsApp number needs a WhatsApp link they published, and an email must be on their own site. Call them from the number above, or check their details first.
      </Box>
    );
  }
  if (blocked === "brand_not_usable") {
    return (
      <Box icon={<ShieldAlert className="size-4" aria-hidden />} title="Approve your Brand DNA first">
        Messages sign off with your business name and only use facts you approved.{" "}
        <Link href={`/w/${slug}/brand`} className={linkClass}>
          Approve your Brand DNA
        </Link>
      </Box>
    );
  }
  const failed = card?.run?.status === "failed";
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-4 sm:p-5">
      <p className="font-semibold">{failed ? "Writing the messages failed" : "Write messages for this offer"}</p>
      <p className="text-sm text-muted">{failed ? (card?.run?.error ?? "Something went wrong while writing.") : "WhatsApp, email, LinkedIn and a call opener, written from this offer."}</p>
      <Button type="button" className={cn(bigTap, "sm:w-auto sm:px-6")} onClick={onWrite} disabled={ask.state === "asking"}>
        {failed ? <RotateCw className="size-4" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
        {failed ? "Try again" : ask.state === "asking" ? "Starting" : "Write messages"}
      </Button>
      {!failed && <p className="max-w-md text-xs text-muted">Every sentence is checked against its source. Costs a few cents, once.</p>}
    </div>
  );
}

// The selected channel is a white segment on the raised track; every send
// button is the one near-black primary. Channels carry no colour of their own.
const TAB_ON = "bg-surface font-semibold text-ink";
const SEND = "bg-primary font-semibold text-on-primary hover:bg-primary/85";
const TAB_NAMES: Record<Channel, string> = { whatsapp: "WhatsApp", email: "Email", linkedin: "LinkedIn", call: "Call opener" };

function DraftTabs({
  base,
  offer,
  drafts,
  dates,
  outreach,
  onChange,
}: {
  base: string;
  offer: React.ReactNode;
  drafts: Draft[];
  dates: ReadDates;
  outreach: LeadOutreachResponse;
  onChange: () => Promise<void>;
}) {
  const [open, setOpen] = useState<Channel>(drafts[0]!.channel);
  const draft = drafts.find((d) => d.channel === open) ?? drafts[0]!;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {offer}
        <div role="tablist" aria-label="Channel" className="grid grid-cols-4 gap-0.5 rounded-card bg-raised p-[3px] sm:flex">
          {drafts.map((d) => (
            <button
              key={d.channel}
              type="button"
              role="tab"
              aria-selected={d.channel === open}
              onClick={() => setOpen(d.channel)}
              className={cn(
                "flex h-11 items-center justify-center rounded-control text-sm transition-colors sm:h-[30px] sm:px-3",
                d.channel === open ? TAB_ON : "text-muted hover:text-ink",
              )}
            >
              <span className="truncate">
                {d.channel === "call" ? (
                  <>
                    <span className="sm:hidden">Call</span>
                    <span className="hidden sm:inline">{TAB_NAMES.call}</span>
                  </>
                ) : (
                  TAB_NAMES[d.channel]
                )}
              </span>
              {d.status !== "ready" && <span className="sr-only">(not ready)</span>}
            </button>
          ))}
        </div>
      </div>
      <DraftView key={draft.id} base={base} draft={draft} dates={dates} outreach={outreach} onChange={onChange} />
    </div>
  );
}

function DraftView({ base, draft, dates, outreach, onChange }: { base: string; draft: Draft; dates: ReadDates; outreach: LeadOutreachResponse; onChange: () => Promise<void> }) {
  const [copied, setCopied] = useState<"body" | "subject" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // Set at the tap, so "Mark as sent" goes before the reload shows the Sent
  // that opening or copying logged.
  const [sentHere, setSentHere] = useState(false);
  const outcome = useOutcomeTap(base, onChange);
  const target = outreach.targets[draft.channel];

  if (draft.status !== "ready") {
    const why = draft.removed.find((r) => r.text === "(whole draft)")?.reason.replace(/^not ready: /, "");
    return (
      <div className="flex flex-col gap-2">
        <Box icon={<ShieldAlert className="size-4" aria-hidden />} title="Draft not ready">
          The checks removed too much of this message to send it{why ? `: ${why}` : "."} Use another channel, or write it yourself from the card above.
        </Box>
        <RemovedList removed={draft.removed} />
      </div>
    );
  }

  // Logs the send (an event, and a "Sent" outcome the first time on this
  // channel), then reloads the lead. The link itself opens at once; the log
  // never blocks it.
  async function logSend(via: SendVia) {
    setProblem(null);
    setSentHere(true);
    try {
      const res = await post(`${base}/drafts/${draft.id}/send`, { via });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      await onChange();
    } catch {
      setSentHere(false);
      setProblem("The send wasn't logged. Tap Mark as sent once it has gone.");
    }
  }

  async function copy(what: "body" | "subject") {
    try {
      await navigator.clipboard.writeText(what === "subject" ? (draft.subject ?? "") : draft.body);
      setCopied(what);
      setTimeout(() => setCopied(null), 2_000);
      if (what === "body") void logSend("copy");
    } catch {
      setProblem("Couldn't copy. Select the text and copy it by hand.");
    }
  }

  async function markSent() {
    if (await outcome.tap({ type: "sent", channel: draft.channel }, "sent")) setSentHere(true);
  }

  const markable = !sentHere && canMarkSent(draft.channel, outreach.outcomes);
  const checks = draftChecks(draft, { optOut: outreach.country.optOut, sender: outreach.sender?.name ?? null });
  const label = target ? labelText(target.kind === "linkedin" ? "social" : target.kind, target.label) : null;
  const copyButton = (className: string) => (
    <Button type="button" variant={target ? "outline" : "default"} className={className} onClick={() => void copy("body")}>
      {copied === "body" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied === "body" ? "Copied" : "Copy text"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-6">
        <article aria-label={`${TAB_NAMES[draft.channel]} message`} className="flex min-w-0 flex-[3_1_400px] flex-col gap-3 rounded-card border border-border bg-surface px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex justify-between gap-3 text-small text-muted">
            <span className="min-w-0 truncate" title={label?.tip}>
              {target ? `To ${showValue(target.kind, target.value)}, ${label!.word.toLowerCase()}` : "No checked contact"}
            </span>
            {draft.channel !== "call" && <span className="shrink-0 tabular-nums">{draft.body.length} characters</span>}
          </div>
          {draft.subject && (
            <div className="-mx-1 flex items-center gap-2 border-y border-rule px-1 py-1 text-sm">
              <span className="shrink-0 text-xs text-muted">Subject</span>
              <span className="min-w-0 flex-1 font-semibold">{draft.subject}</span>
              <Button type="button" variant="ghost" className="h-10 shrink-0 px-3" onClick={() => void copy("subject")} aria-label="Copy subject">
                {copied === "subject" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </Button>
            </div>
          )}
          <Lines lines={draft.lines} dates={dates} call={draft.channel === "call"} />
          <div className="hidden flex-wrap gap-2 pt-2 sm:flex">
            <SendLinks draft={draft} target={target} onSend={(via) => void logSend(via)} />
            {copyButton("h-10 px-3.5")}
          </div>
          {draft.channel === "email" && target && (
            <a
              href={outlookHref(target.value, draft.subject ?? "", draft.body)}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(linkClass, "inline-flex min-h-11 items-center gap-1.5 self-start text-sm sm:hidden")}
              onClick={() => void logSend("outlook")}
            >
              <Mail className="size-4" aria-hidden /> Open in Outlook instead
            </a>
          )}
        </article>

        <aside aria-label="Before and after sending" className="flex min-w-0 flex-[2_1_240px] flex-col gap-4">
          <ChecksPanel checks={checks} />
          <AfterSend draft={draft} target={target} outreach={outreach} outcome={outcome} markable={markable} onMarkSent={() => void markSent()} />
        </aside>
      </div>

      {!target && <p className="text-xs text-muted">{TARGET_MISSING[draft.channel]}</p>}
      {draft.channel === "email" && outreach.country.emailNote && (
        <p className="rounded-card bg-warning-soft px-3 py-2 text-xs text-warning-ink">
          {outreach.country.emailNote} (A summary of {outreach.country.law}, not legal advice.)
        </p>
      )}
      {problem && <p className="text-sm text-negative-ink">{problem}</p>}
      <RemovedList removed={draft.removed} />

      {/* Phone: send, copy and mark as sent in thumb reach. */}
      <div className="h-10 sm:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3 pb-5 sm:hidden">
        <SendLinks draft={draft} target={target} onSend={(via) => void logSend(via)} phone />
        <div className={cn("grid gap-2", markable && "grid-cols-2")}>
          {copyButton("h-12 text-base")}
          {markable && (
            <Button type="button" variant="outline" className="h-12 text-base" disabled={outcome.busy !== null} onClick={() => void markSent()}>
              Mark as sent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const sendBase = "inline-flex items-center justify-center gap-2 rounded-control px-4 text-sm whitespace-nowrap";

// The draft's send link: WhatsApp, Gmail (Outlook beside it on wide screens),
// LinkedIn, or the call. Nothing without a checked contact point.
function SendLinks({ draft, target, onSend, phone }: { draft: Draft; target: Target | null; onSend: (via: SendVia) => void; phone?: boolean }) {
  if (!target) return null;
  const open = { target: "_blank", rel: "noreferrer noopener" } as const;
  const sendClass = cn(sendBase, SEND, phone ? "h-13 w-full text-base" : "h-10");
  if (draft.channel === "whatsapp") {
    return (
      <a href={whatsappSendHref(target.value, draft.body)} {...open} className={sendClass} onClick={() => onSend("whatsapp")}>
        <MessageCircle className="size-4" aria-hidden /> Open in WhatsApp
      </a>
    );
  }
  if (draft.channel === "email") {
    const subject = draft.subject ?? "";
    return (
      <>
        <a href={gmailHref(target.value, subject, draft.body)} {...open} className={sendClass} onClick={() => onSend("gmail")}>
          <Mail className="size-4" aria-hidden /> Open in Gmail
        </a>
        {!phone && (
          <a href={outlookHref(target.value, subject, draft.body)} {...open} className={cn(sendBase, "h-10 border border-control bg-surface font-medium text-ink hover:bg-raised")} onClick={() => onSend("outlook")}>
            <Mail className="size-4" aria-hidden /> Open in Outlook
          </a>
        )}
      </>
    );
  }
  if (draft.channel === "linkedin") {
    return (
      <a href={target.value} {...open} className={sendClass} onClick={() => onSend("linkedin")}>
        <ExternalLink className="size-4" aria-hidden /> Open their LinkedIn
      </a>
    );
  }
  return (
    <a href={telHref(target.value)} className={sendClass} onClick={() => onSend("call")}>
      <Phone className="size-4" aria-hidden /> Call {formatPhone(target.value)}
    </a>
  );
}

const TARGET_MISSING: Record<Channel, string> = {
  whatsapp: "No WhatsApp number they published themselves: copy the message and send it from WhatsApp yourself if you know their number.",
  email: "No email found on their own site: copy the message if you have another way to reach them.",
  linkedin: "No LinkedIn page linked from their own site: copy the message to send it there yourself.",
  call: "No phone number we can stand behind for a call.",
};

const CHECK_ICONS = {
  pass: <CircleCheck className="mt-0.5 size-4 shrink-0 text-positive-ink" aria-hidden />,
  fail: <CircleX className="mt-0.5 size-4 shrink-0 text-negative-ink" aria-hidden />,
  info: <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />,
};

function ChecksPanel({ checks }: { checks: DraftCheck[] }) {
  return (
    <section aria-label="Checks" className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-5 py-4 text-sm">
      <h4 className="text-body font-semibold">Checks</h4>
      <ul className="flex flex-col gap-2.5">
        {checks.map((c) => (
          <li key={c.text} className={cn("flex gap-2", c.state === "fail" && "font-medium text-negative-ink", c.state === "info" && "text-muted")}>
            {CHECK_ICONS[c.state]}
            <span>
              {c.text}
              {c.state === "fail" && <span className="sr-only"> (failed)</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// "After you send, tap what happened" beside the draft: the stage taps, and
// feedback on this draft's contact point. Lost and every other contact are on
// the Outcome tab.
function AfterSend({
  draft,
  target,
  outreach,
  outcome,
  markable,
  onMarkSent,
}: {
  draft: Draft;
  target: Target | null;
  outreach: LeadOutreachResponse;
  outcome: OutcomeTap;
  markable: boolean;
  onMarkSent: () => void;
}) {
  const shown = target && target.kind !== "linkedin" ? outreach.contacts.find((c) => c.kind === target.kind && c.value === target.value) : undefined;
  const feedback = shown ? FEEDBACK[shown.kind] : [];
  const text = "inline-flex h-11 items-center text-sm text-negative-ink hover:underline underline-offset-4 disabled:opacity-50 sm:h-7";
  return (
    <section aria-labelledby={`after-${draft.id}`} className="flex flex-col gap-3 rounded-card border border-border bg-surface px-5 py-4">
      <h4 id={`after-${draft.id}`} className="font-semibold">
        After you send, tap what happened
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {STAGE_BUTTONS.filter((b) => b.type !== "lost").map((b) => {
          const sent = b.type === "sent";
          const on = sent ? !markable : outreach.stage === b.type;
          return (
            <Button
              key={b.type}
              type="button"
              variant="outline"
              className={cn("h-11 sm:h-9", on && "border-primary bg-primary text-on-primary hover:bg-primary/85 disabled:opacity-100")}
              disabled={outcome.busy !== null || (sent && !markable)}
              aria-pressed={on}
              onClick={() => (sent ? onMarkSent() : void outcome.tap({ type: b.type, channel: draft.channel }, b.type))}
            >
              {b.label}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {feedback.map((f) => (
          <button
            key={f.type}
            type="button"
            className={text}
            disabled={outcome.busy !== null}
            onClick={() =>
              void outcome.tap(
                { type: f.type, contactKind: shown!.kind, contactValue: shown!.value },
                `${f.type}-${shown!.kind}`,
                `Mark ${showValue(shown!.kind, shown!.value)} as "${f.label.toLowerCase()}"? This lowers its confidence for every team using this business.`,
              )
            }
          >
            {f.label}
          </button>
        ))}
        <button type="button" className={text} disabled={outcome.busy !== null} onClick={() => void outcome.tap({ type: "opted_out" }, "opted_out", OPT_OUT_CONFIRM)}>
          Asked us to stop
        </button>
      </div>
      <OutcomeStatus outcome={outcome} idle="Opening or copying the message marks it Sent." />
    </section>
  );
}

// The message as it will be sent, in its paragraphs. A claim is highlighted
// and opens to the quotes or facts that show it: a popover on wide screens,
// a bottom sheet on a phone. The trigger is a span: a button can't wrap
// inline with the sentences around it.
function Lines({ lines, dates, call }: { lines: DraftLine[]; dates: ReadDates; call: boolean }) {
  // The body joins the claims into one paragraph; a call opener is line by line.
  const paragraphs: DraftLine[][] = [];
  for (const line of lines) {
    const last = paragraphs.at(-1);
    if (!call && line.kind === "claim" && last?.[0]?.kind === "claim") last.push(line);
    else paragraphs.push([line]);
  }
  return (
    <div className="flex flex-col gap-3 text-base/[26px]">
      {paragraphs.map((p, i) => (
        <p key={i} className={cn("whitespace-pre-line", p[0]!.kind === "optout" && "text-sm text-muted", p[0]!.kind === "signoff" && "text-muted")}>
          {p.map((line, j) => (
            <Fragment key={j}>
              {j > 0 && " "}
              {line.kind === "claim" ? <ClaimMark line={line} dates={dates} /> : line.text}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

const MARK = "rounded-tile bg-accent-soft px-0.5 text-accent-ink underline decoration-accent decoration-2 underline-offset-[3px] box-decoration-clone";
const TRIGGER = "inline cursor-pointer rounded-tile text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

function ClaimMark({ line, dates }: { line: DraftLine; dates: ReadDates }) {
  const phone = useIsPhone();
  const mark = <span className={MARK}>{line.text}</span>;
  if (phone) {
    return (
      <Dialog.Root>
        <Dialog.Trigger nativeButton={false} render={<span />} className={TRIGGER}>
          {mark}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30" />
          <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col gap-3 overflow-y-auto rounded-t-xl bg-surface px-4 pt-2 pb-5 shadow-float outline-none">
            <span className="h-1 w-9 self-center rounded-full bg-border" aria-hidden />
            <Dialog.Title className="text-small font-normal text-muted">Where this came from</Dialog.Title>
            <Sources cites={line.cites} dates={dates} />
            <Dialog.Close className={cn(buttonVariants({ variant: "outline" }), "h-12 w-full text-base")}>Done</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
  return (
    <Popover.Root>
      <Popover.Trigger nativeButton={false} render={<span />} className={TRIGGER}>
        {mark}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-50">
          <Popover.Popup className="flex w-72 flex-col gap-3 rounded-card border border-border bg-surface px-3.5 py-3 text-sm shadow-float outline-none">
            <Popover.Title className="sr-only">Where this came from</Popover.Title>
            <Sources cites={line.cites} dates={dates} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Each quote or fact behind a claim: what it says, where and when it was
// read, and a link to the page.
function Sources({ cites, dates }: { cites: Cite[]; dates: ReadDates }) {
  return (
    <ul className="flex flex-col gap-3">
      {cites.map((c) => (
        <li key={c.ref} className="flex flex-col gap-1">
          <span className="font-medium">{c.kind === "source" ? `“${c.quote}”` : c.text}</span>
          <span className="text-small text-muted">{c.kind === "fact" ? "Your approved fact" : `${citeName(c)}, ${readOn(dates.get(c.sourceId) ?? null)}`}</span>
          {c.kind !== "fact" && (
            <a href={c.url} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex min-h-8 items-center gap-1 self-start text-small font-medium")}>
              Open the source <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function RemovedList({ removed }: { removed: Draft["removed"] }) {
  const sentences = removed.filter((r) => r.text !== "(whole draft)");
  if (sentences.length === 0) return null;
  return (
    <details className="text-sm">
      <summary className="flex h-11 cursor-pointer items-center text-muted">
        {sentences.length} {sentences.length === 1 ? "sentence" : "sentences"} removed: their sources didn&apos;t back them
      </summary>
      <ul className="flex flex-col gap-2 pb-2">
        {sentences.map((r, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className="line-through decoration-muted-foreground/60">{r.text}</span>
            <span className="text-xs text-muted">{r.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Box({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone?: "negative"; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-card px-4 py-3 text-sm", tone === "negative" ? "bg-negative-soft" : "border border-border bg-surface")}>
      <p className={cn("flex items-center gap-2 font-semibold", tone === "negative" && "text-negative-ink")}>
        {icon} {title}
      </p>
      <p className="text-muted">{children}</p>
    </div>
  );
}

// ---- outcomes ----------------------------------------------------------------

const STAGE_BUTTONS: { type: "sent" | "replied" | "meeting" | "won" | "lost"; label: string; icon: React.ReactNode }[] = [
  { type: "sent", label: "Sent", icon: <Send className="size-4" aria-hidden /> },
  { type: "replied", label: "Replied", icon: <MessageSquareReply className="size-4" aria-hidden /> },
  { type: "meeting", label: "Meeting", icon: <CalendarCheck className="size-4" aria-hidden /> },
  { type: "won", label: "Won", icon: <Trophy className="size-4" aria-hidden /> },
  { type: "lost", label: "Lost", icon: <X className="size-4" aria-hidden /> },
];

const FEEDBACK: Record<ContactRow["kind"], { type: "wrong_number" | "bounced" | "not_owner"; label: string }[]> = {
  phone: [
    { type: "wrong_number", label: "Wrong number" },
    { type: "not_owner", label: "Not the owner" },
  ],
  whatsapp: [
    { type: "wrong_number", label: "Wrong number" },
    { type: "not_owner", label: "Not the owner" },
  ],
  email: [
    { type: "bounced", label: "Bounced" },
    { type: "not_owner", label: "Not the owner" },
  ],
  person: [{ type: "not_owner", label: "Not the owner" }],
};

const KIND_NAMES: Record<ContactRow["kind"], string> = { phone: "Phone", whatsapp: "WhatsApp", email: "Email", person: "Contact" };

const OPT_OUT_CONFIRM = "They asked not to be contacted? Their email and numbers go on your suppression list (and their email domain, when it's their own website's), and no messages will be shown for them.";

type OutcomeTap = ReturnType<typeof useOutcomeTap>;

// One outcome tap: logged as an outcome and an event, never on anyone's
// behalf. Feedback and opt-outs ask first. Resolves true once it is logged.
function useOutcomeTap(base: string, onChange: () => Promise<void>) {
  const [busy, setBusy] = useState<string | null>(null);
  const [logged, setLogged] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function tap(body: OutcomeBody, key: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(key);
    setProblem(null);
    try {
      const res = await post(`${base}/outcomes`, body);
      if (res.status === 401) {
        goToLogin();
        return false;
      }
      // Refused for this lead (Sent after an opt-out): say why, then show where it stands.
      if (res.status === 409) {
        const { error }: ApiErrorResponse = await res.json();
        setProblem(error.message);
        await onChange();
        return false;
      }
      if (!res.ok) throw new Error(String(res.status));
      const result: OutcomeResponse = await res.json();
      setLogged(outcomeText(result.outcome, (v) => showValue(result.outcome.contactKind ?? "", v)));
      await onChange();
      return true;
    } catch {
      setProblem("That wasn't logged. Check your connection and tap it again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return { busy, logged, problem, tap };
}

function OutcomeStatus({ outcome, idle }: { outcome: OutcomeTap; idle: string }) {
  return (
    <>
      <p className="text-sm" role="status" aria-live="polite">
        {outcome.logged ? (
          <span className="inline-flex items-center gap-1.5 text-positive-ink">
            <Check className="size-4" aria-hidden /> Logged: {outcome.logged}
          </span>
        ) : (
          <span className="text-muted">{idle}</span>
        )}
      </p>
      {outcome.problem && <p className="text-sm text-negative-ink">{outcome.problem}</p>}
    </>
  );
}

// The outcome buttons: the full record for this lead (Lost, every contact
// point, the history). Data feedback lowers that contact point's confidence
// on the shared record, so it asks first.
export function OutcomePanel({ base, outreach, onChange }: { base: string; outreach: LeadOutreachResponse; onChange: () => Promise<void> }) {
  const outcome = useOutcomeTap(base, onChange);
  const { busy, tap } = outcome;

  // Nothing is sent to someone who opted out, so they get no Sent button.
  const buttons = outreach.suppressed ? STAGE_BUTTONS.filter((b) => b.type !== "sent") : STAGE_BUTTONS;

  return (
    <section aria-labelledby="outcome-heading" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="outcome-heading" className="text-section font-semibold">
          {outreach.suppressed ? "Tap what happened" : "After you send, tap what happened"}
        </h3>
        <StageChip stage={outreach.stage} />
      </div>

      <div className={cn("grid gap-2", outreach.suppressed ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-5")}>
        {buttons.map((b) => (
          <Button
            key={b.type}
            type="button"
            variant="outline"
            className={cn("h-14 flex-col gap-1 text-sm sm:h-10 sm:flex-row sm:gap-2", outreach.stage === b.type && "border-primary bg-primary text-on-primary hover:bg-primary/85")}
            disabled={busy !== null}
            aria-pressed={outreach.stage === b.type}
            onClick={() => void tap({ type: b.type }, b.type)}
          >
            {b.icon}
            {b.label}
          </Button>
        ))}
      </div>
      <OutcomeStatus
        outcome={outcome}
        idle={outreach.suppressed ? "They asked not to be contacted. Log a reply or a result here." : "Tap what happened. Copying or opening a message marks it Sent."}
      />

      {outreach.contacts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Contact details wrong?</p>
          <ul className="flex flex-col rounded-card border border-border">
            {outreach.contacts.map((c) => (
              <li key={`${c.kind}-${c.value}`} className="flex flex-col gap-2 border-b border-rule px-3.5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                  <span className="text-muted">{KIND_NAMES[c.kind]}: </span>
                  <span className="wrap-anywhere">{showValue(c.kind, c.value)}</span>
                  <span className="text-xs text-muted"> · {labelText(c.kind, c.label).word}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {FEEDBACK[c.kind].map((f) => (
                    <Button
                      key={f.type}
                      type="button"
                      variant="outline"
                      className="h-11 px-3 text-sm"
                      disabled={busy !== null}
                      onClick={() =>
                        void tap(
                          { type: f.type, contactKind: c.kind, contactValue: c.value },
                          `${f.type}-${c.kind}`,
                          `Mark ${showValue(c.kind, c.value)} as "${f.label.toLowerCase()}"? This lowers its confidence for every team using this business.`,
                        )
                      }
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!outreach.suppressed && (
        <Button
          type="button"
          variant="destructive"
          className="h-12 w-full gap-2 sm:h-10 sm:w-auto sm:self-start sm:px-3"
          disabled={busy !== null}
          onClick={() => void tap({ type: "opted_out" }, "opted_out", OPT_OUT_CONFIRM)}
        >
          <Ban className="size-4" aria-hidden /> They asked not to be contacted
        </Button>
      )}

      {outreach.outcomes.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-medium">History</p>
          <ul className="flex flex-col gap-1 text-sm">
            {outreach.outcomes.slice(0, 10).map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-x-3">
                <span>{outcomeText(o, (v) => showValue(o.contactKind ?? "", v))}</span>
                <span className="text-xs text-muted">{formatDateTime(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function StageChip({ stage, small }: { stage: Stage; small?: boolean }) {
  return <span className={cn("rounded-full px-2 text-xs/[22px] font-medium", small && "px-1.5", STAGE_TONES[stage])}>{STAGE_NAMES[stage]}</span>;
}
