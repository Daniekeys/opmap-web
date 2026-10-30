import { describe, expect, it } from "vitest";
import type { Fact } from "@/lib/api-types/brand";
import { approveNote, pageName, pagesRead, reviewFinding, siteMismatch } from "./review";

const fact = (kind: Fact["kind"], status: Fact["status"] = "pending", possiblyStale = false) => ({ kind, status, possiblyStale });

describe("review finding", () => {
  it("leads with facts that may be out of date, named by kind when they share one", () => {
    expect(reviewFinding([fact("service", "pending", true), fact("service"), fact("tone")], "website")).toBe(
      "One service on your site may be out of date. Only facts you approve go into messages.",
    );
    expect(reviewFinding([fact("service", "pending", true), fact("service", "pending", true)], "website")).toBe(
      "2 services on your site may be out of date. Only facts you approve go into messages.",
    );
    expect(reviewFinding([fact("service", "pending", true), fact("location", "pending", true)], "description")).toBe(
      "2 facts in your description may be out of date. Only facts you approve go into messages.",
    );
  });

  it("stops counting a flagged fact once it is decided", () => {
    expect(reviewFinding([fact("service", "rejected", true), fact("tone"), fact("tone")], "website")).toBe(
      "2 facts left to review. Only facts you approve go into messages.",
    );
    expect(reviewFinding([fact("service", "approved", true), fact("tone", "rejected")], "website")).toBe(
      "All 2 facts are decided. Only the ones you approved go into messages.",
    );
  });

  it("says what to do when nothing was found", () => {
    expect(reviewFinding([], "website")).toMatch(/Add the facts you want by hand/);
  });
});

describe("website mismatch", () => {
  const site = (website: string | null, source: "website" | "description" = "website") => ({ source, website });

  it("leads the finding when the draft was read from another site than the approved version", () => {
    const mismatch = siteMismatch(site("https://www.enattafoundation.org/"), site("https://daniekeysstudios.com"));
    expect(mismatch).toBe(
      "This version was read from enattafoundation.org, but your approved one came from daniekeysstudios.com. Check you meant to switch.",
    );
    expect(reviewFinding([fact("service", "pending", true)], "website", mismatch)).toBe(
      "This version was read from enattafoundation.org, but your approved one came from daniekeysstudios.com. Check you meant to switch. One service on your site may be out of date. Only facts you approve go into messages.",
    );
  });

  it("says nothing for the same site, www or not, a description, or no approved version", () => {
    expect(siteMismatch(site("https://www.daniekeysstudios.com/about"), site("https://daniekeysstudios.com"))).toBeNull();
    expect(siteMismatch(site(null, "description"), site("https://daniekeysstudios.com"))).toBeNull();
    expect(siteMismatch(site("https://enattafoundation.org"), site(null, "description"))).toBeNull();
    expect(siteMismatch(site("https://enattafoundation.org"), null)).toBeNull();
    expect(reviewFinding([fact("tone")], "website", null)).toBe("One fact left to review. Only facts you approve go into messages.");
  });
});

describe("page names", () => {
  it("names a page by the last part of its address", () => {
    expect(pageName("https://daniekeysstudios.com/")).toBe("home");
    expect(pageName("https://daniekeysstudios.com")).toBe("home");
    expect(pageName("https://daniekeysstudios.com/services/")).toBe("services");
    expect(pageName("https://site.com/work/case-studies/bakery_rebrand.html?x=1")).toBe("bakery rebrand");
    expect(pageName("https://site.com/About%20Us")).toBe("about us");
    expect(pageName("not a url")).toBe("not a url");
  });

  it("lists up to six names, then how many more", () => {
    const at = "2026-10-28T10:00:00Z";
    const pages = (...paths: string[]) => paths.map((p) => ({ url: `https://site.com${p}` }));
    expect(pagesRead(pages("/", "/about", "/services"), at)).toBe("3 pages on 28 Oct: home, about and services.");
    expect(pagesRead(pages("/"), at)).toBe("1 page on 28 Oct: home.");
    expect(pagesRead(pages("/", "/a", "/b", "/c", "/d", "/e", "/f", "/g", "/h"), at)).toBe(
      "9 pages on 28 Oct: home, a, b, c, d, e and 3 more.",
    );
    expect(pagesRead([], at)).toBe("On 28 Oct.");
  });
});

describe("approve note", () => {
  it("says which version approving replaces", () => {
    expect(approveNote(2)).toBe("Approving replaces version 2 in messages written from now on.");
    expect(approveNote(null)).toBe("Approving makes it the version used in messages written from now on.");
  });
});
