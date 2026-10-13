import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { devPagesEnabled, getWorkspace } from "@/lib/api";
import { TestJobRunner } from "./test-job-runner";

type Props = PageProps<"/w/[workspace]/dev/test-job">;

// Dev only: starts the API's Phase 0 test job and shows it in the progress
// panel. A 404 in a production build unless ENABLE_DEV_PAGES=true.
export default function TestJobPage(props: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TestJob {...props} />
    </Suspense>
  );
}

async function TestJob({ params, searchParams }: Props) {
  const [{ workspace: slug }, { run }] = await Promise.all([params, searchParams]);
  if (!devPagesEnabled()) notFound();
  const workspace = await getWorkspace(slug);

  return (
    <TestJobRunner
      key={workspace.id}
      workspaceId={workspace.id}
      canStart={workspace.role === "owner"}
      initialRunId={typeof run === "string" ? run : null}
    />
  );
}
