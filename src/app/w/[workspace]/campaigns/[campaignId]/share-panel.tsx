"use client";

import { Download, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { PrepareShareResponse, ShareStatusResponse } from "@/lib/api-types/share";
import { goToLogin } from "@/lib/go-to-login";
import { formatUsd } from "@/lib/leads";

const NO_ERROR: ApiErrorResponse = { error: { code: "", message: "" } };

// Share a campaign by link (spec, Core pipelines > Sharing a campaign). An
// owner prepares the leads with no messages (paid, shown first), makes the
// link, chooses whether people with it may download, and can turn it off.
// Every member can download the campaign here.
export function SharePanel({ workspaceId, campaignId, initial }: { workspaceId: string; campaignId: string; initial: ShareStatusResponse | null }) {
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PrepareShareResponse | null>(null);
  const [allowDownloads, setAllowDownloads] = useState(false);
  const base = `/api/w/${workspaceId}/campaigns/${campaignId}`;

  async function call(what: string, method: string, path: string, body?: unknown) {
    setBusy(what);
    setError(null);
    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.status === 401) return goToLogin();
      if (!res.ok) {
        const { error: e }: ApiErrorResponse = await res.json().catch(() => NO_ERROR);
        setError(e.message || "That didn't work. Please try again.");
        return null;
      }
      return res.json();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  const share = status?.share ?? null;
  return (
    <section aria-labelledby="share-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 id="share-heading" className="flex items-center gap-2 font-medium">
          <Share2 className="size-4" aria-hidden /> Share or download
        </h2>
        <p className="text-sm text-muted">
          Share this campaign with someone doing the outreach, such as an intern. They see every lead with its details, opportunity and messages, read-only and with no account. Opening the link never costs anything.
        </p>
      </div>

      {status && (
        <>
          <p className="text-sm">
            <strong>
              {status.withMessages} of {status.leads}
            </strong>{" "}
            {status.leads === 1 ? "lead has" : "leads have"} messages ready.
            {status.optedOut > 0 && ` ${status.optedOut} that asked not to be contacted ${status.optedOut === 1 ? "is" : "are"} left out.`}
          </p>

          {status.toPrepare > 0 && !prepared && (
            <div className="flex flex-col gap-2 rounded-control bg-raised px-3 py-3 text-sm">
              <p>
                Write messages for the other {status.toPrepare} {status.toPrepare === 1 ? "lead" : "leads"} first: about {formatUsd(status.prepareCostUsd.typical)}, at most{" "}
                {formatUsd(status.prepareCostUsd.max)}. Each one is researched in the background, about a minute each, and its messages show on the link as it finishes.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 self-start sm:h-9"
                disabled={busy !== null}
                onClick={async () => {
                  const result: PrepareShareResponse | null = await call("prepare", "POST", "/share/prepare");
                  if (result) setPrepared(result);
                }}
              >
                {busy === "prepare" ? "Starting" : `Write messages for ${status.toPrepare} ${status.toPrepare === 1 ? "lead" : "leads"}`}
              </Button>
            </div>
          )}
          {prepared && (
            <p role="status" className="rounded-control bg-raised px-3 py-2 text-sm">
              {prepared.started > 0 ? `Started ${prepared.started}. ` : ""}
              {prepared.running > 0 ? `${prepared.running} already running. ` : ""}
              {prepared.limit ? `Stopped: ${prepared.limit} ` : "Their messages show on the link as each one finishes. Reload this page in a few minutes to see the count."}
            </p>
          )}

          {share ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                Link
                <input readOnly value={share.link} onFocus={(e) => e.currentTarget.select()} className="h-11 rounded-control border border-control bg-surface px-3 text-sm sm:h-9" />
              </label>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={share.link} label="Copy link" variant="default" />
                <a href={share.link} target="_blank" rel="noreferrer noopener" className={buttonVariants({ variant: "outline", className: "h-11 gap-1.5 sm:h-9" })}>
                  <ExternalLink className="size-4" aria-hidden /> Open
                </a>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={share.allowDownloads}
                  disabled={busy !== null}
                  onChange={async (e) => {
                    const next: ShareStatusResponse | null = await call("downloads", "PATCH", "/share", { allowDownloads: e.target.checked });
                    if (next) setStatus(next);
                  }}
                />
                People with the link can download it (.md and Excel)
              </label>
              <p className="text-xs text-muted">
                Opened {share.viewCount} {share.viewCount === 1 ? "time" : "times"}. Anyone with the link can see it until you turn it off.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="h-11 self-start sm:h-9"
                disabled={busy !== null}
                onClick={async () => {
                  if (!window.confirm("Turn off this link? Anyone who has it can't open it any more.")) return;
                  const next: ShareStatusResponse | null = await call("revoke", "DELETE", "/share");
                  if (next) setStatus(next);
                }}
              >
                {busy === "revoke" ? "Turning off" : "Turn off link"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" className="size-4" checked={allowDownloads} onChange={(e) => setAllowDownloads(e.target.checked)} />
                Let people with the link download it (.md and Excel)
              </label>
              <Button
                type="button"
                className="h-11 self-start sm:h-9"
                disabled={busy !== null || status.leads === 0}
                onClick={async () => {
                  const next: ShareStatusResponse | null = await call("create", "POST", "/share", { allowDownloads });
                  if (next) setStatus(next);
                }}
              >
                {busy === "create" ? "Making the link" : "Create share link"}
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-rule pt-3">
        <a href={`${base}/export.xlsx`} className={buttonVariants({ variant: "outline", className: "h-11 gap-1.5 sm:h-9" })}>
          <Download className="size-4" aria-hidden /> Download Excel
        </a>
        <a href={`${base}/export.md`} className={buttonVariants({ variant: "outline", className: "h-11 gap-1.5 sm:h-9" })}>
          <Download className="size-4" aria-hidden /> Download .md
        </a>
      </div>
      {!status && <p className="text-xs text-muted">Only an owner can share this campaign by link.</p>}
    </section>
  );
}
