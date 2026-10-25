"use client";

import { Globe, Mail, MessageCircle, Phone, Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Contact, Lead, Possible, PossiblesResponse } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";
import {
  categoryText,
  FIT_WORDS,
  formatPhone,
  hasAnyContact,
  hasPhoneOrWhatsapp,
  socialName,
  telHref,
  whatsappHref,
} from "@/lib/leads";
import { cn } from "@/lib/utils";
import { LabelChip } from "./label-chip";

const linkClass = "font-medium text-primary underline-offset-4 hover:underline wrap-anywhere";
const tapLink =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-base font-medium hover:bg-muted/50 wrap-anywhere";

const hostOf = (url: string) => {
  try {
    const u = new URL(url);
    return (u.host + (u.pathname === "/" ? "" : u.pathname)).replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return url;
  }
};

export function LeadsList({
  workspaceId,
  campaignId,
  leads,
  possibleCount,
  searched,
}: {
  workspaceId: string;
  campaignId: string;
  leads: Lead[];
  possibleCount: number;
  searched: boolean;
}) {
  const [phoneOnly, setPhoneOnly] = useState(false);
  const shown = useMemo(() => (phoneOnly ? leads.filter(hasPhoneOrWhatsapp) : leads), [leads, phoneOnly]);
  const withPhone = useMemo(() => leads.filter(hasPhoneOrWhatsapp).length, [leads]);

  return (
    <section aria-labelledby="leads-heading" className="flex flex-col gap-3 lg:w-[min(72rem,calc(100vw-2rem))] lg:self-center">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="leads-heading" className="font-medium">
          Leads <span className="text-muted-foreground">({leads.length})</span>
        </h2>
        {leads.length > 0 && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={phoneOnly} onChange={(e) => setPhoneOnly(e.target.checked)} className="size-5" />
            Has a phone or WhatsApp ({withPhone})
          </label>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {searched ? "No leads yet. Fit businesses show up here as the search finds them." : "No leads yet. Confirm the campaign to start the search."}
        </p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          None of these leads has a phone or WhatsApp number yet.
        </p>
      ) : (
        <>
          {phoneOnly && (
            <p className="text-sm text-muted-foreground">
              Showing {shown.length} of {leads.length}.
            </p>
          )}
          <ul className="flex flex-col gap-3 lg:hidden">
            {shown.map((lead) => (
              <li key={lead.leadId}>
                <LeadCard lead={lead} />
              </li>
            ))}
          </ul>
          <LeadsTable leads={shown} />
        </>
      )}

      <Possibles workspaceId={workspaceId} campaignId={campaignId} count={possibleCount} />
    </section>
  );
}

function Rating({ lead }: { lead: Pick<Lead, "rating" | "reviewCount"> }) {
  if (lead.rating === null) return <span className="text-muted-foreground">No rating</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
      {lead.rating.toFixed(1)}
      <span className="text-muted-foreground">
        ({lead.reviewCount ?? 0} {lead.reviewCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

function Researched({ lead }: { lead: Lead }) {
  return lead.researched ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900" title="The deep-dive has run; opening it costs nothing">
      Researched
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium" title="Opening this lead runs the deep-dive">
      Not yet researched
    </span>
  );
}

function Fit({ lead }: { lead: Lead }) {
  const word = lead.fit.verdict ? (FIT_WORDS[lead.fit.verdict] ?? lead.fit.verdict) : "Fit";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-sm" title={lead.fit.reason ?? undefined}>
      {word}
      {lead.promoted && (
        <span
          className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900"
          title="You made this lead from the possible list; it keeps its place by its buyer score"
        >
          Promoted by you
        </span>
      )}
    </span>
  );
}

// Why the lead sits where it does in the list: its top reason in plain
// words. Every reason is in the tooltip; the score itself isn't shown, since
// a decimal would read as more precise than it is.
function WhyRanked({ lead }: { lead: Lead }) {
  if (!lead.buyer) return null;
  const all = lead.buyer.reasons.map((r) => `${r.good ? "+" : "-"} ${r.text}`).join("\n");
  return (
    <p className="flex items-start gap-1.5 text-sm" title={all}>
      <TrendingUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="wrap-break-word">{lead.buyer.topReason}</span>
    </p>
  );
}

// Website and socials, each linked, with its label.
function WebAndSocials({ lead, empty = "None found" }: { lead: Lead; empty?: string }) {
  const { website, socials } = lead.contacts;
  if (!website && socials.length === 0) return <span className="text-sm text-muted-foreground">{empty}</span>;
  return (
    <ul className="flex flex-col gap-1.5">
      {website && (
        <li className="flex flex-wrap items-center gap-2">
          <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {website.label === "dead" ? (
            <span className="text-muted-foreground line-through wrap-anywhere">{hostOf(website.value)}</span>
          ) : (
            <a href={website.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {hostOf(website.value)}
            </a>
          )}
          <LabelChip group="website" label={website.label} />
        </li>
      )}
      {socials.map((s) => (
        <li key={s.kind} className="flex flex-wrap items-center gap-2">
          <a href={s.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
            {socialName(s.kind)}
          </a>
          <LabelChip group="social" label={s.label} />
        </li>
      ))}
    </ul>
  );
}

function ContactLine({ icon, children, chip }: { icon: ReactNode; children: ReactNode; chip: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {icon}
      {children}
      {chip}
    </div>
  );
}

function PhoneLink({ contact, big }: { contact: Contact; big?: boolean }) {
  return (
    <a href={telHref(contact.value)} className={big ? tapLink : cn(linkClass, "whitespace-nowrap")} aria-label={`Call ${formatPhone(contact.value)}`}>
      {big && <Phone className="size-4" aria-hidden />}
      {formatPhone(contact.value)}
    </a>
  );
}

function WhatsappLink({ contact, big }: { contact: Contact; big?: boolean }) {
  return (
    <a
      href={whatsappHref(contact.value)}
      target="_blank"
      rel="noreferrer noopener"
      className={big ? tapLink : cn(linkClass, "whitespace-nowrap")}
      aria-label={`WhatsApp ${formatPhone(contact.value)}`}
    >
      {big && <MessageCircle className="size-4" aria-hidden />}
      {big ? "WhatsApp" : formatPhone(contact.value)}
    </a>
  );
}

// One lead on a phone: the big tap targets are the phone and WhatsApp.
function LeadCard({ lead }: { lead: Lead }) {
  const { phone, whatsapp, email, person } = lead.contacts;
  const category = categoryText(lead.category);
  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium wrap-break-word">{lead.name}</h3>
        <p className="text-sm text-muted-foreground">{[category, lead.city].filter(Boolean).join(" · ") || "No category"}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Rating lead={lead} />
          <Fit lead={lead} />
          <Researched lead={lead} />
        </div>
        <WhyRanked lead={lead} />
      </div>

      {!hasAnyContact(lead) ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">No contact found</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(phone || whatsapp) && (
            <div className="flex flex-col gap-2">
              {phone && (
                <div className="flex flex-wrap items-center gap-2">
                  <PhoneLink contact={phone} big />
                  <LabelChip group="phone" label={phone.label} />
                </div>
              )}
              {whatsapp && (
                <div className="flex flex-wrap items-center gap-2">
                  <WhatsappLink contact={whatsapp} big />
                  {whatsapp.value !== phone?.value && <span className="text-sm">{formatPhone(whatsapp.value)}</span>}
                  <LabelChip group="whatsapp" label={whatsapp.label} />
                </div>
              )}
            </div>
          )}
          {email && (
            <ContactLine icon={<Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />} chip={<LabelChip group="email" label={email.label} />}>
              <a href={`mailto:${email.value}`} className={linkClass}>
                {email.value}
              </a>
            </ContactLine>
          )}
          {person && (
            <ContactLine icon={<span className="text-sm text-muted-foreground">Contact:</span>} chip={<LabelChip group="person" label={person.label} />}>
              <span className="text-sm">{person.value}</span>
            </ContactLine>
          )}
          <WebAndSocials lead={lead} empty="No website or socials found" />
        </div>
      )}
    </article>
  );
}

