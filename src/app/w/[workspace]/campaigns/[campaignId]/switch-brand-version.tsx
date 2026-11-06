"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { SwitchBrandVersionBody } from "@/lib/api-types/leads";
import { goToLogin } from "@/lib/go-to-login";

// "A newer Brand DNA (vM) was approved. Switch this campaign to vM?" under the
// campaign's title. Switching is an owner's deliberate choice, logged as an
// event: its deep-dives and drafts read vM from then on. Cards and drafts
// already written stay as they are. Members see the question only.
export function SwitchBrandVersion({
  workspaceId,
  campaignId,
  version,
  question,
  isOwner,
}: {
  workspaceId: string;
  campaignId: string;
  version: number;
  question: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function switchVersion() {
    setSwitching(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/brand-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version } satisfies SwitchBrandVersionBody),
      });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        router.refresh();
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
      setError(res.status === 403 ? "Only an owner can switch a campaign's Brand DNA." : e.message || "The campaign wasn't switched. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setSwitching(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-card bg-warning-soft px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <p className="text-sm text-warning-ink sm:flex-1">
        {question}
        {!isOwner && " An owner can switch it."}
      </p>
      {isOwner && (
        <Button variant="outline" className="h-11 self-start bg-surface sm:h-9" onClick={switchVersion} disabled={switching}>
          {switching ? "Switching" : `Switch to v${version}`}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-negative-ink sm:basis-full">
          {error}
        </p>
      )}
    </div>
  );
}
