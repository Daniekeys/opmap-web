import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { devPagesEnabled, getMe, getWorkspace } from "@/lib/api";

type Params = LayoutProps<"/w/[workspace]">["params"];

// The app shell. The frame is static; the parts that depend on the session or
// on the workspace in the URL stream in behind <Suspense>, per request.
export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-2">
          <span className="font-semibold tracking-tight">Opportunity Map</span>
          <SignOutButton className="ml-auto sm:order-last" />
          <Suspense fallback={<div className="h-11 w-full animate-pulse rounded-lg bg-muted sm:w-60" />}>
            <Switcher params={params} />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-11" />}>
          <Nav params={params} />
        </Suspense>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </>
  );
}

async function Switcher({ params }: { params: Params }) {
  const { workspace } = await params;
  const { workspaces } = await getMe();
  return <WorkspaceSwitcher workspaces={workspaces} current={workspace} />;
}

async function Nav({ params }: { params: Params }) {
  const { workspace } = await params;
  // Also the membership check for the shell: an unknown slug is a 404.
  await getWorkspace(workspace);
  return <WorkspaceNav slug={workspace} showDevPages={devPagesEnabled()} />;
}
