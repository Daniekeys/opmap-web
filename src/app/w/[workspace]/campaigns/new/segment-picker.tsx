"use client";

import { ChevronDown, Lock, MapPin, PenLine, RotateCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageLoading } from "@/components/page-loading";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import type { BuyerSegment, SegmentsResponse, StartSegmentsBody } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { signalsInWords } from "@/lib/segments";
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

// The campaign screen's first step: the buyer segments suggested from the
// approved Brand DNA. Starts the (once per Brand DNA version) run when there
// are none yet, and shows its progress. "Not reachable yet" cards can't be used.
export function SegmentPicker({
  workspaceId,
  slug,
  onPick,
  onOwn,
}: {
  workspaceId: string;
  slug: string;
  onPick: (segment: BuyerSegment, setId: string) => void;
  onOwn: () => void;
}) {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  const loaded = (data: SegmentsResponse | null) => data && setLoad({ state: "loaded", data });
  const failed = () => setLoad({ state: "error", message: "Couldn't load your buyer segments. Check your connection and try again." });

  // Retry buttons and a finished run fetch again.
  const request = (method: "GET" | "POST", body?: StartSegmentsBody) => fetchSegments(workspaceId, method, body).then(loaded, failed);

  useEffect(() => {
    let live = true;
    fetchSegments(workspaceId, "GET").then(
      (data) => live && data && setLoad({ state: "loaded", data }),
      () => live && setLoad({ state: "error", message: "Couldn't load your buyer segments. Check your connection and try again." }),
    );
    return () => {
      live = false;
    };
  }, [workspaceId]);

  const own = (
    <Button type="button" variant="outline" className="h-11 text-base sm:self-start" onClick={onOwn}>
      <PenLine className="size-4" aria-hidden /> Type your own
    </Button>
  );

  if (load.state === "loading") return <PageLoading />;
  if (load.state === "error") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">{load.message}</p>
        <Button type="button" variant="outline" className="h-11 self-start" onClick={() => request("GET")}>
          <RotateCw className="size-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  const { data } = load;
  if (data.state === "not_approved") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-4 text-sm">
          <p className="font-medium">Brand DNA not approved yet</p>
          <p className="text-muted-foreground">
            Buyer segments are worked out from what you sell, so they need an approved Brand DNA first. Approve it, or type
            the kind of business you want yourself.
          </p>
          <Link
            href={`/w/${slug}/brand`}
            className="inline-flex h-11 items-center justify-center self-start rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary/80"
          >
            Go to Brand DNA
          </Link>
        </div>
        {own}
      </div>
    );
  }

  if (data.state === "running" || data.state === "none") {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Sparkles className="size-4 shrink-0" aria-hidden /> Working out who is most likely to buy from you. This takes about
          a minute, once per Brand DNA version.
        </p>
        {data.run && <ProgressPanel workspaceId={workspaceId} runId={data.run.id} onFinished={() => request("GET")} />}
        {own}
      </div>
    );
  }

  if (data.state === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Couldn&apos;t suggest buyer segments</p>
          {data.error && <p className="text-destructive wrap-break-word">{data.error}</p>}
          <Button type="button" variant="outline" className="h-11 self-start" onClick={() => request("POST", { retry: true })}>
            <RotateCw className="size-4" aria-hidden /> Try again
          </Button>
        </div>
        {own}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        From Brand DNA version {data.brandProfileVersion}, most likely to pay first. Pick one to edit it and choose places.
      </p>
      <ol className="flex flex-col gap-3">
        {data.segments.map((segment) => (
          <li key={segment.rank}>
            <SegmentCard segment={segment} onPick={() => onPick(segment, data.setId!)} />
          </li>
        ))}
      </ol>
      {own}
    </div>
  );
}

function SegmentCard({ segment, onPick }: { segment: BuyerSegment; onPick: () => void }) {
  const [open, setOpen] = useState(false);
  const reachable = segment.reachability === "places";
  const signals = signalsInWords(segment.buyerSignals);
  return (
    <article className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", !reachable && "bg-muted/40")}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums"
          aria-label={`Rank ${segment.rank}`}
        >
          {segment.rank}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium wrap-break-word">{segment.name}</h3>
          <p className="text-sm text-muted-foreground wrap-break-word">{segment.whoTheyAre}</p>
        </div>
      </div>

      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Pain</dt>
          <dd className="wrap-break-word">{segment.pain}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Pitch first</dt>
          <dd className="font-medium wrap-break-word">{segment.pitchFirst}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {segment.searchTerms.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            <Search className="size-3" aria-hidden /> {t}
          </span>
        ))}
        {segment.suggestedPlaces.map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
            <MapPin className="size-3" aria-hidden /> {p.name}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="-mx-1 inline-flex min-h-11 items-center gap-1 self-start px-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        {open ? "Less" : "Why them, and buyer signals"}
      </button>
      {open && (
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Why they buy</dt>
            <dd className="wrap-break-word">{segment.whyTheyBuy}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Why this rank</dt>
            <dd className="wrap-break-word">{segment.rankReason}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Buyer signals</dt>
            <dd className="wrap-break-word">{signals.length ? signals.join(" · ") : "None in particular"}</dd>
          </div>
          {segment.signalNotes.length > 0 && (
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Also look for (Maps can&apos;t check)</dt>
              <dd className="wrap-break-word">{segment.signalNotes.join(" · ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Backed by your Brand DNA</dt>
            <dd>
              <ul className="list-disc pl-5">
                {segment.pitchFacts.map((f) => (
                  <li key={f.id} className="wrap-break-word">
                    {f.text}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      )}

      {reachable ? (
        <Button type="button" className="h-11 text-base sm:self-start sm:px-5" onClick={onPick}>
          Use this segment
        </Button>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium text-foreground">Not reachable yet.</span> {segment.reachabilityReason} It can&apos;t
            start a campaign until the tool can search beyond Google Maps.
          </span>
        </p>
      )}
    </article>
  );
}
