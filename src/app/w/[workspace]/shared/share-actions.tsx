"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { goToLogin } from "@/lib/go-to-login";

// A live link's actions on the shared campaigns page: copy it, or turn it off.
export function ShareActions({ workspaceId, campaignId, link }: { workspaceId: string; campaignId: string; link: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2 md:justify-end">
        <CopyButton text={link} label="Copy link" />
        <Button
          type="button"
          variant="destructive"
          className="h-11 sm:h-9"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Turn off this link? Anyone who has it can't open it any more.")) return;
            setBusy(true);
            setError(null);
            try {
              const res = await fetch(`/api/w/${workspaceId}/campaigns/${campaignId}/share`, { method: "DELETE" });
              if (res.status === 401) return goToLogin();
              if (!res.ok) setError("The link could not be turned off. Please try again.");
              else router.refresh();
            } catch {
              setError("Could not reach the server. Check your connection and try again.");
            }
            setBusy(false);
          }}
        >
          {busy ? "Turning off" : "Turn off"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-negative-ink">
          {error}
        </p>
      )}
    </div>
  );
}
