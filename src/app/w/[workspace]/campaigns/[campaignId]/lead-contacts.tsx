"use client";

import { AtSign, Globe, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { Lead } from "@/lib/api-types/leads";
import { formatPhone, hasAnyContact, socialName, telHref, whatsappHref } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { LabelChip } from "./label-chip";

const linkClass = "font-medium text-foreground underline-offset-4 hover:text-accent-ink hover:underline wrap-anywhere";

export const hostOf = (url: string) => {
  try {
    const u = new URL(url);
    return (u.host + (u.pathname === "/" ? "" : u.pathname)).replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return url;
  }
};

// One row: a grey icon beside the kind, the value, and its label chip.
function Row({ icon, label, children, chip }: { icon: ReactNode; label: string; children: ReactNode; chip?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-b border-rule py-2.5 last:border-b-0">
      <span className="mt-0.5 inline-flex shrink-0 text-muted [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs text-muted">{label}</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {children}
          {chip}
        </div>
      </div>
    </li>
  );
}

// Every contact point found for a lead, each with how sure we are of it.
// `linked` is false for a business on the opt-out list: values show as text,
// with no WhatsApp, call or mail links.
export function LeadContacts({ lead, linked = true }: { lead: Lead; linked?: boolean }) {
  const { phone, whatsapp, email, website, person, socials } = lead.contacts;
  if (!hasAnyContact(lead) && !person) {
    return <p className="rounded-lg bg-raised px-3 py-3 text-sm text-muted">No contact found for this business.</p>;
  }
  return (
    <ul className="flex flex-col">
      {whatsapp && (
        <Row icon={<MessageCircle className="size-4" />} label="WhatsApp" chip={<LabelChip group="whatsapp" label={whatsapp.label} />}>
          {linked ? (
            <a href={whatsappHref(whatsapp.value)} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {formatPhone(whatsapp.value)}
            </a>
          ) : (
            <span>{formatPhone(whatsapp.value)}</span>
          )}
        </Row>
      )}
      {phone && (
        <Row icon={<Phone className="size-4" />} label="Phone" chip={<LabelChip group="phone" label={phone.label} />}>
          {linked ? (
            <a href={telHref(phone.value)} className={cn(linkClass, "whitespace-nowrap")}>
              {formatPhone(phone.value)}
            </a>
          ) : (
            <span className="whitespace-nowrap">{formatPhone(phone.value)}</span>
          )}
        </Row>
      )}
      {email && (
        <Row icon={<Mail className="size-4" />} label="Email" chip={<LabelChip group="email" label={email.label} />}>
          {linked ? (
            <a href={`mailto:${email.value}`} className={linkClass}>
              {email.value}
            </a>
          ) : (
            <span className="wrap-anywhere">{email.value}</span>
          )}
        </Row>
      )}
      {website && (
        <Row icon={<Globe className="size-4" />} label="Website" chip={<LabelChip group="website" label={website.label} />}>
          {website.label === "dead" ? (
            <span className="text-muted line-through wrap-anywhere">{hostOf(website.value)}</span>
          ) : (
            <a href={website.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {hostOf(website.value)}
            </a>
          )}
        </Row>
      )}
      {person && (
        <Row icon={<UserRound className="size-4" />} label="Contact person" chip={<LabelChip group="person" label={person.label} />}>
          <span>{person.value}</span>
        </Row>
      )}
      {socials.map((s) => (
        <Row key={s.kind} icon={<AtSign className="size-4" />} label={socialName(s.kind)} chip={<LabelChip group="social" label={s.label} />}>
          <a href={s.value} target="_blank" rel="noreferrer noopener" className={linkClass}>
            {hostOf(s.value)}
          </a>
        </Row>
      ))}
    </ul>
  );
}
