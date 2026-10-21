import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { buttonVariants } from "@/components/ui/button";
import { getInvite, type InviteProblem } from "@/lib/api";
import { AcceptInvite } from "./accept-invite";

export const metadata: Metadata = { title: "Join a workspace - Opportunity Map" };

type Props = PageProps<"/invite/[token]">;

// Opened signed out (src/proxy.ts lets it through). The invitee sets a name
// and password, or joins with the account they already have.
export default function InvitePage({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <p className="text-sm font-medium text-muted-foreground">Opportunity Map</p>
      <Suspense fallback={<PageLoading />}>
        <Invite params={params} />
      </Suspense>
    </main>
  );
}

const PROBLEMS: Record<InviteProblem, { title: string; body: string; signIn: boolean }> = {
  invite_invalid: {
    title: "This invite link doesn't work",
    body: "Check that you copied the whole link. If it still doesn't work, ask the workspace owner for a new one.",
    signIn: false,
  },
  invite_used: {
    title: "This invite link has been used",
    body: "Each link works once. If you joined with it, sign in. If not, ask the workspace owner for a new one.",
    signIn: true,
  },
  invite_expired: {
    title: "This invite link has expired",
    body: "Invite links work for 7 days. Ask the workspace owner to send you a new one.",
    signIn: false,
  },
};

async function Invite({ params }: { params: Props["params"] }) {
  const { token } = await params;
  const { invite, problem } = await getInvite(token);

  if (problem) {
    const { title, body, signIn } = PROBLEMS[problem];
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          {body}
        </p>
        {signIn && (
          <Link href="/login" className={buttonVariants({ className: "h-11 self-start px-4 text-base" })}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word">Join {invite.workspaceName}</h1>
        <p className="text-sm text-muted-foreground wrap-break-word">
          {invite.hasAccount
            ? `You already have an account as ${invite.email}. Join, then sign in with it.`
            : `You were invited as ${invite.email}. Choose your name and a password to create your account.`}
        </p>
      </div>
      <AcceptInvite token={token} email={invite.email} hasAccount={invite.hasAccount} />
    </div>
  );
}
