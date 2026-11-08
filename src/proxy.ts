import { type NextRequest, NextResponse } from "next/server";
import { checkSession, clearAuthCookies } from "@/lib/auth-cookies";
import { decideEntry, SESSION_COOKIES } from "@/lib/session";

// "/" and "/start" are decided by the API's answer, never by a cookie being
// there: a valid session goes to its workspace; no session, an expired, revoked
// or garbage one shows the landing page (and the dead cookie is cleared). They
// never send anyone to /login. See decideEntry in src/lib/session.ts.
//
// Every other app route: no cookie means signed out, so go to login before
// anything renders. A cookie that is present but expired gets past here and is
// caught by getMe() in src/lib/api.ts, which asks the API.
export async function proxy(request: NextRequest) {
  const hasCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const { pathname, search } = request.nextUrl;

  if (pathname === "/" || pathname === "/start") {
    const check = hasCookie ? await checkSession(request) : null;
    const decision = decideEntry(pathname, hasCookie, check);
    const response =
      decision.type === "redirect"
        ? NextResponse.redirect(new URL(decision.to, request.url))
        : NextResponse.next();
    if (decision.type === "redirect") response.headers.set("Cache-Control", "private, no-store");
    if (decision.type !== "page" && decision.clearCookies) clearAuthCookies(response, request);
    // Better Auth may refresh the session's expiry on /api/me; pass that on.
    if (check?.kind === "valid") for (const c of check.setCookies ?? []) response.headers.append("set-cookie", c);
    return response;
  }
  if (hasCookie) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

// Every app route except the ones opened signed out: login, invite links, the
// privacy page, sign out, and the files crawlers and link previews fetch.
// /api/* is forwarded to opmap-api, which does its own session check.
export const config = {
  matcher: [
    "/((?!api/|login$|privacy$|invite/|auth/sign-out$|robots\\.txt$|sitemap\\.xml$|icon|apple-icon|opengraph-image|twitter-image|_next/static|_next/image|favicon.ico).*)",
  ],
};
