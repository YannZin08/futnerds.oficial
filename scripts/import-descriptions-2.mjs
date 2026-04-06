import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const teams = JSON.parse(readFileSync('/home/ubuntu/upload/times_2026-04-06(1).json', 'utf-8'));

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
  } else {
    // Tenta match parcial (LIKE)
    const nameParts = team.name.split(' ');
    const keyword = nameParts[0]; // primeira palavra
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
    } else if (likeRows.length > 1) {
      // Tenta match com segunda palavra também
      const keyword2 = nameParts.length > 1 ? nameParts[1] : '';
      const [likeRows2] = await conn.execute(
        'SELECT id, name FROM teams WHERE name LIKE ? AND name LIKE ?',
        [`%${keyword}%`, `%${keyword2}%`]
      );
      if (likeRows2.length === 1) {
        await conn.execute(
          'UPDATE teams SET description = ? WHERE id = ?',
          [team.historicalSummary, likeRows2[0].id]
        );
        console.log(`✅ ${likeRows2[0].name} (match duplo: "${team.name}")`);
        updated++;
      } else {
        notFound.push({ json: team.name, candidates: likeRows.map(r => r.name) });
      }
    } else {
      notFound.push({ json: team.name, candidates: [] });
    }
  }
}

await conn.end();

console.log(`\n✅ ${updated}/${teams.length} times atualizados`);
if (notFound.length > 0) {
  console.log('\n❌ Não encontrados:');
  notFound.forEach(t => console.log(`  - "${t.json}" → candidatos: ${t.candidates.join(', ') || 'nenhum'}`));
}
