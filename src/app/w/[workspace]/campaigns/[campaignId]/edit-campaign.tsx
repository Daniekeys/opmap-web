"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { Campaign, EditCampaignBody, GeoArea } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import { readSettings, settingsDraft } from "@/lib/leads";
import { parseSearchTerms } from "@/lib/segments";
import { PlacePicker } from "../new/campaign-form";
import { SearchSettingsFields } from "./search-settings";

// Edit campaign (owner): its Google Maps searches and places, while it is a
// draft, paused, stopped or failed. A paused campaign has no confirm panel,
// so its search settings are edited here too. Places already searched stay
// covered, so continuing only pays for what is new.
export function EditCampaign({ workspaceId, campaign, withSettings }: { workspaceId: string; campaign: Campaign; withSettings: boolean }) {
  const router = useRouter();
  const [terms, setTerms] = useState(campaign.queries.join(", "));
  const [places, setPlaces] = useState<GeoArea[]>(campaign.locations);
  const [settings, setSettings] = useState(() => settingsDraft(campaign.settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const queries = parseSearchTerms(terms);
    if (queries.length === 0) return setError("Add at least one Google Maps search, 2 letters or more.");
    if (places.length === 0) return setError("Pick at least one place.");
    const body: EditCampaignBody = { queries, locations: places.map((p) => p.id) };
    if (withSettings) {
      const read = readSettings(settings);
      if ("error" in read) return setError(read.error);
      Object.assign(body, read.settings);
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
        setError(res.status === 403 ? "Only an owner can edit a campaign." : e.message || "The changes could not be saved. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <details className="group rounded-xl border bg-card text-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 font-medium">
        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
        Edit campaign
      </summary>
      <form onSubmit={save} className="flex flex-col gap-4 border-t px-4 py-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Google Maps searches
          <input
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="software company, it company"
            autoComplete="off"
            className={inputClass}
          />
          <span className="font-normal text-muted">Up to 3, separated by commas. Each one multiplies the searches per map tile.</span>
        </label>
        <PlacePicker workspaceId={workspaceId} chosen={places} onChange={setPlaces} />
        {withSettings && <SearchSettingsFields value={settings} onChange={setSettings} />}
        {error && (
          <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-sm text-muted">
            Saved.{withSettings ? " The search uses these when it resumes." : " The estimate above shows what the search will cost now."}
          </p>
        )}
        <Button type="submit" className="h-11 sm:self-start sm:px-5" disabled={saving}>
          {saving ? "Saving" : "Save changes"}
        </Button>
      </form>
    </details>
  );
}
