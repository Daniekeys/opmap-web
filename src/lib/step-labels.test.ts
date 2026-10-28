import { describe, expect, it } from "vitest";
import { stepLabel } from "./step-labels";

describe("stepLabel", () => {
  it("names the Brand DNA steps in plain words", () => {
    expect(stepLabel("brand.crawl")).toBe("Reading your website");
    expect(stepLabel("brand.describe")).toBe("Reading your description");
    expect(stepLabel("brand.extract")).toBe("Drafting your profile");
    expect(stepLabel("brand.save")).toBe("Saving");
  });

  it("names the deep-dive steps in plain words", () => {
    expect(stepLabel("deepdive.crawl")).toBe("Reading their website");
    expect(stepLabel("deepdive.check")).toBe("Checking every claim against its source");
  });

  it("shows the raw name of a step it has no label for", () => {
    expect(stepLabel("leads.search")).toBe("leads.search");
  });
});
