import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega dotenv
require('dotenv').config({ path: join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const JSON_PATH = process.argv[2] || "/home/ubuntu/upload/sofifa_team_details_2026-03-31(1).json";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERRO: DATABASE_URL não encontrada');
    process.exit(1);
  }

  console.log('Lendo JSON:', JSON_PATH);
  const teamsData = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Total de times no JSON: ${teamsData.length}`);

  // Parse da URL do banco
  const url = new URL(dbUrl.replace('mysql2://', 'mysql://'));
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1).split('?')[0],
    ssl: { rejectUnauthorized: false },
  });

  // Busca todos os times do banco
  const [dbTeams] = await conn.execute('SELECT id, name FROM teams');
  const dbTeamsMap = {};
  for (const t of dbTeams) {
    dbTeamsMap[t.name.toLowerCase()] = t.id;
  }

  let updated = 0;
  const notFound = [];

  for (const item of teamsData) {
    const name = (item.nome || '').trim();
    const stadium = (item.estadio || '').trim() || null;
    const rival = (item.rivalTime || '').trim() || null;
    const prestigeInt = item.prestigioInternacional != null ? parseInt(item.prestigioInternacional) : null;
    const prestigeLocal = item.prestigioLocal != null ? parseInt(item.prestigioLocal) : null;

    const teamId = dbTeamsMap[name.toLowerCase()];
    if (!teamId) {
      notFound.push(name);
      continue;
    }

    await conn.execute(
      `UPDATE teams SET stadiumName = ?, rivalTeam = ?, prestige = ?, localPrestige = ? WHERE id = ?`,
      [stadium, rival, isNaN(prestigeInt) ? null : prestigeInt, isNaN(prestigeLocal) ? null : prestigeLocal, teamId]
    );
    updated++;
  }

  await conn.end();

  console.log(`\n✅ Times atualizados: ${updated}`);
  if (notFound.length > 0) {
    console.log(`⚠️  Times NÃO encontrados no banco (${notFound.length}):`);
    notFound.forEach(n => console.log(`   - ${n}`));
  } else {
    console.log('✅ Todos os times do JSON foram encontrados no banco!');
  }
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
