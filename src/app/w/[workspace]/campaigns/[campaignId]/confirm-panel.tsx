"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { EditCampaignBody, EstimateResponse } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { formatUsd, previewQuery, readSettings, sameSettings, settingsDraft } from "@/lib/leads";
import { SearchSettingsFields } from "./search-settings";

const span = (r: { min: number; max: number }, format = (n: number) => String(n)) =>
  r.min === r.max ? format(r.min) : `${format(r.min)} to ${format(r.max)}`;

const NO_ERROR: ApiErrorResponse = { error: { code: "", message: "" } };

// The confirm button shows what the search will cost before anything runs
// (spec, Location > Cost before every run). An owner can change the search
// settings first and see the estimate follow; confirming saves them. Only an
// owner can press it. A stopped campaign continues from here.
export function ConfirmPanel({
  workspaceId,
  campaignId,
  isOwner,
  estimate,
  supported,
  continuing,
}: {
  workspaceId: string;
  campaignId: string;
  isOwner: boolean;
  estimate: EstimateResponse;
  supported: boolean;
  continuing: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => settingsDraft(estimate.settings));
  // The last estimate fetched for unsaved settings, and the query it was for.
  const [preview, setPreview] = useState<{ query: string; estimate: EstimateResponse | null } | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const read = readSettings(draft, estimate.dailyCap);
  const invalid = "error" in read ? read.error : null;
  // Null while the settings are the saved ones (or invalid): the saved estimate holds.
  const query = "settings" in read && !sameSettings(read.settings, estimate.settings) ? previewQuery(read.settings) : null;
  const previewing = query !== null && preview?.query !== query;
  const shown = query === null ? estimate : (preview?.estimate ?? estimate);

  // The estimate follows the settings as they are typed (nothing is saved).
  useEffect(() => {
    if (query === null) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/estimate?${query}`, { signal: controller.signal });
        if (res.status === 401) return goToLogin();
        if (res.ok) {
          setPreview({ query, estimate: await res.json() });
          setError(null);
        } else {
          const { error: e }: ApiErrorResponse = await res.json().catch(() => NO_ERROR);
          setPreview({ query, estimate: null });
          setError(e.message || "Couldn't work out the estimate for these settings.");
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setPreview({ query, estimate: null });
        setError("Could not reach the server. Check your connection and try again.");
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, workspaceId, campaignId]);
  const previewFailed = query !== null && preview?.query === query && preview.estimate === null;

  const calls = span(shown.calls);
  const cost = span(shown.costUsd, formatUsd);
  const days = span(shown.daysAtDailyCap);
  const inFreeTier = shown.calls.max <= shown.callsLeft.month;
  const tiles = shown.areas.reduce((n, a) => n + a.tiles, 0);
  const queries = shown.areas[0]?.queries ?? 1;
  const pages = shown.pagesPerTile.max === 1 ? "1 page each" : `1 to ${shown.pagesPerTile.max} pages each`;
  const budgetLeft = shown.settings.maxCalls === null ? null : Math.max(0, shown.settings.maxCalls - shown.callsUsed);

  async function start() {
    if ("error" in read) return setError(read.error);
    setStarting(true);
    setError(null);
    const base = `/api/w/${workspaceId}/campaigns/${campaignId}`;
    try {
      if (!sameSettings(read.settings, estimate.settings)) {
        const saved = await fetch(base, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(read.settings satisfies EditCampaignBody),
        });
        if (saved.status === 401) return goToLogin();
        if (!saved.ok) {
          const { error: e }: ApiErrorResponse = await saved.json().catch(() => NO_ERROR);
          setError(e.message || "The settings could not be saved. Please try again.");
          setStarting(false);
          return;
        }
      }
      const res = await fetch(`${base}/start`, { method: "POST" });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        router.refresh();
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => NO_ERROR);
      setError(res.status === 403 ? "Only an owner can start a campaign." : e.message || "The campaign could not be started. Please try again.");
      // Saved settings show on the page even when the start failed.
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setStarting(false);
  }

  return (
    <section aria-labelledby="confirm-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 id="confirm-heading" className="font-medium">
        {continuing ? "Continue the search" : "Before you start"}
      </h2>

      <SearchSettingsFields value={draft} onChange={setDraft} dailyCap={estimate.dailyCap} disabled={!isOwner || starting} />
      {invalid && (
        <p role="alert" className="text-sm text-destructive">
          {invalid}
        </p>
      )}

      <div aria-live="polite" aria-busy={previewing} className={previewing ? "flex flex-col gap-3 opacity-60" : "flex flex-col gap-3"}>
        <p className="text-sm">
          About <strong>{calls} Google searches</strong> ({tiles} map tiles x {queries} {queries === 1 ? "search term" : "search terms"}, {pages}
          {shown.settings.extrasPerCity > 0 ? ", plus a few neighbourhood searches" : ""}).{" "}
          {shown.budgetCut && budgetLeft !== null && (
            <>
              The whole search needs about {span(shown.needed)}; the budget stops it at {budgetLeft}
              {shown.callsUsed > 0 ? ` (${shown.callsUsed} used already)` : ""}.{" "}
            </>
          )}
          {inFreeTier ? "Inside the free tier" : "More than the free tier left this month"}; {cost} at list price. At {shown.perDay} a day that takes{" "}
          {days} {shown.daysAtDailyCap.max === 1 ? "day" : "days"}.
        </p>
        <p className="text-sm text-muted-foreground">
          {shown.callsLeft.today} searches left today and {shown.callsLeft.month} this month, shared by every workspace. When today&apos;s run
          out, the campaign pauses until tomorrow, then carries on by itself (in development, when an owner taps Resume search). You can stop it
          at any time.
        </p>
        {budgetLeft === 0 && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            The search budget is used up ({shown.callsUsed} searches). Raise it, or clear it for no limit, to search further.
          </p>
        )}
        {shown.warning && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {shown.warning}
          </p>
        )}
        {shown.unmapped.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Not counted yet: {shown.unmapped.join(", ")}. Their map boundary is looked up when the search starts.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {!supported ? (
        <p className="text-sm text-muted-foreground">Only local businesses can be searched for now, so this draft can&apos;t be started.</p>
      ) : isOwner ? (
        <Button
          className="h-auto min-h-11 py-2 text-base whitespace-normal sm:self-start sm:px-5"
          onClick={start}
          disabled={starting || previewing || previewFailed || invalid !== null || budgetLeft === 0}
        >
          {starting ? "Starting" : `${continuing ? "Continue search" : "Confirm and search"}: about ${calls} searches, ${cost}`}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Only an owner can start a campaign or change its settings, because it uses the Google searches both teams share.</p>
      )}
    </section>
  );
}
