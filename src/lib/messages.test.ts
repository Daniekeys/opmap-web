import { describe, expect, it } from "vitest";
import type { MessageRow } from "./api-types/outreach";
import { messagesFinding, rowLine, rowStatus } from "./messages";

// 31 Oct 2026, 14:00 in Lagos.
const NOW = new Date("2026-10-31T13:00:00Z");

const row = (over: Partial<MessageRow> = {}): MessageRow => ({
  kind: "draft",
  leadId: "l1",
  campaignId: "c1",
  businessId: "b1",
  name: "A Bakes",
  offer: "A website",
  note: null,
  at: "2026-10-31T08:00:00Z",
  ...over,
});

describe("messages queue words", () => {
  it("quotes a reply's note, or says when it came; a draft names its offer", () => {
    expect(rowLine(row({ kind: "reply", note: "How much would it cost?" }), NOW)).toBe('Replied: "How much would it cost?"');
    expect(rowLine(row({ kind: "reply", at: "2026-10-30T10:00:00Z" }), NOW)).toBe("Replied yesterday");
    expect(rowLine(row(), NOW)).toBe("A website");
    expect(rowLine(row({ offer: null }), NOW)).toBe("Messages ready");
    expect([rowStatus(row({ kind: "reply" })), rowStatus(row())]).toEqual(["Reply now", "Draft ready"]);
  });

  it("states what's ready and who is waiting", () => {
    const reply = row({ kind: "reply", name: "Rossycakes", at: "2026-10-31T09:00:00Z" });
    expect(messagesFinding({ toSend: 4, newReplies: 1, newRepliesByCampaign: [], queue: [reply, row()] }, NOW)).toBe(
      "Messages for 4 businesses are ready. Rossycakes replied today and is waiting on you.",
    );
    expect(messagesFinding({ toSend: 1, newReplies: 0, newRepliesByCampaign: [], queue: [row()] }, NOW)).toBe("Messages for 1 business are ready.");
    expect(messagesFinding({ toSend: 0, newReplies: 2, newRepliesByCampaign: [], queue: [reply, reply] }, NOW)).toBe("2 replies are waiting on you, newest from Rossycakes.");
    expect(messagesFinding({ toSend: 0, newReplies: 0, newRepliesByCampaign: [], queue: [] }, NOW)).toBe("Nothing waiting. Messages show here once they're written.");
  });
});
