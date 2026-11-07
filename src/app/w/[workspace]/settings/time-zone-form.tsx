"use client";

import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { WorkspaceSettingsResponse } from "@/lib/api-types/access";
import { zoneName } from "@/lib/format";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";

// "" in the select means: no saved zone, use the default (Nigeria).
const DEFAULT = "";

const ZONES: string[] = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];

export function defaultText(settings: WorkspaceSettingsResponse) {
  return `No zone has been chosen, so the workspace uses ${settings.default.country} and ${settings.default.timeZone}, the default.`;
}

// The line under the heading, for the zone in use: chosen by an owner (here,
// or by approving the Brand DNA's country question), or the default.
export function zoneDescription(settings: WorkspaceSettingsResponse) {
  const inUse = `Every time in this workspace (searches, pauses, replies) shows in ${settings.timeZone}.`;
  if (!settings.saved) return `${inUse} ${defaultText(settings)}`;
  return `${inUse} An owner chose it. Pick "Default: ${settings.default.country}" to go back to ${settings.default.timeZone}.`;
}

// The picker's groups, so a phone user doesn't scroll 400 zones: the
// workspace country's zones (and the saved zone) first, then every other zone.
export function zoneGroups(settings: WorkspaceSettingsResponse, all: string[]) {
  const inCountry = settings.country?.timeZones ?? [];
  const groups: { label: string; zones: string[] }[] = [];
  // A saved zone outside the country (UTC, say) stays findable at the top.
  if (settings.saved && !inCountry.includes(settings.saved)) groups.push({ label: "Saved", zones: [settings.saved] });
  if (settings.country && inCountry.length) groups.push({ label: `In ${settings.country.name}`, zones: inCountry });
  const shown = groups.flatMap((g) => g.zones);
  groups.push({ label: shown.length ? "All other time zones" : "All time zones", zones: all.filter((z) => !shown.includes(z)) });
  return groups;
}

export function TimeZoneForm({ workspaceId, settings, canEdit }: { workspaceId: string; settings: WorkspaceSettingsResponse; canEdit: boolean }) {
  const router = useRouter();
  // The settings as last saved here, so the text follows a save at once.
  const [current, setCurrent] = useState(settings);
  const [value, setValue] = useState(settings.saved ?? DEFAULT);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const groups = zoneGroups(current, ZONES);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone: value === DEFAULT ? null : value }),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const saved: WorkspaceSettingsResponse = await res.json();
        setCurrent(saved);
        setMessage({ ok: true, text: `Saved. Times now show in ${saved.timeZone} (${zoneName(saved.timeZone)}).` });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.status === 403 ? "Owners only." : "That time zone couldn't be saved. Pick one from the list." });
      }
    } catch {
      setMessage({ ok: false, text: "Could not reach the server. Check your connection and try again." });
    }
    setPending(false);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Time zone</h2>
        <p className="text-sm text-muted wrap-break-word">
          {zoneDescription(current)}
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Time zone
        <span className="relative">
          <select
            name="timeZone"
            value={value}
            disabled={!canEdit || pending}
            onChange={(e) => setValue(e.target.value)}
            className={cn(inputClass, "appearance-none pr-9")}
          >
            <option value={DEFAULT}>{`Default: ${current.default.country} (${current.default.timeZone})`}</option>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replaceAll("_", " ")}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        </span>
      </label>
      {canEdit ? (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save time zone"}
        </Button>
      ) : (
        <p className="text-sm text-muted">Only an owner can change it.</p>
      )}
      {message && (
        <p role={message.ok ? "status" : "alert"} className={cn("text-sm", message.ok ? "text-positive-ink" : "text-negative-ink")}>
          {message.text}
        </p>
      )}
    </form>
  );
}