// From 1024px wide: one row per lead.
function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Business</th>
            <th className="px-3 py-2 font-medium">Rating</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">WhatsApp</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Website and socials</th>
            <th className="px-3 py-2 font-medium">Fit, and why it ranks here</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leads.map((lead) => {
            const { phone, whatsapp, email } = lead.contacts;
            const none = !hasAnyContact(lead);
            return (
              <tr key={lead.leadId} className="align-top">
                <td className="max-w-56 px-3 py-3">
                  <p className="font-medium wrap-break-word">{lead.name}</p>
                  <p className="text-muted-foreground">{[categoryText(lead.category), lead.city].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Rating lead={lead} />
                </td>
                {none ? (
                  <td colSpan={4} className="px-3 py-3 text-muted-foreground">
                    No contact found
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-3">
                      {phone ? (
                        <div className="flex flex-col items-start gap-1">
                          <PhoneLink contact={phone} />
                          <LabelChip group="phone" label={phone.label} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {whatsapp ? (
                        <div className="flex flex-col items-start gap-1">
                          <WhatsappLink contact={whatsapp} />
                          <LabelChip group="whatsapp" label={whatsapp.label} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="max-w-52 px-3 py-3">
                      {email ? (
                        <div className="flex flex-col items-start gap-1">
                          <a href={`mailto:${email.value}`} className={linkClass}>
                            {email.value}
                          </a>
                          <LabelChip group="email" label={email.label} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="max-w-60 px-3 py-3">
                      <WebAndSocials lead={lead} />
                    </td>
                  </>
                )}
                <td className="max-w-56 px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <Fit lead={lead} />
                    <WhyRanked lead={lead} />
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Researched lead={lead} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type PossiblesState = { state: "hidden" } | { state: "loading" } | { state: "failed" } | { state: "shown"; possibles: Possible[] };

// Businesses the fit check wasn't sure about, behind a toggle. Promoting one
// makes it a lead and starts finding its contacts.
function Possibles({ workspaceId, campaignId, count }: { workspaceId: string; campaignId: string; count: number }) {
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
    <div className="flex flex-col gap-3 pt-2">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => (e.target.checked ? load() : setView({ state: "hidden" }))}
          className="size-5"
        />
        Show possible businesses ({count}): the fit check wasn&apos;t sure about these
      </label>
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
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">No possible businesses left.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {view.possibles.map((p) => (
              <li key={p.businessId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium wrap-break-word">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[categoryText(p.category), p.city].filter(Boolean).join(" · ")}
                    {p.rating !== null && ` · ${p.rating.toFixed(1)} stars`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Why it&apos;s unsure: {p.reason}</p>
                </div>
                <Button variant="outline" className="h-11 shrink-0 px-4 text-base" onClick={() => promote(p)} disabled={promoting !== null}>
                  {promoting === p.businessId ? "Promoting" : "Promote to lead"}
                </Button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
