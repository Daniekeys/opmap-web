import { type NextRequest, NextResponse } from "next/server";

// Better Auth's session cookie. It gets the __Secure- prefix when the API's
// BETTER_AUTH_URL is https.
const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

// Optimistic check only: no cookie means signed out, so go to login before
// anything renders. A cookie that is present but expired gets past here and is
// caught by getMe() in src/lib/api.ts, which asks the API.
export function proxy(request: NextRequest) {
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) return NextResponse.next();

  const login = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  login.pathname = "/login";
  login.search = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(login);
}

// Every app route except login. /api/* is forwarded to opmap-api, which does
// its own session check.
export const config = {
  matcher: ["/((?!api/|login$|_next/static|_next/image|favicon.ico).*)"],
};
