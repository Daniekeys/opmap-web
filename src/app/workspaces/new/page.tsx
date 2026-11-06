import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getMe } from "@/lib/api";
import { NewWorkspaceForm } from "./new-workspace-form";

// A new workspace: its name, then straight into Brand DNA onboarding. Only the
// platform owner may create one; for anyone else the page doesn't exist.
export default function NewWorkspacePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewWorkspace />
    </Suspense>
  );
}

async function NewWorkspace() {
  const { workspaces, canCreateWorkspaces } = await getMe();
  if (!canCreateWorkspaces) notFound();
  return <NewWorkspaceForm back={workspaces[0] ? `/w/${workspaces[0].slug}` : null} />;
}
