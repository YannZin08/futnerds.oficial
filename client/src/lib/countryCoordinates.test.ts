import { describe, expect, it } from "vitest";
import {
  countryCoordinates,
  getCountryCoordinates,
  getCountryFlag,
  toCountryPoints,
} from "./countryCoordinates";

describe("countryCoordinates", () => {
  it("contains coordinates for the main countries shown in the leagues screen", () => {
    expect(countryCoordinates.Inglaterra).toEqual({ lat: 52.4, lng: -1.5 });
    expect(countryCoordinates.Brasil).toEqual({ lat: -14.2, lng: -51.9 });
    expect(countryCoordinates.Itália).toEqual({ lat: 41.9, lng: 12.5 });
  });

  it("returns a deterministic fallback for countries added later", () => {
    expect(getCountryCoordinates("Novo País", 2)).toEqual(getCountryCoordinates("Novo País", 2));
  });

  it("creates selectable points with flags", () => {
    const points = toCountryPoints([
      { id: 1, name: "Inglaterra" },
      { id: 2, name: "Brasil" },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ id: 1, name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" });
    expect(points[1]).toMatchObject({ id: 2, name: "Brasil", lat: -14.2, lng: -51.9 });
    expect(getCountryFlag("País desconhecido")).toBe("🌍");
  });
});
