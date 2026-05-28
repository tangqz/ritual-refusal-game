import { describe, it, expect } from "vitest";
import { SCENARIO_PROMPTS } from "@/lib/prompts/scenario-prompts";

describe("SCENARIO_PROMPTS", () => {
  it("has prompts for all 8 scenarios", () => {
    const ids = ["hongbao","compliment","guest","gift","bill","dinner","workplace","refusal"] as const;
    for (const id of ids) {
      expect(SCENARIO_PROMPTS[id]).toBeDefined();
    }
  });

  it("each prompt has required fields", () => {
    for (const [id, p] of Object.entries(SCENARIO_PROMPTS)) {
      expect(p.personaEn).toBeTruthy();
      expect(p.personaZh).toBeTruthy();
      expect(p.culturalLessonEn).toBeTruthy();
      expect(p.culturalLessonZh).toBeTruthy();
      expect(p.npcMotivationEn).toBeTruthy();
      expect(p.npcMotivationZh).toBeTruthy();
      expect(p.commonMistakesEn).toBeTruthy();
      expect(p.commonMistakesZh).toBeTruthy();
      expect(Array.isArray(p.conceptsToIntroduce)).toBe(true);
    }
  });

  it("each concept has required fields", () => {
    for (const p of Object.values(SCENARIO_PROMPTS)) {
      for (const c of p.conceptsToIntroduce) {
        expect(c.term).toBeTruthy();
        expect(c.pinyin).toBeTruthy();
        expect(c.characters).toBeTruthy();
        expect(c.definitionEn).toBeTruthy();
        expect(c.definitionZh).toBeTruthy();
      }
    }
  });

  it("each scenario has at least 1 concept", () => {
    for (const p of Object.values(SCENARIO_PROMPTS)) {
      expect(p.conceptsToIntroduce.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all personas are substantial", () => {
    for (const p of Object.values(SCENARIO_PROMPTS)) {
      expect(p.personaEn.length).toBeGreaterThan(100);
      expect(p.personaZh.length).toBeGreaterThan(50);
    }
  });
});
