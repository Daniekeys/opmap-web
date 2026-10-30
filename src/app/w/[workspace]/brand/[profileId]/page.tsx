import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getBrand, getBrandProfile, getWorkspace } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { FactSource, KINDS, sourceLabel, StaleFlag, VersionBadge } from "../facts";
import { FactReview } from "./fact-review";

type Props = PageProps<"/w/[workspace]/brand/[profileId]">;

// One profile version. A draft opens the review screen; any other version is
// shown as it was decided.
export default function ProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: Props["params"] }) {
  const { workspace: slug, profileId } = await params;
  const workspace = await getWorkspace(slug);
  const detail = await getBrandProfile(workspace.id, profileId);
  const { profile } = detail;
  const back = `/w/${workspace.slug}/brand`;

  const header = (
    <div className="flex flex-col gap-1">
      <Link
        href={back}
        className="-ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Brand DNA
      </Link>
      <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">
        Version {profile.version} <VersionBadge status={profile.status} />
      </h1>
      <p className="text-sm text-muted wrap-break-word sm:text-body">
        Read from {sourceLabel(profile)} on {formatDateTime(profile.createdAt)}
        {profile.source === "website" && `, ${detail.pages.length} ${detail.pages.length === 1 ? "page" : "pages"}`}.
      </p>
    </div>
  );

  if (profile.status === "draft") {
    const brand = await getBrand(workspace.id);
    return (
      <FactReview
        key={profile.id}
        workspaceId={workspace.id}
        brandHref={back}
        profile={profile}
        pages={detail.pages}
        approvedVersion={brand.approved?.version ?? null}
        initialFacts={detail.facts}
        missing={detail.missing}
        isOwner={workspace.role === "owner"}
      />
    );
  }

  return (
    <>
      {header}
      <p className="max-w-read rounded-control bg-raised px-3.5 py-3 text-sm">
        {profile.status === "approved"
          ? `Approved ${formatDateTime(profile.approvedAt!)}. This is the profile messages to leads use.`
          : profile.status === "retired"
            ? `Retired: ${profile.retiredReason ?? "its source isn't this workspace's"}. Kept for history; it is never used.`
            : "Archived: replaced by a newer version. Shown as it was decided."}{" "}
        {profile.changes.total} {profile.changes.total === 1 ? "change" : "changes"} during review ({profile.changes.edited}{" "}
        edited, {profile.changes.added} added, {profile.changes.rejected} rejected).
      </p>
      {KINDS.map(({ kind, label }) => {
        const facts = detail.facts.filter((f) => f.kind === kind);
        if (facts.length === 0) return null;
        return (
          <section key={kind} aria-label={label} className="flex max-w-read flex-col gap-3">
            <h2 className="text-section font-semibold">{label}</h2>
            <ul className="divide-y divide-rule rounded-card border border-border bg-surface">
              {facts.map((fact) => (
                <li key={fact.id} className="flex flex-col gap-2 px-4 py-3 md:px-6">
                  <p className={fact.status === "rejected" ? "text-muted line-through" : "font-medium"}>
                    {fact.text}
                    {fact.status === "rejected" && <span className="sr-only"> (rejected)</span>}
                  </p>
                  {fact.possiblyStale && <StaleFlag reason={fact.staleReason} />}
                  <FactSource fact={fact} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
