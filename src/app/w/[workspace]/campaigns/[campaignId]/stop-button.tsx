"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";

// Stop search: a running search ends after the map tile it is on, a paused
// one never resumes. Asks once first; leads found so far are kept, and an
// owner can edit the campaign and continue it later.
export function StopButton({ workspaceId, campaignId }: { workspaceId: string; campaignId: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    setStopping(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/stop`, { method: "POST" });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        setAsking(false);
        router.refresh();
        setStopping(false);
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
      // Already finished or stopped: show where it is now.
      if (e.code === "not_stoppable") return router.refresh();
      setError(res.status === 403 ? "Only an owner can stop a campaign." : e.message || "The search could not be stopped. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setStopping(false);
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {asking ? (
        <>
          <p className="text-sm">Stop the search? The leads found so far stay, and you can edit the campaign and continue later.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" className="h-11 px-5" onClick={stop} disabled={stopping}>
              {stopping ? "Stopping" : "Yes, stop search"}
            </Button>
            <Button variant="outline" className="h-11 px-5" onClick={() => setAsking(false)} disabled={stopping}>
              Keep searching
            </Button>
          </div>
        </>
      ) : (
        <Button variant="outline" className="h-11 sm:self-start sm:px-5" onClick={() => setAsking(true)}>
          Stop search
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-negative-ink">
          {error}
        </p>
      )}
    </div>
  );
}
