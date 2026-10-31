import { describe, expect, it } from "vitest";
import type { Draft, DraftLine } from "./api-types/outreach";
import type { OpportunityCard } from "./api-types/research";
import { canMarkSent, draftChecks, gmailHref, outcomeText, outlookHref, sourceReadDates, whatsappSendHref } from "./outreach";

describe("send links", () => {
  it("fills WhatsApp with the draft, digits only in the number", () => {
    expect(whatsappSendHref("+2348030001111", "Hello A Bakes,\n\nA line & more")).toBe("https://wa.me/2348030001111?text=Hello%20A%20Bakes%2C%0A%0AA%20line%20%26%20more");
  });

  it("opens a WhatsApp link with no number as it is", () => {
    expect(whatsappSendHref("https://wa.me/message/ABC123", "Hello")).toBe("https://wa.me/message/ABC123");
  });

  it("fills Gmail and Outlook with the address, subject and body", () => {
    expect(gmailHref("hello@abakes.ng", "A website?", "Hi\nthere")).toBe("https://mail.google.com/mail/?view=cm&fs=1&to=hello%40abakes.ng&su=A%20website%3F&body=Hi%0Athere");
    expect(outlookHref("hello@abakes.ng", "A website?", "Hi")).toBe("https://outlook.live.com/mail/0/deeplink/compose?to=hello%40abakes.ng&subject=A%20website%3F&body=Hi");
  });
});

describe("outcome words", () => {
  it("names the channel or the contact point an outcome was about", () => {
    expect(outcomeText({ type: "sent", channel: "whatsapp" })).toBe("Sent · WhatsApp");
    expect(outcomeText({ type: "wrong_number", channel: null, contactValue: "+2348030001111" }, () => "0803 000 1111")).toBe("Wrong number: 0803 000 1111");
    expect(outcomeText({ type: "opted_out", channel: null })).toBe("Asked not to be contacted");
  });
});

const OPT_OUT = `If you'd rather not hear from us, reply "stop" and we won't contact you again.`;
const site = { kind: "source", ref: "S1", sourceId: "s1", url: "https://abakes.ng/", sourceType: "website", quote: "Cakes to order" } as const;
const listing = { kind: "source", ref: "S2", sourceId: "s2", url: "https://maps.google.com/?cid=1", sourceType: "places", quote: "4.7 from 88 reviews" } as const;
const fact = { kind: "fact", ref: "F1", factId: "f1", text: "We build order pages", url: null } as const;
const line = (kind: DraftLine["kind"], text: string, cites: DraftLine["cites"] = []): DraftLine => ({ kind, text, cites, span: null });

function emailDraft(body: string): Draft {
  return {
    id: "d1",
    channel: "email",
    status: "ready",
    subject: "A question",
    body,
    lines: [line("greeting", "Hello A Bakes,"), line("claim", "You take cake orders.", [site]), line("claim", "88 people reviewed you.", [listing]), line("claim", "We build order pages.", [fact])],
    removed: [{ channel: "email", text: "You won an award.", reason: "not in the source", by: "check" }],
  };
}

describe("the composer's checks", () => {
  const signed = `Hello A Bakes,

You take cake orders.

Best regards,
Daniekeys Studios
daniekeys.com

${OPT_OUT}`;

  it("passes an email with its opt-out line and signed as the business, and counts the claims", () => {
    expect(draftChecks(emailDraft(signed), { optOut: OPT_OUT, sender: "Daniekeys Studios" })).toEqual([
      { text: "Not on your opt-out list", state: "pass" },
      { text: "2 claims about them, from their website and their Google Maps listing", state: "pass" },
      { text: "1 claim about you, from your approved facts", state: "pass" },
      { text: "Opt-out line included", state: "pass" },
      { text: "Signed as Daniekeys Studios", state: "pass" },
      { text: "1 sentence removed: its source didn't back it", state: "info" },
    ]);
  });

  it("fails an email whose body has no opt-out line, or is signed by another name", () => {
    const checks = draftChecks(emailDraft(signed.replace(OPT_OUT, "")), { optOut: OPT_OUT, sender: "Afriment" });
    expect(checks).toContainEqual({ text: "Opt-out line missing", state: "fail" });
    expect(checks).toContainEqual({ text: "Not signed as Afriment", state: "fail" });
    expect(checks.filter((c) => c.state === "pass").map((c) => c.text)).not.toContain("Opt-out line included");
    // A name only mentioned in a sentence isn't a sign-off.
    const mentioned = draftChecks(emailDraft(`I'm from Afriment.

${OPT_OUT}`), { optOut: OPT_OUT, sender: "Afriment" });
    expect(mentioned).toContainEqual({ text: "Not signed as Afriment", state: "fail" });
    expect(draftChecks(emailDraft(signed), { optOut: OPT_OUT, sender: null })).toContainEqual({ text: "No business name to sign as: approve your Brand DNA", state: "fail" });
  });

  it("only checks the opt-out line and sign-off on email", () => {
    const whatsapp = { ...emailDraft("Hello"), channel: "whatsapp" as const };
    expect(draftChecks(whatsapp, { optOut: OPT_OUT, sender: "Afriment" }).map((c) => c.text)).not.toContain("Opt-out line missing");
  });
});

describe("Mark as sent", () => {
  it("is offered until opening or copying the draft logs a Sent on its channel, then not again", () => {
    expect(canMarkSent("whatsapp", [])).toBe(true);
    // Opened in WhatsApp: the send logs one Sent outcome on that channel.
    const afterOpen = [{ type: "sent", channel: "whatsapp" }];
    expect(canMarkSent("whatsapp", afterOpen)).toBe(false);
    expect(canMarkSent("email", afterOpen)).toBe(true);
    expect(canMarkSent("whatsapp", [{ type: "replied", channel: "whatsapp" }])).toBe(true);
  });
});

describe("source dates for a draft's claims", () => {
  it("takes each page's read date from the card, or the research's finish when it was read again", () => {
    const card = {
      id: "c1",
      rank: 1,
      confidence: "high",
      confidenceReason: null,
      offer: { id: "o", field: "offer", text: "Order page", cites: [{ ...site, fetchedAt: "2026-10-28T10:00:00Z" }, fact] },
      gap: { id: "g", field: "gap", text: "No order page", cites: [{ ...listing, fetchedAt: null }] },
      why: [],
      angle: null,
    } satisfies OpportunityCard;
    expect(sourceReadDates(card, "2026-10-29T09:00:00Z")).toEqual(new Map([["s1", "2026-10-28T10:00:00Z"], ["s2", "2026-10-29T09:00:00Z"]]));
  });
});
