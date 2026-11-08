import { describe, expect, it } from "vitest";
import { allSampleCopy, leadsRequestMailto, otherExamples, sampleAnswer, STOP_CONTACT_MAILTO } from "./landing";

describe("landing page search sample", () => {
  it("answers the three examples whatever the case and spacing", () => {
    expect(sampleAnswer("cake shops in Lekki")?.rows).toHaveLength(3);
    expect(sampleAnswer("  PRIVATE clinics   in ikeja ")?.rows[0].name).toBe("Quillmere Clinic");
    expect(sampleAnswer("plumbers in Yaba")).toBeNull();
    expect(sampleAnswer("")).toBeNull();
  });

  it("offers every example except the one shown", () => {
    expect(otherExamples("Cake shops in Lekki")).toEqual(["private clinics in Ikeja", "event planners in Surulere"]);
    expect(otherExamples("plumbers")).toHaveLength(3);
  });

  it("keeps the brand voice and labels every answer as sample data", () => {
    for (const line of allSampleCopy()) {
      expect(line).not.toMatch(/[–—!]/);
      expect(line).not.toMatch(/medical centre/i);
    }
    for (const q of ["cake shops in Lekki", "private clinics in Ikeja", "event planners in Surulere"]) {
      expect(sampleAnswer(q)?.note).toMatch(/Sample data\.$/);
    }
  });
});

describe("landing page mailto links", () => {
  it("sends the visitor's site in the body of the leads request", () => {
    expect(leadsRequestMailto(" crumbs.ng ")).toBe(
      "mailto:daniel@daniekeysstudios.com?subject=5%20free%20leads%20request&body=Site%3A%20crumbs.ng",
    );
  });

  it("encodes characters that would break the link", () => {
    expect(leadsRequestMailto("a.com/?x=1&y=2")).toContain("body=Site%3A%20a.com%2F%3Fx%3D1%26y%3D2");
  });

  it("has a stop-contacting link with its subject", () => {
    expect(STOP_CONTACT_MAILTO).toBe("mailto:daniel@daniekeysstudios.com?subject=Stop%20contacting%20me");
  });
});
