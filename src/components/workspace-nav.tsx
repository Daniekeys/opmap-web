"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function WorkspaceNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: `/w/${slug}`, label: "Overview" },
    ...(isOwner
      ? [
          { href: `/w/${slug}/members`, label: "Members" },
          { href: `/w/${slug}/test-job`, label: "Test job" },
        ]
      : []),
  ];

  return (
    <nav aria-label="Workspace" className="mx-auto flex w-full max-w-3xl gap-1 px-2">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center border-b-2 px-3 text-sm font-medium",
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
