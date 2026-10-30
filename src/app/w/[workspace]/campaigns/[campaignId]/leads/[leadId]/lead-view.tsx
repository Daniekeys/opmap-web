"use client";

import {
  AlertTriangle,
  ChevronDown,
  Compass,
  ExternalLink,
  FileSearch,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Phone,
  Quote,
  RotateCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/api-types/leads";
import type { LeadOutreachResponse } from "@/lib/api-types/outreach";
import type { Cite, Claim, LeadResearchResponse, OpenLeadResponse, OpportunityCard } from "@/lib/api-types/research";
import { formatDateTime } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { categoryText, formatPhone, telHref, whatsappHref } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { LeadContacts } from "../../lead-contacts";
import { CardDrafts, OutcomePanel, StageChip } from "./outreach-panel";

type Props = {
  workspaceId: string;
  slug: string;
  campaignId: string;
  initial: LeadResearchResponse;
  initialOutreach: LeadOutreachResponse;
  listLead: Lead | null;
};

// What happened when we asked for a run, when it isn't a run to follow.
type Ask = { state: "idle" } | { state: "asking" } | { state: "limit"; reason: string } | { state: "error" };

type Tab = "opportunity" | "messages" | "outcome" | "details";

// How many times to ask again (1.5 s apart) for a run someone else just claimed.
const MAX_WAITS = 20;
// The API's text for a removed entry that is a whole card, not one claim.
const WHOLE_CARD = "(whole card)";

const linkClass = "text-primary underline-offset-4 hover:underline wrap-anywhere";

// The lead page's live part: opens the deep-dive on first view (once; the API
// makes sure two people opening it start one run), follows its progress, and
// shows the cards, "Not enough information", or what went wrong.
export function LeadView({ workspaceId, slug, campaignId, initial, initialOutreach, listLead }: Props) {
  const [data, setData] = useState(initial);
  const [outreach, setOutreach] = useState(initialOutreach);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  // A run this page started or joined, before the GET shows it.
  const [runId, setRunId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("opportunity");
  // The card whose messages the Messages tab shows.
  const [cardId, setCardId] = useState<string | null>(null);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}/leads/${data.lead.leadId}`;

  async function reload() {
    const res = await fetch(base, { cache: "no-store" });
    if (res.status === 401) return goToLogin();
    if (!res.ok) throw new Error(String(res.status));
    const next: LeadResearchResponse = await res.json();
    setData(next);
    setRunId(null);
    await reloadOutreach();
  }

  // Drafts, contact points and outcomes: after a draft run, a send or a tap.
  async function reloadOutreach() {
    const res = await fetch(`${base}/outreach`, { cache: "no-store" });
    if (res.status === 401) return goToLogin();
    if (!res.ok) throw new Error(String(res.status));
    setOutreach(await res.json());
  }

  async function open(refresh: boolean) {
    setAsk({ state: "asking" });
    try {
      const res = await fetch(`${base}/deep-dive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(refresh ? { refresh } : {}) });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      const result: OpenLeadResponse = await res.json();
      if (result.state === "limit") return setAsk({ state: "limit", reason: result.reason });
      if ((result.state === "started" || result.state === "running") && result.runId) {
        waits.current = 0;
        setAsk({ state: "idle" });
        setRunId(result.runId);
      } else if (result.state === "running" && waits.current < MAX_WAITS) {
        // Someone else's run, claimed a moment ago: its id is set right after.
        // Stay "asking" while we wait, so the progress section doesn't flicker.
        waits.current += 1;
        if (alive.current) retry.current = setTimeout(() => void open(false), 1_500);
      } else {
        // Done, or still no id after the waits: show what the API has.
        waits.current = 0;
        setAsk({ state: "idle" });
        await reload();
      }
    } catch {
      setAsk({ state: "error" });
    }
  }

  // The wait for a claimed run's id: stopped when the page closes.
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waits = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (retry.current) clearTimeout(retry.current);
    };
  }, []);

  // First view only: no deep-dive has ever been asked for this lead.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || initial.run !== null) return;
    opened.current = true;
    void open(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const following = runId ?? (data.run?.status === "running" ? data.run.runId : null);
  const failed = !following && data.run?.status === "failed";
  const cards = data.result?.cards ?? [];
  const chosenCard = cards.find((c) => c.id === cardId) ?? cards[0] ?? null;
  const draftCount = outreach.cards.reduce((n, c) => n + c.drafts.length, 0);

  function writeFor(id: string) {
    setCardId(id);
    setTab("messages");
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    { key: "opportunity", label: "Opportunity", icon: <Lightbulb className="size-4" aria-hidden />, badge: cards.length > 0 ? cards.length : undefined },
    { key: "messages", label: "Messages", icon: <MessagesSquare className="size-4" aria-hidden />, badge: draftCount > 0 ? draftCount : undefined },
    { key: "outcome", label: "Outcome", icon: <Trophy className="size-4" aria-hidden /> },
    { key: "details", label: "Details", icon: <FileSearch className="size-4" aria-hidden /> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <LeadHeader lead={data.lead} stage={outreach.stage} researched={data.result !== null} />

      {ask.state === "limit" && (
        <Notice tone="warn" title="Spending limit reached">
          {ask.reason} The deep-dive will run once there is budget again.
        </Notice>
      )}
      {ask.state === "error" && (
        <Notice tone="error" title="Couldn't start the research">
          Check your connection and try again.
          <Button type="button" variant="outline" className="mt-3 h-11 self-start" onClick={() => open(false)}>
            <RotateCw className="size-4" aria-hidden /> Try again
          </Button>
        </Notice>
      )}

      {(following || ask.state === "asking" || (data.run?.status === "running" && !data.run.runId)) && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs" aria-label="Research in progress">
          <p className="flex items-center gap-2 text-sm font-medium" role="status">
            <Sparkles className="size-4 animate-pulse text-fuchsia-500" aria-hidden />
            Researching this business: reading what it publishes, then writing and checking opportunity cards. About a minute.
          </p>
          {following ? (
            <ProgressPanel workspaceId={workspaceId} runId={following} title="Deep-dive" onFinished={() => void reload().catch(() => setAsk({ state: "error" }))} />
          ) : (
            <CardsLoading />
          )}
        </section>
      )}

      {failed && !data.result && (
        <Notice tone="error" title="The research didn't finish">
          {failureText(data.run?.errorCode ?? null, data.run?.error ?? null, slug)}
          {data.run?.errorCode !== "brand_not_usable" && (
            <Button type="button" variant="outline" className="mt-3 h-11 self-start" onClick={() => open(false)} disabled={ask.state === "asking"}>
              <RotateCw className="size-4" aria-hidden /> Try again
            </Button>
          )}
        </Notice>
      )}

      <div role="tablist" aria-label="Lead" className="sticky top-14 z-30 -mx-4 flex gap-1 overflow-x-auto border-b bg-background/90 px-4 backdrop-blur lg:top-0 lg:mx-0 lg:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex h-12 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors",
              tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn(tab === t.key && "text-primary")}>{t.icon}</span>
            {t.label}
            {t.key === "outcome" && outreach.stage !== "new" ? (
              <StageChip stage={outreach.stage} small />
            ) : (
              t.badge !== undefined && <span className="rounded-md bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{t.badge}</span>
            )}
            {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
          </button>
        ))}
      </div>

      {tab === "opportunity" &&
        (data.result ? (
          <Result result={data.result} onRefresh={() => open(true)} refreshing={ask.state === "asking" || following !== null} failedRefresh={failed} onWrite={writeFor} outreach={outreach} />
        ) : (
          !following && ask.state !== "asking" && !failed && <Waiting />
        ))}

      {tab === "messages" &&
        (chosenCard ? (
          <section aria-label="Messages" className="flex flex-col gap-4">
            {cards.length > 1 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Written from</p>
                <div className="flex flex-wrap gap-2">
                  {cards.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={c.id === chosenCard.id}
                      onClick={() => setCardId(c.id)}
                      className={cn(
                        "inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border px-3 text-left text-sm",
                        c.id === chosenCard.id ? "border-primary/40 bg-primary/10 text-primary" : "bg-card hover:bg-muted",
                      )}
                    >
                      <span className="text-xs font-semibold">#{i + 1}</span>
                      <span className="truncate">{c.offer?.text ?? "Opportunity"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-4">
              <Target className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="font-semibold text-indigo-950">{chosenCard.offer?.text ?? "Opportunity"}</span>
                {chosenCard.gap && <span className="text-indigo-950/70">{chosenCard.gap.text}</span>}
              </div>
            </div>
            <CardDrafts key={chosenCard.id} base={base} workspaceId={workspaceId} slug={slug} opportunityId={chosenCard.id} outreach={outreach} onChange={reloadOutreach} />
          </section>
        ) : (
          <EmptyTab icon={<MessagesSquare className="size-5" />} title="No messages yet">
            Messages are written from an opportunity card, so every sentence has a source. {data.result ? "This business has none to write from." : "They can be written once the research finishes."}
          </EmptyTab>
        ))}

      {tab === "outcome" && <OutcomePanel base={base} outreach={outreach} onChange={reloadOutreach} />}

      {tab === "details" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section aria-labelledby="contacts-heading" className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-xs">
            <h2 id="contacts-heading" className="text-sm font-semibold">
              Contact points
            </h2>
            {listLead ? <LeadContacts lead={listLead} /> : <p className="text-sm text-muted-foreground">Not found in this campaign&apos;s list.</p>}
          </section>
          {data.signals.length > 0 ? (
            <Signals signals={data.signals} />
          ) : (
            <EmptyTab icon={<FileSearch className="size-5" />} title="Nothing found yet">
              What the research reads about this business shows here.
            </EmptyTab>
          )}
        </div>
      )}
    </div>
  );
}

