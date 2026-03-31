#!/usr/bin/env python3
"""
Script de importação de detalhes dos times a partir de JSON.
Compara pelo nome do time e atualiza: stadiumName, rivalTeam, prestige (internacional), localPrestige.
"""

import json
import os
import sys
import mysql.connector
from urllib.parse import urlparse

# Lê DATABASE_URL do ambiente ou do .env
def get_db_config():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        # Tenta ler do .env
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    if not db_url:
        print("ERRO: DATABASE_URL não encontrada no ambiente ou .env")
        sys.exit(1)
    return db_url

def parse_db_url(db_url):
    # Remove prefixo mysql:// ou mysql2://
    if db_url.startswith("mysql2://"):
        db_url = "mysql://" + db_url[9:]
    parsed = urlparse(db_url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/").split("?")[0],
        "ssl_disabled": False,
    }

def main():
    json_path = sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/upload/sofifa_team_details_2026-03-31(1).json"

    print(f"Lendo JSON: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        teams_data = json.load(f)

    print(f"Total de times no JSON: {len(teams_data)}")

    db_url = get_db_config()
    cfg = parse_db_url(db_url)

    conn = mysql.connector.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        ssl_disabled=cfg["ssl_disabled"],
    )
    cursor = conn.cursor(dictionary=True)

    # Busca todos os times do banco
    cursor.execute("SELECT id, name FROM teams")
    db_teams = cursor.fetchall()
    db_teams_map = {t["name"].lower(): t["id"] for t in db_teams}

    updated = 0
    not_found = []

    for item in teams_data:
        name = item.get("nome", "").strip()
        stadium = item.get("estadio", "").strip() or None
        rival = item.get("rivalTime", "").strip() or None
        prestige_int = item.get("prestigioInternacional")
        prestige_local = item.get("prestigioLocal")

        # Converte para int se possível
        try:
            prestige_int = int(prestige_int) if prestige_int is not None else None
        except (ValueError, TypeError):
            prestige_int = None
        try:
            prestige_local = int(prestige_local) if prestige_local is not None else None
        except (ValueError, TypeError):
            prestige_local = None

        team_id = db_teams_map.get(name.lower())
        if team_id is None:
            not_found.append(name)
            continue

        cursor.execute("""
            UPDATE teams
            SET stadiumName = %s,
                rivalTeam = %s,
                prestige = %s,
                localPrestige = %s
            WHERE id = %s
        """, (stadium, rival, prestige_int, prestige_local, team_id))
        updated += 1

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n✅ Times atualizados: {updated}")
    if not_found:
        print(f"⚠️  Times NÃO encontrados no banco ({len(not_found)}):")
        for n in not_found:
            print(f"   - {n}")
    else:
        print("✅ Todos os times do JSON foram encontrados no banco!")

if __name__ == "__main__":
    main()
