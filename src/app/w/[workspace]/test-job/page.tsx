import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace } from "@/lib/api";
import { TestJobRunner } from "./test-job-runner";

type Props = PageProps<"/w/[workspace]/test-job">;

// Owners only: starts the API's Phase 0 test job and shows it in the progress
// panel. On in production too; it uses the fake adapters, so it costs nothing.
export default function TestJobPage(props: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TestJob {...props} />
    </Suspense>
  );
}

async function TestJob({ params, searchParams }: Props) {
  const [{ workspace: slug }, { run }] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspace(slug);

  if (workspace.role !== "owner") {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Test job</h1>
        <p role="alert" className="rounded-lg bg-raised px-3 py-2 text-sm">
          Owners only. Ask an owner of {workspace.name} to run the test job.
        </p>
      </div>
    );
  }

  return (
    <TestJobRunner
      key={workspace.id}
      workspaceId={workspace.id}
      initialRunId={typeof run === "string" ? run : null}
    />
  );
}
