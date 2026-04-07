import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Mapeamentos de nomes JSON → nomes no banco para cada liga
const mappings = {
  belgica: {
    "Club Brugge Koninklijke Voetbalvereniging": "Club Brugge KV",
    "Royal Sporting Club Anderlecht": "RSC Anderlecht",
    "Koninklijke Racing Club Genk": "KRC Genk",
    "Royal Antwerp Football Club": "Royal Antwerp FC",
    "KAA Gent": "KAA Gent",
    "Royal Standard de Liège": "Standard de Liège",
    "Royale Union Saint-Gilloise": "Union Saint-Gilloise",
    "Royal Charleroi Sporting Club": "Royal Charleroi Sporting Club",
    "Yellow-Red Koninklijke Voetbalclub Mechelen": "KV Mechelen",
    "Cercle Brugge Koninklijke Sportvereniging": "Cercle Brugge KSV",
    "K.V.C. Westerlo": "KVC Westerlo",
    "Oud-Heverlee Leuven": "Oud-Heverlee Leuven",
    "Sint-Truidense Voetbalvereniging": "Sint-Truidense VV",
    "Koninklijke Sportkring Kortrijk": null, // não está no banco
    "Allgemeine Sportvereinigung Eupen": null, // não está no banco
    "Racing White Daring Molenbeek": null, // não está no banco
  },
  argentina: {
    "Club Atlético River Plate": "River Plate",
    "Club Atlético Boca Juniors": "Boca Juniors",
    "Club Atlético Independiente": "Independiente",
    "Racing Club de Avellaneda": "Racing Club",
    "Club Atlético San Lorenzo de Almagro": "San Lorenzo de Almagro",
    "Club Estudiantes de La Plata": "Estudiantes de La Plata",
    "Club Atlético Vélez Sarsfield": "Vélez Sarsfield",
    "Club Atlético Rosario Central": "Rosario Central",
    "Club Atlético Newell's Old Boys": "Newell's Old Boys",
    "Club Atlético Talleres": "Talleres",
    "Club Social y Deportivo Defensa y Justicia": "Defensa y Justicia",
    "Club Atlético Lanús": "Lanús",
    "Club Atlético Banfield": "CA Banfield",
    "Asociación Atlética Argentinos Juniors": "Argentinos Juniors",
    "Club Atlético Huracán": "Huracán",
    "Club de Gimnasia y Esgrima La Plata": "Gimnasia y Esgrima La Plata",
    "Club Atlético Colón": null, // não está no banco
    "Club Atlético Unión": "Club Atlético Unión",
    "Club Atlético Platense": "Platense",
    "Club Atlético Sarmiento": "Club Atlético Sarmiento",
    "Club Atlético Central Córdoba de Santiago del Estero": "Central Cordoba SdE",
    "Club Atlético Tigre": "Tigre",
    "Club Atlético Barracas Central": "Barracas Central",
    "Instituto Atlético Central Córdoba": "Instituto Atlético Central Córdoba",
    "Arsenal Fútbol Club": null, // Arsenal no banco é o inglês
    "Club Deportivo Godoy Cruz Antonio Tomba": "Godoy Cruz",
    "Club Atlético Tucumán": "Atlético Tucumán",
    "Club Atlético Belgrano": "Belgrano de Córdoba",
  },
  arabia: {
    "Al-Hilal Saudi Football Club": "Al Hilal",
    "Al-Nassr Football Club": "Al Nassr",
    "Ittihad Club": "Al Ittihad",
    "Al-Ahli Saudi Football Club": "Al Ahli SFC",
    "Al-Ettifaq Football Club": "Al Ettifaq",
    "Al-Fateh Sports Club": "Al Fateh",
    "Al-Fayha Football Club": "Al Fayha",
    "Al-Raed Saudi Football Club": null, // não está no banco (Al Raed)
    "Al-Taawoun Football Club": "Al Taawoun FC",
    "Abha Club": null, // não está no banco
    "Damac Football Club": "Damac FC",
    "Al-Okhdood Club": "Al Akhdoud Saudi Club",
    "Al-Riyadh Saudi Club": "Al Riyadh",
    "Al-Khaleej Football Club": "Al Khaleej",
    "Al-Hazem Saudi Club": "Al Hazem FC",
    "Al-Tai Saudi Club": null, // não está no banco
    "Al-Wehda Football Club": null, // não está no banco
    "Al-Shabab Football Club": "Al Shabab",
  },
  italia: {
    "Football Club Internazionale Milano": "Inter",
    "Associazione Calcio Milan": "AC Milan",
    "Juventus Football Club": "Juventus",
    "Società Sportiva Calcio Napoli": "Napoli",
    "Associazione Sportiva Roma": "Roma",
    "Società Sportiva Lazio": "Lazio",
    "Atalanta Bergamasca Calcio": "Atalanta",
    "ACF Fiorentina": "Fiorentina",
    "Bologna Football Club 1909": "Bologna",
    "Torino Football Club": "Torino",
    "Genoa Cricket and Football Club": "Genoa",
    "Udinese Calcio S.p.A.": "Udinese",
    "Unione Sportiva Sassuolo Calcio": "Sassuolo",
    "Hellas Verona Football Club": "Hellas Verona FC",
    "Unione Sportiva Lecce": "Lecce",
    "Cagliari Calcio": "Cagliari",
    "Associazione Calcio Monza": "Monza",
    "Empoli Football Club": "Empoli",
    "Parma Calcio 1913": "Parma",
    "Venezia Football Club": "Venezia",
    "Unione Calcio Sampdoria S.p.A.": "Sampdoria",
    "Palermo Football Club": "Palermo FC",
    "Società Sportiva Calcio Bari": "SSC Bari",
    "Pisa Sporting Club": "Pisa",
    "Spezia Calcio": "Spezia",
    "Unione Sportiva Cremonese": "Cremonese",
    "Como 1907": "Como",
    "Associazione Sportiva Reggiana 1919": "Reggiana",
    "Modena Football Club 2018": "Modena",
    "Football Club Südtirol": "Südtirol",
    "Ascoli Calcio 1898 FC": null, // não está no banco
    "Ternana Calcio S.p.A.": null, // não está no banco
    "Brescia Calcio": null, // não está no banco
    "Associazione Sportiva Cittadella": null, // não está no banco
    "Feralpisalò S.r.l.": null, // não está no banco
    "Unione Sportiva Catanzaro 1929": "Catanzaro",
    "Cosenza Calcio": null, // não está no banco
    "Associazione Calcio Mantova 1911": "Mantova",
    "Associazione Calcio Cesena": "Cesena FC",
    "Venezia FC B": null, // time B, não está no banco
  },
};

