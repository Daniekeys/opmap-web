"use client";

import { ChevronDown, HelpCircle, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import type { Possible, PossiblesResponse } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { categoryText } from "@/lib/leads";
import { cn } from "@/lib/utils";

type PossiblesState = { state: "hidden" } | { state: "loading" } | { state: "failed" } | { state: "shown"; possibles: Possible[] };

// Businesses the fit check wasn't sure about, behind a toggle. Promoting one
// makes it a lead and starts finding its contacts.
export function Possibles({ workspaceId, campaignId, count }: { workspaceId: string; campaignId: string; count: number }) {
  const router = useRouter();
  const [view, setView] = useState<PossiblesState>({ state: "hidden" });
  const [promoting, setPromoting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}`;

  async function load() {
    setView({ state: "loading" });
    try {
      const res = await fetch(`${base}/possibles`);
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      setView({ state: "shown", possibles: ((await res.json()) as PossiblesResponse).possibles });
    } catch {
      setView({ state: "failed" });
    }
  }

  async function promote(p: Possible) {
    setPromoting(p.businessId);
    setMessage(null);
    try {
      const res = await fetch(`${base}/possibles/${p.businessId}/promote`, { method: "POST" });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        setView((v) => (v.state === "shown" ? { state: "shown", possibles: v.possibles.filter((x) => x.businessId !== p.businessId) } : v));
        setMessage({ ok: true, text: `${p.name} is a lead now. Finding its contacts takes a minute or two.` });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.status === 404 ? `${p.name} isn't a possible any more.` : `Couldn't promote ${p.name}. Please try again.` });
      }
    } catch {
      setMessage({ ok: false, text: "Could not reach the server. Check your connection and try again." });
    }
    setPromoting(null);
  }

  const open = view.state !== "hidden";
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => (open ? setView({ state: "hidden" }) : void load())}
        className="flex min-h-11 items-center gap-3 text-left"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700" aria-hidden>
          <HelpCircle className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold">Possible businesses ({count})</span>
          <span className="text-xs text-muted-foreground">The fit check wasn&apos;t sure about these. Promote any that fit.</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {message && (
        <p role="status" className={cn("rounded-lg px-3 py-2 text-sm", message.ok ? "bg-emerald-50 text-emerald-950" : "bg-destructive/10 text-destructive")}>
          {message.text}
        </p>
      )}
      {view.state === "loading" && (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading possible businesses">
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        </div>
      )}
      {view.state === "failed" && (
        <p role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Couldn&apos;t load the possible businesses.
          <Button variant="outline" className="h-11 px-4" onClick={load}>
            Try again
          </Button>
        </p>
      )}
      {view.state === "shown" &&
        (view.possibles.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No possible businesses left.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border">
            {view.possibles.map((p) => (
              <li key={p.businessId} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium wrap-break-word">{p.name}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {[categoryText(p.category), p.city].filter(Boolean).join(" · ")}
                      {p.rating !== null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="size-3 fill-amber-400 text-amber-500" aria-hidden />
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Why it&apos;s unsure: {p.reason}</p>
                  </div>
                </div>
                <Button variant="outline" className="h-11 shrink-0 px-4" onClick={() => promote(p)} disabled={promoting !== null}>
                  {promoting === p.businessId ? "Promoting" : "Promote to lead"}
                </Button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
