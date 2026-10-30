"use client";

import { MapPin, RotateCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { inputClass } from "@/components/input-class";
import { PageLoading } from "@/components/page-loading";
import { ProgressPanel } from "@/components/progress-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import type { BuyerSegment, SegmentsResponse, StartSegmentsBody } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { rankedUpWhen, rankLabel, reachWords, segmentsIntro } from "@/lib/segments";
import { cn } from "@/lib/utils";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "loaded"; data: SegmentsResponse };

// GET the segments, or POST to start (or retry) their run. A GET that finds
// none yet starts the run: opening the screen is what asks for them.
// Null when the session has expired (the page is leaving for the login).
async function fetchSegments(workspaceId: string, method: "GET" | "POST", body?: StartSegmentsBody): Promise<SegmentsResponse | null> {
  const res = await fetch(`/api/w/${workspaceId}/buyer-segments`, {
    method,
    ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) } : {}),
  });
  if (res.status === 401) {
    goToLogin();
    return null;
  }
  if (!res.ok) throw new Error(String(res.status));
  const data: SegmentsResponse = await res.json();
  return method === "GET" && data.state === "none" ? fetchSegments(workspaceId, "POST") : data;
}

// The campaign screen's first step (design/screens/Segments.dc.html): the
// buyer segments suggested from the approved Brand DNA, as cards to pick one
// from, or a buyer of your own. Starts the (once per Brand DNA version) run
// when there are none yet, and shows its progress. "Not on Maps yet" cards
// can't be picked.
export function SegmentPicker({
  workspaceId,
  slug,
  onPick,
  onOwn,
}: {
  workspaceId: string;
  slug: string;
  onPick: (segment: BuyerSegment, setId: string) => void;
  onOwn: (name: string) => void;
}) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  // The picked card's rank; null for none (or a buyer of your own).
  const [picked, setPicked] = useState<number | null>(null);
  const [own, setOwn] = useState("");

  const loaded = (data: SegmentsResponse | null) => {
    if (!data) return;
    setLoad({ state: "loaded", data });
    setPicked(data.segments.find((s) => s.reachability === "places")?.rank ?? null);
  };
  const failed = () => setLoad({ state: "error", message: "Couldn't load your buyer segments. Check your connection and try again." });

  // Retry buttons and a finished run fetch again.
  const request = (method: "GET" | "POST", body?: StartSegmentsBody) => fetchSegments(workspaceId, method, body).then(loaded, failed);

  useEffect(() => {
    let live = true;
    fetchSegments(workspaceId, "GET").then(
      (data) => {
        if (!live || !data) return;
        setLoad({ state: "loaded", data });
        setPicked(data.segments.find((s) => s.reachability === "places")?.rank ?? null);
      },
      () => live && setLoad({ state: "error", message: "Couldn't load your buyer segments. Check your connection and try again." }),
    );
    return () => {
      live = false;
    };
  }, [workspaceId]);

  const data = load.state === "loaded" ? load.data : null;
  const segments = data?.state === "ready" ? data.segments : [];
  const chosen = segments.find((s) => s.rank === picked) ?? null;

  function next(event: FormEvent) {
    event.preventDefault();
    if (own.trim()) onOwn(own.trim());
    else if (chosen && data?.setId) onPick(chosen, data.setId);
  }

  const ownForm = (
    <form
      onSubmit={next}
      className="flex max-w-page flex-col gap-4 rounded-card border border-border bg-surface px-5 py-5 sm:flex-row sm:flex-wrap sm:items-end md:px-6"
    >
      <label className="flex flex-col gap-2 text-sm font-medium sm:flex-[1_1_360px]">
        Or describe your own buyer
        <input
          type="text"
          value={own}
          onChange={(e) => {
            setOwn(e.target.value);
            if (e.target.value.trim()) setPicked(null);
          }}
          placeholder="Private schools that just opened a second campus"
          autoComplete="off"
          maxLength={100}
          className={inputClass}
        />
      </label>
      <Button type="submit" className="h-11 text-base md:h-10 md:text-sm" disabled={!own.trim() && !chosen}>
        Next: choose where
      </Button>
    </form>
  );

  let body: React.ReactNode;
  if (load.state === "loading") body = <PageLoading />;
  else if (load.state === "error") {
    body = (
      <Problem title={load.message}>
        <Button type="button" variant="outline" className="h-11 self-start md:h-10" onClick={() => request("GET")}>
          <RotateCw className="size-4" aria-hidden /> Try again
        </Button>
      </Problem>
    );
  } else if (data!.state === "not_approved") {
    body = (
      <div className="flex max-w-read flex-col gap-2 rounded-card border border-dashed border-control bg-surface px-5 py-5 text-sm md:px-6">
        <p className="font-semibold">Brand DNA not approved yet</p>
        <p className="text-muted">
          Buyer segments are worked out from what you sell, so they need an approved Brand DNA first. Approve it, or describe
          the buyer you want yourself below.
        </p>
        <Link href={`/w/${slug}/brand`} className={cn(buttonVariants(), "h-11 self-start text-base md:h-10 md:text-sm")}>
          Go to Brand DNA
        </Link>
      </div>
    );
  } else if (data!.state === "running" || data!.state === "none") {
    body = (
      <div className="flex max-w-read flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-muted" role="status">
          <Sparkles className="size-4 shrink-0" aria-hidden /> Working out who is most likely to buy from you. This takes about
          a minute, once per Brand DNA version.
        </p>
        {data!.run && <ProgressPanel workspaceId={workspaceId} runId={data!.run.id} onFinished={() => request("GET")} />}
      </div>
    );
  } else if (data!.state === "failed") {
    body = (
      <Problem title="Couldn't suggest buyer segments" detail={data!.error}>
        <Button type="button" variant="outline" className="h-11 self-start md:h-10" onClick={() => request("POST", { retry: true })}>
          <RotateCw className="size-4" aria-hidden /> Try again
        </Button>
      </Problem>
    );
  } else {
    body = (
      <>
        <ol className="grid max-w-page gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {segments.map((segment) => (
            <li key={segment.rank} className="flex flex-col gap-4">
              <SegmentCard
                segment={segment}
                picked={segment.rank === picked}
                onPick={() => {
                  setPicked(segment.rank);
                  setOwn("");
                }}
              />
              {/* Phones: the picked card's details sit right under it. */}
              {segment.rank === picked && <WhyThem segment={segment} className="flex md:hidden" />}
            </li>
          ))}
        </ol>
        {chosen && <WhyThem segment={chosen} className="hidden md:flex" />}
      </>
    );
  }

  return (
    <>
      <header className="flex max-w-page flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex max-w-detail flex-col gap-1">
          <span className="text-sm text-muted">New campaign</span>
          <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">
            Who is most likely to pay for what you sell?
          </h1>
          <p className="text-sm text-muted sm:text-body">
            {data?.state === "ready"
              ? segmentsIntro(data.brandProfileVersion)
              : "Pick who to sell to, then where. You'll see what the search costs before anything runs."}
          </p>
        </div>
        <Link
          href={`/w/${slug}/brand`}
          className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink hover:text-accent sm:pt-5"
        >
          Check Brand DNA
        </Link>
      </header>
      {body}
      {ownForm}
    </>
  );
}

