import { z } from "zod";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getPlayersList,
  getPlayerById,
  searchPlayers,
  getUserFavoritePlayers,
  addFavoritePlayer,
  removeFavoritePlayer,
  getPlayersCount,
  updateUserProfile,
  getUserByOpenId,
  getCountriesList,
  getLeaguesByCountry,
  getTeamsByLeague,
  getTeamById,
  getTeamByName,
  getPlayersByTeam,
  importTeamDetails,
  searchTeams,
  getUserFavoriteTeams,
  addFavoriteTeam,
  removeFavoriteTeam,
  isTeamFavorited,
  isPlayerFavorited,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Players ───────────────────────────────────────────────────────────────
  players: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(9999).optional().default(9999),
        position: z.string().optional(),
        nationality: z.string().optional(),
        sortBy: z.enum(["overall", "price"]).optional().default("overall"),
      }))
      .query(async ({ input }) => {
        return await getPlayersList(input);
      }),

    count: publicProcedure
      .query(async () => {
        return await getPlayersCount();
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getPlayerById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await searchPlayers(input.query, input.limit);
      }),

    favorites: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserFavoritePlayers(ctx.user.id);
      }),

    addFavorite: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await addFavoritePlayer(ctx.user.id, input.playerId);
        return { success: true };
      }),

    removeFavorite: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFavoritePlayer(ctx.user.id, input.playerId);
        return { success: true };
      }),
  }),

  // ─── Countries / Leagues / Teams ────────────────────────────────────────────
  countries: router({
    list: publicProcedure.query(async () => {
      return await getCountriesList();
    }),
  }),

  leagues: router({
    byCountry: publicProcedure
      .input(z.object({ countryId: z.number() }))
      .query(async ({ input }) => {
        return await getLeaguesByCountry(input.countryId);
      }),
  }),

  teams: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(2).max(64) }))
      .query(async ({ input }) => {
        return await searchTeams(input.query, 8);
      }),

    byLeague: publicProcedure
      .input(z.object({ leagueId: z.number() }))
      .query(async ({ input }) => {
        return await getTeamsByLeague(input.leagueId);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getTeamById(input.id);
      }),

    byName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await getTeamByName(input.name);
      }),

    favorites: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserFavoriteTeams(ctx.user.id);
      }),

    addFavorite: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await addFavoriteTeam(ctx.user.id, input.teamId);
        return { success: true };
      }),

    removeFavorite: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFavoriteTeam(ctx.user.id, input.teamId);
        return { success: true };
      }),

    isFavorited: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await isTeamFavorited(ctx.user.id, input.teamId);
      }),

    importDetails: protectedProcedure
      .input(z.array(z.object({
        nome: z.string(),
        estadio: z.string().optional(),
        rivalTime: z.string().optional(),
        prestigioInternacional: z.union([z.string(), z.number()]).optional(),
        prestigioLocal: z.union([z.string(), z.number()]).optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores podem importar dados.');
        }
        return await importTeamDetails(input);
      }),
  }),

  // ─── Players by Team ──────────────────────────────────────────────────────
  teamPlayers: router({
    byTeam: publicProcedure
      .input(z.object({ teamName: z.string() }))
      .query(async ({ input }) => {
        return await getPlayersByTeam(input.teamName);
      }),
  }),

  // ─── User Profile ──────────────────────────────────────────────────────────
  user: router({
    profile: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserByOpenId(ctx.user.openId);
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        username: z.string().max(64).optional(),
        bio: z.string().max(500).optional(),
        favoriteTeam: z.string().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({
        base64: z.string(), // data:image/...;base64,...
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Strip data URL prefix if present
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const key = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateUserProfile(ctx.user.id, { avatar: url });
        return { url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
