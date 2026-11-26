import { Download, Globe, Mail, MessageCircle, Phone, Star } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CopyButton } from "@/components/copy-button";
import { TileMark } from "@/components/logo";
import { PageLoading } from "@/components/page-loading";
import { buttonVariants } from "@/components/ui/button";
import { getSharedCampaign } from "@/lib/api";
import type { SharedCampaignResponse, SharedLead } from "@/lib/api-types/share";
import { outcomeName } from "@/lib/outreach";
import { formatPhone } from "@/lib/phone";
import { messageLinks, SHARE_CHANNEL_NAMES, shareStageName } from "@/lib/share";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shared campaign - Opportunity Map",
  // Shared links are for the people they were sent to, not for search engines.
  robots: { index: false, follow: false },
};

type Props = PageProps<"/share/[token]">;

// A campaign shared by link (spec, Core pipelines > Sharing a campaign).
// Opened by anyone with the link, signed out (src/proxy.ts lets /share/
// through): read-only, and nothing here starts a paid call.
export default function SharedCampaignPage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-read flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
      <Suspense fallback={<PageLoading />}>
        <Shared params={params} />
      </Suspense>
    </main>
  );
}

async function Shared({ params }: { params: Props["params"] }) {
  const { token } = await params;
  const view = await getSharedCampaign(token);
  if (!view) {
    return (
      <div className="flex flex-col gap-3">
        <TileMark className="size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">This link doesn&apos;t work</h1>
        <p role="alert" className="text-sm text-muted">
          It may have been turned off, or part of it is missing. Ask whoever shared it with you for a new link.
        </p>
      </div>
    );
  }
  return (
    <>
      <Header view={view} token={token} />
      {view.leads.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">No leads in this campaign yet.</p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Leads">
          {view.leads.map((lead, i) => (
            <li key={`${lead.name}-${i}`}>
              <LeadCard lead={lead} n={i + 1} open={i === 0} />
            </li>
          ))}
        </ol>
      )}
      <p className="pb-4 text-center text-xs text-muted">Read-only. Shared from Opportunity Map.</p>
    </>
  );
}

function Header({ view, token }: { view: SharedCampaignResponse; token: string }) {
  const withMessages = view.leads.filter((l) => l.messages.length > 0).length;
  const base = `/api/share/${encodeURIComponent(token)}`;
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-muted">
        <TileMark className="size-5" />
        <span className="wrap-break-word">{view.sharedBy} shared this with you</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">{view.campaign.name}</h1>
      <p className="text-sm text-muted">
        {view.leads.length} {view.leads.length === 1 ? "lead" : "leads"}, {withMessages} with messages ready to send.
        {view.campaign.places.length > 0 && ` Places: ${view.campaign.places.join(", ")}.`}
      </p>
      <p className="text-sm">Open a lead to see why it fits and its messages. Copy a message, or open it straight in WhatsApp or your email.</p>
      {view.allowDownloads && (
        <div className="flex flex-wrap gap-2">
          <a href={`${base}/export.xlsx`} className={buttonVariants({ variant: "outline", className: "h-11 gap-1.5 sm:h-9" })}>
            <Download className="size-4" aria-hidden /> Download Excel
          </a>
          <a href={`${base}/export.md`} className={buttonVariants({ variant: "outline", className: "h-11 gap-1.5 sm:h-9" })}>
            <Download className="size-4" aria-hidden /> Download .md
          </a>
        </div>
      )}
    </header>
  );
}

const pill = "inline-flex shrink-0 items-center rounded-full px-2 text-xs/[22px] font-medium";

