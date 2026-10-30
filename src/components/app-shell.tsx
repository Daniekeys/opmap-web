"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

// The frame: a dark sidebar beside the page from 1024px, and a top bar with a
// drawer below that. A campaign's workspace (list and detail side by side)
// takes the full width; every other page keeps a readable column.
export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wide = /\/campaigns\/(?!new(\/|$))[^/]+/.test(pathname);

  // Any navigation closes the drawer.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh w-full">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-sidebar text-sidebar-foreground shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 inline-flex size-11 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <X className="size-5" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/85 px-2 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Logo />
        </header>
        <main
          className={cn(
            "mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6",
            wide ? "max-w-[96rem] lg:px-6" : "max-w-3xl lg:py-10",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
