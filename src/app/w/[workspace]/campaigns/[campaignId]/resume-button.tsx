"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";

// Resume search: restarts a campaign a Google cap paused, once the cap has
// lifted. In development this is the only way it restarts; in production the
// resume job usually gets there first. The API checks the time again.
export function ResumeButton({ workspaceId, campaignId }: { workspaceId: string; campaignId: string }) {
  const router = useRouter();
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    setResuming(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/resume`, { method: "POST" });
      if (res.status === 401) return goToLogin();
      if (res.ok) {
        router.refresh();
        return;
      }
      const { error: e }: ApiErrorResponse = await res.json().catch(() => ({ error: { code: "", message: "" } }));
      // Already resumed (by the job, or another tap): show where it is now.
      if (e.code === "not_paused") return router.refresh();
      setError(res.status === 403 ? "Only an owner can resume a campaign." : e.message || "The search could not be resumed. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setResuming(false);
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Button className="h-11 sm:self-start sm:px-5" onClick={resume} disabled={resuming}>
        {resuming ? "Resuming" : "Resume search"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-negative-ink">
          {error}
        </p>
      )}
    </div>
  );
}
