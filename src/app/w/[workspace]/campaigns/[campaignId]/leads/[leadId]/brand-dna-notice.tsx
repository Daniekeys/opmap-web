"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// A new deep-dive that rewrites the cards from the current Brand DNA, reusing
// what was read about the business. `allowed` is the API's brandDnaRerun.
export type Rerun = { allowed: boolean; busy: boolean; onRerun: () => void };

// On the card and in the composer when the card's offer isn't in the approved
// Brand DNA any more: nothing can be written or sent from it.
export function OfferGone({ slug, rerun }: { slug: string; rerun?: Rerun }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning-ink sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>This offer isn&apos;t in your approved Brand DNA anymore.</span>
      </p>
      {rerun?.allowed ? (
        <Button type="button" variant="outline" className="h-auto min-h-11 w-full shrink-0 py-2 whitespace-normal sm:min-h-9 sm:w-auto sm:py-1.5" onClick={rerun.onRerun} disabled={rerun.busy}>
          <RotateCw aria-hidden /> <span className="text-balance">Re-run deep-dive with current Brand DNA</span>
        </Button>
      ) : (
        <Link href={`/w/${slug}/brand`} className="inline-flex min-h-11 shrink-0 items-center font-medium underline-offset-4 hover:underline">
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
