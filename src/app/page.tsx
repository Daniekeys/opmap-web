import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { SignOutButton } from "@/components/sign-out-button";
import { getMe } from "@/lib/api";

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FirstWorkspace />
    </Suspense>
  );
}

// Signed in: go to the first workspace. Signed out: getMe() goes to login.
async function FirstWorkspace() {
  const { user, workspaces } = await getMe();
  if (workspaces[0]) redirect(`/w/${workspaces[0].slug}`);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">No workspace yet</h1>
      <p className="text-sm text-muted-foreground">
        {user.email} is not a member of any workspace. Ask a workspace owner for an invite link.
      </p>
      <SignOutButton className="self-start" />
    </main>
  );
}
