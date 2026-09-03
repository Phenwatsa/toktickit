import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Ticket Detail API Tests (GET /api/tickets/:id)
// ---------------------------------------------------------------------------

describe("Issue 9 — GET /api/tickets/:id (Ticket Detail & Ownership)", () => {
  let requesterAId: number;
  let requesterBId: number;
  let ticketAId: number;
  let ticketBId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Clean up any previous test tickets
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          in: ["TKT-2026-800001", "TKT-2026-800002"],
        },
      },
    });

    // Get two distinct active requesters
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      take: 2,
    });
    requesterAId = requesters[0].id;
    requesterBId = requesters[1].id;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create ticket for Requester A
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-800001",
        summary: "Detail Test Ticket for Requester A",
        description: "Full detailed description of the problem for verification.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
        requesterId: requesterAId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });
    ticketAId = ticketA.id;

    // Create ticket for Requester B
    const ticketB = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-800002",
        summary: "Detail Test Ticket for Requester B",
        description: "Requester B private ticket description.",
        requestedPriority: "LOW",
        currentStatus: "OPEN",
        requesterId: requesterBId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });
    ticketBId = ticketB.id;
  });

  it("returns HTTP 200 with full details and attachments for an owned ticket", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("x-requester-id", String(requesterAId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", ticketAId);
    expect(res.body).toHaveProperty("ticketNumber", "TKT-2026-800001");
    expect(res.body).toHaveProperty("summary", "Detail Test Ticket for Requester A");
    expect(res.body).toHaveProperty("description", "Full detailed description of the problem for verification.");
    expect(res.body).toHaveProperty("requestedPriority", "HIGH");
    expect(res.body).toHaveProperty("currentStatus", "NEW");
    expect(res.body).toHaveProperty("requester");
    expect(res.body.requester).toHaveProperty("name");
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("relatedSystem");
    expect(res.body).toHaveProperty("attachments");
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });

  it("rejects unauthorized access when Requester A tries to view Requester B's ticket (HTTP 403)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketBId}`)
      .set("x-requester-id", String(requesterAId));

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
    expect(res.body.message).toContain("permission");
  });

  it("returns HTTP 404 when ticket ID does not exist", async () => {
    const res = await request(app)
      .get("/api/tickets/999999")
      .set("x-requester-id", String(requesterAId));

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns HTTP 400 when x-requester-id session header is missing", async () => {
    const res = await request(app).get(`/api/tickets/${ticketAId}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing requester session");
  });
});
