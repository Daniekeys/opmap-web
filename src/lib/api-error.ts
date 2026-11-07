// An API failure on its way to an error screen (error.tsx). In production Next
// replaces a Server Component error's message with a generic one, but keeps a
// `digest` the error already has, so the status and the API's request id
// travel there: "opmap-api:<status>:<request id or ->". Status 0: the API
// couldn't be reached.
const PREFIX = "opmap-api";

export type ApiFailureInfo = { status: number | null; requestId: string | null };

export function apiFailure(status: number, path: string, requestId: string | null) {
  const what = status === 0 ? `API unreachable for ${path}` : `API answered ${status} for ${path}`;
  const error = new Error(requestId ? `${what} (request ${requestId})` : what) as Error & { digest: string };
  error.digest = `${PREFIX}:${status}:${requestId ?? "-"}`;
  return error;
}

export function readApiError(error: unknown): ApiFailureInfo {
  const digest = typeof error === "object" && error !== null && "digest" in error ? (error as { digest: unknown }).digest : null;
  const match = typeof digest === "string" ? /^opmap-api:(\d+):([^:]+)$/.exec(digest) : null;
  if (!match) return { status: null, requestId: null };
  return { status: Number(match[1]), requestId: match[2] === "-" ? null : match[2]! };
}

export function errorScreenText({ status }: ApiFailureInfo) {
  const title = "This page didn't load";
  if (status === null) return { title, body: "Something on this page went wrong." };
  if (status === 0) return { title, body: "The server isn't answering. It may be starting up or stopped." };
  if (status === 500) return { title, body: "The server ran into a problem loading it. The error has been logged." };
  return { title, body: `The server answered with an error (${status}).` };
}
