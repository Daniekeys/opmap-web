// Mirrors opmap-api/src/modules/access/routes.ts
// (row shapes from src/modules/access/service.ts and repo.ts, the user from
// src/auth/middleware.ts). The API has no Zod schema for these responses yet.

export type Role = "owner" | "member";

export type AuthedUser = { id: string; name: string; email: string };

export type WorkspaceSummary = { id: string; name: string; slug: string; role: Role };

// GET /api/me
export type MeResponse = { user: AuthedUser; workspaces: WorkspaceSummary[] };

export type Member = { userId: string; name: string; email: string; role: Role };

// GET /api/w/:workspaceId/members
export type MembersResponse = { members: Member[] };
