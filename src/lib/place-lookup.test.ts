import { describe, expect, it } from "vitest";
import type { GeoArea } from "./api-types/leads";
import { offerLookup } from "./place-lookup";

const area = (name: string): GeoArea => ({ id: name, name, level: "city", parentName: null, country: "NG", population: null });

describe("offering a Google Maps lookup", () => {
  it("offers it when no place in the list has the name typed", () => {
    expect(offerLookup("Accra", [])).toBe(true);
    // "Ilorin" is in the list, so no lookup; "Ilo" names nothing yet.
    expect(offerLookup("ilorin", [area("Ilorin"), area("Ilorinland")])).toBe(false);
    expect(offerLookup("Ilo", [area("Ilorin")])).toBe(true);
    // The first part is the place: "Accra, Ghana" asks for Accra.
    expect(offerLookup("Accra, Ghana", [area("Accra")])).toBe(false);
  });

  it("waits for the list, and for two letters", () => {
    expect(offerLookup("Accra", null)).toBe(false);
    expect(offerLookup("A", [])).toBe(false);
  });
});
