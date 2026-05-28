import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/prompts/prompt-builder";

describe("buildSystemPrompt", () => {
  it("returns a string for valid inputs (hongbao, observe, en)", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("returns a string for valid inputs (hongbao, guided, zh)", () => {
    const prompt = buildSystemPrompt("hongbao", "guided", "zh", 2, 1);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("includes scenario title in the output", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(prompt).toContain("Red Envelope");
  });

  it("includes stage modifier", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(prompt).toContain("OBSERVE");
  });

  it("returns fallback for unknown scenario", () => {
    const prompt = buildSystemPrompt("unknown_scenario", "observe", "en", 1, 0);
    expect(typeof prompt).toBe("string");
    expect(prompt).toContain("cultural guide");
  });

  it("returns fallback for unknown stage", () => {
    const prompt = buildSystemPrompt("hongbao", "invalid_stage", "en", 1, 0);
    expect(typeof prompt).toBe("string");
    expect(prompt).toContain("cultural guide");
  });

  it("includes language instruction for English", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(prompt).toContain("English");
  });

  it("includes language instruction for Chinese", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "zh", 1, 0);
    expect(prompt).toContain("中文");
  });

  it("includes output format section", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(prompt).toContain("OUTPUT FORMAT");
    expect(prompt).toContain("<<NPC>>");
  });

  it("includes wisdom card IDs", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 1, 0);
    expect(prompt).toContain("hongbao_keqi");
  });

  it("includes current round number", () => {
    const prompt = buildSystemPrompt("hongbao", "observe", "en", 3, 0);
    expect(prompt).toContain("Round 3");
  });

  it("includes refusal count when > 0", () => {
    const prompt = buildSystemPrompt("hongbao", "guided", "en", 2, 2);
    expect(prompt).toContain("declined");
  });

  it("works for all scenarios", () => {
    const scenarios = ["hongbao","compliment","guest","gift","bill","dinner","workplace","refusal"];
    for (const s of scenarios) {
      const prompt = buildSystemPrompt(s, "observe", "en", 1, 0);
      expect(prompt.length).toBeGreaterThan(500);
    }
  });

  it("works for all stages", () => {
    const stages = ["observe", "guided", "practice", "challenge"];
    for (const s of stages) {
      const prompt = buildSystemPrompt("hongbao", s, "en", 1, 0);
      expect(prompt.length).toBeGreaterThan(500);
    }
  });

  it("challenge mode does NOT include FEEDBACK during conversation", () => {
    const prompt = buildSystemPrompt("hongbao", "challenge", "en", 1, 0);
    expect(prompt).toContain("NO <<FEEDBACK>>");
  });

  it("guided mode includes OPTIONS instruction", () => {
    const prompt = buildSystemPrompt("hongbao", "guided", "en", 1, 0);
    expect(prompt).toContain("<<OPTIONS>>");
  });

  it("practice mode instructs free typing", () => {
    const prompt = buildSystemPrompt("hongbao", "practice", "en", 1, 0);
    expect(prompt).toContain("Practice mode");
  });
});
