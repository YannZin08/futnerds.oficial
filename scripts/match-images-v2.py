"""
Script para fazer match fuzzy dos jogadores restantes com URL do sofifa.
"""
import os
import re
import json
import unicodedata
import subprocess

IMG_DIR = "/home/ubuntu/upload/imagens_jogadores/imagens_jogadores"

def normalize(s):
    """Normaliza string agressivamente: remove acentos, lowercase, substitui tudo por _"""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower()
    s = re.sub(r'[^a-z0-9]', '_', s)
    s = re.sub(r'_+', '_', s)
    s = s.strip('_')
    return s

def normalize_aggressive(s):
    """Normalização ainda mais agressiva: remove tudo que não é letra/número"""
    s = normalize(s)
    return re.sub(r'_', '', s)  # remove underscores também

# Carregar lista de arquivos
files = {}
files_norm_aggressive = {}
for fname in os.listdir(IMG_DIR):
    if fname.endswith('.png') or fname.endswith('.webp'):
        key = fname.rsplit('.', 1)[0]
        files[key] = fname
        files_norm_aggressive[normalize_aggressive(key)] = fname

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
print(f"Jogadores com URL sofifa: {len(players)}")

matches = []
no_match = []

for p in players:
    name = p['name']
    norm_name = normalize(name)
    agg_name = normalize_aggressive(name)
    
    matched_file = None
    
    # 1. Match exato
    if norm_name in files:
        matched_file = files[norm_name]
    
    # 2. Match sem underscores (agressivo)
    if not matched_file and agg_name in files_norm_aggressive:
        matched_file = files_norm_aggressive[agg_name]
    
    # 3. Match por partes (ex: "K. Mbappé" -> "k_mbapp" pode ser no arquivo)
    if not matched_file:
        parts = norm_name.split('_')
        if len(parts) >= 2:
            # Tentar inicial + sobrenome normalizado
            initial = parts[0]
            surname = '_'.join(parts[1:])
            key = f"{initial}_{surname}"
            if key in files:
                matched_file = files[key]
            # Tentar só o sobrenome
            elif surname in files:
                matched_file = files[surname]
    
    # 4. Match parcial: verificar se algum arquivo começa com a normalização
    if not matched_file:
        for k, v in files.items():
            # Verificar se as partes principais coincidem
            k_agg = normalize_aggressive(k)
            if agg_name == k_agg:
                matched_file = v
                break
            # Verificar se o sobrenome normalizado está contido
            if len(agg_name) >= 4 and agg_name in k_agg:
                matched_file = v
                break
    
    if matched_file:
        matches.append({
            'id': p['id'],
            'name': name,
            'file': os.path.join(IMG_DIR, matched_file),
            'filename': matched_file
        })
        print(f"  ✅ {name} -> {matched_file}")
    else:
        no_match.append({'id': p['id'], 'name': name, 'norm': norm_name})

print(f"\nMatches: {len(matches)}")
print(f"Sem match: {len(no_match)}")
if no_match:
    print("Sem match:")
    for p in no_match:
        print(f"  {p['id']} {p['name']}")

with open('/tmp/image_matches_v2.json', 'w') as f:
    json.dump(matches, f, indent=2)
print(f"\nSalvo em /tmp/image_matches_v2.json")
