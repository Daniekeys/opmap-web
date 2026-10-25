"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function WorkspaceNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: `/w/${slug}`, label: "Overview" },
    { href: `/w/${slug}/campaigns`, label: "Campaigns" },
    { href: `/w/${slug}/brand`, label: "Brand DNA" },
    ...(isOwner
      ? [
          { href: `/w/${slug}/members`, label: "Members" },
          { href: `/w/${slug}/test-job`, label: "Test job" },
        ]
      : []),
  ];

  return (
    <nav aria-label="Workspace" className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-2">
      {links.map(({ href, label }) => {
        // Overview is only its own page; the others include their sub-pages.
        const active = pathname === href || (href !== `/w/${slug}` && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
