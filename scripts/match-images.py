"""
Script para fazer o match entre nomes de arquivos PNG e nomes de jogadores no banco.
Gera um arquivo JSON com o mapeamento id -> arquivo.
"""
import os
import re
import json
import unicodedata

IMG_DIR = "/home/ubuntu/upload/imagens_jogadores/imagens_jogadores"

def normalize(s):
    """Normaliza string: remove acentos, lowercase, substitui espaços/pontos/hífens por _"""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')  # remove diacríticos
    s = s.lower()
    s = re.sub(r'[^a-z0-9]', '_', s)  # substitui não-alfanumérico por _
    s = re.sub(r'_+', '_', s)  # colapsa múltiplos _
    s = s.strip('_')
    return s

# Carregar lista de arquivos
files = {}
for fname in os.listdir(IMG_DIR):
    if fname.endswith('.png') or fname.endswith('.webp'):
        key = fname.rsplit('.', 1)[0]  # remove extensão
        files[key] = fname

print(f"Arquivos disponíveis: {len(files)}")
print("Exemplos:", list(files.keys())[:10])

# Carregar jogadores do banco via arquivo temporário
import subprocess
result = subprocess.run(
    ['node', '-e', '''
import("mysql2/promise").then(async ({createConnection}) => {
  const conn = await createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute(
    "SELECT id, name, imageUrl FROM players WHERE imageUrl LIKE \\'%sofifa%\\' OR imageUrl IS NULL OR imageUrl = \\'\\'");
  console.log(JSON.stringify(rows));
  await conn.end();
});
'''],
    capture_output=True, text=True, cwd='/home/ubuntu/futnerds'
)
players = json.loads(result.stdout)
print(f"\nJogadores a processar: {len(players)}")

# Fazer match
matches = []
no_match = []

for p in players:
    name = p['name']
    norm_name = normalize(name)
    
    # Tentar match direto
    matched_file = None
    
    # 1. Match exato
    if norm_name in files:
        matched_file = files[norm_name]
    
    # 2. Se nome tem inicial (ex: "E. Haaland" -> "e_haaland")
    if not matched_file:
        # Tentar remover ponto e espaço após inicial
        # "E. Haaland" -> "e_haaland"
        m = re.match(r'^([a-z])_(.+)$', norm_name)
        if m:
            key = f"{m.group(1)}_{m.group(2)}"
            if key in files:
                matched_file = files[key]
    
    # 3. Tentar só o sobrenome (última palavra)
    if not matched_file:
        parts = norm_name.split('_')
        if len(parts) > 1:
            last = parts[-1]
            if last in files:
                matched_file = files[last]
    
    # 4. Tentar nome completo sem inicial (ex: "Vitinha" -> "vitinha")
    if not matched_file:
        simple = norm_name.replace('_', '')
        for k, v in files.items():
            if k.replace('_', '') == simple:
                matched_file = v
                break
    
    if matched_file:
        matches.append({
            'id': p['id'],
            'name': name,
            'file': os.path.join(IMG_DIR, matched_file),
            'filename': matched_file
        })
    else:
        no_match.append({'id': p['id'], 'name': name, 'norm': norm_name})

print(f"\nMatches encontrados: {len(matches)}")
print(f"Sem match: {len(no_match)}")

if no_match:
    print("\nSem match (primeiros 20):")
    for p in no_match[:20]:
        print(f"  {p['id']} {p['name']} (norm: {p['norm']})")

# Salvar mapeamento
with open('/tmp/image_matches.json', 'w') as f:
    json.dump(matches, f, indent=2)

print(f"\nMapeamento salvo em /tmp/image_matches.json")
