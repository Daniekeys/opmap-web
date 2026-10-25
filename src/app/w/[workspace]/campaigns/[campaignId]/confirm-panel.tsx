"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { EstimateResponse } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { formatUsd } from "@/lib/leads";

const span = (r: { min: number; max: number }, format = (n: number) => String(n)) =>
  r.min === r.max ? format(r.min) : `${format(r.min)} to ${format(r.max)}`;

// The confirm button shows what the search will cost before anything runs
// (spec, Location > Cost before every run). Only an owner can press it.
export function ConfirmPanel({
  workspaceId,
  campaignId,
  isOwner,
  estimate,
  supported,
}: {
  workspaceId: string;
  campaignId: string;
  isOwner: boolean;
  estimate: EstimateResponse;
  supported: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calls = span(estimate.calls);
  const cost = span(estimate.costUsd, formatUsd);
  const days = span(estimate.daysAtDailyCap);
  const inFreeTier = estimate.calls.max <= estimate.callsLeft.month;
  const tiles = estimate.areas.reduce((n, a) => n + a.tiles, 0);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/start`, { method: "POST" });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        router.refresh();
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
      setError(res.status === 403 ? "Only an owner can start a campaign." : e.message || "The campaign could not be started. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setStarting(false);
  }

  return (
    <section aria-labelledby="confirm-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="confirm-heading" className="font-medium">
        Before you start
      </h2>
      <p className="text-sm">
        About <strong>{calls} Google searches</strong> ({tiles} map tiles x {estimate.areas[0]?.queries ?? 1}{" "}
        {estimate.areas[0]?.queries === 1 ? "search term" : "search terms"}, 1 to {estimate.pagesPerTile.max} pages each, plus a few
        neighbourhood searches). {inFreeTier ? "Inside the free tier" : "More than the free tier left this month"}; {cost} at list price.
        At {estimate.dailyCap} a day that takes {days} {estimate.daysAtDailyCap.max === 1 ? "day" : "days"}.
      </p>
      <p className="text-sm text-muted-foreground">
        {estimate.callsLeft.today} searches left today and {estimate.callsLeft.month} this month, shared by every workspace. When today&apos;s run
        out, the campaign pauses until tomorrow and carries on by itself.
      </p>
      {estimate.warning && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {estimate.warning}
        </p>
      )}
      {estimate.unmapped.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Not counted yet: {estimate.unmapped.join(", ")}. Their map boundary is looked up when the search starts.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {!supported ? (
        <p className="text-sm text-muted-foreground">Only local businesses can be searched for now, so this draft can&apos;t be started.</p>
      ) : isOwner ? (
        <Button className="h-auto min-h-11 py-2 text-base whitespace-normal sm:self-start sm:px-5" onClick={start} disabled={starting}>
          {starting ? "Starting" : `Confirm and search: about ${calls} searches, ${cost}`}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Only an owner can start a campaign, because it uses the Google searches both teams share.</p>
      )}
    </section>
  );
}