function Problem({ title, detail, children }: { title: string; detail?: string | null; children: React.ReactNode }) {
  return (
    <div role="alert" className="flex max-w-read flex-col gap-2 rounded-card bg-negative-soft px-5 py-4 text-sm text-negative-ink">
      <p className="font-semibold">{title}</p>
      {detail && <p className="wrap-break-word">{detail}</p>}
      {children}
    </div>
  );
}

// One suggested segment, picked by tapping it. One that Google Maps doesn't
// list can't be picked.
function SegmentCard({ segment, picked, onPick }: { segment: BuyerSegment; picked: boolean; onPick: () => void }) {
  const reachable = segment.reachability === "places";
  const reach = reachWords(segment.reachability);
  return (
    <button
      type="button"
      aria-pressed={picked}
      disabled={!reachable}
      onClick={onPick}
      className={cn(
        "flex h-full w-full flex-col gap-2.5 rounded-card border p-5 text-left text-sm text-ink",
        picked ? "border-[1.5px] border-accent bg-accent-soft" : "border-border bg-surface",
        reachable ? "hover:border-control" : "cursor-not-allowed bg-raised",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-xs text-muted tabular-nums">{rankLabel(segment.rank)}</span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 text-sm leading-[22px] font-medium",
            reach.tone === "positive" ? "bg-positive-soft text-positive-ink" : "bg-neutral-soft text-neutral-ink",
          )}
        >
          {reach.text}
        </span>
      </span>
      <span className="text-section font-semibold wrap-break-word">{segment.name}</span>
      <span className="wrap-break-word">
        <span className="text-muted">Pain. </span>
        {segment.pain}
      </span>
      <span className="wrap-break-word">
        <span className="text-muted">Pitch first. </span>
        {segment.pitchFirst}
      </span>
      <span className="text-xs text-muted wrap-break-word">{rankedUpWhen(segment.buyerSignals)}</span>
      {!reachable && (
        <span className="text-xs text-muted wrap-break-word">
          {segment.reachabilityReason} It can&apos;t start a campaign until the tool can search beyond Google Maps.
        </span>
      )}
    </button>
  );
}

// What the picked card doesn't fit: why them, the searches and places it
// starts from, what Maps can't check, and the Brand DNA facts behind it.
function WhyThem({ segment, className }: { segment: BuyerSegment; className?: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Why they buy", segment.whyTheyBuy],
    ["Why this rank", segment.rankReason],
    [
      "Google Maps searches",
      <span key="terms" className="flex flex-wrap gap-1.5">
        {segment.searchTerms.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-0.5">
            <Search className="size-3.5" aria-hidden /> {t}
          </span>
        ))}
      </span>,
    ],
  ];
  if (segment.suggestedPlaces.length > 0) {
    rows.push([
      "Suggested places",
      <span key="places" className="flex flex-wrap gap-1.5">
        {segment.suggestedPlaces.map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5">
            <MapPin className="size-3.5" aria-hidden /> {p.name}
          </span>
        ))}
      </span>,
    ]);
  }
  if (segment.signalNotes.length > 0) rows.push(["Also look for (Maps can't check)", segment.signalNotes.join(", ")]);
  if (segment.pitchFacts.length > 0) {
    rows.push([
      "Backed by your Brand DNA",
      <ul key="facts" className="list-disc pl-5">
        {segment.pitchFacts.map((f) => (
          <li key={f.id} className="wrap-break-word">
            {f.text}
          </li>
        ))}
      </ul>,
    ]);
  }
  return (
    <section
      aria-label={`Why ${segment.name}`}
      className={cn("max-w-page flex-col gap-3 rounded-card border border-border bg-surface px-5 py-5 md:px-6", className)}
    >
      <h2 className="text-section font-semibold">Why them</h2>
      <dl className="grid gap-x-6 gap-y-3 text-sm md:grid-cols-[200px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="wrap-break-word">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
