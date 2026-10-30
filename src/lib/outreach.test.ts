import { describe, expect, it } from "vitest";
import { gmailHref, outcomeText, outlookHref, whatsappSendHref } from "./outreach";

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
