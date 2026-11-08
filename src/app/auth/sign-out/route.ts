import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, revokeSession } from "@/lib/auth-cookies";
import { SESSION_COOKIES } from "@/lib/session";

// Sign out: revoke the session on the API (Better Auth deletes it, so the
// token is dead even if a copy survives somewhere), then expire every Better
// Auth cookie on this host, with and without the __Secure- prefix. The cookies
// are cleared even if the API can't be reached, so this browser is signed out
// either way; `revoked` says whether the server-side session went too.
export async function POST(request: NextRequest) {
  // Same-origin only, so another site can't sign people out.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || URL.canParse(origin) === false || new URL(origin).host !== host) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const revoked = hasSession ? await revokeSession(request, origin) : true;
  const response = NextResponse.json({ revoked }, { headers: { "Cache-Control": "no-store" } });
  clearAuthCookies(response, request);
  return response;
}
