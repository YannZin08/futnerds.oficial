import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getOrCreateSquad: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      teamId: 10,
      teamName: "Real Madrid",
      teamLogoUrl: null,
      shareToken: null,
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getSquadWithPlayers: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      teamId: 10,
      teamName: "Real Madrid",
      teamLogoUrl: null,
      shareToken: null,
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [
        { id: 1, squadId: 1, playerId: 5, slot: "starter", order: 0, name: "V. Junior", position: "LW", altPositions: null, overall: 92, potential: 95, age: 23, nationality: "Brazil", imageUrl: null, clubLogoUrl: null, cardType: "gold", price: 1500000 },
      ],
    }),
    getUserSquads: vi.fn().mockResolvedValue([
      { id: 1, teamId: 10, teamName: "Real Madrid", teamLogoUrl: null, title: null, shareToken: null, updatedAt: new Date() },
    ]),
    addPlayerToSquad: vi.fn().mockResolvedValue(undefined),
    removePlayerFromSquad: vi.fn().mockResolvedValue(undefined),
    movePlayerSlot: vi.fn().mockResolvedValue(undefined),
    generateShareToken: vi.fn().mockResolvedValue("abc123token"),
    getSquadByToken: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      teamId: 10,
      teamName: "Real Madrid",
      teamLogoUrl: null,
      shareToken: "abc123token",
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
    }),
    deleteSquad: vi.fn().mockResolvedValue(undefined),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    avatar: null,
    bio: null,
    favoriteTeam: null,
    loginMethod: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {} as any,
    res: {} as any,
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {} as any,
    res: {} as any,
  };
  return { ctx };
}

describe("squads router", () => {
  const { ctx } = createAuthContext();

  it("getOrCreate — retorna squad para o time selecionado", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.getOrCreate({ teamId: 10 });
    expect(result).toMatchObject({ teamId: 10, teamName: "Real Madrid" });
  });

  it("getWithPlayers — retorna squad com membros", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.getWithPlayers({ squadId: 1 });
    expect(result).not.toBeNull();
    expect(result!.members).toHaveLength(1);
    expect(result!.members[0].name).toBe("V. Junior");
  });

  it("mySquads — retorna lista de elencos do usuário", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.mySquads();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].teamName).toBe("Real Madrid");
  });

  it("addPlayer — adiciona jogador ao elenco", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.addPlayer({ squadId: 1, playerId: 99, slot: "bench" });
    expect(result.success).toBe(true);
  });

  it("removePlayer — remove jogador do elenco", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.removePlayer({ squadId: 1, playerId: 5 });
    expect(result.success).toBe(true);
  });

  it("movePlayer — move jogador entre titular e reserva", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.movePlayer({ squadId: 1, playerId: 5, slot: "bench" });
    expect(result.success).toBe(true);
  });

  it("share — gera token de compartilhamento", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.share({ squadId: 1 });
    expect(result.token).toBe("abc123token");
  });

  it("byToken — retorna elenco público pelo token (sem auth)", async () => {
    const { ctx: publicCtx } = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.squads.byToken({ token: "abc123token" });
    expect(result).not.toBeNull();
    expect(result!.shareToken).toBe("abc123token");
  });

  it("delete — deleta elenco do usuário", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.delete({ squadId: 1 });
    expect(result.success).toBe(true);
  });

  it("getWithPlayers — lança erro se squad não pertence ao usuário", async () => {
    const { ctx: otherCtx } = createAuthContext();
    // Simular squad de outro usuário
    const { getSquadWithPlayers } = await import("./db");
    (getSquadWithPlayers as any).mockResolvedValueOnce({
      id: 2,
      userId: 999, // outro usuário
      teamId: 20,
      teamName: "Barcelona",
      teamLogoUrl: null,
      shareToken: null,
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
    });
    const caller = appRouter.createCaller(otherCtx);
    await expect(caller.squads.getWithPlayers({ squadId: 2 })).rejects.toThrow();
  });
});
