import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/eua.json', 'utf8'));

// Mapeamento: nome no JSON → id no banco
const nameMap = {
  "Atlanta United FC": 60192,              // Atlanta United
  "Charlotte Football Club": 60181,        // Charlotte FC
  "Chicago Fire FC": 60178,               // Chicago Fire
  "Football Club Cincinnati": 60183,       // FC Cincinnati
  "Columbus Crew": 60186,                  // Columbus Crew
  "D.C. United": 60197,                    // DC United
  "Club Internacional de Fútbol Miami": 60175, // Inter Miami
  "Club de Foot Montréal": 60200,          // CF Montréal
  "Nashville Soccer Club": 60191,          // Nashville SC
  "New England Revolution": 60195,         // New England Revolution
  "New York City Football Club": 60187,    // New York City FC
  "New York Red Bulls": 60202,             // New York Red Bulls
  "Orlando City SC": 60189,               // Orlando City SC
  "Philadelphia Union": 60196,             // Philadelphia Union
  "Toronto Football Club": 60201,          // Toronto FC
  "Austin FC": 60190,                      // Austin FC
  "Colorado Rapids": 60198,               // Colorado Rapids
  "Football Club Dallas": 60199,           // FC Dallas
  "Houston Dynamo FC": 60180,             // Houston Dynamo
  "Los Angeles Galaxy": 60179,             // LA Galaxy
  "Los Angeles Football Club": 60176,      // Los Angeles FC
  "Minnesota United FC": 60184,            // Minnesota United FC
  "Portland Timbers": 60185,              // Portland Timbers
  "Real Salt Lake": 60188,                // Real Salt Lake
  "San Jose Earthquakes": 60203,           // San Jose Earthquakes
  "Seattle Sounders FC": 60177,            // Seattle Sounders FC
  "Sporting Kansas City": 60204,           // Sporting Kansas City
  "St. Louis City SC": 60194,             // St. Louis CITY SC
  "Vancouver Whitecaps FC": 60182,         // Vancouver Whitecaps FC
  // San Diego FC não está no JSON, mas está no banco (60193)
};

const pool = createPool(process.env.DATABASE_URL);

let updated = 0;
let skipped = 0;

for (const entry of data) {
  const id = nameMap[entry.name];
  if (id === undefined) {
    console.log(`❓ Não mapeado: ${entry.name}`);
    skipped++;
    continue;
  }
  if (!id) {
    console.log(`⚠️  Ignorado (não encontrado no banco): ${entry.name}`);
    skipped++;
    continue;
  }
  await pool.query('UPDATE teams SET description = ? WHERE id = ?', [entry.historicalSummary, id]);
  console.log(`✅ Atualizado: ${entry.name} (id ${id})`);
  updated++;
}

console.log(`\n📊 Resultado: ${updated} atualizados, ${skipped} ignorados`);

const [rows] = await pool.query('SELECT COUNT(*) as total FROM teams WHERE description IS NOT NULL AND description != ""');
console.log(`📚 Total de times com descrição no banco: ${rows[0].total}`);

await pool.end();
