import { describe, expect, it } from "vitest";
import type { Lead } from "./api-types/leads";
import {
  formatPhone,
  hasAnyContact,
  hasPhoneOrWhatsapp,
  labelText,
  pausedUntil,
  previewQuery,
  readSettings,
  resumeDue,
  sameSettings,
  settingsDraft,
  statusText,
  whatsappHref,
} from "./leads";

const lead = (contacts: Partial<Lead["contacts"]>): Lead => ({
  leadId: "l",
  businessId: "b",
  name: "Mix n Bake",
  category: "bakery",
  city: "Ilorin",
  rating: null,
  reviewCount: null,
  fit: { score: 1, verdict: "match", reason: null },
  buyer: null,
  promoted: false,
  researched: false,
  contacts: { phone: null, whatsapp: null, email: null, website: null, person: null, socials: [], ...contacts },
});

describe("contact labels in plain words", () => {
  it("says why, for every label the API sends", () => {
    expect(labelText("phone", "single_source")).toMatchObject({ word: "Single source", tip: "one place listed this number" });
    expect(labelText("phone", "confirmed").tip).toBe("two separate places listed this number");
    expect(labelText("whatsapp", "likely").word).toBe("Likely");
    expect(labelText("email", "guessed")).toMatchObject({ word: "Guessed", tone: "weak" });
    expect(labelText("website", "dead").tip).toContain("6 hours apart");
    expect(labelText("social", "verified").word).toBe("Verified");
  });

  it("never hides an unknown label", () => {
    expect(labelText("email", "brand_new")).toMatchObject({ word: "brand new" });
  });
});

describe("phones", () => {
  it("writes Nigerian numbers the local way and links WhatsApp by digits", () => {
    expect(formatPhone("+2348033718771")).toBe("0803 371 8771");
    expect(formatPhone("+447700900123")).toBe("+447700900123");
    expect(whatsappHref("+2348033718771")).toBe("https://wa.me/2348033718771");
    // A wa.me/message link has no number: linked as it is.
    expect(whatsappHref("https://wa.me/message/EO2NVG7LHIROG1")).toBe("https://wa.me/message/EO2NVG7LHIROG1");
    expect(formatPhone("https://wa.me/message/EO2NVG7LHIROG1")).toBe("WhatsApp link");
  });

  it("filters leads with a phone or WhatsApp, and spots leads with no contact at all", () => {
    const phone = { value: "+2348033718771", label: "single_source", sources: [] };
    expect(hasPhoneOrWhatsapp(lead({ whatsapp: phone }))).toBe(true);
    expect(hasPhoneOrWhatsapp(lead({ email: { value: "a@b.ng", label: "found", sources: [] } }))).toBe(false);
    expect(hasAnyContact(lead({}))).toBe(false);
    expect(hasAnyContact(lead({ socials: [{ kind: "instagram", value: "https://instagram.com/x", label: "single_source", sources: [] }] }))).toBe(true);
  });
});

describe("campaign status", () => {
  const now = new Date("2026-10-25T15:00:00Z"); // 16:00 in Lagos

  it("shows a cap pause as paused until tomorrow, in Lagos time", () => {
    // Pacific midnight is 08:00 in Lagos.
    expect(pausedUntil("2026-10-26T07:00:00Z", now)).toBe("tomorrow, 08:00");
    expect(statusText({ status: "paused", resumeAt: "2026-10-26T07:00:00Z" }, now)).toBe("Paused until tomorrow, 08:00");
    expect(statusText({ status: "done", resumeAt: null }, now)).toBe("Complete");
  });

  it("offers Resume search only once the resume time has passed", () => {
    expect(resumeDue("2026-10-25T14:59:59Z", now)).toBe(true);
    expect(resumeDue("2026-10-25T15:00:00Z", now)).toBe(true);
    expect(resumeDue("2026-10-26T07:00:00Z", now)).toBe(false);
    expect(resumeDue(null, now)).toBe(false);
    expect(statusText({ status: "paused", resumeAt: "2026-10-25T14:00:00Z" }, now)).toBe("Paused, limit lifted");
  });
});

describe("search settings form", () => {
  const saved = { maxCalls: null, dailyCalls: 5, pagesPerTile: 3, extrasPerCity: 3 };

  it("round-trips settings, with an empty box for no limit", () => {
    const draft = settingsDraft(saved);
    expect(draft).toEqual({ maxCalls: "", dailyCalls: "5", pagesPerTile: "3", extrasPerCity: "3" });
    expect(readSettings(draft, 20)).toEqual({ settings: saved });
    expect(readSettings({ ...draft, maxCalls: " 150 " }, 20)).toEqual({ settings: { ...saved, maxCalls: 150 } });
  });

  it("refuses limits that aren't whole numbers in range, and a pace above the shared cap", () => {
    const draft = settingsDraft(saved);
    expect(readSettings({ ...draft, maxCalls: "0" })).toHaveProperty("error");
    expect(readSettings({ ...draft, maxCalls: "2.5" })).toHaveProperty("error");
    expect(readSettings({ ...draft, dailyCalls: "21" }, 20)).toEqual({ error: expect.stringContaining("from 1 to 20, the shared Google limit") });
    // Without the cap known, the API checks it.
    expect(readSettings({ ...draft, dailyCalls: "21" })).toEqual({ settings: { ...saved, dailyCalls: 21 } });
  });

  it("compares settings and builds the estimate preview query", () => {
    expect(sameSettings(saved, { ...saved })).toBe(true);
    expect(sameSettings(saved, { ...saved, pagesPerTile: 1 })).toBe(false);
    expect(previewQuery(saved)).toBe("maxCalls=none&dailyCalls=5&pagesPerTile=3&extrasPerCity=3");
  });

  it("names a stopped campaign", () => {
    expect(statusText({ status: "stopped", resumeAt: null })).toBe("Stopped");
  });
});
