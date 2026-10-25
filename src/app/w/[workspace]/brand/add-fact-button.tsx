"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { AddFactBody, AddToBrandResponse, FactKind } from "@/lib/api-types/brand";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";
import { KINDS } from "./kinds";

// "Add a fact" on the Brand screen: something true the approved Brand DNA
// doesn't say. Free: no crawl, no Claude call. It goes into a new draft made
// from the approved version (or the draft already open), and the user reviews
// just that fact before approving the draft.
export function AddFactButton({ workspaceId, brandHref, hasDraft }: { workspaceId: string; brandHref: string; hasDraft: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body: AddFactBody = { kind: data.get("kind") as FactKind, text: String(data.get("text") ?? "").trim() };
    if (!body.text) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/brand/facts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        setError(problem?.error.message ?? "That didn't save. Please try again.");
        setPending(false);
        return;
      }
      const result = (await res.json()) as AddToBrandResponse;
      router.push(`${brandHref}/${result.profileId}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="h-11 text-base sm:self-start sm:px-5" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add a fact
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h3 className="font-medium">Add a fact</h3>
      <p className="text-sm text-muted-foreground">
        Something true about your business that isn&apos;t here yet. It is marked as added by you, with no source page.{" "}
        {hasDraft
          ? "It goes into the draft you're reviewing."
          : "It goes into a new draft with everything already approved; you only review the new fact, then approve the draft."}{" "}
        Free: nothing is read again.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Kind
        <span className="relative">
          <select name="kind" defaultValue="location" className={cn(inputClass, "appearance-none pr-9")}>
            {KINDS.map(({ kind, one }) => (
              <option key={kind} value={kind}>
                {one}
              </option>
            ))}
          </select>
          <ChevronsUpDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Fact
        <textarea name="text" required rows={3} maxLength={500} className={cn(inputClass, "h-auto min-h-24 py-2")} />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button type="submit" className="h-11 text-base sm:px-5" disabled={pending}>
          {pending ? "Adding" : "Add and review"}
        </Button>
        <Button type="button" variant="outline" className="h-11 text-base sm:px-5" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
