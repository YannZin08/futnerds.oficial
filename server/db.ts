import { eq, desc, and, sql, count, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, news, players, userFavoritePlayers, userFavoriteTeams, InsertNews, InsertPlayer, spinListItems, spinHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { username?: string; bio?: string; favoriteTeam?: string; avatar?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── News ────────────────────────────────────────────────────────────────────

export async function getNewsList(opts: { limit?: number; category?: string; featured?: boolean } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 20, category, featured } = opts;

  const conditions = [];
  if (category) conditions.push(eq(news.category, category as any));
  if (featured !== undefined) conditions.push(eq(news.featured, featured));

  const query = db.select().from(news)
    .orderBy(desc(news.publishedAt))
    .limit(limit);

  if (conditions.length > 0) {
    return await db.select().from(news)
      .where(and(...conditions))
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  }
  return await query;
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Players ─────────────────────────────────────────────────────────────────

/**
 * Calcula o tipo do card com base no overall do jogador.
 * gold: 80+, silver: 70-79, bronze: abaixo de 70
 */
export function getCardType(overall: number): 'gold' | 'silver' | 'bronze' {
  if (overall >= 80) return 'gold';
  if (overall >= 70) return 'silver';
  return 'bronze';
}

export async function getPlayersList(opts: { limit?: number; position?: string; nationality?: string; sortBy?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 9999, position, nationality, sortBy = "overall" } = opts;
  const { teams } = await import("../drizzle/schema");

  const conditions = [];
  if (position) conditions.push(eq(players.position, position));
  if (nationality) conditions.push(eq(players.nationality, nationality));

  const orderCol = sortBy === "price" ? desc(players.price) : desc(players.overall);

  const selectFields = {
    id: players.id,
    name: players.name,
    position: players.position,
    nationality: players.nationality,
    club: players.club,
    league: players.league,
    overall: players.overall,
    potential: players.potential,
    age: players.age,
    altPositions: players.altPositions,
    pace: players.pace,
    shooting: players.shooting,
    passing: players.passing,
    dribbling: players.dribbling,
    defending: players.defending,
    physical: players.physical,
    cardType: players.cardType,
    rating: players.rating,
    imageUrl: players.imageUrl,
    flagUrl: players.flagUrl,
    clubLogoUrl: players.clubLogoUrl,
    price: players.price,
    createdAt: players.createdAt,
    updatedAt: players.updatedAt,
    teamId: teams.id,
    teamLogoUrl: teams.logoUrl,
  };

  const baseQuery = db
    .select(selectFields)
    .from(players)
    .leftJoin(teams, sql`LOWER(${teams.name}) = LOWER(${players.club})`);

  if (conditions.length > 0) {
    return await baseQuery
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(limit);
  }
  return await baseQuery.orderBy(orderCol).limit(limit);
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchPlayers(query: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(players)
    .where(sql`LOWER(${players.name}) LIKE ${`%${query.toLowerCase()}%`}`)
    .orderBy(desc(players.overall))
    .limit(limit);
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function getUserFavoritePlayers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: userFavoritePlayers.id,
    playerId: userFavoritePlayers.playerId,
    createdAt: userFavoritePlayers.createdAt,
    player: players,
  })
    .from(userFavoritePlayers)
    .innerJoin(players, eq(userFavoritePlayers.playerId, players.id))
    .where(eq(userFavoritePlayers.userId, userId));
}

export async function addFavoritePlayer(userId: number, playerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userFavoritePlayers).values({ userId, playerId }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function removeFavoritePlayer(userId: number, playerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userFavoritePlayers)
    .where(and(eq(userFavoritePlayers.userId, userId), eq(userFavoritePlayers.playerId, playerId)));
}

export async function getPlayersCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(players);
  return Number(result[0]?.count ?? 0);
}

// ─── Countries ─────────────────────────────────────────────────────────────────────────────

export async function getCountriesList() {
  const db = await getDb();
  if (!db) return [];
  const { countries } = await import("../drizzle/schema");
  return await db.select().from(countries).orderBy(countries.name);
}

// ─── Leagues ─────────────────────────────────────────────────────────────────

