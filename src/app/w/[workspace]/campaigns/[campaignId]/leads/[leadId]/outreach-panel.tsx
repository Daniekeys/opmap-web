"use client";

import {
  Ban,
  CalendarCheck,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
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
import { useState } from "react";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { OutcomeBody, OutcomeResponse, Stage } from "@/lib/api-types/outcomes";
import type { Channel, ContactRow, Draft, DraftLine, LeadOutreachResponse, SendVia, StartDraftsResponse, Target } from "@/lib/api-types/outreach";
import type { Cite } from "@/lib/api-types/research";
import { formatDateTime } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { formatPhone, labelText, telHref } from "@/lib/leads";
import { CHANNEL_NAMES, gmailHref, outcomeText, outlookHref, STAGE_NAMES, STAGE_TONES, whatsappSendHref } from "@/lib/outreach";
import { cn } from "@/lib/utils";

type CardOutreach = LeadOutreachResponse["cards"][number];

const linkClass = "text-accent-ink underline-offset-4 hover:underline wrap-anywhere";
// Every button a thumb has to hit: at least 48 px tall.
const bigTap = "h-12 w-full justify-center gap-2 text-sm";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });

const showValue = (kind: string, value: string) => (kind === "phone" || kind === "whatsapp" ? formatPhone(value) : value);

// ---- drafts under one card -------------------------------------------------

type Ask = { state: "idle" } | { state: "asking" } | { state: "limit"; reason: string } | { state: "blocked"; reason: string } | { state: "error" };

