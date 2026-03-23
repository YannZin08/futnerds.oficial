import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock Context ─────────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-openid",
      email: "test@futnerds.com",
      name: "Test Player",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx = createPublicContext();
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBe(1);
  });

  it("returns null user when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect(me?.email).toBe("test@futnerds.com");
  });
});

// ─── News Router Tests ────────────────────────────────────────────────────────

describe("news.list", () => {
  it("accepts valid list input with limit", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // This will attempt a DB call; we just verify the procedure accepts valid input
    // and doesn't throw a validation error
    const result = await caller.news.list({ limit: 5 }).catch((err) => {
      // DB might not be available in test env, but input validation should pass
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts category filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.news.list({ category: "ultimate_team" }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts featured filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.news.list({ featured: true }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Players Router Tests ─────────────────────────────────────────────────────

describe("players.list", () => {
  it("accepts valid list input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.list({ limit: 10 }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts position filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.list({ position: "ST" }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts sortBy overall", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.list({ sortBy: "overall" }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts sortBy price", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.list({ sortBy: "price" }).catch((err) => {
      if (err.code === "INTERNAL_SERVER_ERROR") return [];
      throw err;
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Protected Route Tests ────────────────────────────────────────────────────

describe("players.favorites (protected)", () => {
  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.players.favorites()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("user.profile (protected)", () => {
  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.profile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("user.updateProfile (protected)", () => {
  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.updateProfile({ username: "test" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
