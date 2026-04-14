import mysql from "mysql2/promise";
import { readFileSync, existsSync } from "fs";
import { basename, extname } from "path";

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DB_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Variáveis de ambiente necessárias: DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

// Upload de arquivo para o CDN via Forge API (mesmo padrão do storage.ts)
async function uploadFile(filePath, relKey) {
  const ext = extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  
  const fileBuffer = readFileSync(filePath);
  const fileName = basename(relKey);
  
  const uploadUrl = new URL(`${FORGE_API_URL}/v1/storage/upload`);
  uploadUrl.searchParams.set("path", relKey);
  
  const blob = new Blob([fileBuffer], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, fileName);
  
  const response = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: form,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload falhou: ${response.status} ${text.substring(0, 200)}`);
  }
  
  const data = await response.json();
  return data.url;
}

async function main() {
  const matches = JSON.parse(readFileSync('/tmp/image_matches.json', 'utf8'));
  console.log(`Total a processar: ${matches.length}`);
  
  const conn = await mysql.createConnection(DB_URL);
  
  let updated = 0;
  let failed = 0;
  const errors = [];
  
  for (let i = 0; i < matches.length; i++) {
    const { id, name, file, filename } = matches[i];
    
    if (!existsSync(file)) {
      console.log(`  ⚠️  Arquivo não encontrado: ${file}`);
      failed++;
      continue;
    }
    
    try {
      const ext = extname(filename);
      const baseName = basename(filename, ext);
      const relKey = `player-images/${baseName}_${randomSuffix()}${ext}`;
      
      const cdnUrl = await uploadFile(file, relKey);
      
      if (!cdnUrl) {
        throw new Error('URL não retornada pelo upload');
      }
      
      await conn.execute(
        'UPDATE players SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
        [cdnUrl, id]
      );
      
      updated++;
      if (updated % 25 === 0 || updated <= 3) {
        console.log(`  [${i+1}/${matches.length}] ✅ ${name}`);
      }
    } catch (err) {
      failed++;
      errors.push({ id, name, erro: err.message });
      if (errors.length <= 5) {
        console.log(`  ❌ ${name}: ${err.message.substring(0, 100)}`);
      }
    }
    
    // Pequena pausa a cada 10 uploads
    if (i % 10 === 9) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  await conn.end();
  
  console.log(`\n✅ Concluído:`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Falhos: ${failed}`);
  if (errors.length > 0) {
    console.log(`\nErros (primeiros 10):`);
    errors.slice(0, 10).forEach(e => console.log(`  - ${e.name}: ${e.erro}`));
  }
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
