import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Logo } from "@/components/logo";
import { MenuNav, type NavData, SidebarNav } from "@/components/workspace-nav";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { getBrand, getMe, getWorkspace, listCampaigns } from "@/lib/api";

type Params = LayoutProps<"/w/[workspace]">["params"];

// The app shell. The frame is static; the parts that depend on the session or
// on the workspace in the URL stream in behind <Suspense>, per request. The
// sidebar and the phone menu show the same data, laid out for each size.
export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  // The shell reads the URL (to size the page and close the menu), so it
  // streams in too, behind a frame of the same shape.
  return (
    <Suspense fallback={<ShellLoading />}>
      <AppShell
        sidebar={
          <>
            <HomeLink params={params} />
            <Suspense fallback={<div className="h-11 animate-pulse rounded-card bg-raised" />}>
              <Switcher params={params} size="sidebar" />
            </Suspense>
            <Suspense fallback={<NavLoading />}>
              <Nav params={params} size="sidebar" />
            </Suspense>
          </>
        }
        menu={
          <>
            <Suspense fallback={<div className="h-14 animate-pulse rounded-card bg-raised" />}>
              <Switcher params={params} size="menu" />
            </Suspense>
            <Suspense fallback={<NavLoading />}>
              <Nav params={params} size="menu" />
            </Suspense>
          </>
        }
      >
        {children}
      </AppShell>
    </Suspense>
  );
}

function ShellLoading() {
  return (
    <div className="flex min-h-dvh w-full bg-ground">
      <div className="hidden w-sidebar shrink-0 border-r border-border lg:block" />
      <div className="flex-1" />
    </div>
  );
}

function NavLoading() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading">
      <div className="h-8.5 animate-pulse rounded-control bg-raised" />
      <div className="h-8.5 animate-pulse rounded-control bg-raised" />
      <div className="h-8.5 animate-pulse rounded-control bg-raised" />
    </div>
  );
}

async function HomeLink({ params }: { params: Params }) {
  const { workspace } = await params;
  return (
    <Link href={`/w/${workspace}`} className="self-start rounded-control px-2">
      <Logo />
    </Link>
  );
}

async function Switcher({ params, size }: { params: Params; size: "sidebar" | "menu" }) {
  const { workspace } = await params;
  const { workspaces } = await getMe();
  return <WorkspaceSwitcher workspaces={workspaces} current={workspace} size={size} />;
}

async function Nav({ params, size }: { params: Params; size: "sidebar" | "menu" }) {
  // getWorkspace is also the membership check for the shell: an unknown slug is a 404.
  const workspace = await getWorkspace((await params).workspace);
  const [{ user }, { campaigns }, brand] = await Promise.all([getMe(), listCampaigns(workspace.id), getBrand(workspace.id)]);
  const data: NavData = {
    slug: workspace.slug,
    isOwner: workspace.role === "owner",
    user,
    campaigns: campaigns.slice(0, 12).map(({ id, name, status, leadCount }) => ({ id, name, status, leadCount })),
    brandPending: brand.draft?.facts.pending ?? 0,
  };
  return size === "sidebar" ? <SidebarNav {...data} /> : <MenuNav {...data} />;
}
