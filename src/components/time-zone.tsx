"use client";
// The workspace's time zone for client components (WorkspaceSummary.timeZone:
// saved by an owner, else from the Brand DNA, else UTC; never the browser's).
// Server components read it from getWorkspace instead.
import { createContext, type ReactNode, useContext } from "react";

const TimeZoneContext = createContext<string | null>(null);

export function TimeZoneProvider({ timeZone, children }: { timeZone: string; children: ReactNode }) {
  return <TimeZoneContext.Provider value={timeZone}>{children}</TimeZoneContext.Provider>;
}

export function useTimeZone() {
  const timeZone = useContext(TimeZoneContext);
  if (!timeZone) throw new Error("useTimeZone is only available inside a workspace.");
  return timeZone;
}
