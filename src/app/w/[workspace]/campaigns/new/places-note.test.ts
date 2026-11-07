import { describe, expect, it } from "vitest";
import type { GeoArea } from "@/lib/api-types/leads";
import { placesNote } from "./campaign-form";

const ilorin: GeoArea = { id: "a", name: "Ilorin", level: "city", parentName: "Kwara", country: "NG", population: null };

// D3: the seller's location from the Brand DNA is the default; the note says
// where the places came from and that any other place can be picked.
describe("starting places note", () => {
  it("names the Brand DNA fact, or the buyer segment, and goes once the places are removed", () => {
    expect(placesNote({ kind: "brand", from: "Based in Ilorin, Kwara State" }, [ilorin])).toBe(
      'Suggested from your Brand DNA ("Based in Ilorin, Kwara State"). Remove it, or pick any other place.',
    );
    expect(placesNote({ kind: "segment" }, [ilorin])).toBe("Suggested for this buyer. Remove any, or pick other places.");
    expect(placesNote({ kind: "brand", from: "Based in Ilorin" }, [])).toBeNull();
    expect(placesNote(null, [ilorin])).toBeNull();
  });
});
