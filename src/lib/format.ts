export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

// Times print in the workspace's time zone (WorkspaceSummary.timeZone: saved
// by an owner, else from the Brand DNA, else UTC; never the browser's), with a
// fixed locale, so the server and the browser print the same text.
const formatters = new Map<string, Intl.DateTimeFormat>();
export function formatter(timeZone: string, options: Intl.DateTimeFormatOptions, locale = "en-GB") {
  const key = JSON.stringify([locale, timeZone, options]);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    formatters.set(key, f);
  }
  return f;
}

// "28 Oct, 14:05".
export const formatDateTime = (iso: string, timeZone: string) =>
  formatter(timeZone, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// "28 Oct".
export const formatDay = (iso: string, timeZone: string) => formatter(timeZone, { day: "numeric", month: "short" }).format(new Date(iso));

// "2026-10-28": the calendar day in the zone, for comparing days.
export const dayKey = (date: Date, timeZone: string) => formatter(timeZone, {}, "en-CA").format(date);

// "Lagos time", "London time", "UTC".
export function zoneName(timeZone: string) {
  if (timeZone === "UTC" || timeZone === "Etc/UTC") return "UTC";
  return `${timeZone.split("/").pop()!.replaceAll("_", " ")} time`;
}
