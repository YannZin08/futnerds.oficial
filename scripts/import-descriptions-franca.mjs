import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const teams = JSON.parse(readFileSync('/home/ubuntu/upload/frança.json', 'utf-8'));

// Mapeamento manual para nomes que diferem do banco
const manualMap = {
  "Paris Saint-Germain Football Club": "Paris Saint-Germain",
  "Olympique de Marseille": "Olympique de Marseille",
  "Olympique Lyonnais": "Olympique Lyonnais",
  "Association Sportive de Monaco Football Club": "AS Monaco",
  "Lille Olympique Sporting Club": "Lille OSC",
  "Stade Rennais Football Club": "Stade Rennais FC",
  "Olympique Gymnaste Club Nice Côte d'Azur": "OGC Nice",
  "Racing Club de Lens": "RC Lens",
  "Racing Club de Strasbourg Alsace": "RC Strasbourg Alsace",
  "Football Club de Nantes": "FC Nantes",
  "Montpellier Hérault Sport Club": "Montpellier HSC",
  "Stade de Reims": "Stade de Reims",
  "Toulouse Football Club": "Toulouse FC",
  "Stade Brestois 29": "Stade Brestois 29",
  "Football Club de Lorient Bretagne Sud": "FC Lorient",
  "Football Club de Metz": "FC Metz",
  "Le Havre Athletic Club": "Le Havre AC",
  "Clermont Foot 63": "Clermont Foot 63",
  "Association Sportive de Saint-Étienne Loire": "AS Saint-Étienne",
  "Football Club des Girondins de Bordeaux": "FC Girondins de Bordeaux",
  "Association de la Jeunesse Auxerroise": "AJ Auxerre",
  "Angers Sporting Club de l'Ouest": "Angers SCO",
  "Stade Malherbe Caen Calvados Basse-Normandie": "SM Caen",
  "En Avant de Guingamp": "EA Guingamp",
  "Amiens Sporting Club": "Amiens SC",
  "Sporting Club de Bastia": "SC Bastia",
  "Grenoble Foot 38": "Grenoble Foot 38",
  "Paris Football Club": "Paris FC",
  "Rodez Aveyron Football": "Rodez AF",
  "Stade Lavallois Mayenne Football Club": "Stade Lavallois",
  "Football Club d'Annecy": "FC Annecy",
  "Valenciennes Football Club": "Valenciennes FC",
  "Union Sportive du Littoral de Dunkerque": "USL Dunkerque",
  "Espérance Sportive Troyes Aube Champagne (ESTAC)": "ESTAC Troyes",
  "Pau Football Club": "Pau FC",
  "Quevilly-Rouen Métropole": "QRM",
};

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = [];

for (const team of teams) {
  const searchName = manualMap[team.name] || team.name;
  
  // Tenta match exato primeiro
  let [rows] = await conn.execute(
    'SELECT id, name FROM teams WHERE name = ?',
    [searchName]
  );
  
  // Se não encontrou, tenta LIKE
  if (rows.length === 0) {
    const keyword = searchName.split(' ')[1] || searchName.split(' ')[0];
    [rows] = await conn.execute(
      'SELECT id, name FROM teams WHERE name LIKE ? AND name LIKE ?',
      [`%${searchName.split(' ')[0]}%`, `%${keyword}%`]
    );
  }

  // Última tentativa com parte do nome
  if (rows.length === 0) {
    const part = searchName.replace(/^(FC|AS|RC|OGC|AJ|SM|EA|SC|US|USL|QRM)\s/i, '').split(' ')[0];
    [rows] = await conn.execute(
      'SELECT id, name FROM teams WHERE name LIKE ?',
      [`%${part}%`]
    );
  }

  if (rows.length === 1) {
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, rows[0].id]
    );
    console.log(`✅ ${rows[0].name}`);
    updated++;
  } else if (rows.length > 1) {
    // Pega o que tem nome mais próximo
    const best = rows.find(r => r.name.toLowerCase().includes(searchName.toLowerCase().split(' ').pop())) || rows[0];
    await conn.execute(
      'UPDATE teams SET description = ? WHERE id = ?',
      [team.historicalSummary, best.id]
    );
    console.log(`✅ ${best.name} (escolhido entre: ${rows.map(r => r.name).join(', ')})`);
    updated++;
  } else {
    console.log(`❌ Não encontrado: "${searchName}" (original: "${team.name}")`);
    notFound.push(team.name);
  }
}

await conn.end();

console.log(`\n✅ ${updated}/${teams.length} times atualizados`);
if (notFound.length > 0) {
  console.log('\n❌ Não encontrados:');
  notFound.forEach(t => console.log(`  - "${t}"`));
}
