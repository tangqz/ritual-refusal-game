import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns healthy status when API key is set", async () => {
    const orig = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "test-key";
    const req = new Request("http://localhost:3000/api/health");
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.service.status).toBe("ok");
    expect(body.checks.deepseek.status).toBe("ok");
    expect(res.status).toBe(200);
    process.env.DEEPSEEK_API_KEY = orig;
  });

  it("returns degraded status when API key is missing", async () => {
    const orig = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    const req = new Request("http://localhost:3000/api/health");
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.deepseek.status).toBe("error");
    expect(res.status).toBe(503);
    if (orig) process.env.DEEPSEEK_API_KEY = orig;
  });
});

