import { describe, expect, it } from "vitest";
import type { Lead } from "./api-types/leads";
import { campaignContext, citeReadAt, contactNote, findingSentence, fitOf, leadMeta, readOn } from "./campaign-view";

const lead = (over: Omit<Partial<Lead>, "contacts"> & { score?: number | null; contacts?: Partial<Lead["contacts"]> } = {}): Lead => {
  const { score = 0.4, contacts, ...rest } = over;
  return {
    leadId: rest.leadId ?? "l",
    businessId: "b",
    name: "Mix n Bake",
    category: "cake_shop",
    city: "Ilorin",
    rating: 4.6,
    reviewCount: 210,
    fit: { score: 1, verdict: "match", reason: null },
    buyer: score === null ? null : { score, topReason: "", reasons: [] },
    promoted: false,
    researched: false,
    ...rest,
    contacts: { phone: null, whatsapp: null, email: null, website: null, person: null, socials: [], ...contacts },
  };
};

const c = (label: string) => ({ value: "+2348030004417", label, sources: [] });

describe("fitOf", () => {
  it("words the buyer score and keeps it as the bar width", () => {
    expect(fitOf(lead({ score: 0.91 }))).toEqual({ word: "Strong fit", strong: true, width: 91 });
    expect(fitOf(lead({ score: 0.7 }))).toMatchObject({ word: "Strong fit", strong: true });
    expect(fitOf(lead({ score: 0.55 }))).toMatchObject({ word: "Good fit", strong: false });
    expect(fitOf(lead({ score: 0.4 }))).toMatchObject({ word: "Fair fit", strong: false, width: 40 });
  });

  it("falls back to the fit check's verdict before the lead is ranked", () => {
    expect(fitOf(lead({ score: null }))).toEqual({ word: "Match", strong: false, width: null });
  });
});

describe("contactNote", () => {
  it("names the best way in, and how sure we are", () => {
    expect(contactNote(lead({ contacts: { whatsapp: c("confirmed"), phone: c("confirmed") } }))).toBe("WhatsApp confirmed");
    expect(contactNote(lead({ contacts: { whatsapp: c("likely") } }))).toBe("WhatsApp likely");
    expect(contactNote(lead({ contacts: { phone: c("single_source") } }))).toBe("Phone, single source");
    expect(contactNote(lead({ contacts: { email: { value: "a@b.ng", label: "guessed", sources: [] } } }))).toBe("Email guessed");
    expect(contactNote(lead())).toBe("No contact found");
  });
});

describe("leadMeta", () => {
  it("is one line: kind and place, rating, contact", () => {
    expect(leadMeta(lead({ contacts: { whatsapp: c("confirmed") } }))).toBe("Cake shop, Ilorin. 4.6 (210). WhatsApp confirmed");
    expect(leadMeta(lead({ category: null, rating: null }))).toBe("Ilorin. No contact found");
  });
});

describe("findingSentence", () => {
  const stages = {};

  it("leads with the strong fits nobody has contacted, and where they are", () => {
    const leads = [
      lead({ leadId: "1", score: 0.9, city: "Ikate" }),
      lead({ leadId: "2", score: 0.8, city: "Ikate" }),
      lead({ leadId: "3", score: 0.75, city: "Osapa" }),
      lead({ leadId: "4", score: 0.72, city: "Agungi" }),
      lead({ leadId: "5", score: 0.4 }),
    ];
    expect(findingSentence({ leads, stages, status: "done", callsUsed: 3 })).toBe("4 strong fits haven't been contacted yet. 3 of them are in Ikate and Osapa.");
  });

  it("skips the place when they are all in one", () => {
    const leads = [lead({ leadId: "1", score: 0.9 }), lead({ leadId: "2", score: 0.8 })];
    expect(findingSentence({ leads, stages, status: "done", callsUsed: 3 })).toBe("2 strong fits haven't been contacted yet.");
    expect(findingSentence({ leads: [leads[0]!], stages, status: "done", callsUsed: 3 })).toBe("1 strong fit hasn't been contacted yet.");
  });

  it("counts what is left when the strong fits are contacted", () => {
    const leads = [lead({ leadId: "1", score: 0.9 }), lead({ leadId: "2" }), lead({ leadId: "3" })];
    expect(findingSentence({ leads, stages: { "1": "sent" }, status: "done", callsUsed: 3 })).toBe("2 of 3 businesses haven't been contacted yet.");
    expect(findingSentence({ leads: [leads[0]!], stages: { "1": "replied" }, status: "done", callsUsed: 3 })).toBe("Every business here has been contacted.");
  });

  it("says what the empty states mean", () => {
    expect(findingSentence({ leads: [], stages, status: "draft", callsUsed: 0 })).toBe("Not searched yet. Confirm the search to find businesses that fit.");
    expect(findingSentence({ leads: [], stages, status: "running", callsUsed: 0 })).toBe("Searching. Businesses that fit show up here as they are checked.");
    expect(findingSentence({ leads: [], stages, status: "done", callsUsed: 3 })).toBe("The search found no businesses that fit.");
  });

  it("says the search hasn't started until a Google search has run, and never 'found none' before it finished", () => {
    // Paused before any search ran (Google off, or a cap reached first).
    expect(findingSentence({ leads: [], stages, status: "paused", callsUsed: 0 })).toBe("The search hasn't started yet.");
    expect(findingSentence({ leads: [], stages, status: "stopped", callsUsed: 0 })).toBe("The search hasn't started yet.");
    // Searched, but not finished: nothing found so far.
    expect(findingSentence({ leads: [], stages, status: "paused", callsUsed: 6 })).toBe("No businesses that fit so far.");
    // Searched, fit checks finished, none fit.
    expect(findingSentence({ leads: [], stages, status: "done", callsUsed: 6 })).toBe("The search found no businesses that fit.");
  });
});

