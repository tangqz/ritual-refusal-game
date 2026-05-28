import { describe, it, expect } from "vitest";
import { StreamParser } from "@/lib/stream-parser";

describe("StreamParser extra", () => {

  it("parses WISDOM section with card ID", () => {
    const parser = new StreamParser();
    parser.feed("<<WISDOM>>");
    parser.feed("id: hongbao_keqi");
    parser.feed("<</WISDOM>>");
    const result = parser.getResult();
    expect(result.wisdom).not.toBeNull();
    expect(result.wisdom!.id).toBe("hongbao_keqi");
  });

  it("parses PLAYER section", () => {
    const parser = new StreamParser();
    parser.feed("<<PLAYER>>");
    parser.feed("Thank you, Auntie!");
    parser.feed("<</PLAYER>>");
    const result = parser.getResult();
    expect(result.playerText).toBe("Thank you, Auntie!");
  });

  it("parses PSYCHOLOGY section", () => {
    const parser = new StreamParser();
    parser.feed("<<PSYCHOLOGY>>");
    parser.feed("NPC thinks this is proper.");
    parser.feed("<</PSYCHOLOGY>>");
    const result = parser.getResult();
    expect(result.psychologyText).toContain("NPC thinks");
  });

  it("parses FEEDBACK section", () => {
    const parser = new StreamParser();
    parser.feed("<<FEEDBACK>>");
    parser.feed("Good job accepting warmly!");
    parser.feed("<</FEEDBACK>>");
    const result = parser.getResult();
    expect(result.feedbackText).toContain("Good job");
  });

  it("parses END with full title data", () => {
    const parser = new StreamParser();
    parser.feed("<<END>>");
    parser.feed("title_name_en: Cultural Explorer");
    parser.feed("title_name_zh: 文化探索者");
    parser.feed("title_emoji: 🌟");
    parser.feed("title_desc_en: Master of etiquette");
    parser.feed("title_desc_zh: 礼仪大师");
    parser.feed("<</END>>");
    const result = parser.getResult();
    expect(result.isEnd).toBe(true);
    expect(result.title!.nameEn).toBe("Cultural Explorer");
    expect(result.title!.descEn).toBe("Master of etiquette");
  });

  it("validateOutput detects missing PLAYER in observe mode", () => {
    const parser = new StreamParser();
    parser.feed("<<NPC>>");
    parser.feed("Hello!");
    parser.feed("<</NPC>>");
    parser.getResult();
    const v = parser.validateOutput("observe");
    expect(v.issues.some(function(i) { return i.includes("PLAYER"); })).toBe(true);
  });

  it("validateOutput detects missing FEEDBACK in practice mode", () => {
    const parser = new StreamParser();
    parser.feed("<<NPC>>");
    parser.feed("Hello!");
    parser.feed("<</NPC>>");
    parser.getResult();
    const v = parser.validateOutput("practice");
    expect(v.issues.some(function(i) { return i.includes("FEEDBACK"); })).toBe(true);
  });

  it("activeSection tracks current section", () => {
    const parser = new StreamParser();
    expect(parser.activeSection).toBeNull();
    parser.feed("<<NPC>>");
    expect(parser.activeSection).toBe("NPC");
    parser.feed("<</NPC>>");
    expect(parser.activeSection).toBeNull();
  });

  it("getResult uses raw text fallback when no NPC text", () => {
    const parser = new StreamParser();
    parser.feed("This is raw dialogue without any tags.");
    parser.feed("The NPC continues speaking naturally.");
    const result = parser.getResult();
    expect(result.npcText).toBeTruthy();
    expect(result.npcText).toContain("raw dialogue");
  });

  it("strips leaked option bullets from NPC text", () => {
    const parser = new StreamParser();
    parser.feed("<<NPC>>");
    parser.feed("(nods) That is good.");
    parser.feed("- Accept the gift");
    parser.feed("- Refuse politely");
    parser.feed("- Say thank you");
    parser.feed("- Stay silent");
    parser.feed("<</NPC>>");
    const result = parser.getResult();
    expect(result.npcText).not.toContain("-");
  });

  it("strips leaked wisdom ID from NPC text", () => {
    const parser = new StreamParser();
    parser.feed("<<NPC>>");
    parser.feed("(bowing) Please accept!");
    parser.feed("id: hongbao_keqi");
    parser.feed("<</NPC>>");
    const result = parser.getResult();
    expect(result.npcText).not.toContain("id:");
    expect(result.wisdom).not.toBeNull();
  });

  it("accepts END via open tag", () => {
    const parser = new StreamParser();
    parser.feed("<<END>>");
    const result = parser.getResult();
    expect(result.isEnd).toBe(true);
  });

});
