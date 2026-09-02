import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 8: My Tickets List API Tests (Multi-tenant & Filtering)
// ---------------------------------------------------------------------------

describe("Issue 8 — GET /api/tickets (My Tickets List API)", () => {
  let requesterAId: number;
  let requesterBId: number;
  let categoryHardwareId: number;
  let categorySoftwareId: number;
  let systemLaptopId: number;

  const uniqueTicketNumA1 = "TKT-2026-900001";
  const uniqueTicketNumA2 = "TKT-2026-900002";
  const uniqueTicketNumA3 = "TKT-2026-900003";
  const uniqueTicketNumB1 = "TKT-2026-900004";

  beforeAll(async () => {
    const prisma = getPrisma();

    // Clean up any previous test tickets with these test numbers
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          in: [uniqueTicketNumA1, uniqueTicketNumA2, uniqueTicketNumA3, uniqueTicketNumB1],
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

    // Get categories
    const catHardware = await prisma.category.findFirst({ where: { name: "Hardware" } });
    const catSoftware = await prisma.category.findFirst({ where: { name: "Software" } });
    categoryHardwareId = catHardware!.id;
    categorySoftwareId = catSoftware!.id;

    // Get related system
    const sysLaptop = await prisma.relatedSystem.findFirst({ where: { name: "Corporate Laptop" } });
    systemLaptopId = sysLaptop!.id;

    // Seed tickets for Requester A
    await prisma.ticket.createMany({
      data: [
        {
          ticketNumber: uniqueTicketNumA1,
          summary: "SpecialA1 Battery Overheating Issue",
          description: "Battery discharges completely within 20 minutes.",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
          requesterId: requesterAId,
          categoryId: categoryHardwareId,
          relatedSystemId: systemLaptopId,
        },
        {
          ticketNumber: uniqueTicketNumA2,
          summary: "SpecialA2 IDE License Expiry",
          description: "Developer IDE license requires urgent renewal.",
          requestedPriority: "MEDIUM",
          currentStatus: "OPEN",
          requesterId: requesterAId,
          categoryId: categorySoftwareId,
          relatedSystemId: systemLaptopId,
        },
        {
          ticketNumber: uniqueTicketNumA3,
          summary: "SpecialA3 Keyboard Sticky Key",
          description: "Spacebar sticks on the laptop keyboard.",
          requestedPriority: "LOW",
          currentStatus: "RESOLVED",
          requesterId: requesterAId,
          categoryId: categoryHardwareId,
          relatedSystemId: systemLaptopId,
        },
      ],
      skipDuplicates: true,
    });

    // Seed tickets for Requester B (Isolation test)
    await prisma.ticket.createMany({
      data: [
        {
          ticketNumber: uniqueTicketNumB1,
          summary: "SpecialB1 Email Sync Error",
          description: "Outlook will not sync incoming mailbox.",
          requestedPriority: "URGENT",
          currentStatus: "NEW",
          requesterId: requesterBId,
          categoryId: categorySoftwareId,
          relatedSystemId: systemLaptopId,
        },
      ],
      skipDuplicates: true,
    });
  });

  it("returns HTTP 200 with paginated tickets owned strictly by Requester A", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({ requesterId: requesterAId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    // Verify all returned tickets belong ONLY to Requester A
    const ticketNumbers = res.body.data.map((t: any) => t.ticketNumber);
    expect(ticketNumbers).toContain(uniqueTicketNumA1);
    expect(ticketNumbers).toContain(uniqueTicketNumA2);
    expect(ticketNumbers).toContain(uniqueTicketNumA3);
    // Requester B's ticket must NEVER appear
    expect(ticketNumbers).not.toContain(uniqueTicketNumB1);

    res.body.data.forEach((ticket: any) => {
      expect(ticket).toHaveProperty("id");
      expect(ticket).toHaveProperty("ticketNumber");
      expect(ticket).toHaveProperty("summary");
      expect(ticket).toHaveProperty("category");
      expect(ticket).toHaveProperty("relatedSystem");
      expect(ticket).toHaveProperty("requestedPriority");
      expect(ticket).toHaveProperty("currentStatus");
      expect(ticket).toHaveProperty("createdAt");
      expect(ticket).toHaveProperty("attachmentsCount");
    });

    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(3);
  });

  it("enforces strict tenant-like data isolation between Requester A and Requester B", async () => {
    // Requester B query with valid Requester B session header
    const resB = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterBId))
      .query({ requesterId: requesterBId });

    expect(resB.status).toBe(200);
    const summariesB = resB.body.data.map((t: any) => t.summary);
    expect(summariesB).toContain("SpecialB1 Email Sync Error");
    expect(summariesB).not.toContain("SpecialA1 Battery Overheating Issue");
  });

  it("filters tickets by search query across ticketNumber and summary (case-insensitive)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({ requesterId: requesterAId, search: "Overheating" });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].ticketNumber).toBe(uniqueTicketNumA1);
  });

  it("filters tickets by categoryId, priority, and currentStatus", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({
        requesterId: requesterAId,
        categoryId: categorySoftwareId,
        priority: "MEDIUM",
        status: "OPEN",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].ticketNumber).toBe(uniqueTicketNumA2);
  });

  it("supports sorting by createdAt in ascending and descending order", async () => {
    const resDesc = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({ requesterId: requesterAId, sortBy: "createdAt", sortOrder: "desc" });

    const resAsc = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({ requesterId: requesterAId, sortBy: "createdAt", sortOrder: "asc" });

    expect(resDesc.status).toBe(200);
    expect(resAsc.status).toBe(200);

    const firstDescDate = new Date(resDesc.body.data[0].createdAt).getTime();
    const lastDescDate = new Date(resDesc.body.data[resDesc.body.data.length - 1].createdAt).getTime();
    expect(firstDescDate).toBeGreaterThanOrEqual(lastDescDate);

    const firstAscDate = new Date(resAsc.body.data[0].createdAt).getTime();
    const lastAscDate = new Date(resAsc.body.data[resAsc.body.data.length - 1].createdAt).getTime();
    expect(firstAscDate).toBeLessThanOrEqual(lastAscDate);
  });

  it("rejects unauthorized access when session header mismatches query requesterId (HTTP 403)", async () => {
    // Current session is Requester A, but request tries to query Requester B
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requesterAId))
      .query({ requesterId: requesterBId });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
    expect(res.body.message).toContain("cannot access tickets belonging to another requester");
  });

  it("rejects request when x-requester-id session header is missing even if query requesterId is provided (HTTP 400)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ requesterId: requesterAId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing requester session");
  });
});
