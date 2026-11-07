"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CountryDecisionResponse, CountryQuestion } from "@/lib/api-types/brand";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";
import { countryQuestionText } from "../review";

// The Brand DNA's country question, as its own item at the top of the review
// (and on the version's page after): "Based in Accra, Ghana: use Ghana for
// this workspace's country and time zone?". An owner approves (the workspace
// switches) or rejects (it stays); members see it and what was decided.
export function CountryQuestionCard({
  workspaceId,
  profileId,
  initial,
  isOwner,
}: {
  workspaceId: string;
  profileId: string;
  initial: CountryQuestion;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = countryQuestionText(question, isOwner);

  async function decide(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/brand/profiles/${profileId}/country/${decision}`, { method: "POST" });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        setQuestion(((await res.json()) as CountryDecisionResponse).countryQuestion);
        // The shell's times and phone formats follow the workspace's zone.
        router.refresh();
      } else {
        const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        setError(body?.error.message ?? "That didn't save. Try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  const waiting = question.status === "pending";
  return (
    <article
      aria-labelledby="country-question"
      className={cn("flex flex-col gap-2.5 rounded-card bg-surface px-5 py-5 md:px-6", waiting ? "border-[1.5px] border-accent" : "border border-border")}
    >
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Workspace country</p>
      <p id="country-question" className="text-section font-semibold wrap-break-word">
        {text.heading}
      </p>
      <p className="text-sm text-muted wrap-break-word md:text-body">{text.body}</p>
      {error && (
        <p role="alert" className="text-sm text-negative-ink">
          {error}
        </p>
      )}
      {text.canDecide && (
        <div className="flex flex-col gap-2 md:flex-row">
          <Button className="h-11 text-base md:h-9 md:text-sm" disabled={busy} onClick={() => decide("approve")}>
            Approve: use {question.countryName}
          </Button>
          <Button variant="outline" className="h-11 text-base md:h-9 md:text-sm" disabled={busy} onClick={() => decide("reject")}>
            Reject: keep the current country
          </Button>
        </div>
      )}
    </article>
  );
}
