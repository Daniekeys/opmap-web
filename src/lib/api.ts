import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { InviteDescription, MeResponse, MembersResponse, PendingInvitesResponse } from "./api-types/access";
import type { BrandOverviewResponse, ProfileDetailResponse } from "./api-types/brand";
import type { ApiErrorResponse } from "./api-types/errors";
import type { CampaignDetailResponse, CampaignsResponse, EstimateResponse, LeadsResponse } from "./api-types/leads";
import type { PipelineRunsResponse } from "./api-types/pipeline";
import type { PipelineResponse } from "./api-types/outcomes";
import type { LeadOutreachResponse } from "./api-types/outreach";
import type { LeadResearchResponse } from "./api-types/research";

// Every read goes to opmap-api with the caller's own cookie. Nothing here uses
// `use cache`, so nothing is stored on the server or shared between users.
// Reading cookies() makes the caller request-time, which is why every component
// that calls these sits inside a <Suspense> boundary.
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API answered ${res.status} for ${path}`);
  return res.json();
}

// The session check for every app route. React's cache() only dedupes calls
// within one request (the shell and the page both ask); it does not persist.
export const getMe = cache(() => apiGet<MeResponse>("/api/me"));

// The active workspace is the slug in the URL. A slug the user is not a member
// of answers 404, the same as the API does.
export async function getWorkspace(slug: string) {
  const { workspaces } = await getMe();
  const workspace = workspaces.find((w) => w.slug === slug);
  if (!workspace) notFound();
  return workspace;
}

export const listMembers = (workspaceId: string) => apiGet<MembersResponse>(`/api/w/${workspaceId}/members`);

export const listPipelineRuns = (workspaceId: string) =>
  apiGet<PipelineRunsResponse>(`/api/w/${workspaceId}/pipeline-runs`);

export const getBrand = (workspaceId: string) => apiGet<BrandOverviewResponse>(`/api/w/${workspaceId}/brand`);

export const getBrandProfile = (workspaceId: string, profileId: string) =>
  apiGet<ProfileDetailResponse>(`/api/w/${workspaceId}/brand/profiles/${encodeURIComponent(profileId)}`);

export const listCampaigns = (workspaceId: string) => apiGet<CampaignsResponse>(`/api/w/${workspaceId}/campaigns`);

const campaignPath = (workspaceId: string, campaignId: string) => `/api/w/${workspaceId}/campaigns/${encodeURIComponent(campaignId)}`;

export const getCampaign = (workspaceId: string, campaignId: string) =>
  apiGet<CampaignDetailResponse>(campaignPath(workspaceId, campaignId));

export const getCampaignLeads = (workspaceId: string, campaignId: string) =>
  apiGet<LeadsResponse>(`${campaignPath(workspaceId, campaignId)}/leads`);

export const getCampaignEstimate = (workspaceId: string, campaignId: string) =>
  apiGet<EstimateResponse>(`${campaignPath(workspaceId, campaignId)}/estimate`);

// Owners only; the API answers 403 to a member.
export const listPendingInvites = (workspaceId: string) =>
  apiGet<PendingInvitesResponse>(`/api/w/${workspaceId}/invites`);

export type InviteProblem = "invite_invalid" | "invite_used" | "invite_expired";

// For the invite page, which the invitee opens signed out: no cookie is sent,
// and a link that can't be used is a state to show, not an error page.
export async function getInvite(
  token: string,
): Promise<{ invite: InviteDescription; problem: null } | { invite: null; problem: InviteProblem }> {
  const res = await fetch(`${process.env.API_URL}/api/invites/${encodeURIComponent(token)}`, { cache: "no-store" });
  if (res.ok) return { invite: await res.json(), problem: null };
  if (res.status === 404 || res.status === 410) {
    const { error }: ApiErrorResponse = await res.json();
    const known: InviteProblem[] = ["invite_invalid", "invite_used", "invite_expired"];
    return { invite: null, problem: known.find((code) => code === error.code) ?? "invite_invalid" };
  }
  throw new Error(`API answered ${res.status} for the invite`);
}

// The lead page: the lead, its deep-dive and its opportunity cards.
export const getLeadResearch = (workspaceId: string, campaignId: string, leadId: string) =>
  apiGet<LeadResearchResponse>(`${campaignPath(workspaceId, campaignId)}/leads/${encodeURIComponent(leadId)}`);

// The lead page's drafts, contact points and outcomes.
export const getLeadOutreach = (workspaceId: string, campaignId: string, leadId: string) =>
  apiGet<LeadOutreachResponse>(`${campaignPath(workspaceId, campaignId)}/leads/${encodeURIComponent(leadId)}/outreach`);

// The campaign's leads by stage.
export const getPipeline = (workspaceId: string, campaignId: string) => apiGet<PipelineResponse>(`${campaignPath(workspaceId, campaignId)}/pipeline`);
