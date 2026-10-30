"use client";

import { ChevronLeft, LoaderCircle, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type {
  BuyerSegment,
  BuyerSignals,
  CampaignResponse,
  CampaignSegment,
  CreateCampaignBody,
  GeoArea,
  GeoAreasResponse,
  Presence,
  RouteTargetBody,
  RouteTargetResponse,
  TargetKind,
} from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { TARGET_KINDS } from "@/lib/leads";
import { parseSearchTerms, ratingOptions } from "@/lib/segments";
import { cn } from "@/lib/utils";

const LEVELS: Record<GeoArea["level"], string> = { country: "Country", state: "State", city: "City", neighbourhood: "Area" };

const areaLabel = (a: GeoArea) => (a.parentName ? `${a.name}, ${a.parentName}` : a.name);

const NO_ERROR: ApiErrorResponse = { error: { code: "", message: "" } };

type Suggestion =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; answer: RouteTargetResponse; for: string }
  | { state: "failed"; message: string };

// What the form starts from: a suggested segment (from the picker) or nothing
// (the user types their own).
export type FormStart = { segment: BuyerSegment; setId: string } | null;

const PRESENCE_OPTIONS: { value: Presence; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "has", label: "Has one" },
  { value: "lacks", label: "Doesn't have one" },
];

const NO_SIGNALS: BuyerSignals = { minReviews: null, minRating: null, website: "any", socials: "any", categories: [] };

// Places of a suggestion that are in geo_areas, as the picker shows them.
const startPlaces = (start: FormStart): GeoArea[] =>
  (start?.segment.suggestedPlaces ?? []).flatMap((p) =>
    p.areaId ? [{ id: p.areaId, name: p.name, level: "city" as const, parentName: null, country: "NG", population: null }] : [],
  );

