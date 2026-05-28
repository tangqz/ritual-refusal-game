import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/hint/route";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/hint", () => {
  it("returns 500 when DEEPSEEK_API_KEY is missing", async () => {
    const orig = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    const req = new Request("http://localhost:3000/api/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What should I do?" }],
        scenario: "hongbao",
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    if (orig) process.env.DEEPSEEK_API_KEY = orig;
  });

  it("returns 400 for invalid JSON body", async () => {
    process.env.DEEPSEEK_API_KEY = "test-key";
    const req = new Request("http://localhost:3000/api/hint", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid request body", async () => {
    process.env.DEEPSEEK_API_KEY = "test-key";
    const req = new Request("http://localhost:3000/api/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    process.env.DEEPSEEK_API_KEY = "test-key";
    // Hit the rate limit by making many requests with the same IP
    const req = new Request("http://localhost:3000/api/hint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "rate-limit-test-ip",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Help" }],
        scenario: "hongbao",
      }),
    });
    // Make 21 requests to exceed the 20-request limit
    for (let i = 0; i < 21; i++) {
      await POST(req.clone() as any);
    }
    const res = await POST(req as any);
    expect(res.status).toBe(429);
  });
});

