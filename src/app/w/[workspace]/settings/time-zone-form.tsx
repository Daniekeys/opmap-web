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

// "" in the select means: no saved zone, use the Brand DNA suggestion.
const SUGGESTED = "";

const ZONES: string[] = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];

export function suggestionText(settings: WorkspaceSettingsResponse) {
  return settings.suggested
    ? `From your Brand DNA ("${settings.suggested.from}"): ${settings.suggested.timeZone}.`
    : "Your Brand DNA doesn't name a country yet, so times show in UTC until you pick a zone.";
}

export function TimeZoneForm({ workspaceId, settings, canEdit }: { workspaceId: string; settings: WorkspaceSettingsResponse; canEdit: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(settings.saved ?? SUGGESTED);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const zones = settings.saved && !ZONES.includes(settings.saved) ? [settings.saved, ...ZONES] : ZONES;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone: value === SUGGESTED ? null : value }),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const saved: WorkspaceSettingsResponse = await res.json();
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
          Every time in this workspace (searches, pauses, replies) shows in {settings.timeZone}. {suggestionText(settings)}
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
            <option value={SUGGESTED}>{settings.suggested ? `From Brand DNA (${settings.suggested.timeZone})` : "UTC (no Brand DNA country yet)"}</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
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
