import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarCampaigns, WorkspaceNav } from "@/components/workspace-nav";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { getMe, getWorkspace, listCampaigns } from "@/lib/api";

type Params = LayoutProps<"/w/[workspace]">["params"];

// The app shell. The frame is static; the parts that depend on the session or
// on the workspace in the URL stream in behind <Suspense>, per request.
export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  // The shell reads the URL (to size the page and close the drawer), so it
  // streams in too, behind a frame of the same shape.
  return (
    <Suspense fallback={<ShellLoading />}>
      <AppShell
        sidebar={
          <div className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
            <div className="px-2 pt-1">
              <Logo />
            </div>
            <Suspense fallback={<div className="h-11 animate-pulse rounded-lg bg-accent-soft" />}>
              <Switcher params={params} />
            </Suspense>
            <Suspense fallback={<div className="h-52 animate-pulse rounded-lg bg-accent-soft" />}>
              <Nav params={params} />
            </Suspense>
            <Suspense fallback={null}>
              <Campaigns params={params} />
            </Suspense>
            <div className="mt-auto border-t border-border pt-3">
              <SignOutButton variant="ghost" className="w-full justify-start gap-3 text-muted hover:bg-accent-soft hover:text-ink" />
            </div>
          </div>
        }
    >
      {children}
    </AppShell>
    </Suspense>
  );
}

function ShellLoading() {
  return (
    <div className="flex min-h-dvh w-full">
      <div className="hidden w-64 shrink-0 bg-ground lg:block" />
      <div className="flex-1" />
    </div>
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
  const { role } = await getWorkspace(workspace);
  return <WorkspaceNav slug={workspace} isOwner={role === "owner"} />;
}

async function Campaigns({ params }: { params: Params }) {
  const workspace = await getWorkspace((await params).workspace);
  const { campaigns } = await listCampaigns(workspace.id);
  return (
    <section aria-labelledby="sidebar-campaigns" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-3">
        <h2 id="sidebar-campaigns" className="text-xs font-semibold tracking-wider text-muted uppercase">
          Campaigns
        </h2>
        <Link
          href={`/w/${workspace.slug}/campaigns/new`}
          aria-label="New campaign"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-ink"
        >
          <Plus className="size-4" aria-hidden />
        </Link>
      </div>
      <SidebarCampaigns slug={workspace.slug} campaigns={campaigns.slice(0, 12)} />
    </section>
  );
}
