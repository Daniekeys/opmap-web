import type { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES, type SessionCheck } from "./session";

const apiUrl = () => (process.env.API_URL ?? "").replace(/\/$/, "");

// Expire every Better Auth cookie on this host (they are host-only, path /).
// __Secure- names can only be set with Secure, and Secure is right on https.
export function clearAuthCookies(response: NextResponse, request: NextRequest) {
  const https = request.nextUrl.protocol === "https:";
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: https || name.startsWith("__Secure-") });
  }
}

// Ask the API whether this request's cookie is a live session. 401 means no
// session (expired, revoked or garbage); anything else that isn't a 200, or no
// answer within 5 seconds, is unknown.
export async function checkSession(request: NextRequest): Promise<SessionCheck & { setCookies?: string[] }> {
  try {
    const res = await fetch(`${apiUrl()}/api/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401) return { kind: "invalid" };
    if (!res.ok) return { kind: "unknown" };
    return { kind: "valid", me: await res.json(), setCookies: res.headers.getSetCookie() };
  } catch {
    return { kind: "unknown" };
  }
}

// Revoke the session on the API (Better Auth deletes it from the database).
// The API checks Origin on cookie requests, so this server call sends the
// browser's own origin, which the API trusts (WEB_ORIGIN).
export async function revokeSession(request: NextRequest, origin: string) {
  try {
    const res = await fetch(`${apiUrl()}/api/auth/sign-out`, {
      method: "POST",
      headers: { cookie: request.headers.get("cookie") ?? "", "content-type": "application/json", origin },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
