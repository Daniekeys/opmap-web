import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getWorkspace, listMembers, listPendingInvites } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { CreateInvite } from "./create-invite";

type Props = PageProps<"/w/[workspace]/members">;

// Owners only: who is in the workspace, pending invites, and a form that makes
// an invite link for the owner to send by hand (no email sending yet).
export default function MembersPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Members params={params} />
    </Suspense>
  );
}

async function Members({ params }: { params: Props["params"] }) {
  const workspace = await getWorkspace((await params).workspace);

  if (workspace.role !== "owner") {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p role="alert" className="rounded-lg bg-muted px-3 py-2 text-sm">
          Owners only. Ask an owner of {workspace.name} to invite someone.
        </p>
      </div>
    );
  }

  const [{ members }, { invites }] = await Promise.all([listMembers(workspace.id), listPendingInvites(workspace.id)]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground wrap-break-word">Invite people to {workspace.name}.</p>
      </div>

      <CreateInvite key={workspace.id} workspaceId={workspace.id} />

      <section aria-labelledby="pending-heading" className="flex flex-col gap-2">
        <h2 id="pending-heading" className="text-sm font-medium text-muted-foreground">
          Pending invites ({invites.length})
        </h2>
        {invites.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No pending invites.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {invites.map((invite) => (
              <li key={invite.id} className="flex min-h-11 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{invite.email}</p>
                  <p className="text-sm text-muted-foreground">Expires {formatDateTime(invite.expiresAt)}</p>
                </div>
                <RoleBadge role={invite.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-heading" className="flex flex-col gap-2">
        <h2 id="members-heading" className="text-sm font-medium text-muted-foreground">
          Members ({members.length})
        </h2>
        <ul className="divide-y rounded-xl border bg-card">
          {members.map((member) => (
            <li key={member.userId} className="flex min-h-11 items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              </div>
              <RoleBadge role={member.role} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{role}</span>
  );
}
