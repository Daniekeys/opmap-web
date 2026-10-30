"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import type { Lead } from "@/lib/api-types/leads";
import type { Stage } from "@/lib/api-types/outcomes";
import { fitOf, leadMeta } from "@/lib/campaign-view";
import { hasPhoneOrWhatsapp } from "@/lib/leads";
import { STAGE_NAMES, STAGE_TONES } from "@/lib/outreach";
import { cn } from "@/lib/utils";

type Tab = "all" | "researched" | "outreach";

const TABS: { key: Tab; label: string; chip: string }[] = [
  { key: "all", label: "Businesses", chip: "All" },
  { key: "researched", label: "Researched", chip: "Researched" },
  { key: "outreach", label: "Contacted", chip: "Contacted" },
];

// The campaign's leads, best fit first, as a list to pick from
// (Main.dc.html; MobileLeads.dc.html on a phone). The open lead is
// highlighted. Opening one that isn't researched yet starts its paid
// deep-dive, so nothing is opened for the user.
export function LeadRail({
  base,
  leads,
  stages,
  searched,
}: {
  base: string;
  leads: Lead[];
  stages: Record<string, Stage>;
  searched: boolean;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [phoneOnly, setPhoneOnly] = useState(false);

  const stageOf = (lead: Lead) => stages[lead.leadId] ?? "new";
  const inTab = (lead: Lead, t: Tab) => (t === "all" ? true : t === "researched" ? lead.researched : stageOf(lead) !== "new");
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, leads.filter((l) => inTab(l, t.key)).length])) as Record<Tab, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leads, stages],
  );
  const q = query.trim().toLowerCase();
  const shown = leads.filter(
    (l) =>
      inTab(l, tab) &&
      (!phoneOnly || hasPhoneOrWhatsapp(l)) &&
      (!q || [l.name, l.category, l.city].some((v) => v?.toLowerCase().includes(q))),
  );

  const chipClass = (on: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control border px-3 text-sm",
      on ? "border-primary bg-primary font-medium text-on-primary" : "border-control bg-surface text-ink hover:bg-raised",
    );

  return (
    <section aria-label="Businesses" className="flex flex-col lg:max-h-[calc(100dvh-4rem)]">
      {/* Wide screens: underline tabs. */}
      <div role="tablist" aria-label="Show" className="hidden gap-6 border-b border-border lg:flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 py-2 text-body",
              tab === t.key ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label} <span className={cn("tabular-nums", tab === t.key ? "font-normal text-muted" : "")}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className={cn("flex flex-col gap-3 pb-3 lg:flex-row lg:items-center lg:justify-between lg:gap-2 lg:pt-4 lg:pb-2", leads.length === 0 && "hidden lg:hidden")}>
        <label className="flex h-11 w-full items-center gap-2 rounded-control border border-control bg-surface px-3 focus-within:border-ink focus-within:ring-3 focus-within:ring-ring/30 lg:h-9 lg:max-w-list-min">
          <Search className="size-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Search businesses</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, kind or area"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted lg:text-sm"
          />
        </label>
        {/* Phones: the tabs as filter chips, with the phone filter beside them. */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {TABS.map((t) => (
            <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)} className={chipClass(tab === t.key)}>
              {t.chip} <span className="tabular-nums opacity-80">{counts[t.key]}</span>
            </button>
          ))}
          <button type="button" aria-pressed={phoneOnly} onClick={() => setPhoneOnly((v) => !v)} className={chipClass(phoneOnly)}>
            Has phone
          </button>
        </div>
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <button
            type="button"
            aria-pressed={phoneOnly}
            onClick={() => setPhoneOnly((v) => !v)}
            title="Only businesses with a phone or WhatsApp number"
            className={cn(
              "inline-flex h-8 items-center rounded-control border px-2.5 text-xs",
              phoneOnly ? "border-primary bg-primary font-medium text-on-primary" : "border-control bg-surface text-ink hover:bg-raised",
            )}
          >
            Has phone
          </button>
          <span className="text-xs text-muted">Best fit first</span>
        </div>
      </div>

      {leads.length === 0 ? (
        <Empty title={searched ? "No businesses yet" : "Not searched yet"}>
          {searched ? "Businesses that fit show up here as the search finds and checks them." : "Confirm the search to find businesses that fit."}
        </Empty>
      ) : shown.length === 0 ? (
        <Empty title="Nothing matches">
          {tab === "outreach" && !q && !phoneOnly ? "Nobody contacted yet. Open a business, write its messages and send one." : "Try another word, or clear the filters."}
        </Empty>
      ) : (
        <ul className="-mx-4 flex min-h-0 flex-col overflow-y-auto border-y border-border bg-surface lg:mx-0 lg:rounded-card lg:border">
          {shown.map((lead) => {
            const href = `${base}/leads/${lead.leadId}`;
            return (
              <li key={lead.leadId} className="border-b border-rule last:border-b-0">
                <LeadRow lead={lead} href={href} stage={stageOf(lead)} active={pathname === href} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// A tile grid with nothing lit: the brand's empty state.
function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-10 text-center">
      <span className="grid grid-cols-3 gap-1" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="size-3.5 rounded-tile bg-rule" />
        ))}
      </span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted">{children}</p>
    </div>
  );
}

function LeadRow({ lead, href, stage, active }: { lead: Lead; href: string; stage: Stage; active: boolean }) {
  const fit = fitOf(lead);
  const meta = `${leadMeta(lead)}${lead.researched ? ". Researched" : ""}`;
  const right =
    stage !== "new" ? (
      <span className={cn("rounded-full px-2 text-xs/[22px] font-medium", STAGE_TONES[stage])}>{STAGE_NAMES[stage]}</span>
    ) : (
      <span className={cn("text-xs font-medium", fit.strong ? "text-accent-ink" : "text-muted")}>{fit.word}</span>
    );
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex h-18 items-center gap-3 px-4", active ? "bg-accent-soft" : "hover:bg-ground active:bg-raised")}
    >
      <Avatar name={lead.name} seed={lead.businessId} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{lead.name}</span>
          <span className="shrink-0 lg:hidden">{right}</span>
        </span>
        <span className="truncate text-xs text-muted">{meta}</span>
      </span>
      <span className="hidden w-28 shrink-0 flex-col items-end gap-1.5 lg:flex">
        {right}
        {fit.width !== null && (
          <span className="block h-1 w-28 rounded-full bg-rule" aria-hidden>
            <span className="block h-1 rounded-full bg-accent" style={{ width: `${fit.width}%` }} />
          </span>
        )}
      </span>
    </Link>
  );
}
