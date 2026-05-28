import { describe, it, expect } from "vitest";
import { SCENARIO_GOALS, getScenarioGoal } from "@/lib/scenario-goals";

describe("SCENARIO_GOALS", () => {
  it("has goals for all 8 scenarios", () => {
    const ids = ["hongbao","compliment","guest","gift","bill","dinner","workplace","refusal"] as const;
    for (const id of ids) {
      expect(SCENARIO_GOALS[id]).toBeDefined();
    }
  });

  it("each goal has required fields", () => {
    for (const [id, goal] of Object.entries(SCENARIO_GOALS)) {
      expect(goal.pattern).toBeTruthy();
      expect(goal.goalLabelEn).toBeTruthy();
      expect(goal.goalLabelZh).toBeTruthy();
      expect(goal.optionsInstructionEn).toBeTruthy();
      expect(goal.optionsInstructionZh).toBeTruthy();
      expect(goal.optionExampleEn).toBeTruthy();
      expect(goal.optionExampleZh).toBeTruthy();
      expect(goal.acceptanceFeedbackEn).toBeTruthy();
      expect(goal.acceptanceFeedbackZh).toBeTruthy();
      expect(goal.npcClosingEn).toBeTruthy();
      expect(goal.npcClosingZh).toBeTruthy();
      expect(goal.hintContextEn).toBeTruthy();
      expect(goal.hintContextZh).toBeTruthy();
      expect(goal.targetRoundRange.min).toBeGreaterThanOrEqual(1);
      expect(goal.targetRoundRange.max).toBeGreaterThanOrEqual(goal.targetRoundRange.min);
    }
  });

  it("has valid interaction patterns", () => {
    const validPatterns = ["refuse_then_accept","deflect_and_connect","compete_then_concede","refuse_indirectly"];
    for (const goal of Object.values(SCENARIO_GOALS)) {
      expect(validPatterns).toContain(goal.pattern);
    }
  });

  it("hongbao uses refuse_then_accept", () => {
    expect(SCENARIO_GOALS.hongbao.pattern).toBe("refuse_then_accept");
  });

  it("refusal uses refuse_indirectly", () => {
    expect(SCENARIO_GOALS.refusal.pattern).toBe("refuse_indirectly");
  });

  it("bill uses compete_then_concede", () => {
    expect(SCENARIO_GOALS.bill.pattern).toBe("compete_then_concede");
  });

  it("compliment uses deflect_and_connect", () => {
    expect(SCENARIO_GOALS.compliment.pattern).toBe("deflect_and_connect");
  });

  it("all option examples contain [ACCEPT]", () => {
    for (const goal of Object.values(SCENARIO_GOALS)) {
      expect(goal.optionExampleEn).toContain("[ACCEPT]");
      expect(goal.optionExampleZh).toContain("[ACCEPT]");
    }
  });
});

describe("getScenarioGoal", () => {
  it("returns goal for valid scenario", () => {
    expect(getScenarioGoal("hongbao")).toBe(SCENARIO_GOALS.hongbao);
  });

  it("returns undefined for unknown scenario", () => {
    expect(getScenarioGoal("unknown")).toBeUndefined();
  });
});
