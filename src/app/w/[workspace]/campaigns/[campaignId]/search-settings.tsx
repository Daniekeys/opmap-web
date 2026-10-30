"use client";

import { inputClass } from "@/components/input-class";
import type { SettingsDraft } from "@/lib/leads";

// An owner's search settings: a budget and a pace that can only lower what
// the search spends (the shared Google limit always holds), and how deep it
// searches each tile and city. Empty limits mean no limit.
export function SearchSettingsFields({
  value,
  onChange,
  dailyCap,
  disabled,
}: {
  value: SettingsDraft;
  onChange: (value: SettingsDraft) => void;
  dailyCap?: number;
  disabled?: boolean;
}) {
  const set = (key: keyof SettingsDraft) => (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value });
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-3 disabled:opacity-70">
      <legend className="mb-1 text-sm font-medium">Search settings</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Search budget
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={value.maxCalls}
            onChange={set("maxCalls")}
            placeholder="No limit"
            className={inputClass}
          />
          <span className="text-muted">The most Google searches this campaign may use. It stops there and keeps its leads.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Searches a day
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={dailyCap}
            value={value.dailyCalls}
            onChange={set("dailyCalls")}
            placeholder={dailyCap ? `Up to ${dailyCap}` : "Shared limit"}
            className={inputClass}
          />
          <span className="text-muted">
            This campaign&apos;s own pace{dailyCap ? `, up to the shared limit of ${dailyCap} a day` : ", up to the shared daily limit"}.
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Pages per map tile
          <select value={value.pagesPerTile} onChange={set("pagesPerTile")} className={inputClass}>
            <option value="1">1 page (up to 20 businesses)</option>
            <option value="2">2 pages (up to 40)</option>
            <option value="3">3 pages (up to 60)</option>
          </select>
          <span className="text-muted">Each page is one search. Fewer pages can miss businesses in busy areas.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Neighbourhood searches per city
          <select value={value.extrasPerCity} onChange={set("extrasPerCity")} className={inputClass}>
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "None" : n}
              </option>
            ))}
          </select>
          <span className="text-muted">Extra searches by neighbourhood name, one page each.</span>
        </label>
      </div>
    </fieldset>
  );
}
