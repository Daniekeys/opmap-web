"use client";

import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { AcceptInviteBody, AcceptInviteResponse } from "@/lib/api-types/access";
import type { ApiErrorResponse } from "@/lib/api-types/errors";

const ACCEPT_ERRORS: Record<string, string> = {
  invite_invalid: "This invite link doesn't work. Ask the workspace owner for a new one.",
  invite_used: "This invite link has already been used. If you joined with it, sign in.",
  invite_expired: "This invite link has expired. Ask the workspace owner for a new one.",
};

export function AcceptInvite({ token, email, hasAccount }: { token: string; email: string; hasAccount: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: AcceptInviteBody = hasAccount
      ? {}
      : { name: String(form.get("name") ?? ""), password: String(form.get("password") ?? "") };
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
        setError(
          ACCEPT_ERRORS[error.code] ??
            (error.code === "invalid_input"
              ? "Enter your name, and a password of 8 to 128 characters."
              : "Joining failed. Please try again in a moment."),
        );
        setPending(false);
        return;
      }
      const { workspaceSlug }: AcceptInviteResponse = await res.json();
      const home = `/w/${workspaceSlug}`;

      if (hasAccount) {
        // Signed out, the app sends them to sign in and then on to the workspace.
        // A full page load, like every sign-in (see go-to-login.ts).
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(home);
        return;
      }
      // New account: sign in with the password just set. A full page load, so
      // the app starts from this user's session alone.
      const signIn = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: body.password }),
      });
      window.location.assign(signIn.ok ? home : `/login?next=${encodeURIComponent(home)}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={accept} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      {!hasAccount && (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Your name
            <input name="name" autoComplete="name" required maxLength={100} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              aria-describedby="password-hint"
              className={inputClass}
            />
            <span id="password-hint" className="text-sm font-normal text-muted-foreground">
              At least 8 characters.
            </span>
          </label>
        </>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 text-base" disabled={pending}>
        {pending ? "Joining" : hasAccount ? "Join workspace" : "Create account and join"}
      </Button>
    </form>
  );
}
