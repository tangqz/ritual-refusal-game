import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isStorageAvailable,
  loadProgress,
  saveProgress,
  completeOnboarding,
  getScenarioProgress,
  completeScenarioStage,
  collectInsight,
  getAllCollectedInsightIds,
  resetProgress,
  hasProgress,
} from "@/lib/game-progress-store";

// Mock localStorage globally for Node.js environment
const store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
  removeItem: vi.fn((key: string) => { store.delete(key); }),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe("isStorageAvailable", () => {
  it("returns true when localStorage works", () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

describe("loadProgress", () => {
  it("returns empty progress when nothing stored", () => {
    const p = loadProgress();
    expect(p.onboardingCompleted).toBe(false);
    expect(p.completedScenarios).toEqual([]);
    expect(p.totalInsightsCollected).toBe(0);
  });

  it("returns stored progress", () => {
    const data = { onboardingCompleted: true, completedScenarios: ["hongbao"], scenarioProgress: {}, totalInsightsCollected: 5, lastActiveAt: new Date().toISOString() };
    store.set("cultural-compass-progress", JSON.stringify(data));
    const p = loadProgress();
    expect(p.onboardingCompleted).toBe(true);
    expect(p.completedScenarios).toEqual(["hongbao"]);
    expect(p.totalInsightsCollected).toBe(5);
  });

  it("handles corrupted JSON gracefully", () => {
    store.set("cultural-compass-progress", "not valid json{");
    const p = loadProgress();
    expect(p.onboardingCompleted).toBe(false);
    expect(p.totalInsightsCollected).toBe(0);
  });
});

describe("saveProgress", () => {
  it("saves progress to localStorage", () => {
    const p = loadProgress();
    p.onboardingCompleted = true;
    saveProgress(p);
    const raw = store.get("cultural-compass-progress");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).onboardingCompleted).toBe(true);
  });

  it("updates lastActiveAt on save", () => {
    const p = loadProgress();
    saveProgress(p);
    const raw = store.get("cultural-compass-progress");
    expect(JSON.parse(raw!).lastActiveAt).toBeTruthy();
  });
});

describe("completeOnboarding", () => {
  it("sets onboardingCompleted to true", () => {
    const p = completeOnboarding();
    expect(p.onboardingCompleted).toBe(true);
  });
});

describe("getScenarioProgress", () => {
  it("returns default for unplayed scenario", () => {
    const sp = getScenarioProgress("hongbao");
    expect(sp.completedStages).toEqual([]);
    expect(sp.bestPerformance).toBeNull();
  });
});

describe("completeScenarioStage", () => {
  it("adds stage to completed stages", () => {
    const p = completeScenarioStage("hongbao", "observe", { roundsPlayed: 3, endReason: "accept" });
    expect(p.scenarioProgress.hongbao?.completedStages).toContain("observe");
  });

  it("adds scenario to completedScenarios", () => {
    const p = completeScenarioStage("hongbao", "observe", { roundsPlayed: 3, endReason: "accept" });
    expect(p.completedScenarios).toContain("hongbao");
  });

  it("does not duplicate stages", () => {
    completeScenarioStage("hongbao", "observe", { roundsPlayed: 1, endReason: "test" });
    const p = completeScenarioStage("hongbao", "observe", { roundsPlayed: 3, endReason: "accept" });
    expect(p.scenarioProgress.hongbao?.completedStages).toEqual(["observe"]);
  });
});

describe("collectInsight", () => {
  it("adds insight ID", () => {
    const p = collectInsight("hongbao", "hongbao_keqi");
    expect(p.scenarioProgress.hongbao?.insightsCollected).toContain("hongbao_keqi");
    expect(p.totalInsightsCollected).toBe(1);
  });

  it("does not duplicate insights", () => {
    collectInsight("hongbao", "hongbao_keqi");
    const p = collectInsight("hongbao", "hongbao_keqi");
    expect(p.totalInsightsCollected).toBe(1);
  });
});

describe("getAllCollectedInsightIds", () => {
  it("returns all collected IDs across scenarios", () => {
    collectInsight("hongbao", "hongbao_keqi");
    collectInsight("bill", "bill_fight_why");
    const ids = getAllCollectedInsightIds();
    expect(ids).toContain("hongbao_keqi");
    expect(ids).toContain("bill_fight_why");
  });

  it("returns empty array with no insights", () => {
    expect(getAllCollectedInsightIds()).toEqual([]);
  });
});

describe("resetProgress", () => {
  it("clears stored progress", () => {
    saveProgress(loadProgress());
    resetProgress();
    expect(store.has("cultural-compass-progress")).toBe(false);
  });
});

describe("hasProgress", () => {
  it("returns false for new player", () => {
    expect(hasProgress()).toBe(false);
  });

  it("returns true after completing a scenario", () => {
    completeScenarioStage("hongbao", "observe", { roundsPlayed: 3, endReason: "accept" });
    expect(hasProgress()).toBe(true);
  });
});
