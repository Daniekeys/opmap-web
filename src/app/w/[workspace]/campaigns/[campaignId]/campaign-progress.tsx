import { Fragment } from "react";
import { StepList } from "@/components/step-list";
import type { Campaign, CampaignProgressResponse } from "@/lib/api-types/leads";
import { pauseText, problemText, progressSentence, STATE_WORDS, STEP_TITLES, stepDetail, usd } from "@/lib/progress-view";
import { RefreshAt } from "./auto-refresh";
import { ResumeButton } from "./resume-button";
import { StopButton } from "./stop-button";

const HEADINGS: Partial<Record<Campaign["status"], string>> = {
  running: "Searching now",
  paused: "Search paused",
  done: "Search finished",
  stopped: "How far the search got",
  failed: "How far the search got",
};

// The search's progress (design/screens/Progress.dc.html, without the tile
// grid): a heading and one sentence, Stop while it searches or waits, the
// paused state when a limit is hit, its steps from step_runs, and its cost.
export function CampaignProgress({
  progress,
  campaign,
  leadCount,
  workspaceId,
  isOwner,
}: {
  progress: CampaignProgressResponse;
  campaign: Campaign;
  leadCount: number;
  workspaceId: string;
  isOwner: boolean;
}) {
  const stoppable = isOwner && (campaign.status === "running" || campaign.status === "paused");
  const pause = progress.pause && pauseText(progress.pause, progress, campaign.settings.dailyCalls);
  return (
    <section aria-labelledby="progress-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="progress-heading" className="text-section font-semibold">
          {HEADINGS[campaign.status] ?? "Search"}
        </h2>
        <p className="text-sm text-muted sm:text-body">{progressSentence(progress)}</p>
      </div>

      {pause && progress.pause && (
        <div role="status" className="flex flex-col gap-1 rounded-card bg-warning-soft px-5 py-4 text-sm text-warning-ink">
          <p className="font-semibold">{pause.title}</p>
          <p>{pause.body}</p>
          {progress.pause.limit === "lifted" && isOwner && !progress.pause.autoResume && <ResumeButton workspaceId={workspaceId} campaignId={campaign.id} />}
          {progress.pause.limit !== "lifted" && progress.pause.resumeAt && <RefreshAt at={progress.pause.resumeAt} />}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 rounded-card border border-border bg-surface px-5 py-5 sm:px-6">
          <StepList
            live={campaign.status === "running"}
            steps={progress.steps.map((s) => {
              const problem = s.problem && problemText(s.problem);
              return {
                id: s.key,
                title: STEP_TITLES[s.key],
                state: s.state,
                stateText: STATE_WORDS[s.state],
                detail: (
                  <>
                    <p>{stepDetail(s, progress, leadCount)}</p>
                    {problem && (
                      <p className={s.state === "failed" ? "mt-1 text-negative-ink" : "mt-1"}>
                        {problem.reason} {problem.next}
                      </p>
                    )}
                  </>
                ),
              };
            })}
          />
        </div>
        <CostBox progress={progress} />
      </div>

      {stoppable && (
        <div className="-mt-1">
          <StopButton workspaceId={workspaceId} campaignId={campaign.id} />
        </div>
      )}
    </section>
  );
}

// What the campaign has cost: Claude credit from its steps, and Google
// searches against its budget and the shared caps (from the API's config).
function CostBox({ progress }: { progress: CampaignProgressResponse }) {
  const { claudeUsd, searches } = progress.cost;
  const rows: [string, string][] = [
    ["Claude credit", usd(claudeUsd)],
    ["Google searches, this campaign", searches.budget !== null ? `${searches.campaign} of ${searches.budget}` : String(searches.campaign)],
    ["Google searches today", `${searches.today} of ${searches.dailyCap}`],
    ["This month", `${searches.month.toLocaleString("en-GB")} of ${searches.monthlyCap.toLocaleString("en-GB")}`],
  ];
  return (
    <section aria-labelledby="cost-heading" className="flex flex-col gap-3 rounded-card border border-border bg-surface px-5 py-5 sm:px-6 xl:w-72 xl:shrink-0">
      <h3 id="cost-heading" className="font-semibold">
        Cost so far
      </h3>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="text-right tabular-nums">{v}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="text-xs text-muted">Today and this month count every campaign in every workspace.</p>
    </section>
  );
}