async function importFile(conn, filePath, nameMap, label) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const [teams] = await conn.execute('SELECT id, name FROM teams');
  
  let updated = 0;
  let skipped = 0;
  let notFound = [];

  for (const item of data) {
    const shortName = nameMap[item.name];
    
    if (shortName === null) {
      skipped++;
      console.log(`  ⏭  Ignorado (não no banco): ${item.name}`);
      continue;
    }
    
    if (shortName === undefined) {
      notFound.push(item.name + ' (sem mapeamento)');
      continue;
    }

    const match = teams.find(t =>
      t.name.toLowerCase() === shortName.toLowerCase() ||
      t.name.toLowerCase().includes(shortName.toLowerCase()) ||
      shortName.toLowerCase().includes(t.name.toLowerCase())
    );

    if (match) {
      await conn.execute(
        'UPDATE teams SET description = ? WHERE id = ?',
        [item.historicalSummary, match.id]
      );
      console.log(`  ✓ ${match.name}`);
      updated++;
    } else {
      notFound.push(`${item.name} → "${shortName}" (não encontrado no banco)`);
    }
  }

  console.log(`\n  ✅ ${label}: ${updated} atualizados, ${skipped} ignorados`);
  if (notFound.length > 0) {
    console.log(`  ⚠️  Não encontrados:`);
    notFound.forEach(n => console.log(`    - ${n}`));
  }
  return updated;
}

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let total = 0;

  console.log('\n=== BÉLGICA ===');
  total += await importFile(conn, '/home/ubuntu/upload/belgica.json', mappings.belgica, 'Bélgica');

  console.log('\n=== ARGENTINA ===');
  total += await importFile(conn, '/home/ubuntu/upload/argentina.json', mappings.argentina, 'Argentina');

  console.log('\n=== ARÁBIA SAUDITA ===');
  total += await importFile(conn, '/home/ubuntu/upload/arabia.json', mappings.arabia, 'Arábia Saudita');

  console.log('\n=== ITÁLIA ===');
  total += await importFile(conn, '/home/ubuntu/upload/italia.json', mappings.italia, 'Itália');

  console.log(`\n🏆 Total geral: ${total} times atualizados`);
  await conn.end();
}

run().catch(console.error);
