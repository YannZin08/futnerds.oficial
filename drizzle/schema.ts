import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 64 }),
  avatar: text("avatar"),
  bio: text("bio"),
  favoriteTeam: varchar("favoriteTeam", { length: 128 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Notícias FIFA
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  category: mysqlEnum("category", ["ultimate_team", "career_mode", "pro_clubs", "volta", "patch", "general"]).default("general").notNull(),
  tags: text("tags"), // JSON array as string
  featured: boolean("featured").default(false).notNull(),
  authorId: int("authorId"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// Jogadores FIFA
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  position: varchar("position", { length: 16 }).notNull(), // ST, CAM, CM, CB, GK, etc.
  nationality: varchar("nationality", { length: 64 }).notNull(),
  club: varchar("club", { length: 128 }).notNull(),
  league: varchar("league", { length: 128 }).notNull(),
  overall: int("overall").notNull(),
  potential: int("potential"),
  age: int("age"),
  altPositions: text("altPositions"), // JSON array de posições alternativas ex: '["CDM","CM"]'
  pace: int("pace"),
  shooting: int("shooting"),
  passing: int("passing"),
  dribbling: int("dribbling"),
  defending: int("defending"),
  physical: int("physical"),
  cardType: mysqlEnum("cardType", ["gold", "silver", "bronze", "diamond", "toty", "tots", "icon", "hero", "special"]).default("gold").notNull(),
  rating: float("rating"),
  imageUrl: text("imageUrl"),
  flagUrl: text("flagUrl"),
  clubLogoUrl: text("clubLogoUrl"),
  price: int("price"), // FUT coins
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// Times favoritos dos usuários
export const userFavoritePlayers = mysqlTable("userFavoritePlayers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  playerId: int("playerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavoritePlayer = typeof userFavoritePlayers.$inferSelect;

// Países
export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  flagUrl: text("flagUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;

// Ligas / Divisões
export const leagues = mysqlTable("leagues", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  division: int("division").default(1).notNull(), // 1 = primeira divisão, 2 = segunda, etc.
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type League = typeof leagues.$inferSelect;
export type InsertLeague = typeof leagues.$inferInsert;

// Times
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").notNull(),
  countryId: int("countryId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  shortName: varchar("shortName", { length: 32 }),
  logoUrl: text("logoUrl"),
  stadiumName: varchar("stadiumName", { length: 128 }),
  budget: int("budget"), // em milhões de euros
  prestige: int("prestige"), // 1-10 (prestígio internacional)
  localPrestige: int("localPrestige"), // 1-10 (prestígio local)
  rivalTeam: varchar("rivalTeam", { length: 128 }), // nome do time rival
  description: text("description"), // breve descrição do clube
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// Times favoritos dos usuários
export const userFavoriteTeams = mysqlTable("userFavoriteTeams", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavoriteTeam = typeof userFavoriteTeams.$inferSelect;

// Lista de times para sorteio (por usuário)
export const spinListItems = mysqlTable("spinListItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SpinListItem = typeof spinListItems.$inferSelect;

// Histórico de sorteios
export const spinHistory = mysqlTable("spinHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SpinHistory = typeof spinHistory.$inferSelect;
