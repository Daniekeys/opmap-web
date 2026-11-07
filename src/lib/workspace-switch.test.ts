import { describe, expect, it } from "vitest";
import { switchTarget } from "./workspace-switch";

const CAMPAIGN = "b5c709c2-b723-4450-a38f-b8cf814de138";
const LEAD = "9ed0d800-b84c-478c-a4e4-2087b3520645";

describe("switchTarget", () => {
  it("sends a page showing one workspace-owned item to its section's list", () => {
    expect(switchTarget(`/w/afriment/campaigns/${CAMPAIGN}`, "daniekeys")).toBe("/w/daniekeys/campaigns");
    // A lead, with its cards and drafts.
    expect(switchTarget(`/w/afriment/campaigns/${CAMPAIGN}/leads/${LEAD}`, "daniekeys")).toBe("/w/daniekeys/campaigns");
    expect(switchTarget(`/w/afriment/campaigns/${CAMPAIGN}/pipeline`, "daniekeys")).toBe("/w/daniekeys/campaigns");
    expect(switchTarget("/w/afriment/brand/3f0c1d7e-0000-4000-8000-000000000001", "daniekeys")).toBe("/w/daniekeys/brand");
  });

  it("keeps a list or a form that belongs to no one item", () => {
    expect(switchTarget("/w/afriment", "daniekeys")).toBe("/w/daniekeys");
    expect(switchTarget("/w/afriment/campaigns", "daniekeys")).toBe("/w/daniekeys/campaigns");
    expect(switchTarget("/w/afriment/campaigns/new", "daniekeys")).toBe("/w/daniekeys/campaigns/new");
    expect(switchTarget("/w/afriment/messages", "daniekeys")).toBe("/w/daniekeys/messages");
    expect(switchTarget("/w/afriment/brand", "daniekeys")).toBe("/w/daniekeys/brand");
    expect(switchTarget("/w/afriment/members", "daniekeys")).toBe("/w/daniekeys/members");
    expect(switchTarget("/w/afriment/test-job", "daniekeys")).toBe("/w/daniekeys/test-job");
  });

  it("ignores a trailing slash", () => {
    expect(switchTarget(`/w/afriment/campaigns/${CAMPAIGN}/`, "daniekeys")).toBe("/w/daniekeys/campaigns");
    expect(switchTarget("/w/afriment/messages/", "daniekeys")).toBe("/w/daniekeys/messages");
  });
});
