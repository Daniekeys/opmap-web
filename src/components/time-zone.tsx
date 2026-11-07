"use client";
// The workspace's time zone and country for client components
// (WorkspaceSummary: the zone saved by an owner, else from the Brand DNA,
// else UTC, never the browser's; the country is the saved zone's, else the
// Brand DNA's). Server components read them from getWorkspace instead.
import { createContext, type ReactNode, useContext } from "react";

const WorkspaceLocaleContext = createContext<{ timeZone: string; country: string | null } | null>(null);

export function TimeZoneProvider({ timeZone, country, children }: { timeZone: string; country: string | null; children: ReactNode }) {
  return <WorkspaceLocaleContext.Provider value={{ timeZone, country }}>{children}</WorkspaceLocaleContext.Provider>;
}

function useLocale() {
  const locale = useContext(WorkspaceLocaleContext);
  if (!locale) throw new Error("The workspace's time zone is only available inside a workspace.");
  return locale;
}

export const useTimeZone = () => useLocale().timeZone;

// The workspace's own country (ISO code), or null.
export const useWorkspaceCountry = () => useLocale().country;
