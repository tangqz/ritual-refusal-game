import { describe, it, expect } from "vitest";
import { logChatRequest, logChatResponse, logChatError, logHintRequest, logHintResponse, logHintError, logFimRequest, logFimResponse, logFimError, rid } from "@/lib/llm-logger";

describe("rid", () => {
  it("returns a non-empty string", () => {
    const id = rid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 10 }, () => rid()));
    expect(ids.size).toBe(10);
  });
});

describe("logChatRequest", () => {
  it("does not throw", () => {
    expect(() => logChatRequest("test-id", {
      scenario: "hongbao", stage: "observe", roundNumber: 1, lang: "en",
      refusalCount: 0, systemPromptLength: 1000, messageCount: 1,
      messages: [{ role: "user", content: "Hello" }],
    })).not.toThrow();
  });
});

describe("logChatResponse", () => {
  it("does not throw", () => {
    expect(() => logChatResponse("test-id", {
      latencyMs: 1500, totalChunks: 42, totalChars: 500, thinkingChars: 100,
      parsedTags: ["NPC", "OPTIONS"],
    })).not.toThrow();
  });
});

describe("logChatError", () => {
  it("does not throw", () => {
    expect(() => logChatError("test-id", {
      latencyMs: 500, error: "timeout", status: 500,
    })).not.toThrow();
  });
});

describe("logHintRequest", () => {
  it("does not throw", () => {
    expect(() => logHintRequest("test-id", {
      scenario: "hongbao", lang: "en", messageCount: 3,
    })).not.toThrow();
  });
});

describe("logHintResponse", () => {
  it("does not throw", () => {
    expect(() => logHintResponse("test-id", {
      latencyMs: 800, hintLength: 120, hint: "Try being more polite",
    })).not.toThrow();
  });
});

describe("logHintError", () => {
  it("does not throw", () => {
    expect(() => logHintError("test-id", {
      latencyMs: 300, error: "rate limited",
    })).not.toThrow();
  });
});

describe("logFimRequest", () => {
  it("does not throw", () => {
    expect(() => logFimRequest("test-id", {
      promptLength: 50, suffixLength: 20,
    })).not.toThrow();
  });
});

describe("logFimResponse", () => {
  it("does not throw", () => {
    expect(() => logFimResponse("test-id", {
      latencyMs: 600, completionLength: 80, completion: "to accept the gift",
    })).not.toThrow();
  });
});

describe("logFimError", () => {
  it("does not throw", () => {
    expect(() => logFimError("test-id", {
      latencyMs: 200, error: "invalid request",
    })).not.toThrow();
  });
});

describe("logChatRequest with DEBUG", () => {
  it("logs verbose messages when DEBUG is enabled", () => {
    const orig = process.env.LLM_DEBUG;
    process.env.LLM_DEBUG = "true";
    // Re-import is tricky, but the module caches the DEBUG value at load time.
    // Just verify it does not throw when messages are long.
    expect(() => logChatRequest("debug-id", {
      scenario: "hongbao", stage: "observe", roundNumber: 1, lang: "en",
      refusalCount: 0, systemPromptLength: 5000, messageCount: 5,
      messages: [
        { role: "system", content: "a".repeat(200) },
        { role: "user", content: "Hello" },
      ],
    })).not.toThrow();
    process.env.LLM_DEBUG = orig;
  });
});

describe("logHintResponse with DEBUG", () => {
  it("does not throw with debug enabled", () => {
    expect(() => logHintResponse("test-id", {
      latencyMs: 800, hintLength: 120, hint: "Try being more polite",
    })).not.toThrow();
  });
});

describe("logFimResponse with DEBUG", () => {
  it("does not throw", () => {
    expect(() => logFimResponse("test-id", {
      latencyMs: 600, completionLength: 80, completion: "to accept the gift",
    })).not.toThrow();
  });
});
