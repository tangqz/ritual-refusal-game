import { describe, it, expect } from "vitest";
import { STAGES, getNextStage, getStagesForScenario } from "@/lib/learning-progression";

describe("STAGES", () => {
  it("has four stages in order", () => {
    expect(STAGES.observe.order).toBe(0);
    expect(STAGES.guided.order).toBe(1);
    expect(STAGES.practice.order).toBe(2);
    expect(STAGES.challenge.order).toBe(3);
  });

  it("each stage has required bilingual fields", () => {
    for (const s of Object.values(STAGES)) {
      expect(s.id).toBeTruthy();
      expect(s.labelEn).toBeTruthy();
      expect(s.labelZh).toBeTruthy();
      expect(s.shortEn).toBeTruthy();
      expect(s.shortZh).toBeTruthy();
      expect(s.icon).toBeTruthy();
      expect(s.descriptionEn).toBeTruthy();
      expect(s.descriptionZh).toBeTruthy();
      expect(s.promptModifierEn).toBeTruthy();
      expect(s.promptModifierZh).toBeTruthy();
    }
  });
});

describe("getNextStage", () => {
  it("returns guided after observe", () => {
    expect(getNextStage("observe")).toBe("guided");
  });
  it("returns practice after guided", () => {
    expect(getNextStage("guided")).toBe("practice");
  });
  it("returns challenge after practice", () => {
    expect(getNextStage("practice")).toBe("challenge");
  });
  it("returns null after challenge", () => {
    expect(getNextStage("challenge")).toBeNull();
  });
});

describe("getStagesForScenario", () => {
  it("observe is always available when nothing completed", () => {
    const result = getStagesForScenario([]);
    expect(result.available).toEqual(["observe"]);
    expect(result.locked).toEqual(["guided", "practice", "challenge"]);
  });

  it("unlocks guided after completing observe", () => {
    const result = getStagesForScenario(["observe"]);
    expect(result.available).toContain("observe");
    expect(result.available).toContain("guided");
    expect(result.locked).toEqual(["practice", "challenge"]);
  });

  it("unlocks all stages when observe/guided/practice completed", () => {
    const result = getStagesForScenario(["observe", "guided", "practice"]);
    expect(result.available).toContain("challenge");
    expect(result.locked).toEqual([]);
  });

  it("returns correct next stage", () => {
    expect(getStagesForScenario([]).next).toBe("observe");
    expect(getStagesForScenario(["observe"]).next).toBe("guided");
    expect(getStagesForScenario(["observe","guided","practice","challenge"]).next).toBeNull();
  });
});
