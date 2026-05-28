import { describe, it, expect } from "vitest";
import { LEARNING_TITLES, parsedTitleToGameTitle } from "@/lib/game-titles";
import type { ParsedTitle } from "@/lib/stream-parser";

describe("LEARNING_TITLES", () => {
  it("has four achievement titles", () => {
    expect(LEARNING_TITLES).toHaveLength(4);
  });
  it("each title has required fields", () => {
    for (const t of LEARNING_TITLES) {
      expect(t.id).toBeTruthy();
      expect(t.nameEn).toBeTruthy();
      expect(t.nameZh).toBeTruthy();
      expect(t.descriptionEn).toBeTruthy();
      expect(t.descriptionZh).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.color).toContain("from-");
    }
  });
  it("has unique IDs", () => {
    const ids = LEARNING_TITLES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("parsedTitleToGameTitle", () => {
  it("converts a fully-specified ParsedTitle", () => {
    const parsed: ParsedTitle = {
      nameEn: "The Gracious Guest",
      nameZh: "得体的客人",
      descEn: "You learned the art of being a guest",
      descZh: "你学会了做客的艺术",
      emoji: "🏠",
    };
    const result = parsedTitleToGameTitle(parsed);
    expect(result.nameEn).toBe("The Gracious Guest");
    expect(result.nameZh).toBe("得体的客人");
    expect(result.descriptionEn).toBe("You learned the art of being a guest");
    expect(result.descriptionZh).toBe("你学会了做客的艺术");
    expect(result.emoji).toBe("🏠");
    expect(result.id).toContain("llm_");
  });

  it("uses defaults for empty fields", () => {
    const parsed: ParsedTitle = { nameEn: "", nameZh: "", descEn: "", descZh: "", emoji: "" };
    const result = parsedTitleToGameTitle(parsed);
    expect(result.nameEn).toBe("Cultural Explorer");
    expect(result.nameZh).toBe("文化探索者");
    expect(result.emoji).toBe("🌟");
  });

  it("uses partial defaults", () => {
    const parsed: ParsedTitle = { nameEn: "Custom", nameZh: "", descEn: "", descZh: "", emoji: "" };
    const result = parsedTitleToGameTitle(parsed);
    expect(result.nameEn).toBe("Custom");
    expect(result.nameZh).toBe("文化探索者");
  });

  it("generates ID with llm_ prefix", () => {
    const parsed: ParsedTitle = { nameEn: "Test", nameZh: "", descEn: "", descZh: "", emoji: "" };
    const result = parsedTitleToGameTitle(parsed);
    expect(result.id).toMatch(/^llm_[0-9]+$/);
  });
});

