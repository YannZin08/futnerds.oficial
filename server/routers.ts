import { z } from "zod";
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
  updateUserProfile,
  getUserByOpenId,
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
        limit: z.number().min(1).max(500).optional().default(500),
        position: z.string().optional(),
        nationality: z.string().optional(),
        sortBy: z.enum(["overall", "price"]).optional().default("overall"),
      }))
      .query(async ({ input }) => {
        return await getPlayersList(input);
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
  }),
});

export type AppRouter = typeof appRouter;
