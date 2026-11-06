import { describe, expect, it } from "vitest";
import { suggestionText, zoneDescription, zoneGroups } from "@/app/w/[workspace]/settings/time-zone-form";
import { dayKey, formatDateTime, formatDay, zoneName } from "./format";
import { pausedUntil, statusText } from "./leads";
import { dayText } from "./pipeline";

// Times show in the workspace's zone (saved, else from the Brand DNA, else
// UTC), never the browser's.
describe("workspace time zone", () => {
  const at = "2026-10-30T23:30:00Z";

  it("prints the same instant in each workspace's zone", () => {
    expect(formatDateTime(at, "Africa/Lagos")).toBe("31 Oct, 00:30");
    expect(formatDateTime(at, "Africa/Nairobi")).toBe("31 Oct, 02:30");
    expect(formatDateTime(at, "Europe/London")).toBe("30 Oct, 23:30");
    expect(formatDay(at, "Africa/Accra")).toBe("30 Oct");
    expect(dayKey(new Date(at), "Africa/Lagos")).toBe("2026-10-31");
  });

  it("names days and pauses in the zone, and says which zone", () => {
    const now = new Date("2026-10-31T10:00:00Z");
    expect(dayText(at, "Africa/Lagos", now)).toBe("today");
    expect(dayText(at, "Europe/London", now)).toBe("yesterday");
    // Pacific midnight: 08:00 in Lagos, 07:00 in London (GMT after 25 Oct).
    const resumeAt = "2026-11-01T07:00:00Z";
    expect(pausedUntil(resumeAt, "Africa/Lagos", now)).toBe("tomorrow, 08:00");
    expect(statusText({ status: "paused", resumeAt }, "Europe/London", now)).toBe("Paused until tomorrow, 07:00");
    expect(zoneName("Africa/Lagos")).toBe("Lagos time");
    expect(zoneName("America/New_York")).toBe("New York time");
    expect(zoneName("UTC")).toBe("UTC");
  });

  const NG = { code: "NG", name: "Nigeria", timeZones: ["Africa/Lagos"] };
  const GB = { code: "GB", name: "United Kingdom", timeZones: ["Europe/London"] };
  const suggested = { timeZone: "Africa/Lagos", from: "Based in Nigeria" };

  it("says where the suggestion came from, or that there is none", () => {
    expect(suggestionText({ timeZone: "Africa/Lagos", saved: null, suggested, country: NG })).toBe('From your Brand DNA ("Based in Nigeria"): Africa/Lagos.');
    expect(suggestionText({ timeZone: "UTC", saved: null, suggested: null, country: null })).toMatch(/UTC until you pick a zone/);
  });

  it("describes the zone in use: the saved one after a save, not the suggestion", () => {
    expect(zoneDescription({ timeZone: "Africa/Lagos", saved: null, suggested, country: NG })).toContain("shows in Africa/Lagos. From your Brand DNA");
    const london = zoneDescription({ timeZone: "Europe/London", saved: "Europe/London", suggested, country: GB });
    expect(london).toBe('Every time in this workspace (searches, pauses, replies) shows in Europe/London. An owner chose it. Pick "From Brand DNA" to go back to Africa/Lagos.');
  });

  it("lists the workspace country's zones first, then every other zone once", () => {
    const all = ["Africa/Accra", "Africa/Lagos", "America/Chicago", "Europe/London", "UTC"];
    expect(zoneGroups({ timeZone: "Africa/Lagos", saved: null, suggested, country: NG }, all)).toEqual([
      { label: "In Nigeria", zones: ["Africa/Lagos"] },
      { label: "All other time zones", zones: ["Africa/Accra", "America/Chicago", "Europe/London", "UTC"] },
    ]);
    // A saved zone of no one country stays at the top.
    expect(zoneGroups({ timeZone: "UTC", saved: "UTC", suggested, country: NG }, all).map((g) => [g.label, g.zones.length])).toEqual([
      ["Saved", 1],
      ["In Nigeria", 1],
      ["All other time zones", 3],
    ]);
    expect(zoneGroups({ timeZone: "UTC", saved: null, suggested: null, country: null }, all)).toEqual([{ label: "All time zones", zones: all }]);
  });
});
