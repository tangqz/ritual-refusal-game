import { describe, it, expect } from "vitest";
import { GET, POST, DELETE } from "@/app/api/progress/route";

describe("GET /api/progress", () => {
  it("returns 400 when sessionId is missing", async () => {
    const req = new Request("http://localhost:3000/api/progress");
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing sessionId");
  });

  it("returns game progress for valid session", async () => {
    const sid = "test-" + Math.random().toString(36).slice(2);
    const req = new Request("http://localhost:3000/api/progress?sessionId=" + sid);
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.gameProgress).toBeDefined();
  });

  it("returns scenario progress when scenarioId is provided", async () => {
    const sid = "test-" + Math.random().toString(36).slice(2);
    const req = new Request("http://localhost:3000/api/progress?sessionId=" + sid + "&scenarioId=hongbao");
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scenarioProgress).toBeNull();
  });
});

describe("POST /api/progress", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/progress", {
      method: "POST",
      body: "invalid json",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing sessionId", async () => {
    const req = new Request("http://localhost:3000/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("saves progress successfully", async () => {
    const sid = "test-" + Math.random().toString(36).slice(2);
    const req = new Request("http://localhost:3000/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        onboardingCompleted: true,
        totalInsightsCollected: 3,
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.gameProgress.onboardingCompleted).toBe(true);
  });
});

describe("DELETE /api/progress", () => {
  it("returns 400 when sessionId is missing", async () => {
    const req = new Request("http://localhost:3000/api/progress");
    const res = await DELETE(req as any);
    expect(res.status).toBe(400);
  });

  it("deletes progress successfully", async () => {
    const sid = "test-" + Math.random().toString(36).slice(2);
    const req = new Request("http://localhost:3000/api/progress?sessionId=" + sid);
    const res = await DELETE(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

