import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 24: Requester Dashboard API Test Suite
// Covers: API-09, AC-12, AC-14, BR-12, BR-13
// ---------------------------------------------------------------------------

describe("Requester Dashboard API Tests (requester-dashboard.api.test.ts)", { timeout: 15000 }, () => {
  const prisma = getPrisma();

  let tokenRequester1: string;
  let tokenRequester2: string;
  let tokenStaff: string;
  let tokenAdmin: string;
  let tokenMustChangePass: string;

  let requester1Id: number;
  let requester2Id: number;
  let staffId: number;
  let adminId: number;

  let categoryId: number;
  let systemId: number;

  const createdTicketIds: number[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Setup Test Users
    const req1 = await prisma.user.upsert({
      where: { email: "req1.dash@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Dashboard Requester 1",
        email: "req1.dash@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Finance",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester1Id = req1.id;
    tokenRequester1 = generateToken(req1);

    const req2 = await prisma.user.upsert({
      where: { email: "req2.dash@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Dashboard Requester 2",
        email: "req2.dash@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "HR",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester2Id = req2.id;
    tokenRequester2 = generateToken(req2);

    const staff = await prisma.user.upsert({
      where: { email: "staff.dash@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Dashboard Staff",
        email: "staff.dash@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffId = staff.id;
    tokenStaff = generateToken(staff);

    const admin = await prisma.user.upsert({
      where: { email: "admin.dash@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "ADMINISTRATOR" },
      create: {
        name: "Dashboard Admin",
        email: "admin.dash@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    tokenAdmin = generateToken(admin);

    const reqMustChange = await prisma.user.upsert({
      where: { email: "req.mustchange@toktickit.local" },
      update: { isActive: true, mustChangePassword: true, role: "REQUESTER" },
      create: {
        name: "Must Change Requester",
        email: "req.mustchange@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
      },
    });
    tokenMustChangePass = generateToken(reqMustChange);

    // 2. Fetch existing active Category & Related System
    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    if (!cat) throw new Error("No active category found");
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    if (!sys) throw new Error("No active related system found");
    systemId = sys.id;

    // Helper to create ticket
    const createTestTicket = async (requesterId: number, status: any, summary: string, priority: any = "MEDIUM") => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-DASH-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          summary,
          description: "Test ticket for requester dashboard metrics verification",
          currentStatus: status,
          requestedPriority: priority,
          itPriority: priority,
          requesterId,
          categoryId,
          relatedSystemId: systemId,
        },
      });
      createdTicketIds.push(ticket.id);
      return ticket;
    };

    // 3. Populate known ticket profile for Requester 1:
    // - 1 NEW (counts in openTickets)
    // - 1 OPEN (counts in openTickets)
    // - 2 IN_PROGRESS (counts in openTickets and inProgressTickets)
    // - 1 WAITING_FOR_REQUESTER (counts in openTickets and waitingForRequesterTickets)
    // - 1 REOPENED (counts in openTickets)
    // - 3 RESOLVED (counts in resolvedTickets, NOT openTickets)
    // - 2 CLOSED (counts in closedTickets, NOT openTickets)
    // - 1 CANCELLED (does NOT count in openTickets, inProgress, waiting, resolved, closed)
    // Total openTickets: 1 + 1 + 2 + 1 + 1 = 6
    // inProgressTickets: 2
    // waitingForRequesterTickets: 1
    // resolvedTickets: 3
    // closedTickets: 2
    await createTestTicket(requester1Id, "NEW", "Requester 1 New Ticket");
    await createTestTicket(requester1Id, "OPEN", "Requester 1 Open Ticket");
    await createTestTicket(requester1Id, "IN_PROGRESS", "Requester 1 In Progress 1");
    await createTestTicket(requester1Id, "IN_PROGRESS", "Requester 1 In Progress 2");
    await createTestTicket(requester1Id, "WAITING_FOR_REQUESTER", "Requester 1 Waiting Ticket");
    await createTestTicket(requester1Id, "REOPENED", "Requester 1 Reopened Ticket");
    await createTestTicket(requester1Id, "RESOLVED", "Requester 1 Resolved 1");
    await createTestTicket(requester1Id, "RESOLVED", "Requester 1 Resolved 2");
    await createTestTicket(requester1Id, "RESOLVED", "Requester 1 Resolved 3");
    await createTestTicket(requester1Id, "CLOSED", "Requester 1 Closed 1");
    await createTestTicket(requester1Id, "CLOSED", "Requester 1 Closed 2");
    await createTestTicket(requester1Id, "CANCELLED", "Requester 1 Cancelled Ticket");

    // 4. Populate tickets for Requester 2 to verify strict isolation:
    await createTestTicket(requester2Id, "IN_PROGRESS", "Requester 2 In Progress Ticket");
    await createTestTicket(requester2Id, "RESOLVED", "Requester 2 Resolved Ticket");
    await createTestTicket(requester2Id, "CLOSED", "Requester 2 Closed Ticket");
  });

  afterAll(async () => {
    if (createdTicketIds.length > 0) {
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }
  });

  describe("GET /api/requester/dashboard (API-09 / AC-12)", () => {
    it("returns 200 with accurate 5 metrics and recentTickets strictly isolated to authenticated user", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${tokenRequester1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");

      const { metrics, recentTickets } = res.body;

      // Assert metrics calculation
      expect(metrics.openTickets).toBe(6);
      expect(metrics.inProgressTickets).toBe(2);
      expect(metrics.waitingForRequesterTickets).toBe(1);
      expect(metrics.resolvedTickets).toBe(3);
      expect(metrics.closedTickets).toBe(2);

      // Assert recentTickets structure and isolation
      expect(Array.isArray(recentTickets)).toBe(true);
      expect(recentTickets.length).toBeLessThanOrEqual(5);

      for (const ticket of recentTickets) {
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("currentStatus");
        expect(ticket).toHaveProperty("requestedPriority");
        expect(ticket).toHaveProperty("category");
        expect(ticket.category).toHaveProperty("id");
        expect(ticket.category).toHaveProperty("name");
        expect(ticket).toHaveProperty("updatedAt");
        // Must belong to requester 1, not requester 2
        expect(ticket.summary).not.toContain("Requester 2");
      }

      // Assert descending order by updatedAt
      for (let i = 0; i < recentTickets.length - 1; i++) {
        const dateA = new Date(recentTickets[i].updatedAt).getTime();
        const dateB = new Date(recentTickets[i + 1].updatedAt).getTime();
        expect(dateA).toBeGreaterThanOrEqual(dateB);
      }
    });

    it("verifies Requester 2 receives isolated counts independent of Requester 1", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${tokenRequester2}`);

      expect(res.status).toBe(200);
      const { metrics, recentTickets } = res.body;

      expect(metrics.openTickets).toBe(1);
      expect(metrics.inProgressTickets).toBe(1);
      expect(metrics.waitingForRequesterTickets).toBe(0);
      expect(metrics.resolvedTickets).toBe(1);
      expect(metrics.closedTickets).toBe(1);

      expect(recentTickets.length).toBe(3);
      for (const ticket of recentTickets) {
        expect(ticket.summary).toContain("Requester 2");
      }
    });

    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/requester/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects non-requester IT Staff with 403 Forbidden (API-11 / AC-14)", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only Requesters can access the Requester Dashboard");
    });

    it("rejects non-requester Administrator with 403 Forbidden (AC-14)", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only Requesters can access the Requester Dashboard");
    });

    it("rejects user who must change password with 403 PASSWORD_CHANGE_REQUIRED", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${tokenMustChangePass}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });
});
