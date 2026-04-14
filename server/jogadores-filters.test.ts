import { describe, it, expect } from "vitest";

// Simula a lógica de filtro do componente Jogadores
const positionGroupMap: Record<string, string> = {
  ST: "ST", CF: "ST", RF: "ST", LF: "ST",
  LW: "LW", RW: "LW",
  CAM: "CM", CM: "CM", CDM: "CM",
  LB: "LB", RB: "LB", LWB: "LB", RWB: "LB",
  CB: "CB",
  GK: "GK",
  ATA: "ST",
  PNT: "LW", PE: "LW", PD: "LW",
  MEI: "CM", VOL: "CM", MC: "CM", MCD: "CM", MD: "CM", ME: "CM",
  LD: "LB", LE: "LB",
  ZAG: "CB",
  GOL: "GK",
};

function playerMatchesPositionGroup(p: any, group: string): boolean {
  if (positionGroupMap[p.position] === group) return true;
  if (!p.altPositions) return false;
  const alts = typeof p.altPositions === "string"
    ? p.altPositions.split(",").map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(p.altPositions) ? p.altPositions : [];
  return alts.some((alt: string) => positionGroupMap[alt] === group);
}

function applyFilters(players: any[], opts: {
  selectedPosition?: string;
  searchQuery?: string;
  filterLeague?: string;
  filterNationality?: string;
  ageRange?: [number, number] | null;
  overallRange?: [number, number] | null;
  potentialRange?: [number, number] | null;
  priceRange?: [number, number] | null;
  onlyPromessas?: boolean;
  onlyVeteranos?: boolean;
  onlyLivres?: boolean;
  sortBy?: string;
}) {
  let result = [...players];

  if (opts.selectedPosition) {
    result = result.filter((p) => playerMatchesPositionGroup(p, opts.selectedPosition!));
  }
  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.club.toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q)
    );
  }
  if (opts.filterLeague) result = result.filter((p) => p.league === opts.filterLeague);
  if (opts.filterNationality) result = result.filter((p) => p.nationality === opts.filterNationality);

  if (opts.ageRange) {
    const [min, max] = opts.ageRange;
    result = result.filter((p) => { const v = Number(p.age ?? 0); return v >= min && v <= max; });
  }
  if (opts.overallRange) {
    const [min, max] = opts.overallRange;
    result = result.filter((p) => { const v = Number(p.overall ?? 0); return v >= min && v <= max; });
  }
  if (opts.potentialRange) {
    const [min, max] = opts.potentialRange;
    result = result.filter((p) => { const v = Number(p.potential ?? 0); return v >= min && v <= max; });
  }
  if (opts.priceRange) {
    const [min, max] = opts.priceRange;
    result = result.filter((p) => { const v = Number(p.price ?? 0); return v >= min && v <= max; });
  }

  if (opts.onlyPromessas) result = result.filter((p) => Number(p.age) <= 21);
  if (opts.onlyVeteranos) result = result.filter((p) => Number(p.age) >= 30);
  if (opts.onlyLivres) result = result.filter((p) => !p.club || p.club.trim() === "");

  if (opts.sortBy === "overall_desc") result.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  if (opts.sortBy === "overall_asc") result.sort((a, b) => (a.overall ?? 0) - (b.overall ?? 0));
  if (opts.sortBy === "age_asc") result.sort((a, b) => (a.age ?? 0) - (b.age ?? 0));
  if (opts.sortBy === "age_desc") result.sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  if (opts.sortBy === "name_asc") result.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return result;
}

const mockPlayers = [
  { id: 1, name: "Mbappé", age: 26, overall: 91, potential: 92, price: 157000000, position: "ATA", altPositions: "PE,ME", club: "Real Madrid", league: "La Liga", nationality: "França" },
  { id: 2, name: "Lamine Yamal", age: 17, overall: 89, potential: 95, price: 147000000, position: "PD", altPositions: "MD", club: "FC Barcelona", league: "La Liga", nationality: "Espanha" },
  { id: 3, name: "Van Dijk", age: 33, overall: 88, potential: 88, price: 43500000, position: "ZAG", altPositions: "", club: "Liverpool", league: "Premier League", nationality: "Países Baixos" },
  { id: 4, name: "Jogador Livre", age: 28, overall: 75, potential: 76, price: 0, position: "MEI", altPositions: "", club: "", league: "", nationality: "Brasil" },
  { id: 5, name: "Jovem Promessa", age: 19, overall: 72, potential: 88, price: 5000000, position: "ATA", altPositions: "", club: "Flamengo", league: "Brasileirão", nationality: "Brasil" },
];

