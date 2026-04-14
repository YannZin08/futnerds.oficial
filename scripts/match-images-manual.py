"""
Match manual para jogadores com nomes especiais cujos arquivos foram truncados.
"""
import os
import re
import json
import unicodedata
import subprocess

IMG_DIR = "/home/ubuntu/upload/imagens_jogadores/imagens_jogadores"

# Mapeamento manual: nome do jogador (banco) -> arquivo PNG
MANUAL_MAP = {
    "K. Mbappé": "k_mbapp.png",
    "O. Dembélé": "o_dembl.png",
    "Rúben Dias": "rben_dias.png",
    "João Cancelo": "joo_cancelo.png",
    "D. Vlahović": "d_vlahovi.png",
    "É. Mendy": "_mendy.png",
    "Á. Correa": "_correa.png",
    "İ. Gündoğan": "_gndoan.png",
    "K. Aktürkoğlu": "k_aktrkolu.png",
    "Angeliño": "angelio.png",
    "A. Kramarić": "a_kramari.png",
    "Đ. Petrović": "_petrovi.png",
}

# Verificar quais arquivos existem
available = set(os.listdir(IMG_DIR))

# Carregar jogadores com URL do sofifa
result = subprocess.run(
    ['node', '-e', '''
import("mysql2/promise").then(async ({createConnection}) => {
  const conn = await createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute(
    "SELECT id, name, imageUrl FROM players WHERE imageUrl LIKE \\'%sofifa%\\'");
  console.log(JSON.stringify(rows));
  await conn.end();
});
'''],
    capture_output=True, text=True, cwd='/home/ubuntu/futnerds'
)
players = json.loads(result.stdout)

matches = []
for p in players:
    name = p['name']
    if name in MANUAL_MAP:
        fname = MANUAL_MAP[name]
        if fname in available:
            matches.append({
                'id': p['id'],
                'name': name,
                'file': os.path.join(IMG_DIR, fname),
                'filename': fname
            })
            print(f"  ✅ {name} -> {fname}")
        else:
            print(f"  ⚠️  Arquivo não encontrado: {fname}")

print(f"\nMatches manuais: {len(matches)}")

with open('/tmp/image_matches_manual.json', 'w') as f:
    json.dump(matches, f, indent=2)
print("Salvo em /tmp/image_matches_manual.json")
