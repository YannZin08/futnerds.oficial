import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, news, players, userFavoritePlayers, InsertNews, InsertPlayer } from "../drizzle/schema";
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

  const conditions = [];
  if (position) conditions.push(eq(players.position, position));
  if (nationality) conditions.push(eq(players.nationality, nationality));

  const orderCol = sortBy === "price" ? desc(players.price) : desc(players.overall);

  if (conditions.length > 0) {
    return await db.select().from(players)
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(limit);
  }
  return await db.select().from(players).orderBy(orderCol).limit(limit);
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
