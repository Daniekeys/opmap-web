import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { buttonVariants } from "@/components/ui/button";
import { getBrand, getBrandProfile, getWorkspace } from "@/lib/api";
import type { ProfileSummary } from "@/lib/api-types/brand";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddFactButton } from "./add-fact-button";
import { BrandRunner } from "./brand-runner";
import { FactSource, KINDS, sourceLabel, StaleFlag, VersionBadge } from "./facts";

type Props = PageProps<"/w/[workspace]/brand">;

// Brand DNA for the workspace: start a crawl of the website, see the draft to
// review, the approved profile, and every version.
export default function BrandPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Brand params={params} />
    </Suspense>
  );
}

async function Brand({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);
  const brand = await getBrand(workspace.id);
  const approved = brand.approved ? await getBrandProfile(workspace.id, brand.approved.id) : null;
  const base = `/w/${workspace.slug}/brand`;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">Brand DNA</h1>
        <p className="text-sm text-muted sm:text-body">{overviewFinding(brand.draft, approved?.profile ?? null)}</p>
      </div>

      <BrandRunner
        key={workspace.id}
        workspaceId={workspace.id}
        isOwner={workspace.role === "owner"}
        website={brand.website}
        description={brand.description}
        instagram={brand.instagram}
        latestRun={brand.latestRun}
        latestRunProblem={brand.latestRunProblem}
        hasProfile={brand.versions.length > 0}
      />

      {brand.draft && <DraftCard draft={brand.draft} href={`${base}/${brand.draft.id}`} />}

      <section aria-labelledby="approved-heading" className="flex max-w-read flex-col gap-3">
        <h2 id="approved-heading" className="text-section font-semibold">
          Approved profile
          {brand.approved && `, version ${brand.approved.version}`}
        </h2>
        {!approved ? (
          <p className="rounded-card border border-dashed border-control bg-surface px-5 py-4 text-sm text-muted">
            {brand.draft
              ? "Nothing approved yet. Review the draft above and approve it."
              : "No Brand DNA yet. Read your website, or describe your business, to get a draft to review."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Approved {formatDateTime(approved.profile.approvedAt!)} from {sourceLabel(approved.profile)}.{" "}
              {approved.profile.facts.approved} facts.
            </p>
            <AddFactButton workspaceId={workspace.id} brandHref={base} hasDraft={brand.draft !== null} />
            {KINDS.map(({ kind, label }) => {
              const facts = approved.facts.filter((f) => f.kind === kind && f.status === "approved");
              if (facts.length === 0) return null;
              return (
                <div key={kind} className="flex flex-col gap-2">
                  <h3 className="font-semibold">
                    {label} <span className="text-muted">({facts.length})</span>
                  </h3>
                  <ul className="divide-y divide-rule rounded-card border border-border bg-surface">
                    {facts.map((fact) => (
                      <li key={fact.id} className="flex flex-col gap-2 px-4 py-3 md:px-6">
                        <p className="font-medium wrap-break-word">{fact.text}</p>
                        {fact.possiblyStale && <StaleFlag reason={fact.staleReason} />}
                        <FactSource fact={fact} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {brand.versions.length > 0 && (
        <section aria-labelledby="versions-heading" className="flex max-w-read flex-col gap-3">
          <h2 id="versions-heading" className="text-section font-semibold">
            Version history
          </h2>
          <ul className="divide-y divide-rule rounded-card border border-border bg-surface">
            {brand.versions.map((version) => (
              <li key={version.id}>
                <Link href={`${base}/${version.id}`} className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-raised md:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Version {version.version} <VersionBadge status={version.status} />
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(version.createdAt)}, {version.facts.approved} of {version.facts.total} facts approved,{" "}
                      {version.changes.total} {version.changes.total === 1 ? "change" : "changes"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// The one thing to know first: a draft waiting, what is approved, or nothing yet.
function overviewFinding(draft: ProfileSummary | null, approved: ProfileSummary | null) {
  if (draft) {
    const decided = draft.facts.total - draft.facts.pending;
    return `Version ${draft.version} is ready to review: ${decided} of ${draft.facts.total} facts decided. Only facts you approve go into messages.`;
  }
  if (approved) return `${approved.facts.approved} approved facts, read from ${sourceLabel(approved)}. Only these go into messages.`;
  return "No Brand DNA yet. Read your website or describe your business to get facts to review.";
}

function DraftCard({ draft, href }: { draft: ProfileSummary; href: string }) {
  const decided = draft.facts.total - draft.facts.pending;
  return (
    <section aria-labelledby="draft-heading" className="flex max-w-read flex-col gap-3 rounded-card border border-border bg-surface px-5 py-5 md:px-6">
      <div className="flex flex-col gap-1">
        <h2 id="draft-heading" className="text-section font-semibold">
          Version {draft.version} is ready to review
        </h2>
        <p className="text-sm text-muted">
          {draft.facts.pending === 0
            ? `All ${draft.facts.total} facts decided. An owner can approve it now.`
            : `${decided} of ${draft.facts.total} facts decided. Approve, fix or reject each one.`}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-accent-track" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${draft.facts.total ? (decided / draft.facts.total) * 100 : 0}%` }} />
      </div>
      <Link
        href={href}
        className={cn(buttonVariants(), "h-11 text-base sm:self-start sm:px-5 md:h-10 md:text-sm")}
      >
        {decided === 0 ? "Start reviewing" : "Continue reviewing"}
      </Link>
    </section>
  );
}
