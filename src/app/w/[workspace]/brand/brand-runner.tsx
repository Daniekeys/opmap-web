"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import {
  MAX_DESCRIPTION_CHARS,
  MIN_DESCRIPTION_CHARS,
  type RunProblem,
  type StartBrandRunBody,
  type StartBrandRunResponse,
} from "@/lib/api-types/brand";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import type { PipelineRun } from "@/lib/api-types/pipeline";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";

const PROBLEMS: Record<RunProblem, { title: string; help: string }> = {
  site_unreachable: {
    title: "We couldn't reach your website",
    help: "Check the address is right and the site loads in a browser, then try again.",
  },
  blocked_address: {
    title: "That address isn't a public website",
    help: "It points to a private or local network, which we never read. Enter the address your customers visit.",
  },
  robots_disallowed: {
    title: "Your website asks crawlers not to read it",
    help: "Its robots.txt blocks crawlers. Allow OpmapBot in robots.txt, then try again.",
  },
  no_content: {
    title: "No usable content found",
    help: "We found nothing we could quote. On a website, text that only shows after a login, or only inside images, can't be read. In a description, say what you sell, who to, and where.",
  },
  foreign_website: {
    title: "That website belongs to another workspace",
    help: "Its Brand DNA can only be read in the workspace that owns it. Switch workspace, or enter this business's own website.",
  },
  failed: {
    title: "The run failed",
    help: "Something went wrong on our side. Try again in a minute.",
  },
};

const isActive = (run: PipelineRun | null) => run !== null && (run.status === "queued" || run.status === "running");

export function BrandRunner({
  workspaceId,
  isOwner,
  website,
  description,
  instagram,
  latestRun,
  latestRunProblem,
  hasProfile,
}: {
  workspaceId: string;
  isOwner: boolean;
  website: string | null;
  description: string | null;
  instagram: string | null;
  latestRun: PipelineRun | null;
  latestRunProblem: RunProblem | null;
  hasProfile: boolean;
}) {
  const router = useRouter();
  // The run in the progress panel: one in progress, one that just failed, or
  // one started from this page.
  const [runId, setRunId] = useState(isActive(latestRun) || latestRunProblem ? latestRun!.id : null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sellers with no website describe their business instead.
  const [mode, setMode] = useState<"website" | "description">(!website && description ? "description" : "website");
  const [text, setText] = useState(description ?? "");
  const running = isActive(latestRun) && latestRun!.id === runId;

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: StartBrandRunBody =
      mode === "website"
        ? { website: String(form.get("website") ?? "") }
        : { description: text, instagram: String(form.get("instagram") ?? "") };
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/brand/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const { run }: StartBrandRunResponse = await res.json();
        setRunId(run.id);
        router.refresh();
      } else if (res.status === 400) {
        setError(
          mode === "website"
            ? "Enter your website address, like yourbusiness.com."
            : `Write at least ${MIN_DESCRIPTION_CHARS} characters, and check the Instagram handle (letters, numbers, dots and underscores).`,
        );
      } else if (res.status === 403) {
        setError("Owners only. Your role in this workspace no longer allows starting a run.");
      } else if (res.status === 409) {
        setError(((await res.json()) as ApiErrorResponse).error.message);
      } else {
        setError("The run could not be started. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setStarting(false);
  }

  const problem = latestRunProblem && latestRun?.id === runId ? PROBLEMS[latestRunProblem] : null;

  return (
    <>
      {isOwner ? (
        <form onSubmit={start} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div role="group" aria-label="Read from" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                ["website", "My website"],
                ["description", "No website"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={cn(
                  "h-11 rounded-md text-sm font-medium",
                  mode === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "website" ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Your website
                <input
                  name="website"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="yourbusiness.com"
                  defaultValue={website ?? ""}
                  required
                  className={inputClass}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                We read up to 10 pages (home, about, services, portfolio, contact) and draft your profile. Takes about a
                minute. If the site hasn&apos;t changed since the last run, the earlier result is reused for free.
              </p>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Describe your business
                <textarea
                  name="description"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  required
                  minLength={MIN_DESCRIPTION_CHARS}
                  maxLength={MAX_DESCRIPTION_CHARS}
                  placeholder="I make and sell liquid soap in Lagos, in 5 and 25 litre kegs."
                  className={cn(inputClass, "h-auto min-h-32 py-2.5 leading-relaxed")}
                />
                <span className="flex justify-between gap-3 font-normal text-muted-foreground">
                  <span>What you sell, who buys it, where, and anything you can prove (years, customers, numbers).</span>
                  <span className="shrink-0 tabular-nums" aria-live="polite">
                    {text.trim().length}/{MAX_DESCRIPTION_CHARS}
                  </span>
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>
                  Instagram handle <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
                <input
                  name="instagram"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="@yourbusiness"
                  defaultValue={instagram ? `@${instagram}` : ""}
                  className={inputClass}
                />
                <span className="font-normal text-muted-foreground">
                  Kept with your profile. We don&apos;t read Instagram, so paste your bio or best captions into the
                  description if they say more.
                </span>
              </label>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 text-base sm:self-start sm:px-5" disabled={starting || running}>
            {starting
              ? "Starting"
              : running
                ? "Drafting your profile"
                : mode === "description"
                  ? "Draft my profile"
                  : hasProfile
                    ? "Read my website again"
                    : "Read my website"}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground wrap-break-word">
          {website ? `Website: ${website}. ` : ""}Only an owner can start a new run. You can review and fix facts in a
          draft.
        </p>
      )}

      {problem && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
          <p className="font-medium text-destructive">{problem.title}</p>
          <p className="mt-1 text-destructive">{problem.help}</p>
          {latestRun?.error && <p className="mt-2 text-muted-foreground wrap-break-word">Details: {latestRun.error}</p>}
        </div>
      )}

      {runId && <ProgressPanel workspaceId={workspaceId} runId={runId} onFinished={() => router.refresh()} />}
    </>
  );
}