// "Write messages" on a card, its progress, then the four drafts. Drafts are
// written only when asked, once; opening the page again shows the saved ones.
export function CardDrafts({
  base,
  workspaceId,
  slug,
  opportunityId,
  outreach,
  onChange,
}: {
  base: string;
  workspaceId: string;
  slug: string;
  opportunityId: string;
  outreach: LeadOutreachResponse;
  onChange: () => Promise<void>;
}) {
  const card = outreach.cards.find((c) => c.opportunityId === opportunityId);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  const [runId, setRunId] = useState<string | null>(null);

  async function write() {
    setAsk({ state: "asking" });
    try {
      const res = await post(`${base}/drafts`, { opportunityId });
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
      <Box icon={<Ban className="size-4" aria-hidden />} title="Asked not to be contacted">
        This business is on your suppression list, so no messages are shown.
      </Box>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {following ? (
        <div className="flex flex-col gap-2">
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
        <DraftTabs base={base} drafts={drafts} outreach={outreach} onChange={onChange} />
      ) : (
        <Start blocked={outreach.blocked} slug={slug} card={card} ask={ask} onWrite={() => void write()} />
      )}
      {ask.state === "limit" && <p className="text-sm text-warning-ink">{ask.reason} Messages can be written once there is budget again.</p>}
      {ask.state === "blocked" && <p className="text-sm text-warning-ink">{ask.reason}</p>}
      {ask.state === "error" && <p className="text-sm text-negative-ink">Couldn&apos;t write the messages. Check your connection and try again.</p>}
    </div>
  );
}

function Start({ blocked, slug, card, ask, onWrite }: { blocked: LeadOutreachResponse["blocked"]; slug: string; card: CardOutreach | undefined; ask: Ask; onWrite: () => void }) {
  if (blocked === "no_target") {
    return (
      <p className="text-sm text-muted">
        No contact point for this lead is checked well enough to send to. A WhatsApp number needs a WhatsApp link they published, and an email must be on their own site. Call them from the number above,
        or check their details first.
      </p>
    );
  }
  if (blocked === "brand_not_usable") {
    return (
      <p className="text-sm text-muted">
        Messages sign off with your business name and only use facts you approved.{" "}
        <Link href={`/w/${slug}/brand`} className={linkClass}>
          Approve your Brand DNA
        </Link>
      </p>
    );
  }
  const failed = card?.run?.status === "failed";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-5 py-8 text-center">
      <div className="flex -space-x-2" aria-hidden>
        {(["whatsapp", "email", "linkedin", "call"] as Channel[]).map((c) => (
          <span key={c} className={cn("inline-flex size-10 items-center justify-center rounded-full ring-4 ring-card", CHANNEL_TONES[c].icon)}>
            {ICONS[c]}
          </span>
        ))}
      </div>
      {failed && <p className="text-sm text-negative-ink">{card?.run?.error ?? "Writing the messages failed."}</p>}
      <Button type="button" className={cn(bigTap, "sm:w-auto sm:px-6")} onClick={onWrite} disabled={ask.state === "asking"}>
        {failed ? <RotateCw className="size-4" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
        {failed ? "Try again" : ask.state === "asking" ? "Starting" : "Write WhatsApp, email, LinkedIn and call messages"}
      </Button>
      {!failed && <p className="max-w-sm text-xs text-muted">Written from this opportunity only, and checked sentence by sentence. Costs a few cents, once.</p>}
    </div>
  );
}

const ICONS: Record<Channel, React.ReactNode> = {
  whatsapp: <MessageCircle className="size-4" aria-hidden />,
  email: <Mail className="size-4" aria-hidden />,
  linkedin: <ExternalLink className="size-4" aria-hidden />,
  call: <Phone className="size-4" aria-hidden />,
};

// Each channel's colour: its icon chip, its selected tab, and its send button.
const CHANNEL_TONES: Record<Channel, { icon: string; tab: string; send: string }> = {
  whatsapp: { icon: "bg-positive-soft text-positive-ink", tab: "bg-positive text-on-primary", send: "bg-positive hover:bg-positive" },
  email: { icon: "bg-neutral-soft text-neutral-ink", tab: "bg-primary text-on-primary", send: "bg-primary hover:bg-primary" },
  linkedin: { icon: "bg-neutral-soft text-neutral-ink", tab: "bg-primary text-on-primary", send: "bg-primary hover:bg-primary" },
  call: { icon: "bg-accent-soft text-accent-ink", tab: "bg-primary text-on-primary", send: "bg-primary hover:bg-primary" },
};

function DraftTabs({ base, drafts, outreach, onChange }: { base: string; drafts: Draft[]; outreach: LeadOutreachResponse; onChange: () => Promise<void> }) {
  const [open, setOpen] = useState<Channel>(drafts[0]!.channel);
  const draft = drafts.find((d) => d.channel === open) ?? drafts[0]!;
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Messages" className="grid grid-cols-4 gap-1 rounded-xl border bg-card p-1">
        {drafts.map((d) => (
          <button
            key={d.channel}
            type="button"
            role="tab"
            aria-selected={d.channel === open}
            onClick={() => setOpen(d.channel)}
            className={cn(
              "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:text-sm",
              d.channel === open ? cn(CHANNEL_TONES[d.channel].tab, "") : "text-muted hover:bg-raised hover:text-foreground",
            )}
          >
            {ICONS[d.channel]}
            <span className="truncate">{d.channel === "linkedin" ? "LinkedIn" : d.channel === "call" ? "Call" : CHANNEL_NAMES[d.channel]}</span>
            {d.status !== "ready" && <span className="sr-only">(not ready)</span>}
          </button>
        ))}
      </div>
      <DraftView key={draft.id} base={base} draft={draft} outreach={outreach} onChange={onChange} />
    </div>
  );
}

