import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 6: Development Requester API Tests
// ---------------------------------------------------------------------------

describe("GET /api/requesters/active", () => {
  it("returns HTTP 200 with an array of active development requesters", async () => {
    const response = await request(app).get("/api/requesters/active");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(4);

    // Verify all returned requesters are active
    response.body.forEach((requester: {
      id: number;
      name: string;
      email: string;
      department: string;
      isActive: boolean;
    }) => {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
      expect(requester).toHaveProperty("department");
      expect(requester.isActive).toBe(true);
    });
  });

  it("excludes inactive development requesters from the response", async () => {
    const response = await request(app).get("/api/requesters/active");

    expect(response.status).toBe(200);
    const names = response.body.map((r: { name: string }) => r.name);
    const emails = response.body.map((r: { email: string }) => r.email);

    // Inactive requester must not appear
    expect(names).not.toContain("Alex Wilson");
    expect(emails).not.toContain("alex.w@toktickit.local");

    // Active requesters must appear
    expect(names).toContain("Jennifer Anderson");
    expect(names).toContain("David Lee");
    expect(names).toContain("Sarah Johnson");
    expect(names).toContain("Michael Brown");
  });
});
