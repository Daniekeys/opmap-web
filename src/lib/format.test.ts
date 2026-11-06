import { describe, expect, it } from "vitest";
import { suggestionText } from "@/app/w/[workspace]/settings/time-zone-form";
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

  it("says where the suggestion came from, or that there is none", () => {
    expect(suggestionText({ timeZone: "Africa/Lagos", saved: null, suggested: { timeZone: "Africa/Lagos", from: "Based in Nigeria" } })).toBe(
      'From your Brand DNA ("Based in Nigeria"): Africa/Lagos.',
    );
    expect(suggestionText({ timeZone: "UTC", saved: null, suggested: null })).toMatch(/UTC until you pick a zone/);
  });
});