function DraftView({ base, draft, outreach, onChange }: { base: string; draft: Draft; outreach: LeadOutreachResponse; onChange: () => Promise<void> }) {
  const [copied, setCopied] = useState<"body" | "subject" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
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

  // Logs the send (an event, and a "Sent" outcome the first time), then
  // reloads the lead. The link itself opens at once; the log never blocks it.
  async function logSend(via: SendVia) {
    setProblem(null);
    try {
      const res = await post(`${base}/drafts/${draft.id}/send`, { via });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      await onChange();
    } catch {
      setProblem("The send wasn't logged. Tap Sent below once it has gone.");
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

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-2.5 text-sm">
          <span className="w-12 shrink-0 text-xs text-muted">To</span>
          <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md", CHANNEL_TONES[draft.channel].icon)} aria-hidden>
            {ICONS[draft.channel]}
          </span>
          <span className="min-w-0 truncate font-medium">{target ? showValue(target.kind, target.value) : "No checked contact"}</span>
        </div>
        {draft.subject && (
          <div className="flex items-center gap-3 border-b px-4 py-1 text-sm">
            <span className="w-12 shrink-0 text-xs text-muted">Subject</span>
            <span className="min-w-0 flex-1 font-semibold">{draft.subject}</span>
            <Button type="button" variant="ghost" className="h-10 shrink-0 px-3" onClick={() => void copy("subject")} aria-label="Copy subject">
              {copied === "subject" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </Button>
          </div>
        )}
        <div className="px-4 py-4 sm:px-5">
          <Lines lines={draft.lines} />
        </div>
        <div className="flex flex-col gap-2 border-t bg-raised px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-xs text-muted">Highlighted sentences are claims: tap one to see what shows it.</p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
            <Button type="button" variant={target ? "outline" : "default"} className={cn(bigTap, "sm:w-auto sm:px-4")} onClick={() => void copy("body")}>
              {copied === "body" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied === "body" ? "Copied" : "Copy"}
            </Button>
            <SendLinks draft={draft} target={target} onSend={(via) => void logSend(via)} />
          </div>
        </div>
      </div>
      <TargetLine channel={draft.channel} target={target} />
      {draft.channel === "email" && outreach.country.emailNote && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
          {outreach.country.emailNote} <span className="text-warning-ink">(A summary of {outreach.country.law}, not legal advice.)</span>
        </p>
      )}
      {problem && <p className="text-sm text-negative-ink">{problem}</p>}
      <RemovedList removed={draft.removed} />
    </div>
  );
}

const sendBase = "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium whitespace-nowrap text-on-primary sm:w-auto";

function SendLinks({ draft, target, onSend }: { draft: Draft; target: Target | null; onSend: (via: SendVia) => void }) {
  if (!target) return null;
  const open = { target: "_blank", rel: "noreferrer noopener" } as const;
  const sendClass = cn(sendBase, CHANNEL_TONES[draft.channel].send);
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
        <a href={outlookHref(target.value, subject, draft.body)} {...open} className={cn(sendBase, "border bg-background text-foreground hover:bg-raised")} onClick={() => onSend("outlook")}>
          <Mail className="size-4" aria-hidden /> Open in Outlook
        </a>
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

function TargetLine({ channel, target }: { channel: Channel; target: Target | null }) {
  if (!target) return <p className="text-xs text-muted">{TARGET_MISSING[channel]}</p>;
  const group = target.kind === "linkedin" ? "social" : target.kind;
  const label = labelText(group, target.label);
  return (
    <p className="text-xs text-muted">
      Sends to {showValue(target.kind, target.value)} · <span title={label.tip}>{label.word}</span>
      {label.tip ? ` (${label.tip})` : ""}
    </p>
  );
}

// The message as it will be sent, line by line. A claim is highlighted and
// opens to the facts or quotes that show it.
function Lines({ lines }: { lines: DraftLine[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {lines.map((line, i) =>
        line.kind === "claim" ? (
          <div key={i} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="-mx-1 rounded px-1 py-0.5 text-left decoration-amber-500/70 decoration-dotted underline-offset-4 hover:bg-warning-soft [&]:underline"
            >
              <span className="bg-warning-soft box-decoration-clone">{line.text}</span>
              <ChevronDown className={cn("ml-1 inline size-3.5 text-muted transition-transform", open === i && "rotate-180")} aria-hidden />
            </button>
            {open === i && <LineCites cites={line.cites} span={line.span} />}
          </div>
        ) : (
          <p key={i} className={cn("whitespace-pre-line", line.kind === "optout" && "text-xs text-muted", line.kind === "signoff" && "text-muted")}>
            {line.text}
          </p>
        ),
      )}
    </div>
  );
}

const SOURCE_NAMES: Record<string, string> = { places: "Google Maps listing", website: "Their website", search: "Search result" };

function LineCites({ cites, span }: { cites: Cite[]; span: string | null }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {cites.map((c) => (
        <li key={c.ref} className="rounded-lg bg-raised px-3 py-2 text-xs">
          {c.kind === "fact" ? (
            <p>
              <span className="text-muted">Your approved fact: </span>
              {c.text}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className={cn(c.kind === "source" && "italic")}>{c.kind === "source" ? `“${c.quote}”` : c.text}</p>
              <a href={c.url} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1 self-start text-muted")}>
                {c.kind === "source" ? (SOURCE_NAMES[c.sourceType] ?? "Source") : "Our check"} <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          )}
        </li>
      ))}
      {span && (
        <li className="px-1 text-xs text-muted">
          The check found: <span className="italic">“{span.split("\n")[0]}”</span>
        </li>
      )}
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

function Box({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-dashed px-3 py-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        {icon} {title}
      </p>
      <p className="text-muted">{children}</p>
    </div>
  );
}

// ---- outcomes ----------------------------------------------------------------

const STAGE_BUTTONS: { type: "sent" | "replied" | "meeting" | "won" | "lost"; label: string; icon: React.ReactNode; on: string }[] = [
  { type: "sent", label: "Sent", icon: <Send className="size-4" aria-hidden />, on: "border-muted/30 bg-primary text-on-primary hover:bg-primary" },
  { type: "replied", label: "Replied", icon: <MessageSquareReply className="size-4" aria-hidden />, on: "border-accent/30 bg-primary text-on-primary hover:bg-primary" },
  { type: "meeting", label: "Meeting", icon: <CalendarCheck className="size-4" aria-hidden />, on: "border-warning-ink/30 bg-warning-ink text-on-primary hover:bg-warning-ink" },
  { type: "won", label: "Won", icon: <Trophy className="size-4" aria-hidden />, on: "border-positive/30 bg-positive text-on-primary hover:bg-positive" },
  { type: "lost", label: "Lost", icon: <X className="size-4" aria-hidden />, on: "border-muted/30 bg-primary text-on-primary hover:bg-primary" },
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

// The outcome buttons: every tap is logged as an outcome and an event, never
// on anyone's behalf. Data feedback lowers that contact point's confidence on
// the shared record, so it asks first.
export function OutcomePanel({ base, outreach, onChange }: { base: string; outreach: LeadOutreachResponse; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [logged, setLogged] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function tap(body: OutcomeBody, key: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key);
    setProblem(null);
    try {
      const res = await post(`${base}/outcomes`, body);
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      const result: OutcomeResponse = await res.json();
      setLogged(outcomeText(result.outcome, (v) => showValue(result.outcome.contactKind ?? "", v)));
      await onChange();
    } catch {
      setProblem("That wasn't logged. Check your connection and tap it again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="outcome-heading" className="flex flex-col gap-5 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="outcome-heading" className="text-lg font-semibold">
          What happened?
        </h2>
        <StageChip stage={outreach.stage} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {STAGE_BUTTONS.map((b) => (
          <Button
            key={b.type}
            type="button"
            variant="outline"
            className={cn("h-14 flex-col gap-1 rounded-xl text-sm sm:h-12 sm:flex-row sm:gap-2", outreach.stage === b.type && b.on)}
            disabled={busy !== null}
            aria-pressed={outreach.stage === b.type}
            onClick={() => void tap({ type: b.type }, b.type)}
          >
            {b.icon}
            {b.label}
          </Button>
        ))}
      </div>
      <p className="text-sm" role="status" aria-live="polite">
        {logged ? (
          <span className="inline-flex items-center gap-1.5 text-positive-ink">
            <Check className="size-4" aria-hidden /> Logged: {logged}
          </span>
        ) : (
          <span className="text-muted">Tap what happened. Copying or opening a message marks it Sent.</span>
        )}
      </p>
      {problem && <p className="text-sm text-negative-ink">{problem}</p>}

      {outreach.contacts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Contact details wrong?</p>
          <ul className="flex flex-col divide-y rounded-lg border">
            {outreach.contacts.map((c) => (
              <li key={`${c.kind}-${c.value}`} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
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
          className="h-12 w-full gap-2 sm:w-auto sm:self-start sm:px-5"
          disabled={busy !== null}
          onClick={() => void tap({ type: "opted_out" }, "opted_out", "They asked not to be contacted? Their email, website domain and numbers go on your suppression list, and no messages will be shown for them.")}
        >
          <Ban className="size-4" aria-hidden /> They asked not to be contacted
        </Button>
      )}

      {outreach.outcomes.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">History</p>
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
  return <span className={cn("rounded-full font-medium", small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs", STAGE_TONES[stage])}>{STAGE_NAMES[stage]}</span>;
}
