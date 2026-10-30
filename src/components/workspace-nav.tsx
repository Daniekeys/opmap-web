"use client";

import { FlaskConical, LayoutGrid, Plus, Star, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthedUser } from "@/lib/api-types/access";
import type { Campaign } from "@/lib/api-types/leads";
import { cn } from "@/lib/utils";
import { initials } from "./avatar";
import { SignOutButton } from "./sign-out-button";

export type NavCampaign = Pick<Campaign, "id" | "name" | "status" | "leadCount">;

export type NavData = {
  slug: string;
  isOwner: boolean;
  user: AuthedUser;
  campaigns: NavCampaign[];
  // Facts in the Brand DNA draft that still need a decision.
  brandPending: number;
};

// The short note beside a campaign: where its search stands, or what it found.
function campaignNote(c: NavCampaign) {
  switch (c.status) {
    case "draft":
      return "Draft";
    case "running":
      return "Searching";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "failed":
      return "Failed";
    default:
      return `${c.leadCount} ${c.leadCount === 1 ? "lead" : "leads"}`;
  }
}

function useLinks({ slug, isOwner, brandPending }: NavData) {
  const pathname = usePathname();
  const is = (href: string, exact = false) => pathname === href || (!exact && pathname.startsWith(`${href}/`));
  const brandNote = brandPending > 0 ? `${brandPending} to review` : "";
  return {
    is,
    overview: { href: `/w/${slug}`, label: "Overview", icon: LayoutGrid, active: is(`/w/${slug}`, true), note: "" },
    brand: { href: `/w/${slug}/brand`, label: "Brand DNA", icon: Star, active: is(`/w/${slug}/brand`), note: brandNote },
    owner: isOwner
      ? [
          { href: `/w/${slug}/members`, label: "Members", icon: Users, active: is(`/w/${slug}/members`), note: "" },
          { href: `/w/${slug}/test-job`, label: "Test job", icon: FlaskConical, active: is(`/w/${slug}/test-job`), note: "" },
        ]
      : [],
    campaignsHref: `/w/${slug}/campaigns`,
    newHref: `/w/${slug}/campaigns/new`,
  };
}

// Desktop: an open-plane list on the ground, rows 34px, the active row tinted.
export function SidebarNav(data: NavData) {
  const links = useLinks(data);
  const top = [links.overview, links.brand, ...links.owner];
  const onCampaigns = links.is(links.campaignsHref, true);

  return (
    <>
      <nav aria-label="Workspace" className="flex flex-col gap-0.5">
        {top.map(({ href, label, icon: Icon, active, note }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8.5 items-center gap-2.5 rounded-control px-2.5 text-sm",
              active ? "bg-accent-soft font-semibold text-accent-ink" : "text-ink hover:bg-raised",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-muted")} strokeWidth={1.5} aria-hidden />
            <span className="flex-1 truncate">{label}</span>
            {note && <span className="shrink-0 text-xs font-normal text-muted">{note}</span>}
          </Link>
        ))}
      </nav>

      <nav aria-label="Campaigns" className="flex flex-col gap-0.5">
        <Link
          href={links.campaignsHref}
          aria-current={onCampaigns ? "page" : undefined}
          className={cn("px-2.5 pb-1.5 text-xs hover:text-ink", onCampaigns ? "font-semibold text-accent-ink" : "text-muted")}
        >
          Campaigns
        </Link>
        {data.campaigns.length === 0 && <p className="px-2.5 pb-1 text-xs text-muted">No campaigns yet.</p>}
        {data.campaigns.map((c) => {
          const href = `${links.campaignsHref}/${c.id}`;
          const active = links.is(href);
          return (
            <Link
              key={c.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8.5 items-center justify-between gap-2 rounded-control px-2.5 text-sm",
                active ? "bg-accent-soft font-semibold text-accent-ink" : "text-ink hover:bg-raised",
              )}
            >
              <span className="min-w-0 truncate">{c.name}</span>
              <span className="shrink-0 text-xs font-normal text-muted tabular-nums">{campaignNote(c)}</span>
            </Link>
          );
        })}
        <Link
          href={links.newHref}
          aria-current={links.is(links.newHref) ? "page" : undefined}
          className={cn(
            "flex h-8.5 items-center gap-2 rounded-control px-2.5 text-sm hover:bg-raised",
            links.is(links.newHref) ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:text-ink",
          )}
        >
          <Plus className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          New campaign
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-2.5">
        <UserRow user={data.user} />
        <SignOutButton variant="ghost" className="-mx-2.5 h-9 justify-start gap-2.5 px-2.5 font-normal text-muted hover:text-ink" />
      </div>
    </>
  );
}

// Phone: grouped white cards with 52px rows, and New campaign as the one
// filled button.
export function MenuNav(data: NavData) {
  const links = useLinks(data);
  const workspaceRows = [links.overview, ...links.owner];

  return (
    <>
      <nav aria-label="Campaigns" className="flex flex-col gap-1.5">
        <Link href={links.campaignsHref} className="px-1 text-xs text-muted hover:text-ink">
          Campaigns
        </Link>
        {data.campaigns.length > 0 ? (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {data.campaigns.map((c) => {
              const href = `${links.campaignsHref}/${c.id}`;
              return <MenuRow key={c.id} href={href} label={c.name} note={campaignNote(c)} active={links.is(href)} />;
            })}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-control px-4 py-5 text-center text-sm text-muted">No campaigns yet.</p>
        )}
        <Link
          href={links.newHref}
          className="mt-1.5 flex h-12 items-center justify-center rounded-control bg-primary font-semibold text-on-primary hover:bg-primary/85"
        >
          New campaign
        </Link>
      </nav>

      <nav aria-label="Your business" className="flex flex-col gap-1.5">
        <span className="px-1 text-xs text-muted">Your business</span>
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <MenuRow href={links.brand.href} label="Brand DNA" note={links.brand.note} noteClass="text-warning-ink" active={links.brand.active} />
        </div>
      </nav>

      <nav aria-label="Workspace" className="flex flex-col gap-1.5">
        <span className="px-1 text-xs text-muted">Workspace</span>
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {workspaceRows.map((l) => (
            <MenuRow key={l.href} href={l.href} label={l.label} active={l.active} />
          ))}
        </div>
      </nav>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-card border border-border bg-surface py-1.5 pr-1.5 pl-3.5">
        <UserRow user={data.user} />
        <SignOutButton variant="ghost" className="h-11 font-normal text-muted hover:text-ink" />
      </div>
    </>
  );
}

function MenuRow({ href, label, note, noteClass, active }: { href: string; label: string; note?: string; noteClass?: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-13 items-center justify-between gap-3 border-b border-rule px-3.5 last:border-b-0",
        active ? "bg-accent-soft font-semibold text-accent-ink" : "text-ink active:bg-raised",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      {note && <span className={cn("shrink-0 text-xs font-normal tabular-nums", noteClass ?? (active ? "" : "text-muted"))}>{note}</span>}
    </Link>
  );
}

function UserRow({ user }: { user: AuthedUser }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-mono-3 text-xs font-semibold text-mono-3-ink">
        {initials(user.name || user.email)}
      </span>
      <span className="truncate text-sm">{user.name || user.email}</span>
    </div>
  );
}
