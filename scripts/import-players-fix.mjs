import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

// Converter valorMercado (ex: "€172.5M", "€500K") para inteiro em coins
function parseMarketValue(val) {
  if (!val) return null;
  const clean = val.replace("€", "").trim();
  if (clean.endsWith("M")) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.endsWith("K")) return Math.round(parseFloat(clean) * 1_000);
  return parseInt(clean) || null;
}

// Extrair número base de strings como "89+1", "83-1", "80+2"
function parseOverall(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // Pega apenas a parte antes de + ou -
    const match = val.match(/^(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return null;
}

function getCardType(overall) {
  if (overall >= 75) return "gold";
  if (overall >= 65) return "silver";
  return "bronze";
}

function mapPosition(posicoes) {
  if (!posicoes || posicoes.length === 0) return "CM";
  return posicoes[0];
}

// Nomes dos jogadores com erro
const errorNames = [
  "F. Valverde", "Oyarzabal", "C. Baumgartner", "G. Vicario",
  "Y. Wissa", "Iñaki Williams", "N. Seiwald", "J. Musso", "D. Welbeck"
];

async function main() {
  const conn = await mysql.createConnection(DB_URL);

  const raw = readFileSync("/home/ubuntu/upload/sofifa_playersparte1.json", "utf8");
  const allPlayers = JSON.parse(raw);

  // Filtrar apenas os que falharam
  const players = allPlayers.filter(p => errorNames.includes(p.nome));
  console.log(`Jogadores a corrigir: ${players.length}`);

  // Buscar existentes para não duplicar
  const [existing] = await conn.execute("SELECT name, club FROM players");
  const existingSet = new Set(existing.map((r) => `${r.name}|||${r.club}`));

  let inserted = 0;
  let skipped = 0;

  for (const p of players) {
    const key = `${p.nome}|||${p.time}`;
    if (existingSet.has(key)) {
      console.log(`  Já existe: ${p.nome}`);
      skipped++;
      continue;
    }

    const overall = parseOverall(p.overall);
    const potential = parseOverall(p.potencial);
    const position = mapPosition(p.posicoes);
    const altPositions = p.posicoes && p.posicoes.length > 1
      ? JSON.stringify(p.posicoes.slice(1))
      : null;
    const price = parseMarketValue(p.valorMercado);
    const cardType = getCardType(overall);

    try {
      await conn.execute(
        `INSERT INTO players
          (name, position, nationality, club, league, overall, potential, age,
           altPositions, cardType, imageUrl, price, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          p.nome, position, p.pais || "", p.time || "", "",
          overall, potential, p.idade || null,
          altPositions, cardType, p.imagem || null, price,
        ]
      );
      console.log(`  ✅ Inserido: ${p.nome} (overall: ${overall})`);
      inserted++;
    } catch (err) {
      console.log(`  ❌ Erro: ${p.nome} — ${err.message}`);
    }
  }

  await conn.end();
  console.log(`\nInseridos: ${inserted} | Ignorados: ${skipped}`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
