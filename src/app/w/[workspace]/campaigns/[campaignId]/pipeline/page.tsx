import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { PageLoading } from "@/components/page-loading";
import { TileMark } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { getPipeline, getWorkspace } from "@/lib/api";
import type { PipelineFunnel, PipelineLead, PipelineResponse } from "@/lib/api-types/outcomes";
import { BOARD_STAGES, COLUMN_NAMES, pipelineFinding, replyFirst, whenLine } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

type Props = PageProps<"/w/[workspace]/campaigns/[campaignId]/pipeline">;
type BoardStage = (typeof BOARD_STAGES)[number];
type Column = PipelineResponse["stages"][number] & { stage: BoardStage };

// Replies and deals (design/screens/Pipeline.dc.html): the campaign's
// contacted leads by stage, under four counts from outcome history. Columns
// on wide screens (200 to 360px each, scrolling sideways below that); on a
// phone one stage at a time from chips. New leads stay on the campaign list.
export default function PipelinePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <PipelineView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

// Cards shown per column before "and N more".
const SHOWN = 30;

async function PipelineView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { workspace: slug, campaignId } = await params;
  const asked = (await searchParams).stage;
  const workspace = await getWorkspace(slug);
  const pipeline = await getPipeline(workspace.id, campaignId);
  const columns = BOARD_STAGES.map((stage) => pipeline.stages.find((s) => s.stage === stage) ?? { stage, count: 0, leads: [] }) as Column[];
  const campaignHref = `/w/${slug}/campaigns/${campaignId}`;
  const leadHref = (leadId: string) => `${campaignHref}/leads/${leadId}`;
  const reply = replyFirst(pipeline.stages);
  // A phone opens on the stage asked for, or the furthest one with leads.
  const chosen: BoardStage =
    typeof asked === "string" && (BOARD_STAGES as readonly string[]).includes(asked)
      ? (asked as BoardStage)
      : ([...columns].reverse().find((c) => c.stage !== "lost" && c.count > 0)?.stage ?? (columns.at(-1)!.count > 0 ? "lost" : "sent"));
  const contacted = columns.some((c) => c.count > 0);

  return (
    <>
      <Link href={campaignHref} className="-mt-2 -ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Campaign
      </Link>
      <div className="-mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">Replies and deals</h1>
          <p className="text-sm text-muted wrap-break-word sm:text-body">{pipelineFinding(pipeline.funnel, pipeline.stages)}</p>
        </div>
        {reply && (
          <Link href={`${leadHref(reply.leadId)}?tab=messages`} className={buttonVariants({ className: "h-11 w-full px-4 text-base sm:h-9 sm:w-auto sm:px-3.5 sm:text-sm" })}>
            Reply to {reply.name}
          </Link>
        )}
      </div>

      {!contacted ? (
        <div className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4 sm:p-6">
          <TileMark className="size-6 opacity-60" />
          <p className="font-semibold">No one contacted yet</p>
          <p className="max-w-md text-sm text-muted">
            Leads show here once a message is sent. Open a lead from the{" "}
            <Link href={campaignHref} className="font-medium text-accent-ink underline-offset-4 hover:text-accent hover:underline">
              campaign list
            </Link>
            , write its messages and send one.
          </p>
        </div>
      ) : (
        <>
          <Funnel funnel={pipeline.funnel} />

          {/* Wide screens: the five columns. */}
          <div className="hidden overflow-x-auto pb-2 lg:block">
            <div className="grid grid-cols-[repeat(5,minmax(var(--container-column-min),var(--container-column)))] gap-6">
              {columns.map((c) => (
                <section key={c.stage} aria-label={COLUMN_NAMES[c.stage]} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between px-0.5 pb-1">
                    <h2 className="text-body font-semibold">{COLUMN_NAMES[c.stage]}</h2>
                    <span className="text-xs text-muted tabular-nums">{c.count}</span>
                  </div>
                  <Cards column={c} leadHref={leadHref} />
                </section>
              ))}
            </div>
          </div>

          {/* Phones: one stage at a time. */}
          <div className="flex flex-col gap-3 lg:hidden">
            <nav aria-label="Stages" className="flex flex-wrap gap-2">
              {columns.map((c) => (
                <Link
                  key={c.stage}
                  href={`?stage=${c.stage}`}
                  scroll={false}
                  aria-current={c.stage === chosen ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium",
                    c.stage === chosen ? "border-primary bg-primary text-on-primary" : "border-control bg-surface hover:bg-raised",
                  )}
                >
                  {COLUMN_NAMES[c.stage]} <span className={cn("tabular-nums", c.stage === chosen ? "text-on-primary" : "text-muted")}>{c.count}</span>
                </Link>
              ))}
            </nav>
            <Cards column={columns.find((c) => c.stage === chosen)!} leadHref={leadHref} />
          </div>
        </>
      )}
    </>
  );
}

// Messaged, Replied, Meeting booked and Won, each with a bar against Messaged.
function Funnel({ funnel }: { funnel: PipelineFunnel }) {
  const items = [
    { label: "Messaged", n: funnel.messaged, of: funnel.messaged === 1 ? "business" : "businesses" },
    { label: "Replied", n: funnel.replied, of: `of ${funnel.messaged}` },
    { label: "Meeting booked", n: funnel.meeting, of: `of ${funnel.messaged}` },
    { label: "Won", n: funnel.won, of: `of ${funnel.messaged}` },
  ];
  return (
    <section aria-label="From message to deal" className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-card border border-border bg-surface px-4 py-4 sm:grid-cols-4 sm:px-6 sm:py-5">
      {items.map((f) => (
        <div key={f.label} className="flex min-w-0 flex-col gap-2">
          <span className="text-xs text-muted">{f.label}</span>
          <span className="text-[20px] leading-[26px] font-medium tabular-nums sm:text-figure">
            {f.n} <span className="text-sm font-normal text-muted">{f.of}</span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-accent-track" aria-hidden>
            <span className="block h-2 rounded-full bg-accent" style={{ width: `${funnel.messaged > 0 ? Math.round((f.n / funnel.messaged) * 100) : 0}%` }} />
          </span>
        </div>
      ))}
    </section>
  );
}

function Cards({ column, leadHref }: { column: Column; leadHref: (id: string) => string }) {
  if (column.count === 0) return <p className="rounded-card border border-dashed border-border px-3.5 py-3 text-sm text-muted">None yet.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {column.leads.slice(0, SHOWN).map((l) => (
        <li key={l.leadId}>
          <LeadCard lead={l} href={leadHref(l.leadId)} />
        </li>
      ))}
      {column.count > SHOWN && <li className="px-1 text-xs text-muted">and {column.count - SHOWN} more</li>}
    </ul>
  );
}

const WHEN_TONES = { muted: "text-muted", accent: "text-accent-ink", positive: "text-positive" };

function LeadCard({ lead, href }: { lead: PipelineLead; href: string }) {
  const when = whenLine(lead);
  return (
    <Link href={href} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3.5 hover:border-control">
      <span className="flex items-center gap-2.5">
        <Avatar name={lead.name} seed={lead.businessId} size="xs" />
        <span className="min-w-0 text-sm font-semibold wrap-break-word">{lead.name}</span>
      </span>
      {lead.offer && <span className="truncate text-sm" title={lead.offer}>{lead.offer}</span>}
      <span className={cn("text-xs", WHEN_TONES[when.tone])}>{when.text}</span>
    </Link>
  );
}
