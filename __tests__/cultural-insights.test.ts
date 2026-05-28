import { describe, it, expect } from "vitest";
import {
  AUNTIE_WISDOMS,
  getInsightById,
  getInsightsByScenario,
  getInsightsByCategory,
  TOTAL_INSIGHTS,
} from "@/lib/cultural-insights";

describe("AUNTIE_WISDOMS", () => {
  it("has at least 20 insights", () => {
    expect(AUNTIE_WISDOMS.length).toBeGreaterThanOrEqual(20);
  });

  it("TOTAL_INSIGHTS matches array length", () => {
    expect(TOTAL_INSIGHTS).toBe(AUNTIE_WISDOMS.length);
  });

  it("each insight has required fields", () => {
    for (const w of AUNTIE_WISDOMS) {
      expect(w.id).toBeTruthy();
      expect(w.scenarioId).toBeTruthy();
      expect(w.icon).toBeTruthy();
      expect(w.titleEn).toBeTruthy();
      expect(w.titleZh).toBeTruthy();
      expect(w.textEn.length).toBeGreaterThan(50);
      expect(w.textZh.length).toBeGreaterThan(50);
      expect(["face","renqing","guanxi","keqi","fencun","general"]).toContain(w.category);
    }
  });

  it("has unique IDs", () => {
    const ids = AUNTIE_WISDOMS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all scenarios", () => {
    const scenarios = new Set(AUNTIE_WISDOMS.map(w => w.scenarioId));
    expect(scenarios.has("hongbao")).toBe(true);
    expect(scenarios.has("compliment")).toBe(true);
    expect(scenarios.has("guest")).toBe(true);
    expect(scenarios.has("gift")).toBe(true);
    expect(scenarios.has("bill")).toBe(true);
    expect(scenarios.has("dinner")).toBe(true);
    expect(scenarios.has("workplace")).toBe(true);
    expect(scenarios.has("refusal")).toBe(true);
  });

  it("covers all categories", () => {
    const categories = new Set(AUNTIE_WISDOMS.map(w => w.category));
    expect(categories.has("face")).toBe(true);
    expect(categories.has("renqing")).toBe(true);
    expect(categories.has("guanxi")).toBe(true);
    expect(categories.has("keqi")).toBe(true);
    expect(categories.has("fencun")).toBe(true);
  });
});

describe("getInsightById", () => {
  it("returns insight for valid ID", () => {
    const insight = getInsightById("hongbao_keqi");
    expect(insight).toBeDefined();
    expect(insight!.titleEn).toBe("The Ritual of Keqi");
  });

  it("returns undefined for unknown ID", () => {
    expect(getInsightById("nonexistent")).toBeUndefined();
  });
});

describe("getInsightsByScenario", () => {
  it("returns insights for hongbao scenario", () => {
    const insights = getInsightsByScenario("hongbao");
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.every(w => w.scenarioId === "hongbao")).toBe(true);
  });

  it("returns empty array for unknown scenario", () => {
    expect(getInsightsByScenario("unknown" as any)).toEqual([]);
  });
});

describe("getInsightsByCategory", () => {
  it("returns only insights of given category", () => {
    const insights = getInsightsByCategory("keqi");
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every(w => w.category === "keqi")).toBe(true);
  });

  it("returns empty array for unknown category", () => {
    expect(getInsightsByCategory("unknown" as any)).toEqual([]);
  });
});
