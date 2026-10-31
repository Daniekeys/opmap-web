import { describe, expect, it } from "vitest";
import type { PipelineLead, PipelineResponse } from "./api-types/outcomes";
import { dayText, pipelineFinding, whenLine } from "./pipeline";

// 31 Oct 2026, 14:00 in Lagos.
const NOW = new Date("2026-10-31T13:00:00Z");

const lead = (over: Partial<PipelineLead> = {}): PipelineLead => ({
  leadId: "l1",
  businessId: "b1",
  name: "A Bakes",
  city: "Ilorin",
  category: "bakery",
  stage: "sent",
  offer: "A website",
  optedOut: false,
  lastOutcome: { type: "sent", channel: "whatsapp", note: null, createdAt: "2026-10-31T08:00:00Z" },
  ...over,
});

describe("pipeline words", () => {
  it("names the day by Lagos time", () => {
    expect(dayText("2026-10-31T00:30:00Z", NOW)).toBe("today");
    // 23:30 UTC on the 30th is 00:30 on the 31st in Lagos.
    expect(dayText("2026-10-30T23:30:00Z", NOW)).toBe("today");
    expect(dayText("2026-10-30T10:00:00Z", NOW)).toBe("yesterday");
    expect(dayText("2026-10-28T10:00:00Z", NOW)).toBe("28 Oct");
  });

  it("says what happened and when, or the note, and an opt-out over everything", () => {
    expect(whenLine(lead(), NOW)).toEqual({ text: "Sent today, WhatsApp", tone: "muted" });
    expect(whenLine(lead({ lastOutcome: { type: "sent", channel: "call", note: null, createdAt: "2026-10-26T10:00:00Z" } }), NOW).text).toBe("Called 26 Oct");
    expect(whenLine(lead({ stage: "replied", lastOutcome: { type: "replied", channel: "whatsapp", note: null, createdAt: "2026-10-31T09:00:00Z" } }), NOW)).toEqual({ text: "Replied today", tone: "accent" });
    expect(whenLine(lead({ stage: "won", lastOutcome: { type: "won", channel: null, note: null, createdAt: "2026-10-24T09:00:00Z" } }), NOW)).toEqual({ text: "Won 24 Oct", tone: "positive" });
    const lost = { type: "lost", channel: null, note: "Not now. Try again in January", createdAt: "2026-10-29T09:00:00Z" };
    expect(whenLine(lead({ stage: "lost", lastOutcome: lost }), NOW)).toEqual({ text: "Not now. Try again in January", tone: "muted" });
    expect(whenLine(lead({ stage: "lost", optedOut: true, lastOutcome: lost }), NOW)).toEqual({ text: "Asked us to stop", tone: "muted" });
  });

  it("states the reply count, and who replied last", () => {
    const stages = (leads: PipelineLead[]): PipelineResponse["stages"] => [{ stage: "replied", count: leads.length, leads }];
    expect(pipelineFinding({ messaged: 0, replied: 0, meeting: 0, won: 0 }, [], NOW)).toBe("No one has been messaged yet.");
    expect(pipelineFinding({ messaged: 9, replied: 0, meeting: 0, won: 0 }, [], NOW)).toBe("0 of 9 replied.");
    const replied = lead({ name: "Adewole Cake Studio", stage: "replied", lastOutcome: { type: "replied", channel: "whatsapp", note: null, createdAt: "2026-10-31T09:00:00Z" } });
    expect(pipelineFinding({ messaged: 9, replied: 3, meeting: 1, won: 1 }, stages([replied]), NOW)).toBe("3 of 9 replied. Adewole Cake Studio replied today.");
  });
});