function LeadCard({ lead, n, open }: { lead: SharedLead; n: number; open: boolean }) {
  const about = [lead.category?.replaceAll("_", " "), lead.city].filter(Boolean).join(" · ");
  return (
    <details open={open} className="group rounded-card border border-border bg-surface">
      <summary className="flex min-h-14 cursor-pointer list-none items-start gap-3 px-4 py-3">
        <span className="mt-0.5 w-6 shrink-0 text-sm text-muted tabular-nums">{n}.</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold wrap-break-word">{lead.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {about && <span>{about}</span>}
            {lead.rating !== null && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="size-3" aria-hidden /> {lead.rating}
                {lead.reviewCount ? ` (${lead.reviewCount})` : ""}
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn(pill, lead.stage === "new" ? "bg-neutral-soft text-neutral-ink" : lead.stage === "lost" ? "bg-negative-soft text-negative-ink" : "bg-positive-soft text-positive-ink")}>
            {shareStageName(lead.stage)}
          </span>
          <span className="text-xs text-muted">{lead.messages.length > 0 ? `${lead.messages.length} messages` : "No messages"}</span>
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-rule px-4 py-4">
        <Contacts lead={lead} />
        {(lead.fit.verdict || lead.buyer) && (
          <div className="flex flex-col gap-1 text-sm">
            {lead.fit.verdict && (
              <p>
                <span className="text-muted">Fit:</span> {lead.fit.verdict}
                {lead.fit.reason ? `. ${lead.fit.reason}` : ""}
              </p>
            )}
            {lead.buyer && (
              <p>
                <span className="text-muted">Why they might buy:</span> {lead.buyer}
              </p>
            )}
          </div>
        )}
        {lead.opportunities.map((o, i) => (
          <section key={i} className="flex flex-col gap-1.5 rounded-control bg-raised px-3 py-3 text-sm">
            <h3 className="font-medium">{o.general ? "Opportunity (no specific gap found)" : "Opportunity"}</h3>
            {o.offer && (
              <p>
                <span className="text-muted">Offer:</span> {o.offer}
              </p>
            )}
            {o.gap && (
              <p>
                <span className="text-muted">Gap:</span> {o.gap}
              </p>
            )}
            {o.why.length > 0 && (
              <ul className="list-disc pl-5">
                {o.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            {o.angle && (
              <p>
                <span className="text-muted">Angle:</span> {o.angle}
              </p>
            )}
            {o.sources.length > 0 && (
              <p className="text-xs text-muted wrap-break-word">
                Sources:{" "}
                {o.sources.map((url, j) => (
                  <span key={url}>
                    {j > 0 && ", "}
                    <a href={url} target="_blank" rel="noreferrer noopener" className="underline hover:text-ink">
                      {hostOf(url)}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </section>
        ))}
        {lead.messages.length === 0 ? (
          <p className="text-sm text-muted">No messages were written for this lead.</p>
        ) : (
          lead.messages.map((m) => <MessageBlock key={m.channel} lead={lead} message={m} />)
        )}
        {lead.notes.map((note) => (
          <p key={note} role="note" className="rounded-control bg-warning-soft px-3 py-2 text-xs text-warning-ink">
            {note}
          </p>
        ))}
        {lead.outcomes.length > 0 && (
          <section className="flex flex-col gap-1 text-sm">
            <h3 className="font-medium">Outcomes</h3>
            <ul className="flex flex-col gap-1">
              {lead.outcomes.map((o, i) => (
                <li key={i} className="text-muted">
                  <span className="text-ink">{outcomeName(o.type)}</span>
                  {o.channel ? ` on ${SHARE_CHANNEL_NAMES[o.channel] ?? o.channel}` : ""}, {o.at.slice(0, 10)}
                  {o.note ? `: ${o.note}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </details>
  );
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function Contacts({ lead }: { lead: SharedLead }) {
  const c = lead.contacts;
  const row = "inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border px-3 text-sm hover:bg-raised sm:min-h-9";
  return (
    <div className="flex flex-col gap-2">
      {c.person && <p className="text-sm">Contact: {c.person}</p>}
      <div className="flex flex-wrap gap-2">
        {c.phone && (
          <a href={`tel:${c.phone}`} className={row}>
            <Phone className="size-4" aria-hidden /> {formatPhone(c.phone, null)}
          </a>
        )}
        {c.whatsapp && (
          <a href={/^https?:/.test(c.whatsapp) ? c.whatsapp : `https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer noopener" className={row}>
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`} className={cn(row, "max-w-full")}>
            <Mail className="size-4 shrink-0" aria-hidden /> <span className="truncate">{c.email}</span>
          </a>
        )}
        {c.website && (
          <a href={c.website} target="_blank" rel="noreferrer noopener" className={cn(row, "max-w-full")}>
            <Globe className="size-4 shrink-0" aria-hidden /> <span className="truncate">{hostOf(c.website)}</span>
          </a>
        )}
        {c.socials.map((s) => (
          <a key={s.kind} href={s.value} target="_blank" rel="noreferrer noopener" className={row}>
            {s.kind}
          </a>
        ))}
      </div>
      {!c.phone && !c.whatsapp && !c.email && !c.website && <p className="text-sm text-muted">No contact details found. Copy a message and find them on Google Maps.</p>}
    </div>
  );
}

function MessageBlock({ lead, message }: { lead: SharedLead; message: SharedLead["messages"][number] }) {
  const links = messageLinks(lead.targets, message);
  return (
    <section className="flex flex-col gap-2 rounded-control border border-border px-3 py-3">
      <h3 className="text-sm font-medium">{SHARE_CHANNEL_NAMES[message.channel] ?? message.channel}</h3>
      {message.subject && (
        <p className="text-sm">
          <span className="text-muted">Subject:</span> {message.subject}
        </p>
      )}
      <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.body}</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={message.subject ? `${message.subject}\n\n${message.body}` : message.body} label="Copy message" />
        {links.map((l) => (
          <a key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener" className={buttonVariants({ className: "h-11 gap-1.5 sm:h-9" })}>
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
