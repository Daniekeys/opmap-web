"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// List beside detail from 1024px (HANDOFF.md, Layout widths): the list is a
// column of 360 to 440px, the detail pane takes the rest and caps its own
// content at 880px, left-aligned. The title and figures line up with that
// content. On a phone the campaign's own page shows its title, figures and
// the list; a lead (or the pipeline) opens on its own, full width. While the
// search runs or waits (paneFirst), the campaign's page comes before the list
// on a phone, so its progress isn't below every lead.
export function CampaignFrame({
  base,
  header,
  stats,
  rail,
  paneFirst = false,
  children,
}: {
  base: string;
  header: ReactNode;
  stats: ReactNode;
  rail: ReactNode;
  paneFirst?: boolean;
  children: ReactNode;
}) {
  const atRoot = usePathname() === base;
  return (
    <div className="flex w-full flex-col gap-6">
      <div className={cn("flex w-full max-w-workspace flex-col gap-4 sm:gap-6", !atRoot && "hidden lg:flex")}>
        {header}
        {stats}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={cn("w-full shrink lg:sticky lg:top-8 lg:w-list lg:min-w-list-min", !atRoot && "hidden lg:block")}>{rail}</div>
        <div className={cn("flex min-w-0 flex-1 flex-col", paneFirst && atRoot && "order-first lg:order-none")}>
          <div className="flex w-full max-w-detail flex-col gap-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
