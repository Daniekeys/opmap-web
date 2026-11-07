import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFailure, errorScreenText, readApiError } from "./api-error";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "session=abc" }) }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { to });
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("API failures on the error screen", () => {
  it("carries the status and request id in the digest, which Next keeps in production", () => {
    const error = apiFailure(500, "/api/w/w1/campaigns", "3f9c2a7b1e04");
    expect(error.digest).toBe("opmap-api:500:3f9c2a7b1e04");
    expect(error.message).toBe("API answered 500 for /api/w/w1/campaigns (request 3f9c2a7b1e04)");
    // In production Next replaces the message; the digest is what arrives.
    expect(readApiError({ message: "An error occurred in the Server Components render.", digest: error.digest })).toEqual({ status: 500, requestId: "3f9c2a7b1e04" });
    expect(readApiError(apiFailure(0, "/api/me", null))).toEqual({ status: 0, requestId: null });
    expect(readApiError({ message: "boom", digest: "1234567" })).toEqual({ status: null, requestId: null });
    expect(readApiError("not an error")).toEqual({ status: null, requestId: null });
  });

  it("says what happened in plain words", () => {
    expect(errorScreenText({ status: 500, requestId: "3f9c2a7b1e04" })).toEqual({
      title: "This page didn't load",
      body: "The server ran into a problem loading it. The error has been logged.",
    });
    expect(errorScreenText({ status: 0, requestId: null }).body).toBe("The server isn't answering. It may be starting up or stopped.");
    expect(errorScreenText({ status: 503, requestId: null }).body).toBe("The server answered with an error (503).");
    expect(errorScreenText({ status: null, requestId: null }).body).toBe("Something on this page went wrong.");
  });
});

describe("apiGet", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.API_URL = "http://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

  it("passes a 500's request id through to the error", async () => {
    const { listCampaigns } = await import("./api");
    fetchMock.mockResolvedValueOnce(
      json(500, { error: { code: "internal", message: "Something went wrong", requestId: "3f9c2a7b1e04" } }, { "x-request-id": "3f9c2a7b1e04" }),
    );
    const error = await listCampaigns("w-500").catch((e: unknown) => e);
    expect(readApiError(error)).toEqual({ status: 500, requestId: "3f9c2a7b1e04" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/w/w-500/campaigns", expect.objectContaining({ headers: { cookie: "session=abc" } }));
  });

  it("reads the id from the body when the header is missing, and says when the server can't be reached", async () => {
    const { listCampaigns } = await import("./api");
    fetchMock.mockResolvedValueOnce(json(500, { error: { code: "internal", message: "Something went wrong", requestId: "aaaabbbbcccc" } }));
    expect(readApiError(await listCampaigns("w-body").catch((e: unknown) => e))).toEqual({ status: 500, requestId: "aaaabbbbcccc" });

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(readApiError(await listCampaigns("w-down").catch((e: unknown) => e))).toEqual({ status: 0, requestId: null });
  });

  it("keeps the 401 and 404 handling", async () => {
    const { listCampaigns } = await import("./api");
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: "unauthenticated", message: "Sign in" } }));
    await expect(listCampaigns("w-401")).rejects.toMatchObject({ message: "NEXT_REDIRECT", to: "/login" });
    fetchMock.mockResolvedValueOnce(json(404, { error: { code: "not_found", message: "Not found" } }));
    await expect(listCampaigns("w-404")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
