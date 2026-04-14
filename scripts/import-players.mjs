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

// Determinar cardType baseado no overall
function getCardType(overall) {
  if (overall >= 75) return "gold";
  if (overall >= 65) return "silver";
  return "bronze";
}

// Mapear posição principal do array de posições
function mapPosition(posicoes) {
  if (!posicoes || posicoes.length === 0) return "CM";
  return posicoes[0];
}

async function main() {
  const conn = await mysql.createConnection(DB_URL);

  // Carregar JSON
  const raw = readFileSync("/home/ubuntu/upload/sofifa_playersparte1.json", "utf8");
  const players = JSON.parse(raw);

  console.log(`Total no arquivo: ${players.length}`);

  // Buscar todos os jogadores existentes (nome + clube) para checar duplicatas
  const [existing] = await conn.execute("SELECT name, club FROM players");
  const existingSet = new Set(existing.map((r) => `${r.name}|||${r.club}`));

  console.log(`Jogadores já no banco: ${existingSet.size}`);

  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const p of players) {
    const key = `${p.nome}|||${p.time}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    const position = mapPosition(p.posicoes);
    const altPositions = p.posicoes && p.posicoes.length > 1
      ? JSON.stringify(p.posicoes.slice(1))
      : null;
    const price = parseMarketValue(p.valorMercado);
    const cardType = getCardType(p.overall);

    try {
      await conn.execute(
        `INSERT INTO players
          (name, position, nationality, club, league, overall, potential, age,
           altPositions, cardType, imageUrl, price, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          p.nome,
          position,
          p.pais || "",
          p.time || "",
          "", // liga não está no JSON — deixar vazio
          p.overall,
          p.potencial || null,
          p.idade || null,
          altPositions,
          cardType,
          p.imagem || null,
          price,
        ]
      );
      inserted++;
      existingSet.add(key); // evitar duplicatas dentro do próprio arquivo
    } catch (err) {
      errors.push({ nome: p.nome, erro: err.message });
    }
  }

  await conn.end();

  console.log(`\n✅ Importação concluída:`);
  console.log(`   Inseridos: ${inserted}`);
  console.log(`   Ignorados (já existiam): ${skipped}`);
  console.log(`   Erros: ${errors.length}`);
  if (errors.length > 0) {
    console.log("\nErros:");
    errors.forEach((e) => console.log(`  - ${e.nome}: ${e.erro}`));
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
