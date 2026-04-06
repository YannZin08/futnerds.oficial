import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const teams = JSON.parse(readFileSync('/home/ubuntu/upload/times_2026-04-06(2).json', 'utf-8'));

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = [];

for (const team of teams) {
  // Tenta match exato primeiro
  const [rows] = await conn.execute(
    'SELECT id, name FROM teams WHERE name = ?',
    [team.name]
  );

  if (rows.length > 0) {
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, rows[0].id]
    );
    console.log(`✅ ${rows[0].name}`);
    updated++;
    continue;
  }

  // Tenta match parcial com as primeiras palavras significativas
  const nameParts = team.name.split(' ').filter(w => w.length > 2);
  let found = false;

  for (let i = 0; i < Math.min(3, nameParts.length); i++) {
    const keyword = nameParts[i];
    const [likeRows] = await conn.execute(
      'SELECT id, name FROM teams WHERE name LIKE ?',
      [`%${keyword}%`]
    );

    if (likeRows.length === 1) {
      await conn.execute(
        'UPDATE teams SET description = ? WHERE id = ?',
        [team.historicalSummary, likeRows[0].id]
      );
      console.log(`✅ ${likeRows[0].name} (match parcial: "${team.name}")`);
      updated++;
      found = true;
      break;
    }
  }

  if (!found) {
    // Tenta com múltiplas palavras
    if (nameParts.length >= 2) {
      const [multiRows] = await conn.execute(
        'SELECT id, name FROM teams WHERE name LIKE ? AND name LIKE ?',
        [`%${nameParts[0]}%`, `%${nameParts[1]}%`]
      );
      if (multiRows.length === 1) {
        await conn.execute(
          'UPDATE teams SET description = ? WHERE id = ?',
          [team.historicalSummary, multiRows[0].id]
        );
        console.log(`✅ ${multiRows[0].name} (match duplo: "${team.name}")`);
        updated++;
        found = true;
      }
    }
  }

  if (!found) {
    notFound.push(team.name);
  }
}

await conn.end();

console.log(`\n✅ ${updated}/${teams.length} times atualizados`);
if (notFound.length > 0) {
  console.log('\n❌ Não encontrados:');
  notFound.forEach(t => console.log(`  - "${t}"`));
}
