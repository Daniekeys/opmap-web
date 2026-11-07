import { describe, expect, it } from "vitest";
import { copyPasteChip, matchesTailoring, TAILORING, tailoringCounts, tailoringSummary, whatsappChatHref } from "./tailoring";

const lead = (tailoring: "tailored" | "general" | null) => ({ tailoring });

describe("Tailored and General", () => {
  it("names each kind in plain words, with what it means", () => {
    expect(TAILORING.tailored.word).toBe("Tailored");
    expect(TAILORING.tailored.title).toBe("Messages rest on a specific, sourced gap from this business's own pages or listing.");
    expect(TAILORING.general.word).toBe("General");
    expect(TAILORING.general.title).toBe("No specific gap was found or kept: messages use the business's basics and your general offer.");
  });

  it("counts the campaign's leads and says it in one line", () => {
    const leads = [...Array(12)].map(() => lead("tailored")).concat([...Array(8)].map(() => lead("general")), [lead(null)]);
    expect(tailoringCounts(leads)).toEqual({ tailored: 12, general: 8 });
    expect(tailoringSummary(tailoringCounts(leads))).toBe("12 Tailored, 8 General");
    expect(tailoringSummary({ tailored: 0, general: 0 })).toBeNull();
    expect(tailoringSummary({ tailored: 1, general: 0 })).toBe("1 Tailored, 0 General");
  });

  it("filters the list by kind", () => {
    expect(matchesTailoring(lead("tailored"), "tailored")).toBe(true);
    expect(matchesTailoring(lead("general"), "tailored")).toBe(false);
    expect(matchesTailoring(lead(null), "general")).toBe(false);
    expect(matchesTailoring(lead(null), "all")).toBe(true);
  });
});

describe("a channel with nowhere to send", () => {
  it("still has its draft, with a copy-and-paste chip naming what's missing", () => {
    expect(copyPasteChip("linkedin")).toBe("Copy and paste, no LinkedIn page found");
    expect(copyPasteChip("email")).toBe("Copy and paste, no email found");
    expect(copyPasteChip("whatsapp")).toBe("Copy and paste, no WhatsApp found");
    expect(copyPasteChip("call")).toBe("Copy and paste, no phone number found");
  });
});

describe("Chat on WhatsApp", () => {
  it("opens wa.me with the WhatsApp draft prefilled, or the bare chat when there is none", () => {
    expect(whatsappChatHref("+2348030001111", "Hello Tech365,\n\nI came across you.")).toBe("https://wa.me/2348030001111?text=Hello%20Tech365%2C%0A%0AI%20came%20across%20you.");
    expect(whatsappChatHref("+2348030001111", null)).toBe("https://wa.me/2348030001111");
  });
});
