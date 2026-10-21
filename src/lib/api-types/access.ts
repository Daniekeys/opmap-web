// Mirrors opmap-api/src/modules/access/contracts.ts

export type Role = "owner" | "member";

export type AuthedUser = { id: string; name: string; email: string };

export type WorkspaceSummary = { id: string; name: string; slug: string; role: Role };

// GET /api/me
export type MeResponse = { user: AuthedUser; workspaces: WorkspaceSummary[] };

// GET /api/workspaces
export type WorkspacesResponse = { workspaces: WorkspaceSummary[] };

export type Member = { userId: string; name: string; email: string; role: Role };

// GET /api/w/:workspaceId/members
export type MembersResponse = { members: Member[] };

export type PendingInvite = { id: string; email: string; role: Role; expiresAt: string; createdAt: string };

// GET /api/w/:workspaceId/invites (owner)
export type PendingInvitesResponse = { invites: PendingInvite[] };

// POST /api/w/:workspaceId/invites (owner). role defaults to member.
export type CreateInviteBody = { email: string; role?: Role };

// 201. The link holds the token, so it is only ever shown in this response.
export type CreateInviteResponse = {
  invite: { id: string; email: string; role: Role; expiresAt: string; link: string };
};

// GET /api/invites/:token (no session)
export type InviteDescription = { email: string; workspaceName: string; hasAccount: boolean };

// POST /api/invites/:token/accept (no session). Name and password (8 to 128
// characters) only for a new account.
export type AcceptInviteBody = { name?: string; password?: string };

export type AcceptInviteResponse = { workspaceId: string; workspaceSlug: string; email: string };
