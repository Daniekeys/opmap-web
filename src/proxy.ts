import { type NextRequest, NextResponse } from "next/server";

// Better Auth's session cookie. It gets the __Secure- prefix when the API's
// BETTER_AUTH_URL is https.
const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

// Optimistic check only: no cookie means signed out, so go to login before
// anything renders. A cookie that is present but expired gets past here and is
// caught by getMe() in src/lib/api.ts, which asks the API.
// "/" is the public landing page when signed out; with a cookie it is served
// by /start, which sends the user on to their workspace.
export function proxy(request: NextRequest) {
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    return signedIn ? NextResponse.rewrite(new URL("/start", request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

// Every app route except login, invite links and the privacy page, which are
// opened signed out. /api/* is forwarded to opmap-api, which does its own
// session check.
export const config = {
  matcher: ["/((?!api/|login$|privacy$|invite/|_next/static|_next/image|favicon.ico).*)"],
};
