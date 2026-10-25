"use client";

import { LoaderCircle, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type {
  CampaignResponse,
  CreateCampaignBody,
  GeoArea,
  GeoAreasResponse,
  RouteTargetBody,
  RouteTargetResponse,
  TargetKind,
} from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { TARGET_KINDS } from "@/lib/leads";
import { cn } from "@/lib/utils";

const LEVELS: Record<GeoArea["level"], string> = { country: "Country", state: "State", city: "City", neighbourhood: "Area" };

const areaLabel = (a: GeoArea) => (a.parentName ? `${a.name}, ${a.parentName}` : a.name);

const NO_ERROR: ApiErrorResponse = { error: { code: "", message: "" } };

type Suggestion =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; answer: RouteTargetResponse; for: string }
  | { state: "failed"; message: string };

export function CampaignForm({ workspaceId, slug }: { workspaceId: string; slug: string }) {
  const router = useRouter();
  const [segment, setSegment] = useState("");
  const [kind, setKind] = useState<TargetKind>("local_business");
  const [suggestion, setSuggestion] = useState<Suggestion>({ state: "idle" });
  const [chosen, setChosen] = useState<GeoArea[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The Haiku router's suggestion (one paid call), once per business type the
  // user settles on. The user can pick another kind.
  async function suggest() {
    const text = segment.trim();
    if (text.length < 2 || (suggestion.state === "done" && suggestion.for === text)) return;
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
    if (chosen.length === 0) {
      setError("Pick at least one place to search.");
      return;
    }
    const body: CreateCampaignBody = {
      segment: segment.trim(),
      targetKind: kind,
      locations: chosen.map((a) => a.id),
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
        res.status === 400 && e.code !== "unknown_location"
          ? "Enter a business type of at least 2 letters."
          : e.message || "The campaign could not be saved. Please try again.",
      );
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setSaving(false);
  }

  const unsupported = !TARGET_KINDS.find((t) => t.kind === kind)!.supported;

  return (
    <form onSubmit={save} className="flex flex-col gap-5 rounded-xl border bg-card p-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Business type
        <input
          name="segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          onBlur={suggest}
          placeholder="Bakeries and cake shops"
          autoComplete="off"
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
        <span className="font-normal text-muted-foreground">
          Searched on Google Maps as you write it, e.g. &quot;bakery&quot; or &quot;private school&quot;.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Who are you looking for?</legend>
        <SuggestionNote suggestion={suggestion} />
        {TARGET_KINDS.map((t) => (
          <label
            key={t.kind}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
              kind === t.kind ? "border-foreground bg-muted/50" : "border-border",
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
                  <span className="ml-2 text-xs font-normal text-muted-foreground">suggested</span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{t.help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <PlacePicker workspaceId={workspaceId} chosen={chosen} onChange={setChosen} />

      {unsupported && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Only local businesses can be searched for now. You can save this draft, but it can&apos;t be started yet.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 text-base sm:self-start sm:px-5" disabled={saving}>
        {saving ? "Saving" : "Save and see the cost"}
      </Button>
    </form>
  );
}

function SuggestionNote({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.state === "idle") return null;
  if (suggestion.state === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden /> Checking where these are found
      </p>
    );
  }
  if (suggestion.state === "failed") return <p className="text-sm text-muted-foreground">{suggestion.message}</p>;
  const label = TARGET_KINDS.find((t) => t.kind === suggestion.answer.kind)!.label.toLowerCase();
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Suggested: {label}. {suggestion.answer.reason} Change it if that&apos;s wrong.
      </span>
    </p>
  );
}

// Search geo_areas at any level and keep a list of chosen places.
function PlacePicker({ workspaceId, chosen, onChange }: { workspaceId: string; chosen: GeoArea[]; onChange: (areas: GeoArea[]) => void }) {
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
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A city, state or area, e.g. Ilorin"
            autoComplete="off"
            className={cn(inputClass, "pl-9")}
          />
        </span>
        <span className="font-normal text-muted-foreground">A state runs its towns biggest first. Pick as many places as you like.</span>
      </label>

      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Chosen places">
          {chosen.map((a) => (
            <li key={a.id} className="flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm">
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
        <p className="text-sm text-muted-foreground" role="status">
          Looking up places
        </p>
      )}
      {failed && <p className="text-sm text-destructive">Couldn&apos;t look up places. Try again.</p>}
      {shown && shown.length === 0 && <p className="text-sm text-muted-foreground">No place called &quot;{text.trim()}&quot; in the list.</p>}
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
                  className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{areaLabel(a)}</span>
                    {disabled && <span className="block text-xs text-muted-foreground">Whole countries can&apos;t be searched yet</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{LEVELS[a.level]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
