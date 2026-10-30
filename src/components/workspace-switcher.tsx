"use client";

import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { WorkspaceSummary } from "@/lib/api-types/access";
import { cn } from "@/lib/utils";
import { initials, toneOf } from "./avatar";

// The active workspace is the slug in the URL, so switching is a navigation:
// the same screen under the other workspace, re-rendered with its data.
// A native select sits invisibly over the card, so phones get their own
// full-size picker and keyboards get the usual select behaviour.
export function WorkspaceSwitcher({
  workspaces,
  current,
  size = "sidebar",
}: {
  workspaces: WorkspaceSummary[];
  current: string;
  size?: "sidebar" | "menu";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(current);
  const active = workspaces.find((w) => w.slug === selected) ?? workspaces[0];
  const others = workspaces.filter((w) => w.slug !== active?.slug);

  function switchTo(slug: string) {
    // /w/<slug>/<rest> keeps <rest>; the query string (a run id) is dropped.
    const rest = pathname.split("/").slice(3);
    startTransition(() => {
      setSelected(slug);
      router.push(`/${["w", slug, ...rest].join("/")}`);
    });
  }

  if (!active) return null;
  const menu = size === "menu";
  const hint = others.length === 1 ? `Switch to ${others[0]!.name}` : others.length > 1 ? "Switch workspace" : "Your only workspace";

  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-card border border-border bg-surface text-ink focus-within:border-ink focus-within:ring-3 focus-within:ring-ring/40",
        menu ? "h-14 gap-3 px-3" : "h-11 gap-2.5 px-2",
        pending && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-control font-semibold",
          toneOf(active.name),
          menu ? "size-8 text-xs" : "size-7 text-xs",
        )}
      >
        {initials(active.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm", menu ? "text-body font-semibold" : "font-medium")}>{active.name}</span>
        {menu && <span className="truncate text-xs text-muted">{hint}</span>}
      </span>
      {menu ? <ChevronRight className="size-4.5 shrink-0 text-muted" aria-hidden /> : <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />}
      <select
        aria-label="Workspace"
        value={active.slug}
        onChange={(event) => switchTo(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.slug}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}
