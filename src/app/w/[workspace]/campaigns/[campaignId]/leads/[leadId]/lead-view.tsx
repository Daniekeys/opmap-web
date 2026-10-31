"use client";

import { AlertTriangle, ChevronDown, ExternalLink, MessageCircle, Phone, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { TileMark } from "@/components/logo";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/api-types/leads";
import type { LeadOutreachResponse } from "@/lib/api-types/outreach";
import type { Claim, DatedCite, LeadResearchResponse, OpenLeadResponse, OpportunityCard } from "@/lib/api-types/research";
import { citeName, citeReadAt, readOn } from "@/lib/campaign-view";
import { formatDateTime } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { categoryText, formatPhone, labelText, telHref, whatsappHref } from "@/lib/leads";
import { STAGE_NAMES, STAGE_TONES } from "@/lib/outreach";
import { cn } from "@/lib/utils";
import { hostOf, LeadContacts } from "../../lead-contacts";
import { CardDrafts, OutcomePanel } from "./outreach-panel";

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

const linkClass = "font-medium text-accent-ink underline-offset-4 hover:text-accent hover:underline wrap-anywhere";
const outlineLink = "inline-flex h-11 items-center justify-center gap-2 rounded-control border border-control bg-surface px-3.5 text-sm font-medium whitespace-nowrap hover:bg-raised sm:h-10";

// The lead page's live part (Main.dc.html's open business; MobileDetail.dc.html
// on a phone): opens the deep-dive on first view (once; the API makes sure two
// people opening it start one run), follows its progress, and shows the
// opportunity cards, "Not enough information", or what went wrong.
export function LeadView({ workspaceId, slug, campaignId, initial, initialOutreach, listLead }: Props) {
  const [data, setData] = useState(initial);
  const [outreach, setOutreach] = useState(initialOutreach);
  const [ask, setAsk] = useState<Ask>({ state: "idle" });
  // A run this page started or joined, before the GET shows it.
  const [runId, setRunId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("opportunity");
  // The card shown in full on the Opportunity tab, and written from on Messages.
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
  const researching = following !== null || ask.state === "asking" || (data.run?.status === "running" && !data.run.runId);
  const failed = !following && data.run?.status === "failed";
  const cards = data.result?.cards ?? [];
  const chosenCard = cards.find((c) => c.id === cardId) ?? cards[0] ?? null;
  const draftCount = outreach.cards.reduce((n, c) => n + c.drafts.length, 0);
  const suppressed = outreach.suppressed;
  const chosenWritten = chosenCard ? (outreach.cards.find((c) => c.opportunityId === chosenCard.id)?.drafts.length ?? 0) > 0 : false;

  function writeFor(id: string) {
    setCardId(id);
    setTab("messages");
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "opportunity", label: "Opportunity", count: cards.length || undefined },
    { key: "messages", label: "Messages", count: draftCount || undefined },
    { key: "outcome", label: "Outcome" },
    { key: "details", label: "Details" },
  ];

  // The one primary action, in the header on wide screens and in the bottom
  // bar on a phone. Never shown for a business on the opt-out list.
  const primary = !suppressed && chosenCard && (
    <Button type="button" className="h-13 w-full gap-2 text-base sm:h-10 sm:w-auto sm:text-sm" onClick={() => writeFor(chosenCard.id)}>
      <MessageCircle className="size-4.5 sm:size-4" strokeWidth={1.75} aria-hidden />
      {chosenWritten ? "Open messages" : "Write messages"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4 pb-28 sm:pb-0">
      <section aria-label={data.lead.name} className="flex flex-col sm:rounded-card sm:border sm:border-border sm:bg-surface">
        <LeadHeader lead={data.lead} stage={outreach.stage} suppressed={suppressed} primary={primary} />

        <div role="tablist" aria-label="Lead" className="-mx-4 flex gap-6 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px flex h-11 shrink-0 items-center gap-1.5 border-b-2 text-body",
                tab === t.key ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.key === "outcome" && outreach.stage !== "new" ? (
                <span className={cn("rounded-full px-2 text-xs/[22px] font-medium", STAGE_TONES[outreach.stage])}>{STAGE_NAMES[outreach.stage]}</span>
              ) : (
                t.count !== undefined && <span className="font-normal text-muted tabular-nums">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:px-6 sm:pt-5 sm:pb-6">
          {ask.state === "limit" && (
            <Notice tone="warn" title="Spending limit reached">
              {ask.reason} The research will run once there is budget again.
            </Notice>
          )}
          {ask.state === "error" && (
            <Notice tone="error" title="We couldn't start the research">
              Check your connection and try again.
              <Button type="button" variant="outline" className="mt-3 h-11 self-start" onClick={() => open(false)}>
                <RotateCw aria-hidden /> Try again
              </Button>
            </Notice>
          )}

          {researching && (
            <div className="flex flex-col gap-3" aria-label="Research in progress">
              <p className="text-sm text-muted" role="status">
                Researching this business: reading what it publishes, then writing and checking opportunity cards. About a minute.
              </p>
              {following ? (
                <ProgressPanel workspaceId={workspaceId} runId={following} title="Research" onFinished={() => void reload().catch(() => setAsk({ state: "error" }))} />
              ) : (
                <CardsLoading />
              )}
            </div>
          )}

          {failed && !data.result && (
            <Notice tone="error" title="The research didn't finish">
              {failureText(data.run?.errorCode ?? null, data.run?.error ?? null, slug)}
              {data.run?.errorCode !== "brand_not_usable" && (
                <Button type="button" variant="outline" className="mt-3 h-11 self-start" onClick={() => open(false)} disabled={ask.state === "asking"}>
                  <RotateCw aria-hidden /> Try again
                </Button>
              )}
            </Notice>
          )}

          {tab === "opportunity" &&
            (data.result ? (
              <Result
                result={data.result}
                chosen={chosenCard}
                onChoose={setCardId}
                onRefresh={() => open(true)}
                refreshing={researching}
                failedRefresh={failed}
                listLead={listLead}
              />
            ) : (
              !researching && !failed && <Waiting />
            ))}

          {tab === "messages" &&
            (chosenCard ? (
              <section aria-label="Messages" className="flex flex-col gap-4">
                {cards.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted">Written from</p>
                    <div className="flex flex-wrap gap-2">
                      {cards.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={c.id === chosenCard.id}
                          onClick={() => setCardId(c.id)}
                          className={cn(
                            "inline-flex min-h-10 max-w-full items-center rounded-control border px-3 text-left text-sm",
                            c.id === chosenCard.id ? "border-primary bg-primary font-medium text-on-primary" : "border-control bg-surface hover:bg-raised",
                          )}
                        >
                          <span className="truncate">{c.offer?.text ?? "Opportunity"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CardDrafts
                  key={chosenCard.id}
                  base={base}
                  workspaceId={workspaceId}
                  slug={slug}
                  card={chosenCard}
                  finishedAt={data.result?.finishedAt ?? null}
                  outreach={outreach}
                  onChange={reloadOutreach}
                />
              </section>
            ) : (
              <EmptyState title="No messages yet">
                Messages are written from an opportunity card, so every sentence has a source.{" "}
                {data.result ? "This business has none to write from." : "They can be written once the research finishes."}
              </EmptyState>
            ))}

          {tab === "outcome" && <OutcomePanel base={base} outreach={outreach} onChange={reloadOutreach} />}

          {tab === "details" && (
            <div className="flex flex-col gap-6">
              <section aria-labelledby="contacts-heading" className="flex flex-col gap-2">
                <h3 id="contacts-heading" className="font-semibold">
                  Contact points
                </h3>
                {listLead ? <LeadContacts lead={listLead} linked={!suppressed} /> : <p className="text-sm text-muted">Not found in this campaign&apos;s list.</p>}
              </section>
              {data.signals.length > 0 ? (
                <Signals signals={data.signals} />
              ) : (
                <EmptyState title="Nothing found yet">What the research reads about this business shows here.</EmptyState>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Phone: the one action in thumb reach. */}
      {tab === "opportunity" && (primary || suppressed) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-5 sm:hidden">
          {suppressed ? <OptedOutNote /> : primary}
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

function OptedOutNote() {
  return (
    <p className="flex flex-col gap-0.5 text-sm" role="note">
      <span className="font-semibold text-negative-ink">On your opt-out list</span>
      <span className="text-muted">They asked not to be contacted, so no messages are written or shown.</span>
    </p>
  );
}

// "Cake shop in Ilorin, 4.7 stars from 35 reviews".
function describe(lead: LeadResearchResponse["lead"]) {
  const kind = categoryText(lead.category);
  const where = kind && lead.city ? `${kind} in ${lead.city}` : (kind ?? lead.city);
  const rating = lead.rating !== null ? `${lead.rating.toFixed(1)} stars from ${lead.reviewCount ?? 0} ${lead.reviewCount === 1 ? "review" : "reviews"}` : null;
  return [where, rating].filter(Boolean).join(", ");
}

function LeadHeader({
  lead,
  stage,
  suppressed,
  primary,
}: {
  lead: LeadResearchResponse["lead"];
  stage: LeadOutreachResponse["stage"];
  suppressed: boolean;
  primary: React.ReactNode;
}) {
  const website = lead.website && lead.website.label !== "dead" ? lead.website : null;
  return (
    <div className="flex flex-col gap-4 pb-4 sm:border-b sm:border-rule sm:px-6 sm:py-5">
      <div className="flex items-center gap-3 sm:gap-3.5">
        <Avatar name={lead.name} seed={lead.businessId} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-[22px] leading-7 font-bold tracking-[-0.01em] wrap-break-word sm:text-xl sm:leading-[26px] sm:font-semibold sm:tracking-normal">{lead.name}</h2>
            {suppressed ? (
              <span className="rounded-full bg-negative-soft px-2 text-xs/[22px] font-medium text-negative-ink">On your opt-out list</span>
            ) : (
              stage !== "new" && <span className={cn("rounded-full px-2 text-xs/[22px] font-medium", STAGE_TONES[stage])}>{STAGE_NAMES[stage]}</span>
            )}
          </div>
          <span className="text-sm text-muted">{describe(lead)}</span>
        </div>
      </div>
      {suppressed ? (
        <div className="hidden sm:block">
          <OptedOutNote />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <span className="hidden sm:contents">{primary}</span>
          {lead.whatsapp && (
            <a href={whatsappHref(lead.whatsapp.value)} target="_blank" rel="noreferrer noopener" className={outlineLink}>
              <MessageCircle className="size-4 text-muted" strokeWidth={1.75} aria-hidden /> Chat on WhatsApp
            </a>
          )}
          {lead.phone && (
            <a href={telHref(lead.phone.value)} className={outlineLink}>
              <Phone className="size-4 text-muted" strokeWidth={1.75} aria-hidden /> {formatPhone(lead.phone.value)}
            </a>
          )}
          {website && (
            <a href={website.value} target="_blank" rel="noreferrer noopener" className={outlineLink}>
              <ExternalLink className="size-4 text-muted" strokeWidth={1.75} aria-hidden /> Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Result({
  result,
  chosen,
  onChoose,
  onRefresh,
  refreshing,
  failedRefresh,
  listLead,
}: {
  result: NonNullable<LeadResearchResponse["result"]>;
  chosen: OpportunityCard | null;
  onChoose: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  failedRefresh: boolean;
  listLead: Lead | null;
}) {
  const others = result.cards.filter((c) => c.id !== chosen?.id);
  return (
    <section aria-label="Opportunities" className="flex flex-col gap-4">
      {result.stale && (
        <div className="flex flex-col gap-2 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning-ink sm:flex-row sm:items-center sm:justify-between">
          <span>This research is over 90 days old. Refresh it before reaching out.</span>
          <Button type="button" variant="outline" className="h-11 shrink-0 sm:h-9" onClick={onRefresh} disabled={refreshing}>
            <RotateCw aria-hidden /> Refresh research
          </Button>
        </div>
      )}
      {failedRefresh && <p className="text-sm text-negative-ink">The last refresh didn&apos;t finish. These are the cards from before it.</p>}

      {chosen ? (
        <article className="flex flex-col gap-3.5 rounded-card border border-border bg-surface p-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">{rankText(chosen, result.cards.length)}</span>
            <Confidence card={chosen} />
          </div>
          <h3 className="text-section font-semibold wrap-break-word">{chosen.offer?.text ?? "Opportunity"}</h3>
          {chosen.offer && chosen.offer.cites.length > 0 && <ClaimSource claim={chosen.offer} readAt={result.finishedAt} />}
          {chosen.gap && <ClaimBlock claim={chosen.gap} readAt={result.finishedAt} />}
          {chosen.why.map((w) => (
            <ClaimBlock key={w.id} claim={w} readAt={result.finishedAt} />
          ))}
          {chosen.angle ? (
            <ClaimBlock claim={chosen.angle} readAt={result.finishedAt} lead="Angle." muted />
          ) : (
            // A card stands on its offer and gap; its angle may have failed the check.
            <p className="text-muted">Angle. No opening line passed the check. Open with the gap above, in your own words.</p>
          )}
          {chosen.confidenceReason && <p className="text-xs text-muted">{chosen.confidenceReason}</p>}

          {listLead && <ContactWell lead={listLead} />}

          {others.length > 0 && (
            <div className="flex flex-col border-t border-rule pt-1.5">
              {others.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChoose(c.id)}
                  className="flex min-h-11 items-center justify-between gap-3 py-2 text-left hover:text-accent-ink"
                >
                  <span className="min-w-0">{c.offer?.text ?? "Opportunity"}</span>
                  <span className={cn("shrink-0 text-xs", (CONFIDENCE[c.confidence]?.word ?? "") === "High" ? "text-positive" : "text-warning-ink")}>
                    {CONFIDENCE[c.confidence]?.word ?? c.confidence}
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>
      ) : (
        <NotEnough reason={result.notEnough} read={result.read} />
      )}

      {result.removed.length > 0 && <Removed removed={result.removed} />}
      {result.finishedAt && <p className="text-xs text-muted">Researched {formatDateTime(result.finishedAt)}</p>}
    </section>
  );
}

function rankText(card: OpportunityCard, total: number) {
  if (total === 1) return "The one opportunity found";
  return card.rank === 1 ? `Best of ${total} opportunities` : `Opportunity ${card.rank} of ${total}`;
}

const CONFIDENCE: Record<string, { word: string; tone: string }> = {
  high: { word: "High", tone: "bg-positive-soft text-positive-ink" },
  medium: { word: "Medium", tone: "bg-warning-soft text-warning-ink" },
  low: { word: "Low", tone: "bg-warning-soft text-warning-ink" },
};

function Confidence({ card }: { card: OpportunityCard }) {
  const c = CONFIDENCE[card.confidence] ?? { word: card.confidence, tone: "bg-neutral-soft text-neutral-ink" };
  return <span className={cn("shrink-0 rounded-full px-2 text-xs/[22px] font-medium", c.tone)}>{c.word} confidence</span>;
}

// "Not enough information" as its own designed state: the tile grid with
// nothing lit, what was read, and what to do instead. Never a blank space.
function NotEnough({ reason, read }: { reason: string | null; read: NonNullable<LeadResearchResponse["result"]>["read"] }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
      <span className="grid w-fit grid-cols-4 gap-1" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="size-3.5 rounded-tile bg-rule" />
        ))}
      </span>
      <h3 className="text-section font-semibold">Not enough information</h3>
      <p>{reason ?? "We couldn't tie any of your offers to something specific at this business."}</p>
      {read && (
        <div className="rounded-control bg-raised px-3.5 py-3 text-sm">
          <span className="font-medium">What we read: </span>
          {read.pages} website {read.pages === 1 ? "page" : "pages"}, {read.socials} social {read.socials === 1 ? "account" : "accounts"} and the Google Maps listing.
        </div>
      )}
      <p className="text-sm text-muted">We don&apos;t guess. Call them, or look them up yourself, before pitching.</p>
    </div>
  );
}

// A claim's text, with its sourced part marked, and where it came from.
function ClaimBlock({ claim, readAt, lead, muted }: { claim: Claim; readAt: string | null; lead?: string; muted?: boolean }) {
  const sourced = claim.cites.some((c) => c.kind !== "fact");
  return (
    <div className="flex flex-col gap-1.5">
      <p className={cn(muted && "text-muted")}>
        {lead && <span className="text-muted">{lead} </span>}
        {sourced ? (
          <mark className="rounded-tile bg-accent-soft px-0.5 text-accent-ink underline decoration-accent decoration-2 underline-offset-[3px] box-decoration-clone">{claim.text}</mark>
        ) : (
          claim.text
        )}
      </p>
      <ClaimSource claim={claim} readAt={readAt} />
    </div>
  );
}

// Where a claim came from, always visible ("Instagram bio, read 28 Oct"),
// opening to the quotes themselves. Sources read on the same day share one
// date; approved facts have none.
function ClaimSource({ claim, readAt }: { claim: Claim; readAt: string | null }) {
  const [open, setOpen] = useState(false);
  if (claim.cites.length === 0) return null;
  const byDay = new Map<string, string[]>();
  for (const c of claim.cites) {
    const day = c.kind === "fact" ? "" : readOn(citeReadAt(c, readAt));
    const names = byDay.get(day) ?? [];
    if (!names.includes(citeName(c))) names.push(citeName(c));
    byDay.set(day, names);
  }
  const label = [...byDay].map(([day, names]) => (day ? `${names.join(", ")}, ${day}` : names.join(", "))).join(" · ");
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-8 items-center gap-1 self-start text-left text-xs text-muted hover:text-ink"
      >
        {label}
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        <span className="sr-only">{open ? "Hide the evidence" : "Show the evidence"}</span>
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5">
          {claim.cites.map((c) => (
            <li key={`${claim.id}-${c.ref}`} className="flex flex-col gap-0.5 rounded-control bg-raised px-3.5 py-3">
              <CiteView cite={c} readAt={readAt} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CiteView({ cite, readAt }: { cite: DatedCite; readAt: string | null }) {
  if (cite.kind === "fact") {
    return (
      <>
        <span>{cite.text}</span>
        <span className="text-xs text-muted">Your approved fact</span>
      </>
    );
  }
  const text = cite.kind === "source" ? `“${cite.quote}”` : cite.text;
  return (
    <>
      <span>{text}</span>
      <span className="text-xs text-muted">
        {citeName(cite)}, {readOn(citeReadAt(cite, readAt))} ·{" "}
        <a href={cite.url} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1 font-normal")}>
          {(cite.kind === "source" && cite.sourceType === "places") || /google\./.test(cite.url) ? "Open the listing" : hostOf(cite.url)} <ExternalLink className="size-3" aria-hidden />
        </a>
      </span>
    </>
  );
}

const PILL = { good: "bg-positive-soft text-positive-ink", fair: "bg-neutral-soft text-neutral-ink", weak: "bg-warning-soft text-warning-ink" };

// WhatsApp, email and website at a glance, each with how sure we are.
function ContactWell({ lead }: { lead: Lead }) {
  const { whatsapp, phone, email, website } = lead.contacts;
  const rows: { key: string; label: string; value: string; pill: { word: string; tone: string } }[] = [];
  const pill = (group: Parameters<typeof labelText>[0], label: string) => {
    const t = labelText(group, label);
    return { word: t.word, tone: PILL[t.tone] };
  };
  if (whatsapp) rows.push({ key: "w", label: "WhatsApp", value: formatPhone(whatsapp.value), pill: pill("whatsapp", whatsapp.label) });
  else if (phone) rows.push({ key: "p", label: "Phone", value: formatPhone(phone.value), pill: pill("phone", phone.label) });
  else rows.push({ key: "w", label: "WhatsApp", value: "-", pill: { word: "None found", tone: PILL.fair } });
  rows.push(email ? { key: "e", label: "Email", value: email.value, pill: pill("email", email.label) } : { key: "e", label: "Email", value: "-", pill: { word: "None found", tone: PILL.fair } });
  rows.push(
    website ? { key: "s", label: "Website", value: hostOf(website.value), pill: pill("website", website.label) } : { key: "s", label: "Website", value: "-", pill: { word: "Not listed", tone: PILL.fair } },
  );
  return (
    <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-t border-rule pt-3.5 text-sm">
      {rows.map((r) => (
        <div key={r.key} className="contents">
          <dt className="text-muted">{r.label}</dt>
          <dd className={cn("truncate tabular-nums", r.value === "-" && "text-muted")}>{r.value}</dd>
          <dd>
            <span className={cn("rounded-full px-2 text-xs/[22px] font-medium whitespace-nowrap", r.pill.tone)}>{r.pill.word}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Removed({ removed }: { removed: NonNullable<LeadResearchResponse["result"]>["removed"] }) {
  // The summary counts every entry the list shows: claims, and whole cards dropped.
  const cards = removed.filter((r) => r.text === WHOLE_CARD).length;
  const claims = removed.length - cards;
  const parts = [claims > 0 && `${claims} ${claims === 1 ? "claim" : "claims"}`, cards > 0 && `${cards} ${cards === 1 ? "card" : "cards"}`].filter(Boolean);
  return (
    <details className="group text-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-muted hover:text-ink">
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
        {parts.join(" and ")} removed: their sources didn&apos;t back them
      </summary>
      <ul className="flex flex-col gap-2 pb-1 pl-5.5">
        {removed.map((r, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className="text-muted line-through">{r.text}</span>
            <span className="text-xs text-muted">
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
      <h3 id="signals-heading" className="font-semibold">
        What we found
      </h3>
      <ul className="flex flex-col">
        {signals.map((s, i) => (
          <li key={i} className="flex flex-col gap-0.5 border-b border-rule py-2.5 text-sm last:border-b-0">
            <span className="text-xs text-muted">{s.label}</span>
            <span className="wrap-break-word">{s.text}</span>
            <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className={cn(linkClass, "inline-flex items-center gap-1 self-start text-xs font-normal")}>
              {hostOf(s.sourceUrl)} <ExternalLink className="size-3" aria-hidden />
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
      <div className="h-6 w-2/3 animate-pulse rounded-control bg-raised" />
      <div className="h-20 animate-pulse rounded-control bg-raised" />
      <div className="h-20 animate-pulse rounded-control bg-raised" />
    </div>
  );
}

function Waiting() {
  return <EmptyState title="Not researched yet">The research starts when this page opens. If it hasn&apos;t, reload the page.</EmptyState>;
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4 sm:border-0 sm:bg-transparent sm:p-0">
      <TileMark className="size-6 opacity-60" />
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted">{children}</p>
    </div>
  );
}

function Notice({ tone, title, children }: { tone: "warn" | "error"; title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className={cn("flex flex-col gap-1 rounded-card px-4 py-3 text-sm", tone === "error" ? "bg-negative-soft text-negative-ink" : "bg-warning-soft text-warning-ink")}>
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-4 shrink-0" aria-hidden /> {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
