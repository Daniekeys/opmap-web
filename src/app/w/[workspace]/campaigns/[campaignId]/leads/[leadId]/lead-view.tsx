"use client";

import { AlertTriangle, ExternalLink, FileSearch, MessageCircle, Phone, RotateCw, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { Cite, Claim, LeadResearchResponse, OpenLeadResponse, OpportunityCard } from "@/lib/api-types/research";
import { formatDateTime } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { categoryText, formatPhone, telHref, whatsappHref } from "@/lib/leads";
import { cn } from "@/lib/utils";

type Props = { workspaceId: string; slug: string; campaignId: string; initial: LeadResearchResponse };

// What happened when we asked for a run, when it isn't a run to follow.
type Ask = { state: "idle" } | { state: "asking" } | { state: "limit"; reason: string } | { state: "error" };

// How many times to ask again (1.5 s apart) for a run someone else just claimed.
const MAX_WAITS = 20;
// The API's text for a removed entry that is a whole card, not one claim.
const WHOLE_CARD = "(whole card)";

const linkClass ="text-primary underline-offset-4 hover:underline wrap-anywhere";

// The lead page's live part: opens the deep-dive on first view (once; the API
// makes sure two people opening it start one run), follows its progress, and
// shows the cards, "Not enough information", or what went wrong.
export function LeadView({ workspaceId, slug, campaignId, initial }: Props) {
  const [data, setData] = useState(initial);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  // A run this page started or joined, before the GET shows it.
  const [runId, setRunId] = useState<string | null>(null);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}/leads/${data.lead.leadId}`;

  async function reload() {
    const res = await fetch(base, { cache: "no-store" });
    if (res.status === 401) return goToLogin();
    if (!res.ok) throw new Error(String(res.status));
    const next: LeadResearchResponse = await res.json();
    setData(next);
    setRunId(null);
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

  return (
    <div className="flex flex-col gap-6">
      <LeadHeader lead={data.lead} />

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
        <section className="flex flex-col gap-2" aria-label="Research in progress">
          <p className="text-sm text-muted-foreground" role="status">
            Researching this business: reading what it publishes, then writing and checking opportunity cards. This takes about a minute.
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

      {data.result && <Result result={data.result} onRefresh={() => open(true)} refreshing={ask.state === "asking" || following !== null} failedRefresh={failed} />}

      {data.signals.length > 0 && <Signals signals={data.signals} />}
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

function LeadHeader({ lead }: { lead: LeadResearchResponse["lead"] }) {
  const details = [categoryText(lead.category), lead.city].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">{lead.name}</h1>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {details && <span>{details}</span>}
          {lead.rating !== null && (
            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
              {lead.rating.toFixed(1)}
              <span className="text-muted-foreground">({lead.reviewCount ?? 0} reviews)</span>
            </span>
          )}
        </p>
      </div>
      {(lead.phone || lead.whatsapp || lead.website) && (
        <div className="flex flex-wrap gap-2">
          {lead.phone && (
            <a href={telHref(lead.phone.value)} className={tapClass}>
              <Phone className="size-4" aria-hidden /> {formatPhone(lead.phone.value)}
            </a>
          )}
          {lead.whatsapp && (
            <a href={whatsappHref(lead.whatsapp.value)} target="_blank" rel="noreferrer noopener" className={tapClass}>
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          )}
          {lead.website && lead.website.label !== "dead" && (
            <a href={lead.website.value} target="_blank" rel="noreferrer noopener" className={tapClass}>
              <ExternalLink className="size-4" aria-hidden /> Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const tapClass = "inline-flex h-11 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted";

function Result({
  result,
  onRefresh,
  refreshing,
  failedRefresh,
}: {
  result: NonNullable<LeadResearchResponse["result"]>;
  onRefresh: () => void;
  refreshing: boolean;
  failedRefresh: boolean;
}) {
  return (
    <section aria-labelledby="cards-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="cards-heading" className="text-lg font-semibold">
            Opportunities
          </h2>
          {result.finishedAt && <p className="text-sm text-muted-foreground">Researched {formatDateTime(result.finishedAt)}</p>}
        </div>
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
        <ol className="flex flex-col gap-3">
          {result.cards.map((card) => (
            <li key={card.id}>
              <OpportunityCardView card={card} />
            </li>
          ))}
        </ol>
      )}

      {result.removed.length > 0 && <Removed removed={result.removed} />}
    </section>
  );
}

function NotEnough({ reason, read }: { reason: string | null; read: NonNullable<LeadResearchResponse["result"]>["read"] }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-4">
      <p className="flex items-center gap-2 font-medium">
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

const CONFIDENCE: Record<string, { word: string; tone: string }> = {
  high: { word: "High confidence", tone: "bg-emerald-100 text-emerald-900" },
  medium: { word: "Medium confidence", tone: "bg-sky-100 text-sky-900" },
  low: { word: "Low confidence", tone: "bg-amber-100 text-amber-950" },
};

function OpportunityCardView({ card }: { card: OpportunityCard }) {
  const confidence = CONFIDENCE[card.confidence] ?? { word: card.confidence, tone: "bg-muted" };
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", confidence.tone)} title={card.confidenceReason ?? undefined}>
            {confidence.word}
          </span>
        </div>
        {card.offer && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Offer</p>
            <h3 className="text-base font-semibold wrap-break-word">{card.offer.text}</h3>
            <Evidence claim={card.offer} />
          </div>
        )}
      </div>
      {card.gap && <ClaimBlock label="The gap" claim={card.gap} />}
      {card.why.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Why it matters to them</p>
          {card.why.map((w) => (
            <div key={w.id} className="flex flex-col gap-1">
              <p className="text-sm">{w.text}</p>
              <Evidence claim={w} />
            </div>
          ))}
        </div>
      )}
      {card.angle ? (
        <ClaimBlock label="Angle" claim={card.angle} quoteStyle />
      ) : (
        // A card stands on its offer and gap; its angle may have failed the check.
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Angle</p>
          <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            No opening line passed the check. Open with the gap above, in your own words.
          </p>
        </div>
      )}
      {card.confidenceReason && <p className="text-xs text-muted-foreground">{card.confidenceReason}</p>}
    </article>
  );
}

function ClaimBlock({ label, claim, quoteStyle }: { label: string; claim: Claim; quoteStyle?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-sm", quoteStyle && "font-medium")}>{claim.text}</p>
      <Evidence claim={claim} />
    </div>
  );
}

const SOURCE_NAMES: Record<string, string> = { places: "Google Maps listing", website: "Their website", search: "Search result" };

const pageName = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("google.")) return "Google Maps";
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
};

// The evidence under a claim, readable without leaving the page: each quote
// in full, with a link that opens the page it came from.
function Evidence({ claim }: { claim: Claim }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {claim.cites.map((c) => (
        <li key={`${claim.id}-${c.ref}`} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <CiteView cite={c} />
        </li>
      ))}
    </ul>
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
  const parts = [
    claims > 0 && `${claims} ${claims === 1 ? "claim" : "claims"}`,
    cards > 0 && `${cards} ${cards === 1 ? "card" : "cards"}`,
  ].filter(Boolean);
  return (
    <details className="rounded-xl border bg-card p-4 text-sm">
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
    <section aria-labelledby="signals-heading" className="flex flex-col gap-2">
      <h2 id="signals-heading" className="text-sm font-medium text-muted-foreground">
        What we found
      </h2>
      <ul className="flex flex-col divide-y rounded-xl border bg-card">
        {signals.map((s, i) => (
          <li key={i} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="wrap-break-word">{s.text}</span>
            <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1 self-start text-xs")}>
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

function Notice({ tone, title, children }: { tone: "warn" | "error"; title: string; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4 text-sm",
        tone === "error" ? "border-destructive/30 bg-destructive/5" : "border-amber-300 bg-amber-50 text-amber-950",
      )}
    >
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="size-4 shrink-0" aria-hidden /> {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
