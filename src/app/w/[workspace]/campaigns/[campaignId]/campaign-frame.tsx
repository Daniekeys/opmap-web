"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// List beside detail from 1024px. On a phone the campaign's own page shows its
// header, numbers and the list; a lead (or the pipeline) shows on its own,
// full width. On wide screens a lead keeps the header but not the numbers.
export function CampaignFrame({ base, header, stats, rail, children }: { base: string; header: ReactNode; stats: ReactNode; rail: ReactNode; children: ReactNode }) {
  const atRoot = usePathname() === base;
  return (
    <div className="flex flex-col gap-5">
      <div className={cn("flex flex-col gap-5", !atRoot && "hidden lg:flex")}>
        {header}
        {atRoot && stats}
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className={cn("shrink-0 lg:sticky lg:top-6 lg:w-[22rem] xl:w-[25rem]", !atRoot && "hidden lg:block")}>{rail}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}
