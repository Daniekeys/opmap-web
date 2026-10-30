import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getCampaign, getPipeline, getWorkspace } from "@/lib/api";
import { type PipelineLead, type PipelineResponse, type Stage, STAGES } from "@/lib/api-types/outcomes";
import { formatDateTime } from "@/lib/format";
import { categoryText } from "@/lib/leads";
import { outcomeText, STAGE_NAMES } from "@/lib/outreach";
import { cn } from "@/lib/utils";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]/pipeline">;

// A campaign's leads by outcome (spec, Build phases > Phase 4: pipeline view).
// One stage shows at a time, picked from the chips with their counts. The
// app's content column is narrow at every width, so six columns never fit.
export default function PipelinePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <PipelineView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

// Leads shown per stage before "and N more": New can hold a whole campaign.
const SHOWN = 30;

async function PipelineView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { workspace: slug, campaignId } = await params;
  const asked = (await searchParams).stage;
  const workspace = await getWorkspace(slug);
  const [{ campaign }, pipeline] = await Promise.all([getCampaign(workspace.id, campaignId), getPipeline(workspace.id, campaignId)]);
  const worked = pipeline.stages.filter((s) => s.stage !== "new").reduce((n, s) => n + s.count, 0);
  // Opens on the stage asked for, or the furthest one with leads.
  const chosen: Stage =
    typeof asked === "string" && (STAGES as readonly string[]).includes(asked)
      ? (asked as Stage)
      : ([...pipeline.stages].reverse().find((s) => s.stage !== "lost" && s.count > 0)?.stage ?? "new");
  const leadHref = (leadId: string) => `/w/${slug}/campaigns/${campaignId}/leads/${leadId}`;

  return (
    <>
      <Link
        href={`/w/${slug}/campaigns/${campaignId}`}
        className="-mt-2 -ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Campaign
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">Pipeline</h1>
        <p className="text-sm text-muted wrap-break-word">
          {campaign.name}: {worked === 0 ? "no lead contacted yet. Open a lead, write its messages and send one." : `${worked} ${worked === 1 ? "lead" : "leads"} contacted.`}
        </p>
      </div>

      <nav aria-label="Stages" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {pipeline.stages.map((s) => (
          <Link
            key={s.stage}
            href={`?stage=${s.stage}`}
            scroll={false}
            aria-current={s.stage === chosen ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium",
              s.stage === chosen ? "border-ink bg-primary text-on-primary" : "bg-card hover:bg-raised",
            )}
          >
            {STAGE_NAMES[s.stage]} <span className={cn("tabular-nums", s.stage === chosen ? "text-on-primary" : "text-muted")}>{s.count}</span>
          </Link>
        ))}
      </nav>
      <StageList stage={pipeline.stages.find((x) => x.stage === chosen)!} leadHref={leadHref} />
    </>
  );
}

function StageList({ stage, leadHref }: { stage: PipelineResponse["stages"][number]; leadHref: (id: string) => string }) {
  if (stage.count === 0) {
    return <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted">No leads {stage.stage === "new" ? "waiting" : `at ${STAGE_NAMES[stage.stage]}`}.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {stage.leads.slice(0, SHOWN).map((l) => (
        <li key={l.leadId}>
          <LeadCard lead={l} href={leadHref(l.leadId)} />
        </li>
      ))}
      {stage.count > SHOWN && <li className="px-1 text-xs text-muted">and {stage.count - SHOWN} more</li>}
    </ul>
  );
}

function LeadCard({ lead, href }: { lead: PipelineLead; href: string }) {
  const details = [categoryText(lead.category), lead.city].filter(Boolean).join(" · ");
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 hover:bg-raised">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium wrap-break-word">{lead.name}</span>
        {details && <span className="text-xs text-muted">{details}</span>}
        {lead.lastOutcome && (
          <span className="text-xs text-muted">
            {outcomeText(lead.lastOutcome)} · {formatDateTime(lead.lastOutcome.createdAt)}
          </span>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