describe("campaignContext", () => {
  const segment = { setId: "set-1", rank: 1, name: "Fast food restaurants", edited: false, searchTerms: [], whyTheyBuy: "", pain: "", pitchFirst: "", buyerSignals: { minReviews: null, minRating: null, website: "any" as const, socials: "any" as const, categories: [] } };
  const area = (name: string) => ({ id: name, name, level: "city" as const, parentName: null, country: "NG", population: null });
  const campaign = {
    segment: "Fast food restaurants",
    buyerSegment: segment,
    locations: [area("Ilorin"), area("Offa")],
    brandProfileVersion: 4,
    startedAt: "2026-10-31T16:05:17Z",
  };
  const brand = { approved: { version: 4 }, versions: [{ id: "p4", version: 4 }, { id: "p3", version: 3 }] };

  it("says who it is for, where, the Brand DNA it was built from and when it started", () => {
    expect(campaignContext(campaign, brand)).toEqual({
      who: "Fast food restaurants",
      where: "Ilorin, Offa",
      brand: { label: "Brand DNA v4", profileId: "p4" },
      started: "Started 31 Oct",
      newer: null,
    });
  });

  it("marks the user's own segment, and a draft as not started", () => {
    const own = campaignContext({ ...campaign, buyerSegment: { ...segment, setId: null, name: "Chop bars near campus" }, startedAt: null }, brand);
    expect([own.who, own.started]).toEqual(["Your own: Chop bars near campus", null]);
    // Made before segments: its typed segment.
    expect(campaignContext({ ...campaign, buyerSegment: null }, brand).who).toBe("Your own: Fast food restaurants");
  });

  it("says in one line when a newer Brand DNA has been approved since", () => {
    const later = campaignContext(campaign, { approved: { version: 5 }, versions: [{ id: "p5", version: 5 }, ...brand.versions] });
    expect(later.newer).toBe("Brand DNA v5 has been approved since. This campaign still uses v4.");
    expect(later.brand).toEqual({ label: "Brand DNA v4", profileId: "p4" });
    expect(campaignContext({ ...campaign, brandProfileVersion: null }, brand)).toMatchObject({ brand: null, newer: null });
  });
});

describe("readOn", () => {
  it("is the day a source was read, in Lagos", () => {
    expect(readOn("2026-10-26T20:06:00Z")).toBe("read 26 Oct");
    expect(readOn(null)).toBe("date not recorded");
  });

  it("dates a quote by its own page's read, else the research's finish time", () => {
    const quote = { kind: "source" as const, ref: "S1", sourceId: "s", url: "https://instagram.com/x", sourceType: "search", quote: "DM to order" };
    expect(citeReadAt({ ...quote, fetchedAt: "2026-10-28T09:00:00Z" }, "2026-10-30T09:00:00Z")).toBe("2026-10-28T09:00:00Z");
    expect(citeReadAt({ ...quote, fetchedAt: null }, "2026-10-30T09:00:00Z")).toBe("2026-10-30T09:00:00Z");
    expect(citeReadAt({ kind: "fact", ref: "F1", factId: "f", text: "Builds websites", url: null }, "2026-10-30T09:00:00Z")).toBeNull();
  });
});
