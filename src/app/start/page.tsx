import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { SignOutButton } from "@/components/sign-out-button";
import { getMeOrNull } from "@/lib/api";
import { homeFor } from "@/lib/session";

export default function Start() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FirstWorkspace />
    </Suspense>
  );
}

// Reached only with a valid session and no workspace to go to: src/proxy.ts
// sends everyone else on (decideEntry). Checked again here in case the session
// ended in between: no session goes to the landing page, never /login.
async function FirstWorkspace() {
  const me = await getMeOrNull();
  if (!me) redirect("/");
  const home = homeFor(me);
  if (home) redirect(home);
  const { user } = me;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">No workspace yet</h1>
      <p className="text-sm text-muted">
        {user.email} is not a member of any workspace. Ask a workspace owner for an invite link.
      </p>
      <SignOutButton className="self-start" />
    </main>
  );
}
