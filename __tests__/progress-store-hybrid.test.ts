import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSessionId, loadProgressHybrid, saveProgressHybrid, ensureSession, syncScenarioToServer } from "@/lib/progress-store-hybrid";

// Mock localStorage
const store = new Map();
const localStorageMock = {
  getItem: vi.fn((key) => store.get(key) ?? null),
  setItem: vi.fn((key, val) => { store.set(key, val); }),
  removeItem: vi.fn((key) => { store.delete(key); }),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });
vi.stubGlobal("crypto", {
  randomUUID: () => "550e8400-e29b-41d4-a716-446655440000",
});

// Mock fetch for syncToServer
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true });
});

describe("getSessionId", () => {
  it("generates a UUID on first call", () => {
    const id = getSessionId();
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns existing session ID on subsequent calls", () => {
    store.set("cultural-compass-session", "existing-session-id");
    expect(getSessionId()).toBe("existing-session-id");
  });
});

describe("loadProgressHybrid", () => {
  it("returns empty progress for new player", () => {
    const p = loadProgressHybrid();
    expect(p.onboardingCompleted).toBe(false);
    expect(p.completedScenarios).toEqual([]);
  });
});

describe("saveProgressHybrid", () => {
  it("saves to localStorage and attempts server sync", () => {
    const p = loadProgressHybrid();
    p.onboardingCompleted = true;
    saveProgressHybrid(p);
    const raw = store.get("cultural-compass-progress");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).onboardingCompleted).toBe(true);
  });

  it("does not throw when server sync fails", () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const p = loadProgressHybrid();
    expect(() => saveProgressHybrid(p)).not.toThrow();
  });
});

describe("ensureSession", () => {
  it("is an alias for getSessionId", () => {
    store.delete("cultural-compass-session");
    const id = ensureSession();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });
});


describe("syncScenarioToServer", () => {
  it("returns false when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    store.set("cultural-compass-session", "test-sid-2");
    const result = await syncScenarioToServer("hongbao", "observe", 3, "accept");
    expect(result).toBe(false);
  });

  it("returns true on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    store.set("cultural-compass-session", "test-sid");
    const result = await syncScenarioToServer("hongbao", "observe", 3, "accept");
    expect(result).toBe(true);
  });
});
