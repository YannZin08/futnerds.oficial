import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/escocia.json', 'utf8'));

// Mapeamento: nome no JSON → id no banco
const nameMap = {
  "The Celtic Football Club": 60121,       // Celtic
  "Rangers Football Club": 60122,          // Rangers FC
  "Aberdeen Football Club": 60124,         // Aberdeen
  "Heart of Midlothian Football Club": 60123, // Hearts
  "Hibernian Football Club": 60125,        // Hibernian
  "Dundee United Football Club": 60127,    // Dundee United FC
  "Dundee Football Club": 60130,           // Dundee FC
  "Motherwell Football Club": 60126,       // Motherwell FC
  "Kilmarnock Football Club": 60128,       // Kilmarnock
  "St. Mirren Football Club": 60131,       // St. Mirren
  // St. Johnstone e Ross County não estão no banco (não são do FIFA 26)
};

const pool = createPool(process.env.DATABASE_URL);

let updated = 0;
let skipped = 0;

for (const entry of data) {
  const id = nameMap[entry.name];
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

// Verificar total com descrição
const [rows] = await pool.query('SELECT COUNT(*) as total FROM teams WHERE description IS NOT NULL AND description != ""');
console.log(`📚 Total de times com descrição no banco: ${rows[0].total}`);

await pool.end();
