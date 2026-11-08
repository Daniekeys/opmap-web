// The signed-in check for "/" and "/start", and the cookies sign out clears.
// Plain logic, so the proxy, the sign-out route and the tests share it.

// Better Auth's cookies. Behind https (BETTER_AUTH_URL on Vercel) they carry
// the __Secure- prefix; on http (local) they don't. A browser can hold both if
// the API's URL ever changed, so sign out clears every name.
const AUTH_COOKIE_BASES = ["better-auth.session_token", "better-auth.session_data", "better-auth.dont_remember"];
export const AUTH_COOKIES = AUTH_COOKIE_BASES.flatMap((name) => [name, `__Secure-${name}`]);
export const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

export type Me = { workspaces: { slug: string }[]; canCreateWorkspaces: boolean };

// What the API said about the cookie: a valid session (with the user's
// workspaces), no session (401: expired, revoked, garbage), or no answer.
export type SessionCheck = { kind: "valid"; me: Me } | { kind: "invalid" } | { kind: "unknown" };

export type EntryDecision =
  | { type: "landing"; clearCookies: boolean }
  | { type: "page" }
  | { type: "redirect"; to: string; clearCookies: boolean };

// Where a signed-in user starts: their first workspace, or (platform owner
// with none) making one. null: no workspace and can't make one ("/start" says so).
export function homeFor(me: Me): string | null {
  if (me.workspaces[0]) return `/w/${me.workspaces[0].slug}`;
  if (me.canCreateWorkspaces) return "/workspaces/new";
  return null;
}

// "/" and "/start" never send anyone to /login. Only the API's answer counts,
// never a cookie being present; a cookie the API rejects is cleared.
//   "/":      valid -> their workspace (or /start); anything else -> landing.
//   "/start": valid -> their workspace, or the "no workspace yet" page;
//             anything else -> "/" (which then shows the landing: no loop).
export function decideEntry(pathname: "/" | "/start", hasCookie: boolean, check: SessionCheck | null): EntryDecision {
  if (!hasCookie || !check) return pathname === "/" ? { type: "landing", clearCookies: false } : { type: "redirect", to: "/", clearCookies: false };
  if (check.kind === "valid") {
    const home = homeFor(check.me);
    if (home) return { type: "redirect", to: home, clearCookies: false };
    return pathname === "/" ? { type: "redirect", to: "/start", clearCookies: false } : { type: "page" };
  }
  const clearCookies = check.kind === "invalid";
  return pathname === "/" ? { type: "landing", clearCookies } : { type: "redirect", to: "/", clearCookies };
}
