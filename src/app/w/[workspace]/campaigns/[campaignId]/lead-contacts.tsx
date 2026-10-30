"use client";

import { AtSign, Globe, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { Lead } from "@/lib/api-types/leads";
import { formatPhone, hasAnyContact, socialName, telHref, whatsappHref } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { LabelChip } from "./label-chip";

const linkClass = "font-medium text-foreground underline-offset-4 hover:text-primary hover:underline wrap-anywhere";

export const hostOf = (url: string) => {
  try {
    const u = new URL(url);
    return (u.host + (u.pathname === "/" ? "" : u.pathname)).replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return url;
  }
};

// One row: a coloured icon tile, the value, and its label chip.
function Row({ icon, tone, label, children, chip }: { icon: ReactNode; tone: string; label: string; children: ReactNode; chip?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", tone)} aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {children}
          {chip}
        </div>
      </div>
    </li>
  );
}

// Every contact point found for a lead, each with how sure we are of it.
export function LeadContacts({ lead }: { lead: Lead }) {
  const { phone, whatsapp, email, website, person, socials } = lead.contacts;
  if (!hasAnyContact(lead) && !person) {
    return <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">No contact found for this business.</p>;
  }
  return (
    <ul className="flex flex-col divide-y">
      {whatsapp && (
        <Row icon={<MessageCircle className="size-4" />} tone="bg-emerald-100 text-emerald-700" label="WhatsApp" chip={<LabelChip group="whatsapp" label={whatsapp.label} />}>
          <a href={whatsappHref(whatsapp.value)} target="_blank" rel="noreferrer noopener" className={linkClass}>
            {formatPhone(whatsapp.value)}
          </a>
        </Row>
      )}
      {phone && (
        <Row icon={<Phone className="size-4" />} tone="bg-violet-100 text-violet-700" label="Phone" chip={<LabelChip group="phone" label={phone.label} />}>
          <a href={telHref(phone.value)} className={cn(linkClass, "whitespace-nowrap")}>
            {formatPhone(phone.value)}
          </a>
        </Row>
      )}
      {email && (
        <Row icon={<Mail className="size-4" />} tone="bg-sky-100 text-sky-700" label="Email" chip={<LabelChip group="email" label={email.label} />}>
          <a href={`mailto:${email.value}`} className={linkClass}>
            {email.value}
          </a>
        </Row>
      )}
      {website && (
        <Row icon={<Globe className="size-4" />} tone="bg-indigo-100 text-indigo-700" label="Website" chip={<LabelChip group="website" label={website.label} />}>
          {website.label === "dead" ? (
            <span className="text-muted-foreground line-through wrap-anywhere">{hostOf(website.value)}</span>
          ) : (
            <a href={website.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {hostOf(website.value)}
            </a>
          )}
        </Row>
      )}
      {person && (
        <Row icon={<UserRound className="size-4" />} tone="bg-amber-100 text-amber-700" label="Contact person" chip={<LabelChip group="person" label={person.label} />}>
          <span>{person.value}</span>
        </Row>
      )}
      {socials.map((s) => (
        <Row key={s.kind} icon={<AtSign className="size-4" />} tone="bg-pink-100 text-pink-700" label={socialName(s.kind)} chip={<LabelChip group="social" label={s.label} />}>
          <a href={s.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
            {hostOf(s.value)}
          </a>
        </Row>
      ))}
    </ul>
  );
}
