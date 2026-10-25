import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getBrand, getBrandProfile, getWorkspace } from "@/lib/api";
import type { ProfileSummary } from "@/lib/api-types/brand";
import { formatDateTime } from "@/lib/format";
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
        <h1 className="text-2xl font-semibold tracking-tight">Brand DNA</h1>
        <p className="text-sm text-muted-foreground">
          What {workspace.name} offers and can prove, read from your website or your own description, and approved by
          you. Messages to leads may only claim what is approved here.
        </p>
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

      <section aria-labelledby="approved-heading" className="flex flex-col gap-2">
        <h2 id="approved-heading" className="text-sm font-medium text-muted-foreground">
          Approved profile
          {brand.approved && `, version ${brand.approved.version}`}
        </h2>
        {!approved ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {brand.draft
              ? "Nothing approved yet. Review the draft above and approve it."
              : "No Brand DNA yet. Read your website, or describe your business, to get a draft to review."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Approved {formatDateTime(approved.profile.approvedAt!)} from {sourceLabel(approved.profile)}.{" "}
              {approved.profile.facts.approved} facts.
            </p>
            <AddFactButton workspaceId={workspace.id} brandHref={base} hasDraft={brand.draft !== null} />
            {KINDS.map(({ kind, label }) => {
              const facts = approved.facts.filter((f) => f.kind === kind && f.status === "approved");
              if (facts.length === 0) return null;
              return (
                <div key={kind} className="flex flex-col gap-2">
                  <h3 className="font-medium">
                    {label} <span className="text-muted-foreground">({facts.length})</span>
                  </h3>
                  <ul className="divide-y rounded-xl border bg-card">
                    {facts.map((fact) => (
                      <li key={fact.id} className="flex flex-col gap-2 px-4 py-3">
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
        <section aria-labelledby="versions-heading" className="flex flex-col gap-2">
          <h2 id="versions-heading" className="text-sm font-medium text-muted-foreground">
            Version history
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {brand.versions.map((version) => (
              <li key={version.id}>
                <Link href={`${base}/${version.id}`} className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Version {version.version} <VersionBadge status={version.status} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(version.createdAt)}, {version.facts.approved} of {version.facts.total} facts approved,{" "}
                      {version.changes.total} {version.changes.total === 1 ? "change" : "changes"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function DraftCard({ draft, href }: { draft: ProfileSummary; href: string }) {
  const decided = draft.facts.total - draft.facts.pending;
  return (
    <section aria-labelledby="draft-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 id="draft-heading" className="font-medium">
          Version {draft.version} is ready to review
        </h2>
        <p className="text-sm text-muted-foreground">
          {draft.facts.pending === 0
            ? `All ${draft.facts.total} facts decided. An owner can approve it now.`
            : `${decided} of ${draft.facts.total} facts decided. Approve, fix or reject each one.`}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-foreground" style={{ width: `${draft.facts.total ? (decided / draft.facts.total) * 100 : 0}%` }} />
      </div>
      <Link
        href={href}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary/80 sm:self-start"
      >
        {decided === 0 ? "Start reviewing" : "Continue reviewing"}
      </Link>
    </section>
  );
}
