import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/ubuntu/upload/portugal.json', 'utf8'));

// Mapeamento: nome no JSON → id no banco
// Banco: SL Benfica (60300), FC Porto (60301), Sporting CP (60299), Sporting Clube de Braga (60302),
//        Vitória SC (60306), Boavista (não está), Famalicão (60303), Gil Vicente FC (60307),
//        Casa Pia (60305), GD Estoril Praia (60304), FC Arouca (60309), Vizela (não está),
//        Moreirense FC (60312), Rio Ave FC (60311), Chaves (não está), Portimonense (não está),
//        Farense (não está), CD Nacional (60308)
const nameMap = {
  "Sport Lisboa e Benfica": 60300,         // SL Benfica
  "Futebol Clube do Porto": 60301,         // FC Porto
  "Sporting Clube de Portugal": 60299,     // Sporting CP
  "Sporting Clube de Braga": 60302,        // Sporting Clube de Braga
  "Vitória Sport Clube": 60306,            // Vitória SC
  "Boavista Futebol Clube": null,          // não está no banco
  "Futebol Clube de Famalicão": 60303,     // Famalicão
  "Gil Vicente Futebol Clube": 60307,      // Gil Vicente FC
  "Casa Pia Atlético Clube": 60305,        // Casa Pia
  "Grupo Desportivo Estoril Praia": 60304, // GD Estoril Praia
  "Futebol Clube de Arouca": 60309,        // FC Arouca
  "Futebol Clube de Vizela": null,         // não está no banco
  "Moreirense Futebol Clube": 60312,       // Moreirense FC
  "Rio Ave Futebol Clube": 60311,          // Rio Ave FC
  "Grupo Desportivo de Chaves": null,      // não está no banco
  "Portimonense Sporting Clube": null,     // não está no banco
  "Sporting Clube Farense": null,          // não está no banco
  "Club Nacional de Football": 60308,     // CD Nacional (nota: este é o Nacional da Madeira, não o uruguaio)
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
