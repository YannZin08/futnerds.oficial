import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const teams = JSON.parse(readFileSync('/home/ubuntu/upload/times_2026-04-06(2).json', 'utf-8'));

// Mapeamento manual: nome no JSON -> nome no banco (ou parte do nome)
const manualMap = {
  "Ballspielverein Borussia 09 e.V. Dortmund": "Borussia Dortmund",
  "Verein für Leibesübungen Wolfsburg e. V.": "VfL Wolfsburg",
  "Borussia Verein für Leibesübungen 1900 e. V. Mönchengladbach": "Borussia Mönchengladbach",
  "Verein für Bewegungsspiele Stuttgart 1893 e. V.": "VfB Stuttgart",
  "Verein für Leibesübungen Bochum 1848 Fußballgemeinschaft e.V.": "VfL Bochum",
  "FC Gelsenkirchen-Schalke 04 e.V.": "Schalke 04",
  "Hertha, Berliner Sport-Club e.V.": "Hertha BSC",
  "Düsseldorfer Turn- und Sportverein Fortuna 1895 e.V.": "Fortuna Düsseldorf",
  "Hannoverscher Sportverein von 1896 e. V.": "Hannover 96",
  "Braunschweiger Turn- und Sportverein Eintracht von 1895 e.V.": "Eintracht Braunschweig",
  "Hallescher FC": "Hallescher FC",
  "SV Sandhausen 1916 e.V.": "SV Sandhausen",
  "Spielvereinigung Unterhaching e.V.": "SpVgg Unterhaching",
  "Sportclub Verl von 1924 e. V.": "SC Verl",
  "VfB Lübeck": "VfB Lübeck",
};

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = [];

for (const [jsonName, dbSearch] of Object.entries(manualMap)) {
  const team = teams.find(t => t.name === jsonName);
  if (!team) continue;

  const [rows] = await conn.execute(
    'SELECT id, name FROM teams WHERE name LIKE ?',
    [`%${dbSearch}%`]
  );

  if (rows.length === 1) {
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, rows[0].id]
    );
    console.log(`✅ ${rows[0].name} (mapeado de: "${jsonName}")`);
    updated++;
  } else if (rows.length > 1) {
    console.log(`⚠️  Múltiplos resultados para "${dbSearch}": ${rows.map(r => r.name).join(', ')}`);
    notFound.push(jsonName);
  } else {
    console.log(`❌ Não encontrado: "${dbSearch}" (de: "${jsonName}")`);
    notFound.push(jsonName);
  }
}

await conn.end();

console.log(`\n✅ ${updated} times corrigidos`);
if (notFound.length > 0) {
  console.log('\n❌ Ainda não encontrados:');
  notFound.forEach(t => console.log(`  - "${t}"`));
}