function failureText(code: string | null, error: string | null, slug: string) {
  if (code === "brand_not_usable")
    return (
      <>
        The cards can only use facts you approved, and your Brand DNA isn&apos;t approved yet.{" "}
        <Link href={`/w/${slug}/brand`} className={linkClass}>
          Go to Brand DNA
        </Link>
      </>
    );
  if (code === "limit_reached") return error ?? "The spending limit was reached.";
  return error ?? "Something went wrong while researching this business.";
}

function LeadHeader({ lead, stage, researched }: { lead: LeadResearchResponse["lead"]; stage: LeadOutreachResponse["stage"]; researched: boolean }) {
  const details = [categoryText(lead.category), lead.city].filter(Boolean).join(" · ");
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-gradient-to-br from-indigo-300/30 via-fuchsia-300/20 to-transparent blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={lead.name} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight wrap-break-word sm:text-2xl">{lead.name}</h1>
              <StageChip stage={stage} />
              {researched && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-800">
                  <Sparkles className="size-3" aria-hidden /> Researched
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {details && <span>{details}</span>}
              {lead.rating !== null && (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
                  <span className="font-medium">{lead.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({lead.reviewCount ?? 0} reviews)</span>
                </span>
              )}
            </p>
          </div>
        </div>
        {(lead.phone || lead.whatsapp || lead.website) && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {lead.whatsapp && (
              <a href={whatsappHref(lead.whatsapp.value)} target="_blank" rel="noreferrer noopener" className={cn(tapClass, "border-transparent bg-emerald-600 text-white hover:bg-emerald-700")}>
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </a>
            )}
            {lead.phone && (
              <a href={telHref(lead.phone.value)} className={tapClass}>
                <Phone className="size-4 text-violet-600" aria-hidden /> {formatPhone(lead.phone.value)}
              </a>
            )}
            {lead.website && lead.website.label !== "dead" && (
              <a href={lead.website.value} target="_blank" rel="noreferrer noopener" className={tapClass}>
                <ExternalLink className="size-4 text-indigo-600" aria-hidden /> Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const tapClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium whitespace-nowrap shadow-xs hover:bg-muted";

function Result({
  result,
  onRefresh,
  refreshing,
  failedRefresh,
  onWrite,
  outreach,
}: {
  result: NonNullable<LeadResearchResponse["result"]>;
  onRefresh: () => void;
  refreshing: boolean;
  failedRefresh: boolean;
  onWrite: (cardId: string) => void;
  outreach: LeadOutreachResponse;
}) {
  return (
    <section aria-label="Opportunities" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {result.finishedAt && <p className="text-xs text-muted-foreground">Researched {formatDateTime(result.finishedAt)}</p>}
        {result.stale && (
          <Button type="button" variant="outline" className="h-11" onClick={onRefresh} disabled={refreshing}>
            <RotateCw className="size-4" aria-hidden /> Refresh research
          </Button>
        )}
      </div>
      {result.stale && <p className="text-sm text-muted-foreground">This research is over 90 days old. Refresh it before reaching out.</p>}
      {failedRefresh && <p className="text-sm text-destructive">The last refresh didn&apos;t finish. These are the cards from before it.</p>}

      {result.cards.length === 0 ? (
        <NotEnough reason={result.notEnough} read={result.read} />
      ) : (
        <ol className="flex flex-col gap-4">
          {result.cards.map((card, i) => {
            const written = (outreach.cards.find((c) => c.opportunityId === card.id)?.drafts.length ?? 0) > 0;
            return (
              <li key={card.id}>
                <OpportunityCardView card={card} index={i + 1} written={written} onWrite={() => onWrite(card.id)} />
              </li>
            );
          })}
        </ol>
      )}

      {result.removed.length > 0 && <Removed removed={result.removed} />}
    </section>
  );
}

function NotEnough({ reason, read }: { reason: string | null; read: NonNullable<LeadResearchResponse["result"]>["read"] }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed bg-card p-5">
      <p className="flex items-center gap-2 font-semibold">
        <FileSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Not enough information
      </p>
      <p className="text-sm">{reason ?? "We couldn't tie any of your offers to something specific at this business."}</p>
      {read && (
        <p className="text-sm text-muted-foreground">
          Read: {read.pages} website {read.pages === 1 ? "page" : "pages"}, {read.socials} social {read.socials === 1 ? "account" : "accounts"}, the Google Maps listing.
        </p>
      )}
      <p className="text-sm text-muted-foreground">We don&apos;t guess. Call them, or look them up yourself, before pitching.</p>
    </div>
  );
}

const CONFIDENCE: Record<string, { word: string; tone: string; bar: string }> = {
  high: { word: "High confidence", tone: "bg-emerald-100 text-emerald-900", bar: "from-emerald-400 to-teal-500" },
  medium: { word: "Medium confidence", tone: "bg-sky-100 text-sky-900", bar: "from-sky-400 to-indigo-500" },
  low: { word: "Low confidence", tone: "bg-amber-100 text-amber-950", bar: "from-amber-400 to-orange-500" },
};

function OpportunityCardView({ card, index, written, onWrite }: { card: OpportunityCard; index: number; written: boolean; onWrite: () => void }) {
  const confidence = CONFIDENCE[card.confidence] ?? { word: card.confidence, tone: "bg-muted", bar: "from-zinc-300 to-zinc-400" };
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className={cn("h-1.5 bg-gradient-to-r", confidence.bar)} aria-hidden />
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">Opportunity {index}</span>
            <span className={cn("rounded-full px-2 py-0.5 font-medium", confidence.tone)} title={card.confidenceReason ?? undefined}>
              {confidence.word}
            </span>
          </div>
          {card.offer && (
            <>
              <h3 className="text-lg font-semibold tracking-tight wrap-break-word">{card.offer.text}</h3>
              <Evidence claim={card.offer} />
            </>
          )}
        </div>

        {card.gap && (
          <Section icon={<TriangleAlert className="size-4" />} tone="bg-rose-100 text-rose-700" label="The gap">
            <p className="text-sm">{card.gap.text}</p>
            <Evidence claim={card.gap} />
          </Section>
        )}

        {card.why.length > 0 && (
          <Section icon={<Compass className="size-4" />} tone="bg-amber-100 text-amber-700" label="Why it matters to them">
            {card.why.map((w) => (
              <div key={w.id} className="flex flex-col gap-1">
                <p className="text-sm">{w.text}</p>
                <Evidence claim={w} />
              </div>
            ))}
          </Section>
        )}

        <Section icon={<Quote className="size-4" />} tone="bg-indigo-100 text-indigo-700" label="Angle">
          {card.angle ? (
            <>
              <p className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50/70 px-4 py-3 text-sm font-medium text-indigo-950">{card.angle.text}</p>
              <Evidence claim={card.angle} />
            </>
          ) : (
            // A card stands on its offer and gap; its angle may have failed the check.
            <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">No opening line passed the check. Open with the gap above, in your own words.</p>
          )}
        </Section>

        {card.confidenceReason && <p className="text-xs text-muted-foreground">{card.confidenceReason}</p>}

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{written ? "Messages are written for this opportunity." : "Turn this into WhatsApp, email and call messages."}</p>
          <Button type="button" className="h-11 gap-2 px-5" onClick={onWrite}>
            <MessagesSquare className="size-4" aria-hidden /> {written ? "Open messages" : "Write messages"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Section({ icon, tone, label, children }: { icon: React.ReactNode; tone: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", tone)} aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="pt-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        {children}
      </div>
    </div>
  );
}

const SOURCE_NAMES: Record<string, string> = { places: "Google Maps listing", website: "Their website", search: "Search result" };

const pageName = (url: string) => {
  try {
    const u = new URL(url);
    // Google Maps, not other Google pages (a Google Sites website is the business's own).
    if (u.hostname.startsWith("maps.") || (u.hostname.includes("google.") && u.pathname.startsWith("/maps"))) return "Google Maps";
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
};

// The evidence under a claim, folded to a "2 sources" chip and readable
// without leaving the page: each quote in full, with a link to its page.
function Evidence({ claim }: { claim: Claim }) {
  const [open, setOpen] = useState(false);
  if (claim.cites.length === 0) return null;
  const n = claim.cites.length;
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 self-start rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <FileSearch className="size-3.5" aria-hidden />
        {open ? "Hide" : "Show"} {n} {n === 1 ? "source" : "sources"}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5">
          {claim.cites.map((c) => (
            <li key={`${claim.id}-${c.ref}`} className="rounded-xl bg-muted/70 px-3 py-2 text-sm">
              <CiteView cite={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CiteView({ cite }: { cite: Cite }) {
  if (cite.kind === "fact") {
    return (
      <p>
        <span className="text-muted-foreground">Your approved fact: </span>
        {cite.text}
      </p>
    );
  }
  const text = cite.kind === "source" ? `“${cite.quote}”` : cite.text;
  const from = cite.kind === "source" ? (SOURCE_NAMES[cite.sourceType] ?? "Source") : "Our check";
  return (
    <div className="flex flex-col gap-1">
      <p className={cn(cite.kind === "source" && "italic")}>{text}</p>
      <p className="text-xs text-muted-foreground">
        {from} ·{" "}
        <a href={cite.url} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1")}>
          {pageName(cite.url)} <ExternalLink className="size-3" aria-hidden />
        </a>
      </p>
    </div>
  );
}

function Removed({ removed }: { removed: NonNullable<LeadResearchResponse["result"]>["removed"] }) {
  // The summary counts every entry the list shows: claims, and whole cards dropped.
  const cards = removed.filter((r) => r.text === WHOLE_CARD).length;
  const claims = removed.length - cards;
  const parts = [claims > 0 && `${claims} ${claims === 1 ? "claim" : "claims"}`, cards > 0 && `${cards} ${cards === 1 ? "card" : "cards"}`].filter(Boolean);
  return (
    <details className="rounded-2xl border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium">{parts.join(" and ")} removed: their sources didn&apos;t back them</summary>
      <ul className="mt-3 flex flex-col gap-2">
        {removed.map((r, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className="line-through decoration-muted-foreground/60">{r.text}</span>
            <span className="text-xs text-muted-foreground">
              Card {r.card}, {r.field}: {r.reason}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Signals({ signals }: { signals: LeadResearchResponse["signals"] }) {
  return (
    <section aria-labelledby="signals-heading" className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-xs">
      <h2 id="signals-heading" className="text-sm font-semibold">
        What we found
      </h2>
      <ul className="flex flex-col divide-y">
        {signals.map((s, i) => (
          <li key={i} className="flex flex-col gap-0.5 py-2.5 text-sm">
            <span className="text-xs font-medium text-primary">{s.label}</span>
            <span className="wrap-break-word">{s.text}</span>
            <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1 self-start text-xs text-muted-foreground")}>
              {pageName(s.sourceUrl)} <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardsLoading() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading">
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function Waiting() {
  return (
    <EmptyTab icon={<Sparkles className="size-5" />} title="Not researched yet">
      The research starts when this page opens. If it hasn&apos;t, reload the page.
    </EmptyTab>
  );
}

function EmptyTab({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Notice({ tone, title, children }: { tone: "warn" | "error"; title: string; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col gap-1 rounded-2xl border p-4 text-sm", tone === "error" ? "border-destructive/30 bg-destructive/5" : "border-amber-300 bg-amber-50 text-amber-950")}
    >
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="size-4 shrink-0" aria-hidden /> {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
