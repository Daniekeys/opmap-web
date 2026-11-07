"use client";
// Phone numbers as this workspace reads them: national format for numbers
// from the workspace's own country, international for the rest. On its own
// so only screens that show a phone load libphonenumber-js.
import { formatPhone } from "@/lib/phone";
import { useWorkspaceCountry } from "./time-zone";

export function useFormatPhone() {
  const country = useWorkspaceCountry();
  return (value: string) => formatPhone(value, country);
}
