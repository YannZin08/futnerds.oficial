import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/times_2026-04-06.json', 'utf8'));

// Mapeamento de nomes do JSON para nomes no banco (match parcial)
const nameMap = {
  "Arsenal Football Club": "Arsenal",
  "Aston Villa Football Club": "Aston Villa",
  "Athletic Football Club Bournemouth": "Bournemouth",
  "Brentford Football Club": "Brentford",
  "Brighton & Hove Albion Football Club": "Brighton",
  "Burnley Football Club": "Burnley",
  "Chelsea Football Club": "Chelsea",
  "Crystal Palace Football Club": "Crystal Palace",
  "Everton Football Club": "Everton",
  "Fulham Football Club": "Fulham",
  "Leeds United Football Club": "Leeds United",
  "Liverpool Football Club": "Liverpool",
  "Manchester City Football Club": "Manchester City",
  "Manchester United Football Club": "Manchester United",
  "Newcastle United Football Club": "Newcastle United",
  "Nottingham Forest Football Club": "Nottingham Forest",
  "Sunderland Association Football Club": "Sunderland",
  "Tottenham Hotspur Football Club": "Tottenham Hotspur",
  "West Ham United Football Club": "West Ham United",
  "Wolverhampton Wanderers Football Club": "Wolverhampton Wanderers",
};

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Buscar todos os times do banco
  const [teams] = await conn.execute('SELECT id, name FROM teams');
  console.log(`Total de times no banco: ${teams.length}`);

  let updated = 0;
  let notFound = [];

  for (const item of data) {
    const shortName = nameMap[item.name];
    if (!shortName) {
      notFound.push(item.name);
      continue;
    }

    // Busca por match parcial no nome
    const match = teams.find(t =>
      t.name.toLowerCase().includes(shortName.toLowerCase()) ||
      shortName.toLowerCase().includes(t.name.toLowerCase())
    );

    if (match) {
      await conn.execute(
        'UPDATE teams SET description = ? WHERE id = ?',
        [item.historicalSummary, match.id]
      );
      console.log(`✓ Atualizado: ${match.name} (id=${match.id})`);
      updated++;
    } else {
      notFound.push(`${item.name} → "${shortName}" (não encontrado no banco)`);
    }
  }

  console.log(`\n✅ ${updated} times atualizados`);
  if (notFound.length > 0) {
    console.log(`\n⚠️  Não encontrados:`);
    notFound.forEach(n => console.log(`  - ${n}`));
  }

  await conn.end();
}

run().catch(console.error);
