import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { MeResponse, MembersResponse } from "./api-types/access";
import type { PipelineRunsResponse } from "./api-types/pipeline";

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