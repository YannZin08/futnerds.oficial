import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/holanda.json', 'utf8'));

// Mapeamento: nome no JSON → id no banco
const nameMap = {
  "Amsterdamsche Football Club Ajax": 60242,          // Ajax
  "Philips Sport Vereniging": 60241,                  // PSV
  "Feyenoord Rotterdam": 60243,                       // Feyenoord
  "Alkmaar Zaanstreek": 60244,                        // AZ Alkmaar
  "Football Club Utrecht": 60245,                     // FC Utrecht
  "Sportclub Heerenveen": 60250,                      // SC Heerenveen
  "Football Club Twente": 60247,                      // FC Twente
  "Stichting Betaald Voetbal Vitesse": null,          // Vitesse - não está no banco
  "Sparta Rotterdam": 60249,                          // Sparta Rotterdam
  "Nijmegen Eendracht Combinatie": 60246,             // NEC Nijmegen
  "Go Ahead Eagles": 60248,                           // Go Ahead Eagles
  "Fortuna Sittard": 60251,                           // Fortuna Sittard
  "PEC Zwolle": 60254,                                // PEC Zwolle
  "Rooms Katholieke Combinatie Waalwijk": null,       // RKC Waalwijk - não está no banco
  "Heracles Almelo": 60252,                           // Heracles Almelo
  "Football Club Groningen": 60255,                   // FC Groningen
  "Nooit Ophouden Altijd Doorgaan, Aangenaam Door Vermaak En Nuttig Door Ontspanning, Combinatie Breda": 60253, // NAC Breda
  "Almere City Football Club": null,                  // Almere City - não está no banco
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
