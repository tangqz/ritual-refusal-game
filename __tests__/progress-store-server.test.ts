import { describe, it, expect, beforeEach } from "vitest";
import {
  getUser,
  upsertUser,
  getScenarioProgress,
  saveScenarioProgress,
  getGameProgress,
  saveGameProgress,
  deleteProgress,
} from "@/lib/progress-store-server";

describe("progress-store-server", () => {
  const sid = "test-session-" + Math.random().toString(36).slice(2);

  describe("upsertUser", () => {
    it("creates a new user", async () => {
      const user = await upsertUser(sid);
      expect(user.id).toBe(sid);
      expect(user.createdAt).toBeTruthy();
      expect(user.lastActiveAt).toBeTruthy();
    });

    it("updates an existing user", async () => {
      const u1 = await upsertUser(sid);
      const u2 = await upsertUser(sid);
      expect(u2.id).toBe(sid);
      expect(u2.createdAt).toBe(u1.createdAt);
    });
  });

  describe("getUser", () => {
    it("returns null for unknown user", async () => {
      expect(await getUser("nonexistent")).toBeNull();
    });

    it("returns user after upsert", async () => {
      await upsertUser(sid + "-2");
      const user = await getUser(sid + "-2");
      expect(user).not.toBeNull();
      expect(user!.id).toBe(sid + "-2");
    });
  });

  describe("scenario progress", () => {
    it("returns null for unknown", async () => {
      expect(await getScenarioProgress(sid, "hongbao")).toBeNull();
    });

    it("saves and retrieves", async () => {
      const record = { userId: sid, scenarioId: "hongbao", completedStages: ["observe"], insightsCollected: [], bestRoundsPlayed: 3, bestEndReason: "accept", lastPlayedAt: new Date().toISOString() };
      await saveScenarioProgress(sid, record);
      const loaded = await getScenarioProgress(sid, "hongbao");
      expect(loaded).not.toBeNull();
      expect(loaded!.completedStages).toEqual(["observe"]);
    });
  });

  describe("game progress", () => {
    it("returns null for unknown", async () => {
      expect(await getGameProgress(sid)).toBeNull();
    });

    it("saves and retrieves", async () => {
      const record = { userId: sid, onboardingCompleted: true, completedScenarios: ["hongbao"], totalInsightsCollected: 3, lastActiveAt: new Date().toISOString() };
      await saveGameProgress(record);
      const loaded = await getGameProgress(sid);
      expect(loaded).not.toBeNull();
      expect(loaded!.onboardingCompleted).toBe(true);
    });
  });

  describe("deleteProgress", () => {
    it("removes all user data", async () => {
      await upsertUser(sid + "-del");
      await saveScenarioProgress(sid + "-del", { userId: sid + "-del", scenarioId: "hongbao", completedStages: [], insightsCollected: [], bestRoundsPlayed: 0, bestEndReason: "", lastPlayedAt: "" });
      await deleteProgress(sid + "-del");
      expect(await getUser(sid + "-del")).toBeNull();
    });
  });
});
