"use client";

import { ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { WorkspaceSummary } from "@/lib/api-types/access";
import { cn } from "@/lib/utils";

// The active workspace is the slug in the URL, so switching is a navigation:
// the same screen under the other workspace, re-rendered with its data.
// A native select, so phones get their own full-size picker.
export function WorkspaceSwitcher({ workspaces, current }: { workspaces: WorkspaceSummary[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(current);

  function switchTo(slug: string) {
    // /w/<slug>/<rest> keeps <rest>; the query string (a run id) is dropped.
    const rest = pathname.split("/").slice(3);
    startTransition(() => {
      setSelected(slug);
      router.push(`/${["w", slug, ...rest].join("/")}`);
    });
  }

  return (
    <div className={cn("relative w-full", pending && "opacity-60")}>
      <select
        aria-label="Workspace"
        value={selected}
        onChange={(event) => switchTo(event.target.value)}
        className="h-11 w-full appearance-none truncate rounded-lg border border-sidebar-border bg-sidebar-accent/60 pr-9 pl-3 text-sm font-medium text-white outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 [&>option]:text-foreground"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.slug}>
            {workspace.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sidebar-foreground/60"
        aria-hidden
      />
    </div>
  );
}
