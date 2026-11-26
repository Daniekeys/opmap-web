import { describe, expect, it } from "vitest";
import { config } from "../proxy";
import { messageLinks, shareStageName } from "./share";

const targets = { whatsapp: "+2348030001111", email: "hello@abakes.ng", call: "+2348030001111" };

describe("send links on a shared campaign", () => {
  it("opens WhatsApp with the text, the mail app with subject and body, and dials the call opener", () => {
    expect(messageLinks(targets, { channel: "whatsapp", subject: null, body: "Hello A Bakes" })).toEqual([
      { label: "Open in WhatsApp", href: "https://wa.me/2348030001111?text=Hello%20A%20Bakes" },
    ]);
    expect(messageLinks(targets, { channel: "email", subject: "A website", body: "Hi & bye" })).toEqual([
      { label: "Open in email", href: "mailto:hello@abakes.ng?subject=A%20website&body=Hi%20%26%20bye" },
    ]);
    expect(messageLinks(targets, { channel: "call", subject: null, body: "Hi" })).toEqual([{ label: "Call", href: "tel:+2348030001111" }]);
  });

  it("gives no link where there is nowhere to send, or for LinkedIn: copy and paste", () => {
    const none = { whatsapp: null, email: null, call: null };
    expect(messageLinks(none, { channel: "whatsapp", subject: null, body: "Hi" })).toEqual([]);
    expect(messageLinks(targets, { channel: "linkedin", subject: null, body: "Hi" })).toEqual([]);
  });

  it("names the stages", () => {
    expect(shareStageName("replied")).toBe("Replied");
    expect(shareStageName("something_else")).toBe("something_else");
  });
});

describe("the proxy", () => {
  // Shared links are opened signed out, so the proxy must not send them to login.
  it("lets /share/ links through, but not app pages", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    expect(matcher.test("/share/abc123")).toBe(false);
    expect(matcher.test("/w/daniekeys/shared")).toBe(true);
    expect(matcher.test("/w/daniekeys/campaigns")).toBe(true);
  });
});
