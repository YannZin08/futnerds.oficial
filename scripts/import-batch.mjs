import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

require('dotenv').config({ path: join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const FILES = [
  '/home/ubuntu/upload/sofifa_team_details_2026-04-01frança.json',
  '/home/ubuntu/upload/sofifa_team_details_2026-04-01espanha.json',
  '/home/ubuntu/upload/sofifa_team_details_2026-04-01italia.json',
  '/home/ubuntu/upload/sofifa_team_details_2026-04-01bundesliga.json',
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error('ERRO: DATABASE_URL não encontrada'); process.exit(1); }

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
  const teamsMap = new Map(dbTeams.map(t => [t.name.toLowerCase(), t.id]));
  console.log(`Times no banco: ${dbTeams.length}`);

  let totalUpdated = 0;
  const allNotFound = [];

  for (const filePath of FILES) {
    const fileName = filePath.split('/').pop();
    const items = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(`\nProcessando ${fileName}: ${items.length} times`);

    let updated = 0;
    const notFound = [];

    for (const item of items) {
      const name = (item.nome || '').trim();
      const teamId = teamsMap.get(name.toLowerCase());
      if (!teamId) { notFound.push(name); continue; }

      const stadium = item.estadio?.trim() || null;
      const rival = item.rivalTime?.trim() || null;
      const prestigeInt = item.prestigioInternacional != null ? parseInt(String(item.prestigioInternacional)) : null;
      const prestigeLocal = item.prestigioLocal != null ? parseInt(String(item.prestigioLocal)) : null;

      await conn.execute(
        `UPDATE teams SET stadiumName = ?, rivalTeam = ?, prestige = ?, localPrestige = ? WHERE id = ?`,
        [stadium, rival, isNaN(prestigeInt) ? null : prestigeInt, isNaN(prestigeLocal) ? null : prestigeLocal, teamId]
      );
      updated++;
    }

    console.log(`  ✅ Atualizados: ${updated}`);
    if (notFound.length > 0) {
      console.log(`  ⚠️  Não encontrados (${notFound.length}):`);
      notFound.forEach(n => console.log(`     - ${n}`));
      allNotFound.push(...notFound);
    }
    totalUpdated += updated;
  }

  await conn.end();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ TOTAL ATUALIZADO: ${totalUpdated} times`);
  if (allNotFound.length > 0) {
    console.log(`⚠️  Total não encontrados: ${allNotFound.length}`);
  } else {
    console.log('✅ Todos os times foram encontrados no banco!');
  }
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
