"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A new deep-dive that rewrites the cards from the current Brand DNA, reusing
// what was read about the business. `allowed` is the API's brandDnaRerun.
export type Rerun = { allowed: boolean; busy: boolean; onRerun: () => void };

export const OFFER_NO_LONGER_APPROVED = "This offer is no longer in your approved Brand DNA.";

// The warning's id: the lead page's "Offer missing, fix it" scrolls to it.
export const OFFER_GONE_ID = "offer-gone";

const brandLinkClass = "inline-flex min-h-11 shrink-0 items-center font-medium underline-offset-4 hover:underline";

// On the card and in the composer when the card's offer can't be written:
// dropped from the approved Brand DNA, or (`note`, the API's offerNote) never
// in the Brand DNA version the campaign uses. Nothing can be written or sent
// from it. The re-run is the main action; `brandLink` adds "Go to Brand DNA"
// beside it (on /messages).
export function OfferGone({ slug, rerun, brandLink = false, note = null }: { slug: string; rerun: Rerun; brandLink?: boolean; note?: string | null }) {
  return (
    // With the Brand DNA link the actions need a row of their own, under the text.
    <div
      id={OFFER_GONE_ID}
      role="status"
      className={cn("flex flex-col gap-3 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning-ink", !brandLink && "sm:flex-row sm:items-center sm:justify-between")}
    >
      <p className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{note ?? OFFER_NO_LONGER_APPROVED}</span>
      </p>
      {rerun.allowed ? (
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <Button type="button" variant="outline" className="h-auto min-h-11 w-full py-2 whitespace-normal sm:min-h-9 sm:w-auto sm:py-1.5" onClick={rerun.onRerun} disabled={rerun.busy}>
            <RotateCw aria-hidden /> <span className="text-balance">Re-run deep-dive with current Brand DNA</span>
          </Button>
          {brandLink && (
            <Link href={`/w/${slug}/brand`} className={cn(brandLinkClass, "self-center sm:self-auto")}>
              Go to Brand DNA
            </Link>
          )}
        </div>
      ) : (
        <Link href={`/w/${slug}/brand`} className={brandLinkClass}>
          Go to Brand DNA
        </Link>
      )}
    </div>
  );
}

// The cards still stand, but came from another Brand DNA version (or there
// are none): a quiet way to write them again.
export function RefreshCards({ changed, rerun }: { changed: boolean; rerun: Rerun }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted">
      {changed ? "Brand DNA updated," : "No card from this research."}
      <button type="button" className="inline-flex min-h-11 items-center font-medium text-accent-ink underline-offset-4 hover:underline disabled:opacity-50" onClick={rerun.onRerun} disabled={rerun.busy}>
        {changed ? "refresh cards" : "Try again with your current Brand DNA"}
      </button>
    </p>
  );
}