export async function getLeaguesByCountry(countryId: number) {
  const db = await getDb();
  if (!db) return [];
  const { leagues } = await import("../drizzle/schema");
  return await db.select().from(leagues)
    .where(eq(leagues.countryId, countryId))
    .orderBy(leagues.division);
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function searchTeams(query: string, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const { teams, leagues, countries } = await import("../drizzle/schema");
  const results = await db
    .select({
      id: teams.id,
      name: teams.name,
      shortName: teams.shortName,
      logoUrl: teams.logoUrl,
      stadiumName: teams.stadiumName,
      budget: teams.budget,
      prestige: teams.prestige,
      leagueName: leagues.name,
      countryName: countries.name,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .innerJoin(countries, eq(teams.countryId, countries.id))
    .where(like(teams.name, `%${query}%`))
    .orderBy(teams.name)
    .limit(limit);
  return results;
}

export async function getTeamsByLeague(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  const { teams } = await import("../drizzle/schema");
  return await db.select().from(teams)
    .where(eq(teams.leagueId, leagueId))
    .orderBy(teams.name);
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { teams, leagues } = await import("../drizzle/schema");
  const result = await db
    .select({
      id: teams.id,
      name: teams.name,
      shortName: teams.shortName,
      logoUrl: teams.logoUrl,
      stadiumName: teams.stadiumName,
      budget: teams.budget,
      prestige: teams.prestige,
      leagueId: teams.leagueId,
      countryId: teams.countryId,
      leagueName: leagues.name,
      leagueLogoUrl: leagues.logoUrl,
      localPrestige: teams.localPrestige,
      rivalTeam: teams.rivalTeam,
      description: teams.description,
    })
    .from(teams)
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(teams.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function importTeamDetails(items: Array<{
  nome: string;
  estadio?: string;
  rivalTime?: string;
  prestigioInternacional?: string | number;
  prestigioLocal?: string | number;
}>) {
  const db = await getDb();
  if (!db) return { updated: 0, notFound: [] as string[] };
  const { teams } = await import("../drizzle/schema");

  // Busca todos os times do banco
  const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
  const teamsMap = new Map(allTeams.map(t => [t.name.toLowerCase(), t.id]));

  let updated = 0;
  const notFound: string[] = [];

  for (const item of items) {
    const name = (item.nome || '').trim();
    const teamId = teamsMap.get(name.toLowerCase());
    if (!teamId) { notFound.push(name); continue; }

    const stadium = item.estadio?.trim() || null;
    const rival = item.rivalTime?.trim() || null;
    const prestigeInt = item.prestigioInternacional != null ? parseInt(String(item.prestigioInternacional)) : null;
    const prestigeLocal = item.prestigioLocal != null ? parseInt(String(item.prestigioLocal)) : null;

    await db.update(teams).set({
      stadiumName: stadium,
      rivalTeam: rival,
      prestige: isNaN(prestigeInt as number) ? null : prestigeInt,
      localPrestige: isNaN(prestigeLocal as number) ? null : prestigeLocal,
    }).where(eq(teams.id, teamId));
    updated++;
  }

  return { updated, notFound };
}

export async function getTeamByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const { teams } = await import("../drizzle/schema");
  const result = await db.select().from(teams)
    .where(sql`LOWER(${teams.name}) = LOWER(${name})`)
    .limit(1);
  return result[0] ?? null;
}

// ─── Favorite Teams ─────────────────────────────────────────────────────────

export async function getUserFavoriteTeams(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { teams, leagues } = await import("../drizzle/schema");
  return await db.select({
    id: userFavoriteTeams.id,
    teamId: userFavoriteTeams.teamId,
    createdAt: userFavoriteTeams.createdAt,
    teamName: teams.name,
    teamLogoUrl: teams.logoUrl,
    leagueName: leagues.name,
    leagueLogoUrl: leagues.logoUrl,
    prestige: teams.prestige,
  })
    .from(userFavoriteTeams)
    .innerJoin(teams, eq(userFavoriteTeams.teamId, teams.id))
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(userFavoriteTeams.userId, userId))
    .orderBy(desc(userFavoriteTeams.createdAt));
}

export async function addFavoriteTeam(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userFavoriteTeams).values({ userId, teamId }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function removeFavoriteTeam(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userFavoriteTeams)
    .where(and(eq(userFavoriteTeams.userId, userId), eq(userFavoriteTeams.teamId, teamId)));
}

export async function isTeamFavorited(userId: number, teamId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: userFavoriteTeams.id })
    .from(userFavoriteTeams)
    .where(and(eq(userFavoriteTeams.userId, userId), eq(userFavoriteTeams.teamId, teamId)))
    .limit(1);
  return result.length > 0;
}

export async function isPlayerFavorited(userId: number, playerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: userFavoritePlayers.id })
    .from(userFavoritePlayers)
    .where(and(eq(userFavoritePlayers.userId, userId), eq(userFavoritePlayers.playerId, playerId)))
    .limit(1);
  return result.length > 0;
}

export async function getPlayersByTeam(teamName: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(players)
    .where(sql`LOWER(${players.club}) = LOWER(${teamName})`)
    .orderBy(desc(players.overall));
}

// ─── Sorteio de Times ────────────────────────────────────────────────────────
export async function getSpinList(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { teams, leagues, countries } = await import("../drizzle/schema");
  return await db.select({
    id: spinListItems.id,
    teamId: spinListItems.teamId,
    teamName: teams.name,
    teamLogoUrl: teams.logoUrl,
    leagueName: leagues.name,
    countryName: countries.name,
    budget: teams.budget,
    prestige: teams.prestige,
  })
    .from(spinListItems)
    .innerJoin(teams, eq(spinListItems.teamId, teams.id))
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .leftJoin(countries, eq(teams.countryId, countries.id))
    .where(eq(spinListItems.userId, userId))
    .orderBy(spinListItems.createdAt);
}

export async function addSpinListItem(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  // Evitar duplicatas
  const existing = await db.select({ id: spinListItems.id })
    .from(spinListItems)
    .where(and(eq(spinListItems.userId, userId), eq(spinListItems.teamId, teamId)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(spinListItems).values({ userId, teamId });
}

export async function removeSpinListItem(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(spinListItems)
    .where(and(eq(spinListItems.userId, userId), eq(spinListItems.teamId, teamId)));
}

export async function addSpinHistory(userId: number, teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(spinHistory).values({ userId, teamId });
}

export async function getSpinHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { teams, leagues, countries } = await import("../drizzle/schema");
  return await db.select({
    id: spinHistory.id,
    teamId: spinHistory.teamId,
    teamName: teams.name,
    teamLogoUrl: teams.logoUrl,
    leagueName: leagues.name,
    countryName: countries.name,
    createdAt: spinHistory.createdAt,
  })
    .from(spinHistory)
    .innerJoin(teams, eq(spinHistory.teamId, teams.id))
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .leftJoin(countries, eq(teams.countryId, countries.id))
    .where(eq(spinHistory.userId, userId))
    .orderBy(desc(spinHistory.createdAt))
    .limit(5);
}
