import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const navbarSource = readFileSync(resolve(process.cwd(), "client/src/components/Navbar.tsx"), "utf8");

 describe("Home redesign", () => {
  it("keeps the requested visual sections and official assets", () => {
    expect(homeSource).toContain("home-v2-hero");
    expect(homeSource).toContain("/manus-storage/hero-stadium_");
    expect(homeSource).toContain("EXPLORE O UNIVERSO DO");
    expect(homeSource).toContain("FUTEBOL DO");
    expect(homeSource).toContain("QUAL SERÁ SUA PRÓXIMA CARREIRA?");
    expect(homeSource).toContain("DOMINAR O");
  });

  it("preserves the functional players and teams routes", () => {
    expect(homeSource).toContain('href="/jogadores"');
    expect(homeSource).toContain('href="/times"');
  });

  it("keeps future navbar options visibly disabled", () => {
    expect(navbarSource).toContain('label: "Scouting"');
    expect(navbarSource).toContain('label: "Modo Carreira"');
    expect(navbarSource).toContain('label: "Rankings"');
    expect(navbarSource).toContain("disabled: true");
  });
});
