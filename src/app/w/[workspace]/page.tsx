import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { StatusBadge } from "@/components/status-badge";
import { devPagesEnabled, getMe, getWorkspace, listMembers, listPipelineRuns } from "@/lib/api";
import { formatDateTime, formatDuration } from "@/lib/format";

type Params = PageProps<"/w/[workspace]">["params"];

export default function WorkspacePage({ params }: PageProps<"/w/[workspace]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: Params }) {
  const workspace = await getWorkspace((await params).workspace);
  const [{ user }, { members }, { runs }] = await Promise.all([
    getMe(),
    listMembers(workspace.id),
    listPipelineRuns(workspace.id),
  ]);
  const linkRuns = devPagesEnabled();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.name}, {workspace.role} of this workspace.
        </p>
      </div>

      <section aria-labelledby="members-heading" className="flex flex-col gap-2">
        <h2 id="members-heading" className="text-sm font-medium text-muted-foreground">
          Members ({members.length})
        </h2>
        <ul className="divide-y rounded-xl border bg-card">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="runs-heading" className="flex flex-col gap-2">
        <h2 id="runs-heading" className="text-sm font-medium text-muted-foreground">
          Recent pipeline runs
        </h2>
        {runs.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No pipeline runs in this workspace yet.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {runs.map((run) => {
              const row = (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium capitalize">{run.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(run.createdAt)}
                      {run.durationMs !== null && `, ${formatDuration(run.durationMs)}`}
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                </>
              );
              return (
                <li key={run.id}>
                  {linkRuns ? (
                    <Link
                      href={`/w/${workspace.slug}/dev/test-job?run=${run.id}`}
                      className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
