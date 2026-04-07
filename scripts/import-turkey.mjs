import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/turquia.json', 'utf8'));

// Mapeamento: nome no JSON → id no banco
// Banco: Galatasaray SK, Fenerbahçe SK, Beşiktaş JK, Trabzonspor, Medipol Başakşehir FK,
//        Adana Demirspor (não está), Antalyaspor, Konyaspor, Samsunspor, Kayserispor,
//        Gaziantep FK, Alanyaspor, Hatayspor (não está), Ankaragücü (não está),
//        Çaykur Rizespor, Sivasspor (não está), Pendikspor (não está), İstanbulspor (não está)
const nameMap = {
  "Galatasaray Spor Kulübü": 60317,           // Galatasaray SK
  "Fenerbahçe Spor Kulübü": 60318,            // Fenerbahçe SK
  "Beşiktaş Jimnastik Kulübü": 60319,         // Beşiktaş JK
  "Trabzonspor Kulübü": 60320,                // Trabzonspor
  "İstanbul Başakşehir Futbol Kulübü": 60321, // Medipol Başakşehir FK
  "Adana Demirspor Kulübü": null,             // não está no banco
  "Antalyaspor Kulübü": 60333,                // Antalyaspor
  "Konyaspor Kulübü": 60323,                  // Konyaspor
  "Sivasspor Kulübü": null,                   // não está no banco
  "Kayserispor Kulübü": 60325,                // Kayserispor
  "Gaziantep Futbol Kulübü": 60329,           // Gaziantep FK
  "Alanyaspor Kulübü": 60330,                 // Alanyaspor
  "Hatayspor Kulübü": null,                   // não está no banco
  "MKE Ankaragücü": null,                     // não está no banco
  "Çaykur Rizespor Kulübü": 60328,            // Çaykur Rizespor
  "Samsunspor Kulübü": 60322,                 // Samsunspor
  "Pendikspor Kulübü": null,                  // não está no banco
  "İstanbulspor A.Ş.": null,                  // não está no banco
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
