import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Ticket Creation & Reference Data API Tests
// ---------------------------------------------------------------------------

describe("Issue 7 — Reference Data & Ticket Creation APIs", () => {
  let activeRequesterId: number;
  let inactiveRequesterId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Get an active requester
    const activeReq = await prisma.requesterUser.findFirst({
      where: { isActive: true },
    });
    activeRequesterId = activeReq!.id;

    // Get an inactive requester
    const inactiveReq = await prisma.requesterUser.findFirst({
      where: { isActive: false },
    });
    inactiveRequesterId = inactiveReq!.id;

    // Get a category
    const cat = await prisma.category.findFirst({
      where: { isActive: true },
    });
    categoryId = cat!.id;

    // Get a related system
    const sys = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });
    relatedSystemId = sys!.id;
  });

  describe("GET /api/related-systems/active", () => {
    it("returns HTTP 200 with an array of active related systems", async () => {
      const response = await request(app).get("/api/related-systems/active");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(6);

      response.body.forEach((sys: { id: number; name: string; isActive: boolean }) => {
        expect(sys).toHaveProperty("id");
        expect(sys).toHaveProperty("name");
        expect(sys.isActive).toBe(true);
      });
    });
  });

  describe("GET /api/categories/active", () => {
    it("returns HTTP 200 with active categories", async () => {
      const response = await request(app).get("/api/categories/active");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);
    });
  });

  describe("POST /api/tickets", () => {
    it("creates a valid ticket with official ticket number and status NEW (HTTP 201)", async () => {
      const payload = {
        requesterId: activeRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "HIGH",
        summary: "VPN connection drops every 5 minutes",
        description: "Whenever I connect to the university VPN, it disconnects after 5 minutes on corporate laptop.",
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("ticketNumber");
      // Format: TKT-YYYY-NNNNNN
      expect(response.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(response.body.currentStatus).toBe("NEW");
      expect(response.body.requestedPriority).toBe("HIGH");
      expect(response.body.summary).toBe(payload.summary);
      expect(response.body.description).toBe(payload.description);
      expect(response.body.requesterId).toBe(activeRequesterId);
      expect(response.body.categoryId).toBe(categoryId);
      expect(response.body.relatedSystemId).toBe(relatedSystemId);
    });

    it("handles concurrent ticket creation requests without duplicate ticket numbers", async () => {
      const payloads = Array.from({ length: 5 }, (_, i) => ({
        requesterId: activeRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "MEDIUM",
        summary: `Concurrent ticket request #${i + 1}`,
        description: `Detailed description for concurrent ticket request test #${i + 1}.`,
      }));

      // Fire 5 concurrent requests simultaneously
      const responses = await Promise.all(
        payloads.map((p) => request(app).post("/api/tickets").send(p))
      );

      // Verify all 5 were created successfully with 201
      responses.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      });

      // Verify all 5 generated ticket numbers are strictly unique
      const ticketNumbers = responses.map((res) => res.body.ticketNumber);
      const uniqueNumbers = new Set(ticketNumbers);
      expect(uniqueNumbers.size).toBe(5);
    });

    it("rejects ticket creation when summary is less than 5 characters (HTTP 400)", async () => {
      const payload = {
        requesterId: activeRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "MEDIUM",
        summary: "VPN", // Too short (< 5 chars)
        description: "Valid description longer than ten characters.",
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("details");
      const summaryError = response.body.details.find((d: { field: string }) => d.field === "summary");
      expect(summaryError).toBeDefined();
    });

    it("rejects ticket creation when description is less than 10 characters (HTTP 400)", async () => {
      const payload = {
        requesterId: activeRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "MEDIUM",
        summary: "Valid summary for ticket",
        description: "Short", // Too short (< 10 chars)
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      const descError = response.body.details.find((d: { field: string }) => d.field === "description");
      expect(descError).toBeDefined();
    });

    it("rejects ticket creation when requested priority is invalid (HTTP 400)", async () => {
      const payload = {
        requesterId: activeRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "INVALID_PRIORITY",
        summary: "Valid summary for ticket",
        description: "Valid description longer than ten characters.",
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects ticket creation when requester is inactive (HTTP 400)", async () => {
      const payload = {
        requesterId: inactiveRequesterId,
        categoryId: categoryId,
        relatedSystemId: relatedSystemId,
        requestedPriority: "LOW",
        summary: "Valid summary for ticket",
        description: "Valid description longer than ten characters.",
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/inactive|not found/i);
    });
  });
});
