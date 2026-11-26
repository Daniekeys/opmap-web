import { describe, expect, it } from "vitest";
import type { GeoArea } from "./api-types/leads";
import { areaLabel, hasLandmark, offerLookup } from "./place-lookup";

const area = (name: string): GeoArea => ({ id: name, name, level: "city", parentName: null, country: "NG", population: null });

describe("place labels", () => {
  it("names a landmark as near it, under its town", () => {
    expect(areaLabel({ name: "Eiffel Tower", level: "point", parentName: "Paris" })).toBe("Near Eiffel Tower, Paris");
    expect(areaLabel({ name: "Ilorin", level: "city", parentName: "Kwara" })).toBe("Ilorin, Kwara");
    expect(areaLabel({ name: "Kwara", level: "state", parentName: null })).toBe("Kwara");
  });

  it("asks for the distance only when a landmark is among the places", () => {
    expect(hasLandmark([area("Ilorin")])).toBe(false);
    expect(hasLandmark([area("Ilorin"), { ...area("Eiffel Tower"), level: "point" }])).toBe(true);
    expect(hasLandmark([])).toBe(false);
  });
});

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