describe("Filtros de Jogadores", () => {
  it("sem filtros retorna todos os jogadores", () => {
    const result = applyFilters(mockPlayers, {});
    expect(result).toHaveLength(5);
  });

  it("filtro por posição ATA (ST) retorna apenas atacantes", () => {
    const result = applyFilters(mockPlayers, { selectedPosition: "ST" });
    expect(result.map((p) => p.name)).toContain("Mbappé");
    expect(result.map((p) => p.name)).toContain("Jovem Promessa");
    expect(result.map((p) => p.name)).not.toContain("Van Dijk");
  });

  it("filtro por posição LW (pontas) inclui jogadores com PD como posição principal", () => {
    const result = applyFilters(mockPlayers, { selectedPosition: "LW" });
    expect(result.map((p) => p.name)).toContain("Lamine Yamal");
  });

  it("filtro por posição LW inclui Mbappé via altPositions (PE)", () => {
    const result = applyFilters(mockPlayers, { selectedPosition: "LW" });
    expect(result.map((p) => p.name)).toContain("Mbappé");
  });

  it("busca por nome funciona (case insensitive)", () => {
    // 'mbapp' bate com 'Mbappé' via toLowerCase()
    const result = applyFilters(mockPlayers, { searchQuery: "mbapp" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Mbappé");
  });

  it("busca por clube funciona", () => {
    const result = applyFilters(mockPlayers, { searchQuery: "liverpool" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Van Dijk");
  });

  it("filtro por liga funciona", () => {
    const result = applyFilters(mockPlayers, { filterLeague: "La Liga" });
    expect(result).toHaveLength(2);
  });

  it("filtro por nacionalidade funciona", () => {
    const result = applyFilters(mockPlayers, { filterNationality: "Brasil" });
    expect(result).toHaveLength(2);
  });

  it("filtro de range de idade funciona", () => {
    const result = applyFilters(mockPlayers, { ageRange: [16, 20] });
    expect(result).toHaveLength(2); // Lamine Yamal (17) e Jovem Promessa (19)
  });

  it("filtro de range de overall funciona", () => {
    const result = applyFilters(mockPlayers, { overallRange: [88, 91] });
    expect(result).toHaveLength(3); // Mbappé (91), Lamine Yamal (89), Van Dijk (88)
  });

  it("filtro de range de potencial funciona", () => {
    const result = applyFilters(mockPlayers, { potentialRange: [90, 99] });
    // Mbappé (92) e Lamine Yamal (95) — Jovem Promessa tem 88, Van Dijk 88, Jogador Livre 76
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.potential >= 90)).toBe(true);
  });

  it("filtro de range de preço funciona", () => {
    const result = applyFilters(mockPlayers, { priceRange: [0, 50000000] });
    expect(result).toHaveLength(3); // Van Dijk (43.5M), Jogador Livre (0), Jovem Promessa (5M)
  });

  it("toggle Promessas filtra jogadores com até 21 anos", () => {
    const result = applyFilters(mockPlayers, { onlyPromessas: true });
    expect(result).toHaveLength(2); // Lamine Yamal (17) e Jovem Promessa (19)
    expect(result.every((p) => p.age <= 21)).toBe(true);
  });

  it("toggle Veteranos filtra jogadores com 30+ anos", () => {
    const result = applyFilters(mockPlayers, { onlyVeteranos: true });
    expect(result).toHaveLength(1); // Van Dijk (33)
    expect(result[0].name).toBe("Van Dijk");
  });

  it("toggle Jogadores Livres filtra sem clube", () => {
    const result = applyFilters(mockPlayers, { onlyLivres: true });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Jogador Livre");
  });

  it("ordenação por overall_desc funciona", () => {
    const result = applyFilters(mockPlayers, { sortBy: "overall_desc" });
    expect(result[0].overall).toBe(91);
    expect(result[result.length - 1].overall).toBeLessThanOrEqual(result[0].overall);
  });

  it("ordenação por age_asc funciona", () => {
    const result = applyFilters(mockPlayers, { sortBy: "age_asc" });
    expect(result[0].age).toBe(17);
  });

  it("ordenação por name_asc funciona", () => {
    const result = applyFilters(mockPlayers, { sortBy: "name_asc" });
    expect(result[0].name).toBe("Jogador Livre");
  });

  it("null em ageRange não aplica filtro", () => {
    const result = applyFilters(mockPlayers, { ageRange: null });
    expect(result).toHaveLength(5);
  });

  it("combinação de filtros funciona", () => {
    const result = applyFilters(mockPlayers, {
      filterNationality: "Brasil",
      onlyPromessas: true,
    });
    expect(result).toHaveLength(1); // Jovem Promessa (19, Brasil)
    expect(result[0].name).toBe("Jovem Promessa");
  });
});
