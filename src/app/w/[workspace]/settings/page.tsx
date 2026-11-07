import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace, getWorkspaceSettings } from "@/lib/api";
import { TimeZoneForm } from "./time-zone-form";

type Props = PageProps<"/w/[workspace]/settings">;

// Workspace settings: the time zone every time in the app is shown in
// (spec, Location > Beyond Nigeria). Owners change it; members see it.
export default function SettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Settings params={params} />
    </Suspense>
  );
}

async function Settings({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);
  const settings = await getWorkspaceSettings(workspace.id);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted wrap-break-word">How {workspace.name} works.</p>
      </div>
      <TimeZoneForm key={workspace.id} workspaceId={workspace.id} settings={settings} canEdit={workspace.role === "owner"} />
    </>
  );
}
