"use client";

import { Check, ChevronsUpDown, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { CreateInviteBody, CreateInviteResponse, Role } from "@/lib/api-types/access";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";

const CREATE_ERRORS: Record<number, string> = {
  400: "Enter a valid email address.",
  // The page only renders this for owners, but a role can change mid-session.
  403: "Owners only. Your role in this workspace no longer allows inviting people.",
};

type Created = CreateInviteResponse["invite"];

export function CreateInvite({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: CreateInviteBody = { email: String(form.get("email") ?? ""), role: form.get("role") as Role };
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const { invite }: CreateInviteResponse = await res.json();
        setCreated(invite);
        // Shows the new invite in the pending list below.
        router.refresh();
      } else {
        setError(CREATE_ERRORS[res.status] ?? "The invite could not be created. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setPending(false);
  }

  if (created) {
    return <InviteLink invite={created} onDone={() => setCreated(null)} />;
  }

  return (
    <form onSubmit={create} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 className="font-medium">Invite someone</h2>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="off" inputMode="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Role
        <span className="relative">
          <select name="role" defaultValue="member" className={cn(inputClass, "appearance-none pr-9")}>
            <option value="member">Member</option>
            <option value="owner">Owner (can invite people and run the test job)</option>
          </select>
          <ChevronsUpDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </span>
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 text-base sm:self-start sm:px-5" disabled={pending}>
        {pending ? "Creating link" : "Create invite link"}
      </Button>
    </form>
  );
}

// The link is shown once: only its hash is stored, so it can't be shown again.
function InviteLink({ invite, onDone }: { invite: Created; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopy("copied");
      setTimeout(() => setCopy("idle"), 2000);
    } catch {
      // No clipboard access (an http page that isn't localhost, or a denied
      // permission): select the text so it can be copied by hand.
      input.current?.select();
      setCopy("failed");
    }
  }

  return (
    <section aria-labelledby="link-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="link-heading" className="font-medium wrap-break-word">
        Invite link for {invite.email}
      </h2>
      <p className="text-sm text-muted">
        Send this link to them yourself. It works once, for 7 days, and is shown only now.
      </p>
      <input
        ref={input}
        readOnly
        value={invite.link}
        aria-label="Invite link"
        onFocus={(event) => event.currentTarget.select()}
        className={cn(inputClass, "font-mono")}
      />
      {copy === "failed" && (
        <p role="alert" className="text-sm text-muted">
          Couldn&apos;t copy automatically. The link is selected: copy it from the box above.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="h-11 text-base sm:px-5" onClick={copyLink}>
          {copy === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copy === "copied" ? "Copied" : "Copy link"}
        </Button>
        <Button variant="outline" className="h-11 text-base sm:px-5" onClick={onDone}>
          Invite someone else
        </Button>
      </div>
    </section>
  );
}
