"use client";

import { Globe, Mail, MessageCircle, Phone, Search, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import type { Stage } from "@/lib/api-types/outcomes";
import type { Lead } from "@/lib/api-types/leads";
import { categoryText, hasPhoneOrWhatsapp } from "@/lib/leads";
import { STAGE_NAMES, STAGE_TONES } from "@/lib/outreach";
import { cn } from "@/lib/utils";

type Tab = "all" | "researched" | "outreach";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "researched", label: "Researched" },
  { key: "outreach", label: "Contacted" },
];

// The campaign's leads, best fit first, as a list to pick from. The open lead
// is highlighted; opening one that isn't researched yet starts its deep-dive,
// so nothing is opened for the user.
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

  return (
    <section aria-label="Businesses" className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs lg:max-h-[calc(100dvh-3rem)]">
      <div className="flex flex-col gap-3 border-b p-3">
        <div role="tablist" aria-label="Show" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-xs font-medium transition-colors sm:text-[13px]",
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="truncate">{t.label}</span>
              <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", tab === t.key ? "bg-primary/10 text-primary" : "bg-background/60")}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search businesses</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, type or city"
              className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
            />
          </label>
          <button
            type="button"
            aria-pressed={phoneOnly}
            onClick={() => setPhoneOnly((v) => !v)}
            title="Only businesses with a phone or WhatsApp number"
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium",
              phoneOnly ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <Phone className="size-3.5" aria-hidden /> Has phone
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <Empty>{searched ? "No leads yet. Businesses that fit show up here as the search finds them." : "No leads yet. Confirm the campaign to start the search."}</Empty>
      ) : shown.length === 0 ? (
        <Empty>{tab === "outreach" && !q && !phoneOnly ? "Nobody contacted yet. Open a business, write its messages and send one." : "Nothing matches."}</Empty>
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto p-2">
          {shown.map((lead) => {
            const href = `${base}/leads/${lead.leadId}`;
            return (
              <li key={lead.leadId}>
                <LeadRow lead={lead} href={href} stage={stageOf(lead)} active={pathname === href} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-3 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function LeadRow({ lead, href, stage, active }: { lead: Lead; href: string; stage: Stage; active: boolean }) {
  const { phone, whatsapp, email, website } = lead.contacts;
  const details = [categoryText(lead.category), lead.city].filter(Boolean).join(" · ");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex gap-3 rounded-xl border px-3 py-3 transition-colors",
        active ? "border-primary/30 bg-primary/[0.06] ring-1 ring-primary/20" : "border-transparent hover:bg-muted/70",
      )}
    >
      <Avatar name={lead.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold">{lead.name}</span>
          {lead.rating !== null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium">
              <Star className="size-3 fill-amber-400 text-amber-500" aria-hidden />
              {lead.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({lead.reviewCount ?? 0})</span>
            </span>
          )}
        </div>
        {details && <span className="truncate text-xs text-muted-foreground">{details}</span>}
        <div className="mt-0.5 flex items-center gap-1.5">
          <Channel on={!!whatsapp} tone="bg-emerald-100 text-emerald-700" label="WhatsApp">
            <MessageCircle className="size-3" />
          </Channel>
          <Channel on={!!phone} tone="bg-violet-100 text-violet-700" label="Phone">
            <Phone className="size-3" />
          </Channel>
          <Channel on={!!email} tone="bg-sky-100 text-sky-700" label="Email">
            <Mail className="size-3" />
          </Channel>
          <Channel on={!!website && website.label !== "dead"} tone="bg-indigo-100 text-indigo-700" label="Website">
            <Globe className="size-3" />
          </Channel>
          <span className="ml-auto flex items-center gap-1">
            {stage !== "new" ? (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STAGE_TONES[stage])}>{STAGE_NAMES[stage]}</span>
            ) : lead.researched ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia-800" title="The deep-dive has run; opening it costs nothing">
                <Sparkles className="size-3" aria-hidden /> Researched
              </span>
            ) : null}
          </span>
        </div>
        {lead.buyer && <span className="line-clamp-1 text-xs text-muted-foreground/90">{lead.buyer.topReason}</span>}
      </div>
    </Link>
  );
}

// A channel this lead can be reached on; greyed out when there isn't one.
function Channel({ on, tone, label, children }: { on: boolean; tone: string; label: string; children: React.ReactNode }) {
  return (
    <span
      title={on ? label : `No ${label.toLowerCase()}`}
      className={cn("inline-flex size-5.5 items-center justify-center rounded-md", on ? tone : "bg-muted text-muted-foreground/40")}
    >
      {children}
      <span className="sr-only">{on ? label : `No ${label.toLowerCase()}`}</span>
    </span>
  );
}
