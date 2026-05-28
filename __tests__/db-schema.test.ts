import { describe, it, expect } from "vitest";
import { userKey, progressKey, gameKey } from "@/lib/db-schema";

describe("userKey", () => {
  it("returns correct format", () => {
    expect(userKey("abc123")).toBe("user:abc123");
  });

  it("handles UUID session IDs", () => {
    expect(userKey("550e8400-e29b-41d4-a716-446655440000")).toContain("user:");
  });
});

describe("progressKey", () => {
  it("returns correct format", () => {
    expect(progressKey("abc", "hongbao")).toBe("progress:abc:hongbao");
  });
});

describe("gameKey", () => {
  it("returns correct format", () => {
    expect(gameKey("abc")).toBe("game:abc");
  });
});
