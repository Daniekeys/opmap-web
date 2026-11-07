import { describe, expect, it } from "vitest";
import { emptyFactsMessage, factTabs } from "./kinds";

describe("fact tabs", () => {
  it("shows every kind, Industries included, with its count even when it is zero", () => {
    const tabs = factTabs([{ kind: "service" }, { kind: "service" }, { kind: "location" }]);
    expect(tabs.map((t) => t.label)).toEqual([
      "All",
      "Services",
      "Proof points",
      "Ideal clients",
      "Industries",
      "Tone of voice",
      "Places served",
    ]);
    expect(tabs.find((t) => t.kind === "all")!.count).toBe(3);
    expect(tabs.find((t) => t.kind === "service")!.count).toBe(2);
    expect(tabs.find((t) => t.kind === "industry")!.count).toBe(0);
  });

  it("says what is missing on an empty tab and how to fill it", () => {
    expect(emptyFactsMessage("industry")).toBe("No industries were found on the site. Add any you want by hand below.");
    expect(emptyFactsMessage("all")).toMatch(/No facts were found/);
  });
});
