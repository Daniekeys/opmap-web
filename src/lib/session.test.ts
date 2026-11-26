import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as signOut } from "@/app/auth/sign-out/route";
import { proxy } from "@/proxy";
import { AUTH_COOKIES, decideEntry, homeFor } from "./session";

const valid = (slugs: string[], canCreateWorkspaces = false) =>
  ({ kind: "valid", me: { workspaces: slugs.map((slug) => ({ slug })), canCreateWorkspaces } }) as const;

describe("decideEntry: / and /start never send anyone to /login", () => {
  it("fresh browser (no cookie): / is the landing page, /start goes to /", () => {
    expect(decideEntry("/", false, null)).toEqual({ type: "landing", clearCookies: false });
    expect(decideEntry("/start", false, null)).toEqual({ type: "redirect", to: "/", clearCookies: false });
  });

  it("signed in: both go to the first workspace", () => {
    expect(decideEntry("/", true, valid(["afriment", "daniekeys"]))).toEqual({ type: "redirect", to: "/w/afriment", clearCookies: false });
    expect(decideEntry("/start", true, valid(["afriment"]))).toEqual({ type: "redirect", to: "/w/afriment", clearCookies: false });
  });

  it("signed in with no workspace: the platform owner makes one, anyone else sees /start", () => {
    expect(decideEntry("/", true, valid([], true))).toEqual({ type: "redirect", to: "/workspaces/new", clearCookies: false });
    expect(decideEntry("/", true, valid([]))).toEqual({ type: "redirect", to: "/start", clearCookies: false });
    expect(decideEntry("/start", true, valid([]))).toEqual({ type: "page" });
  });

  it("expired, garbage or revoked cookie (the API answers 401): landing, and the cookie is cleared", () => {
    expect(decideEntry("/", true, { kind: "invalid" })).toEqual({ type: "landing", clearCookies: true });
    expect(decideEntry("/start", true, { kind: "invalid" })).toEqual({ type: "redirect", to: "/", clearCookies: true });
  });

  it("API unreachable: landing, cookie kept for when it is back", () => {
    expect(decideEntry("/", true, { kind: "unknown" })).toEqual({ type: "landing", clearCookies: false });
    expect(decideEntry("/start", true, { kind: "unknown" })).toEqual({ type: "redirect", to: "/", clearCookies: false });
  });

  it("can't loop: /start only ever redirects to / or a workspace, and / never to /start without a valid session", () => {
    for (const check of [null, { kind: "invalid" } as const, { kind: "unknown" } as const]) {
      const fromHome = decideEntry("/", check !== null, check);
      expect(fromHome.type).toBe("landing");
    }
    expect(homeFor({ workspaces: [], canCreateWorkspaces: false })).toBeNull();
  });
});

// The proxy and the sign-out route against a mocked API.
const req = (path: string, init: { cookie?: string; method?: string; origin?: string } = {}) =>
  new NextRequest(`https://opmap.test${path}`, {
    method: init.method ?? "GET",
    headers: {
      host: "opmap.test",
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...(init.origin ? { origin: init.origin } : {}),
    },
  });

const api = (status: number, body: unknown = {}) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })));

const cleared = (res: Response) =>
  res.headers.getSetCookie().filter((c) => /Max-Age=0/i.test(c)).map((c) => c.split("=")[0]);

const SESSION = "__Secure-better-auth.session_token=abc.def";

describe("proxy on / and /start", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fresh browser: / passes through to the landing page without asking the API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await proxy(req("/"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("signed in: / redirects to the workspace, not cached", async () => {
    api(200, { workspaces: [{ slug: "afriment" }], canCreateWorkspaces: false });
    const res = await proxy(req("/", { cookie: SESSION }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://opmap.test/w/afriment");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  for (const [name, cookie] of [
    ["expired cookie", SESSION],
    ["garbage cookie", "__Secure-better-auth.session_token=garbage"],
    ["revoked session", SESSION],
    ["old non-secure cookie", "better-auth.session_token=old.token"],
  ] as const) {
    it(`${name}: / shows the landing page and clears every auth cookie`, async () => {
      api(401, { error: { code: "unauthenticated" } });
      const res = await proxy(req("/", { cookie }));
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(res.headers.get("location")).toBeNull();
      expect(cleared(res).sort()).toEqual([...AUTH_COOKIES].sort());
    });
  }

  it("after sign out (no cookie left): / is the landing page", async () => {
    const res = await proxy(req("/"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("/start with no valid session goes to /, never /login", async () => {
    api(401);
    const withCookie = await proxy(req("/start", { cookie: SESSION }));
    expect(withCookie.headers.get("location")).toBe("https://opmap.test/");
    const noCookie = await proxy(req("/start"));
    expect(noCookie.headers.get("location")).toBe("https://opmap.test/");
  });

  it("API down: / still shows the landing page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const res = await proxy(req("/", { cookie: SESSION }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("other app routes without a cookie still go to login", async () => {
    const res = await proxy(req("/w/afriment/campaigns"));
    expect(res.headers.get("location")).toBe("https://opmap.test/login?next=%2Fw%2Fafriment%2Fcampaigns");
  });
});

describe("sign out route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("revokes the session on the API with the browser's origin and clears all six cookies", async () => {
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await signOut(req("/auth/sign-out", { method: "POST", cookie: SESSION, origin: "https://opmap.test" }));
    expect(await res.json()).toEqual({ revoked: true });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/auth\/sign-out$/);
    expect((init.headers as Record<string, string>).cookie).toBe(SESSION);
    expect((init.headers as Record<string, string>).origin).toBe("https://opmap.test");
    expect(cleared(res).sort()).toEqual([...AUTH_COOKIES].sort());
    for (const c of res.headers.getSetCookie()) expect(c).toMatch(/Path=\//);
    expect(res.headers.getSetCookie().filter((c) => c.startsWith("__Secure-")).every((c) => /Secure/.test(c))).toBe(true);
  });

  it("clears the cookies even when the API can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const res = await signOut(req("/auth/sign-out", { method: "POST", cookie: SESSION, origin: "https://opmap.test" }));
    expect(await res.json()).toEqual({ revoked: false });
    expect(cleared(res)).toHaveLength(AUTH_COOKIES.length);
  });

  it("refuses another site's request", async () => {
    const res = await signOut(req("/auth/sign-out", { method: "POST", cookie: SESSION, origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });
});
