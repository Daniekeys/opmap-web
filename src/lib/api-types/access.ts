// Mirrors opmap-api/src/modules/access/contracts.ts

export type Role = "owner" | "member";

export type AuthedUser = { id: string; name: string; email: string };

// claudeAlert: set for owners on a day (UTC) the workspace passed the Claude
// daily alert; null otherwise and for members.
export type ClaudeAlert = { spentUsd: number; thresholdUsd: number };

// timeZone: the IANA zone every time in this workspace is shown in (saved by
// an owner, else suggested from the approved Brand DNA, else UTC). country:
// the workspace's own country (the saved zone's, else the Brand DNA's), or
// null; phones from it show in national format, others in international.
export type WorkspaceSummary = { id: string; name: string; slug: string; role: Role; claudeAlert: ClaudeAlert | null; timeZone: string; country: string | null };

// GET /api/w/:workspaceId/settings; PATCH (owner) with { timeZone: string | null }.
export type WorkspaceSettingsResponse = {
  timeZone: string;
  saved: string | null;
  suggested: { timeZone: string; from: string } | null;
  // The workspace's country and its zones, listed first in the picker.
  country: { code: string; name: string; timeZones: string[] } | null;
};

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
