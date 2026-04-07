import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const teams = JSON.parse(readFileSync('/home/ubuntu/upload/espanha.json', 'utf-8'));

// Mapeamento manual para nomes que diferem do banco
const manualMap = {
  "Real Madrid Club de Fútbol": "Real Madrid",
  "Fútbol Club Barcelona": "FC Barcelona",
  "Club Atlético de Madrid, S.A.D.": "Atlético de Madrid",
  "Sevilla Fútbol Club": "Sevilla FC",
  "Real Sociedad de Fútbol S.A.D.": "Real Sociedad",
  "Villarreal Club de Fútbol, S.A.D.": "Villarreal CF",
  "Real Betis Balompié": "Real Betis",
  "Valencia Club de Fútbol S.A.D.": "Valencia CF",
  "Real Club Celta de Vigo S.A.D.": "Celta de Vigo",
  "Getafe Club de Fútbol S.A.D.": "Getafe CF",
  "Club Atlético Osasuna": "Osasuna",
  "Real Club Deportivo Mallorca": "RCD Mallorca",
  "Rayo Vallecano de Madrid, S.A.D.": "Rayo Vallecano",
  "Reial Club Deportiu Espanyol de Barcelona": "RCD Espanyol",
  "Unión Deportiva Almería S.A.D.": "UD Almería",
  "Real Valladolid Club de Fútbol, S.A.D.": "Real Valladolid",
  "Sociedad Deportiva Eibar": "SD Eibar",
  "Club Deportivo Leganés S.A.D.": "CD Leganés",
  "Real Sporting de Gijón, S.A.D.": "Sporting de Gijón",
  "Real Zaragoza S.A.D.": "Real Zaragoza",
  "Club Deportivo Tenerife": "CD Tenerife",
  "Real Racing Club de Santander": "Racing de Santander",
  "Real Club Deportivo de La Coruña": "Deportivo de La Coruña",
  "Villarreal Club de Fútbol B": "Villarreal CF B",
};

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = [];

for (const team of teams) {
  const searchName = manualMap[team.name] || team.name;
  
  // Tenta match exato primeiro
  let [rows] = await conn.execute(
    'SELECT id, name FROM teams WHERE name = ?',
    [searchName]
  );
  
  // Se não encontrou, tenta LIKE
  if (rows.length === 0) {
    [rows] = await conn.execute(
      'SELECT id, name FROM teams WHERE name LIKE ?',
      [`%${searchName}%`]
    );
  }

  if (rows.length === 1) {
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, rows[0].id]
    );
    console.log(`✅ ${rows[0].name}`);
    updated++;
  } else if (rows.length > 1) {
    // Pega o mais curto (mais provável de ser o time principal)
    const best = rows.sort((a, b) => a.name.length - b.name.length)[0];
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, best.id]
    );
    console.log(`✅ ${best.name} (escolhido entre: ${rows.map(r => r.name).join(', ')})`);
    updated++;
  } else {
    console.log(`❌ Não encontrado: "${searchName}" (original: "${team.name}")`);
    notFound.push(team.name);
  }
}

await conn.end();

console.log(`\n✅ ${updated}/${teams.length} times atualizados`);
if (notFound.length > 0) {
  console.log('\n❌ Não encontrados:');
  notFound.forEach(t => console.log(`  - "${t}"`));
}
