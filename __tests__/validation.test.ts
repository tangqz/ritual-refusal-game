import { describe, it, expect } from "vitest";
import {
  messageSchema,
  chatRequestSchema,
  debriefRequestSchema,
  fimCompleteRequestSchema,
  hintRequestSchema,
} from "@/lib/validation";

describe("messageSchema", () => {
  it("accepts valid user message", () => {
    const result = messageSchema.safeParse({ role: "user", content: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts valid assistant message", () => {
    const result = messageSchema.safeParse({ role: "assistant", content: "Hi" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = messageSchema.safeParse({ role: "npc", content: "Hello" });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding max length", () => {
    const result = messageSchema.safeParse({ role: "user", content: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("chatRequestSchema", () => {
  const valid = { messages: [{ role: "user", content: "Hello" }], scenario: "hongbao", stage: "observe", roundNumber: 1, lang: "en" };

  it("accepts valid request", () => {
    expect(chatRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty scenario", () => {
    expect(chatRequestSchema.safeParse({ ...valid, scenario: "" }).success).toBe(false);
  });

  it("rejects invalid stage", () => {
    expect(chatRequestSchema.safeParse({ ...valid, stage: "expert" }).success).toBe(false);
  });

  it("rejects invalid language", () => {
    expect(chatRequestSchema.safeParse({ ...valid, lang: "fr" }).success).toBe(false);
  });

  it("rejects roundNumber 0", () => {
    expect(chatRequestSchema.safeParse({ ...valid, roundNumber: 0 }).success).toBe(false);
  });

  it("accepts zh language", () => {
    expect(chatRequestSchema.safeParse({ ...valid, lang: "zh" }).success).toBe(true);
  });

  it("accepts optional sessionId", () => {
    expect(chatRequestSchema.safeParse({ ...valid, sessionId: "abc" }).success).toBe(true);
  });
});

describe("debriefRequestSchema", () => {
  const valid = { messages: [{ role: "user", content: "Hi" }], scenarioId: "hongbao", stage: "observe", roundsPlayed: 3 };

  it("accepts valid request", () => {
    expect(debriefRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = debriefRequestSchema.safeParse({ ...valid, insightsCollected: ["w1"], lang: "zh" });
    expect(result.success).toBe(true);
  });
});

describe("fimCompleteRequestSchema", () => {
  it("accepts valid request", () => {
    const result = fimCompleteRequestSchema.safeParse({ prompt: "I think", suffix: "because" });
    expect(result.success).toBe(true);
  });

  it("rejects empty prompt", () => {
    expect(fimCompleteRequestSchema.safeParse({ prompt: "" }).success).toBe(false);
  });
});

describe("hintRequestSchema", () => {
  it("accepts valid request", () => {
    const result = hintRequestSchema.safeParse({ messages: [{ role: "user", content: "Help" }], scenario: "hongbao" });
    expect(result.success).toBe(true);
  });
});