export function CampaignForm({
  workspaceId,
  slug,
  start,
  ownName = "",
  onBack,
}: {
  workspaceId: string;
  slug: string;
  start: FormStart;
  // The buyer typed on the picker, when there is no suggestion.
  ownName?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const picked = start?.segment ?? null;
  const [segment, setSegment] = useState(picked?.name ?? ownName);
  const [terms, setTerms] = useState(picked?.searchTerms.join(", ") ?? "");
  const [pitch, setPitch] = useState(picked?.pitchFirst ?? "");
  const [signals, setSignals] = useState<BuyerSignals>(picked?.buyerSignals ?? NO_SIGNALS);
  const [kind, setKind] = useState<TargetKind>("local_business");
  const [suggestion, setSuggestion] = useState<Suggestion>({ state: "idle" });
  const [chosen, setChosen] = useState<GeoArea[]>(() => startPlaces(start));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The user's own segment: the Haiku router's suggestion (one paid call),
  // once per business type they settle on. A suggested segment is already
  // known to be on Google Maps, so it skips this.
  async function suggest() {
    const text = segment.trim();
    if (start || text.length < 2 || (suggestion.state === "done" && suggestion.for === text)) return;
    setSuggestion({ state: "loading" });
    try {
      const body: RouteTargetBody = { segment: text };
      const res = await fetch(`/api/w/${workspaceId}/campaigns/route-target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return goToLogin();
      if (!res.ok) {
        const { error: e }: ApiErrorResponse = await res.json().catch(() => NO_ERROR);
        setSuggestion({ state: "failed", message: e.message || "No suggestion right now. Pick the kind yourself." });
        return;
      }
      const answer: RouteTargetResponse = await res.json();
      setSuggestion({ state: "done", answer, for: text });
      setKind(answer.kind);
    } catch {
      setSuggestion({ state: "failed", message: "Could not reach the server. Pick the kind yourself." });
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const searchTerms = parseSearchTerms(terms || segment);
    if (searchTerms.length === 0) {
      setError('Add at least one Google Maps search, e.g. "hotel".');
      return;
    }
    if (chosen.length === 0) {
      setError("Pick at least one place to search.");
      return;
    }
    const buyerSegment: CampaignSegment = {
      setId: start?.setId ?? null,
      rank: start?.segment.rank ?? null,
      name: segment.trim(),
      searchTerms,
      whyTheyBuy: start?.segment.whyTheyBuy ?? "",
      pain: start?.segment.pain ?? "",
      pitchFirst: pitch.trim(),
      buyerSignals: signals,
    };
    const body: CreateCampaignBody = {
      segment: segment.trim(),
      targetKind: kind,
      locations: chosen.map((a) => a.id),
      buyerSegment,
      ...(suggestion.state === "done" ? { suggested: { kind: suggestion.answer.kind, promptVersion: suggestion.answer.promptVersion } } : {}),
    };
    setSaving(true);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        const { campaign }: CampaignResponse = await res.json();
        router.push(`/w/${slug}/campaigns/${campaign.id}`);
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => NO_ERROR);
      setError(
        res.status === 400 && e.code === "invalid_input"
          ? "Check the fields: a name of at least 2 letters, and searches of at least 2 letters each."
          : e.message || "The campaign could not be saved. Please try again.",
      );
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setSaving(false);
  }

  const unsupported = !TARGET_KINDS.find((t) => t.kind === kind)!.supported;
  const notSearchable = (start?.segment.suggestedPlaces ?? []).filter((p) => !p.areaId);

  return (
    <>
      <header className="flex max-w-read flex-col gap-1">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm font-medium text-muted hover:text-ink md:h-8"
        >
          <ChevronLeft className="size-4" aria-hidden /> All segments
        </button>
        <span className="text-sm text-muted">New campaign</span>
        <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">Choose where</h1>
        <p className="text-sm text-muted sm:text-body">
          Check who to look for, then pick the places. You&apos;ll see what the search costs before anything runs.
        </p>
      </header>
      <form onSubmit={save} className="flex max-w-read flex-col gap-5 rounded-card border border-border bg-surface p-4 md:px-6 md:py-5">
        {start && (
          <p className="flex items-start gap-2 rounded-control bg-raised px-3.5 py-3 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Suggestion {start.segment.rank}. {start.segment.pain} Change anything that&apos;s off.
            </span>
          </p>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Who to look for
          <input
            name="segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            onBlur={suggest}
            placeholder="Hotels and guest houses"
            autoComplete="off"
            required
            minLength={2}
            maxLength={100}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Google Maps searches
          <input
            name="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="hotel, guest house"
            autoComplete="off"
            className={inputClass}
          />
          <span className="font-normal text-muted">
            Up to 3, separated by commas, the way a person would search.
            {!start && " Left empty, the name above is searched."}
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <span>
            What to pitch first <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            name="pitch"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            maxLength={300}
            autoComplete="off"
            placeholder="Website development"
            className={inputClass}
          />
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">Buyer signals</legend>
          <p className="-mt-1 text-sm text-muted">Leads that match these rank higher. Nothing is filtered out.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              Reviews, at least
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100000}
                value={signals.minReviews ?? ""}
                onChange={(e) =>
                  setSignals({ ...signals, minReviews: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) })
                }
                placeholder="Any"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Rated at least
              <select
                value={signals.minRating ?? ""}
                onChange={(e) => setSignals({ ...signals, minRating: e.target.value === "" ? null : Number(e.target.value) })}
                className={inputClass}
              >
                <option value="">Any</option>
                {ratingOptions(signals.minRating).map((r) => (
                  <option key={r} value={r}>
                    {r.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ["website", "Website"],
                ["socials", "Social media"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1.5 text-sm">
                {label}
                <select
                  value={signals[key]}
                  onChange={(e) => setSignals({ ...signals, [key]: e.target.value as Presence })}
                  className={inputClass}
                >
                  {PRESENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        {!start && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">Who are you looking for?</legend>
            <SuggestionNote suggestion={suggestion} />
            {TARGET_KINDS.map((t) => (
              <label
                key={t.kind}
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
                  kind === t.kind ? "border-ink bg-raised" : "border-control",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={t.kind}
                  checked={kind === t.kind}
                  onChange={() => setKind(t.kind)}
                  className="mt-1 size-4 shrink-0"
                />
                <span className="flex flex-col">
                  <span className="font-medium">
                    {t.label}
                    {suggestion.state === "done" && suggestion.answer.kind === t.kind && (
                      <span className="ml-2 text-xs font-normal text-muted">suggested</span>
                    )}
                  </span>
                  <span className="text-sm text-muted">{t.help}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <PlacePicker workspaceId={workspaceId} chosen={chosen} onChange={setChosen} />
        {notSearchable.length > 0 && (
          <p className="text-sm text-muted">Also suggested, not in the place list yet: {notSearchable.map((p) => p.name).join(", ")}.</p>
        )}

        {unsupported && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            Only local businesses can be searched for now. You can save this draft, but it can&apos;t be started yet.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 text-base sm:self-start sm:px-5" disabled={saving}>
          {saving ? "Saving" : "Save and see the cost"}
        </Button>
      </form>
    </>
  );
}

function SuggestionNote({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.state === "idle") return null;
  if (suggestion.state === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden /> Checking where these are found
      </p>
    );
  }
  if (suggestion.state === "failed") return <p className="text-sm text-muted">{suggestion.message}</p>;
  const label = TARGET_KINDS.find((t) => t.kind === suggestion.answer.kind)!.label.toLowerCase();
  return (
    <p className="flex items-start gap-2 text-sm text-muted">
      <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Suggested: {label}. {suggestion.answer.reason} Change it if that&apos;s wrong.
      </span>
    </p>
  );
}

// Search geo_areas at any level and keep a list of chosen places. Also used
// by the campaign page's edit panel.
export function PlacePicker({ workspaceId, chosen, onChange }: { workspaceId: string; chosen: GeoArea[]; onChange: (areas: GeoArea[]) => void }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<GeoArea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/w/${workspaceId}/geo-areas?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.status === 401) return goToLogin();
        if (!res.ok) throw new Error(String(res.status));
        setResults(((await res.json()) as GeoAreasResponse).areas);
        setLoading(false);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setFailed(true);
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, workspaceId]);

  const pick = (area: GeoArea) => {
    if (!chosen.some((a) => a.id === area.id)) onChange([...chosen, area]);
    setText("");
    setResults(null);
  };
  const shown = text.trim().length >= 2 && !loading ? results : null;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Where
        <span className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A city, state or area, e.g. Ilorin"
            autoComplete="off"
            className={cn(inputClass, "pl-9")}
          />
        </span>
        <span className="font-normal text-muted">A state runs its towns biggest first. Pick as many places as you like.</span>
      </label>

      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Chosen places">
          {chosen.map((a) => (
            <li key={a.id} className="flex items-center gap-1 rounded-full bg-raised py-1 pr-1 pl-3 text-sm">
              {areaLabel(a)}
              <button
                type="button"
                onClick={() => onChange(chosen.filter((c) => c.id !== a.id))}
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-background"
                aria-label={`Remove ${a.name}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && text.trim().length >= 2 && (
        <p className="text-sm text-muted" role="status">
          Looking up places
        </p>
      )}
      {failed && <p className="text-sm text-negative-ink">Couldn&apos;t look up places. Try again.</p>}
      {shown && shown.length === 0 && <p className="text-sm text-muted">No place called &quot;{text.trim()}&quot; in the list.</p>}
      {shown && shown.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {shown.map((a) => {
            const disabled = a.level === "country";
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(a)}
                  className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{areaLabel(a)}</span>
                    {disabled && <span className="block text-xs text-muted">Whole countries can&apos;t be searched yet</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs">{LEVELS[a.level]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
