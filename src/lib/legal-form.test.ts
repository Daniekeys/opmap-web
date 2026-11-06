import { describe, expect, it } from "vitest";
import type { LegalFormView } from "./api-types/outreach";
import { legalFormText } from "./legal-form";

const ltd = { number: "01234567", name: "BRICK LANE BAKERY LIMITED", type: "ltd", status: "active", postcode: "E1 6QL" };
const view = (fields: Partial<LegalFormView>): LegalFormView => ({ consentNeeded: true, registry: null, checkedAt: null, confirmed: null, ...fields });

describe("a UK lead's legal form, in words", () => {
  it("says what Companies House found and how it was matched", () => {
    expect(legalFormText(view({ consentNeeded: false, registry: { form: "company", method: "site_number", company: ltd } }))).toEqual({
      status: "Private limited company on Companies House: BRICK LANE BAKERY LIMITED, 01234567. Matched by the company number on their site.",
      badge: null,
      consequence: "A company: every channel can be used, with your name and the opt-out line.",
    });
    expect(legalFormText(view({ consentNeeded: false, registry: { form: "company", method: "name_postcode", company: { ...ltd, type: "llp" } } })).status).toBe(
      "Limited liability partnership on Companies House: BRICK LANE BAKERY LIMITED, 01234567. Matched by name and postcode.",
    );
  });

  it("asks for consent for a partnership, a company that isn't active, one not found, and one not checked yet", () => {
    const consent = "Consent needed for this business under UK rules: only the call opener can be used until they agree to hear from you.";
    const partnership = legalFormText(view({ registry: { form: "partnership", method: "name_postcode", company: { ...ltd, type: "limited-partnership" } } }));
    expect(partnership.status).toMatch(/^Limited partnership on Companies House/);
    expect(partnership.consequence).toBe(consent);
    expect(legalFormText(view({ registry: { form: "unknown", method: "site_number", company: { ...ltd, status: "liquidation" } } })).status).toBe(
      "On Companies House as BRICK LANE BAKERY LIMITED, 01234567, but in liquidation, so it counts as unknown.",
    );
    expect(legalFormText(view({ registry: { form: "unknown", method: null, company: null } })).status).toBe("Not found on Companies House.");
    expect(legalFormText(view({})).status).toBe("Not checked on Companies House yet.");
  });

  it("puts a member's own check first, with their name", () => {
    const mine = legalFormText(
      view({ consentNeeded: true, registry: { form: "company", method: "site_number", company: ltd }, confirmed: { form: "sole_trader", note: "Owner says sole trader", by: "Dan", at: "2026-11-06T10:00:00.000Z" } }),
    );
    expect(mine).toMatchObject({ status: "Sole trader, checked by your team.", badge: "Confirmed by Dan" });
    expect(legalFormText(view({ consentNeeded: false, confirmed: { form: "company", note: null, by: "Ada", at: "2026-11-06T10:00:00.000Z" } }))).toMatchObject({
      status: "Limited company, checked by your team.",
      badge: "Confirmed by Ada",
    });
  });
});
