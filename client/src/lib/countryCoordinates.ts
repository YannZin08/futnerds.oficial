export type CountryCoordinates = {
  lat: number;
  lng: number;
};

/** Coordenadas aproximadas dos países disponíveis no banco. */
export const countryCoordinates: Record<string, CountryCoordinates> = {
  Brasil: { lat: -14.2, lng: -51.9 },
  Inglaterra: { lat: 52.4, lng: -1.5 },
  Espanha: { lat: 40.4, lng: -3.7 },
  Itália: { lat: 41.9, lng: 12.5 },
  Alemanha: { lat: 51.2, lng: 10.4 },
  França: { lat: 46.2, lng: 2.2 },
  Portugal: { lat: 39.4, lng: -8.2 },
  "Arábia Saudita": { lat: 23.9, lng: 45.1 },
  Holanda: { lat: 52.1, lng: 5.3 },
  Bélgica: { lat: 50.8, lng: 4.5 },
  Turquia: { lat: 38.9, lng: 35.2 },
  Escócia: { lat: 56.5, lng: -4.2 },
  Argentina: { lat: -38.4, lng: -63.6 },
  EUA: { lat: 37.1, lng: -95.7 },
};

export function getCountryCoordinates(countryName: string, index = 0): CountryCoordinates {
  const known = countryCoordinates[countryName];
  if (known) return known;

  const fallbackLng = ((index * 137.5 + 17) % 300) - 150;
  const fallbackLat = ((index * 41.3 + 11) % 110) - 55;
  return { lat: fallbackLat, lng: fallbackLng };
}

export function getCountryFlag(countryName: string): string {
  const flags: Record<string, string> = {
    Brasil: "🇧🇷",
    Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    Espanha: "🇪🇸",
    Itália: "🇮🇹",
    Alemanha: "🇩🇪",
    França: "🇫🇷",
    Portugal: "🇵🇹",
    "Arábia Saudita": "🇸🇦",
    Holanda: "🇳🇱",
    Bélgica: "🇧🇪",
    Turquia: "🇹🇷",
    Escócia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    Argentina: "🇦🇷",
    EUA: "🇺🇸",
  };
  return flags[countryName] ?? "🌍";
}

export function normalizeCountryName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type CountryPoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  flag: string;
};

export function toCountryPoints(countries: Array<{ id: number; name: string }>): CountryPoint[] {
  return countries.map((country, index) => {
    const coordinates = getCountryCoordinates(country.name, index);
    return {
      ...country,
      ...coordinates,
      flag: getCountryFlag(country.name),
    };
  });
}

export default countryCoordinates;
