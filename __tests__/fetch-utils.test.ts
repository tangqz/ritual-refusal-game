import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithRetry } from "@/lib/fetch-utils";

describe("fetchWithRetry", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns response on success", async () => {
    const mockRes = { ok: true, status: 200, json: async () => ({}) } as Response;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockRes);
    const res = await fetchWithRetry("https://api.example.com", {});
    expect(res.ok).toBe(true);
  });

  it("returns response for 4xx without retry", async () => {
    const mockRes = { ok: false, status: 400 } as Response;
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockRes);
    const res = await fetchWithRetry("https://api.example.com", {});
    expect(res.status).toBe(400);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx errors", async () => {
    const badRes = { ok: false, status: 500 } as Response;
    const goodRes = { ok: true, status: 200 } as Response;
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(badRes)
      .mockResolvedValueOnce(goodRes);
    const res = await fetchWithRetry("https://api.example.com", {}, 2);
    expect(res.ok).toBe(true);
  });

  it("retries on network error", async () => {
    const goodRes = { ok: true, status: 200 } as Response;
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(goodRes);
    const res = await fetchWithRetry("https://api.example.com", {}, 2);
    expect(res.ok).toBe(true);
  });

  it("throws after exhausting retries", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    await expect(fetchWithRetry("https://api.example.com", {}, 1)).rejects.toThrow();
  });

  it("passes init to fetch", async () => {
    const mockRes = { ok: true, status: 200 } as Response;
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockRes);
    const init: RequestInit = { method: "POST", body: "test" };
    await fetchWithRetry("https://api.example.com", init);
    expect(spy).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({ method: "POST", body: "test", signal: expect.any(AbortSignal) }),
    );
  });
});
