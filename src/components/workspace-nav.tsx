"use client";

import { FlaskConical, LayoutDashboard, Megaphone, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Campaign } from "@/lib/api-types/leads";
import { cn } from "@/lib/utils";

const itemClass = "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors";

export function WorkspaceNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: `/w/${slug}`, label: "Overview", icon: LayoutDashboard },
    { href: `/w/${slug}/campaigns`, label: "Campaigns", icon: Megaphone },
    { href: `/w/${slug}/brand`, label: "Brand DNA", icon: Sparkles },
    ...(isOwner
      ? [
          { href: `/w/${slug}/members`, label: "Members", icon: Users },
          { href: `/w/${slug}/test-job`, label: "Test job", icon: FlaskConical },
        ]
      : []),
  ];

  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        // Overview is only its own page; the others include their sub-pages.
        const active = pathname === href || (href !== `/w/${slug}` && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const DOTS: Record<Campaign["status"], string> = {
  draft: "bg-zinc-400",
  running: "bg-sky-400 animate-pulse",
  paused: "bg-amber-400",
  stopped: "bg-zinc-500",
  done: "bg-emerald-400",
  failed: "bg-rose-500",
};

// The workspace's campaigns, newest first, each with its lead count.
export function SidebarCampaigns({ slug, campaigns }: { slug: string; campaigns: Pick<Campaign, "id" | "name" | "status" | "leadCount">[] }) {
  const pathname = usePathname();
  if (campaigns.length === 0) return <p className="px-3 text-xs text-sidebar-foreground/50">No campaigns yet.</p>;
  return (
    <ul className="flex flex-col gap-0.5">
      {campaigns.map((c) => {
        const href = `/w/${slug}/campaigns/${c.id}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={c.id}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                itemClass,
                "h-9",
                active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", DOTS[c.status])} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[11px] tabular-nums text-sidebar-foreground/70">{c.leadCount}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
