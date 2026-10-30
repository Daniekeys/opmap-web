"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

// The frame fills the window. From 1024px a 240px sidebar sits on the ground at
// the left edge; below that, a 56px top bar opens the menu as a full-screen
// sheet. Panes cap their own content; only screens not yet redone for the v2
// design are held to the reading width here.
export function AppShell({ sidebar, menu, children }: { sidebar: ReactNode; menu: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  // A campaign, the new-campaign segment grid and a Brand DNA version (its
  // facts beside a side panel) cap their own columns; every other page is a
  // form or reading, capped at 720.
  const wide = /\/campaigns\/[^/]+|\/brand\/[^/]+/.test(pathname);

  // Any navigation closes the menu.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const opener = openButton.current;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh w-full bg-ground">
      <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-5.5 overflow-y-auto border-r border-border px-3 py-5 lg:flex">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ground animate-in fade-in duration-150 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-14 shrink-0 items-center gap-2.5 pr-1 pl-4">
            <Logo className="flex-1" />
            <button
              ref={closeButton}
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-raised"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-5">{menu}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-ground pr-2 pl-1 lg:hidden">
          <button
            ref={openButton}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-raised"
          >
            <Menu className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
          <Logo />
        </header>
        <main className="flex w-full flex-1 flex-col gap-6 px-4 pt-2 pb-6 lg:px-6 lg:pt-8">
          <div className={cn("flex w-full flex-col gap-6", !wide && "max-w-read")}>{children}</div>
        </main>
      </div>
    </div>
  );
}
