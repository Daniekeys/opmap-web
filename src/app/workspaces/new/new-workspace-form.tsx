"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { CreateWorkspaceBody, CreateWorkspaceResponse } from "@/lib/api-types/access";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";

// Name the business, then go straight to its Brand DNA: its website, or a
// short description when it has none. The new workspace is in the switcher
// from then on, with you as its owner.
export function NewWorkspaceForm({ back }: { back: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() } satisfies CreateWorkspaceBody),
      });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        const { workspace }: CreateWorkspaceResponse = await res.json();
        router.push(`/w/${workspace.slug}/brand`);
        router.refresh();
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
      setError(e.message || "The workspace wasn't created. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-read flex-1 flex-col gap-6 px-4 py-10">
      {back && (
        <Link href={back} className="-ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm font-medium text-muted hover:text-ink md:h-8">
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Link>
      )}
      <header className="flex flex-col gap-1">
        <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">New workspace</h1>
        <p className="text-sm text-muted sm:text-body">
          One workspace per business. Next you&apos;ll set up its Brand DNA from its website, or from a short description if it has none.
        </p>
      </header>
      <form onSubmit={create} className="flex flex-col gap-4 rounded-card border border-border bg-surface px-5 py-5 md:px-6">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Business name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Test Liquid Soap Ilorin"
            autoComplete="organization"
            maxLength={80}
            required
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 self-start text-base md:h-10 md:text-sm" disabled={saving || !name.trim()}>
          {saving ? "Creating" : "Create and set up Brand DNA"}
        </Button>
      </form>
    </main>
  );
}
