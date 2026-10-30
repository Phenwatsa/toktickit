import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 24: Staff & Administrator Dashboard API Test Suite
// Covers: API-10, API-11, API-12, API-13, AC-13, AC-14, AC-19a, AC-19b, BR-14, BR-17
// ---------------------------------------------------------------------------

describe("Staff and Administrator Dashboard API Tests (staff-dashboard.api.test.ts)", { timeout: 15000 }, () => {
  const prisma = getPrisma();

  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;
  let tokenRequester: string;
  let tokenMustChangePass: string;

  let staff1Id: number;
  let staff2Id: number;
  let adminId: number;
  let requesterId: number;

  let categoryId: number;
  let systemId: number;

  const createdTicketIds: number[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Setup Test Users
    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.dashapi@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Staff User 1",
        email: "staff1.dashapi@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff1Id = staff1.id;
    tokenStaff1 = generateToken(staff1);

    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.dashapi@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Staff User 2",
        email: "staff2.dashapi@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Infrastructure",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff2Id = staff2.id;
    tokenStaff2 = generateToken(staff2);

    const admin = await prisma.user.upsert({
      where: { email: "admin.dashapi@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "ADMINISTRATOR" },
      create: {
        name: "Admin User",
        email: "admin.dashapi@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Executive",
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    tokenAdmin = generateToken(admin);

    const requester = await prisma.user.upsert({
      where: { email: "requester.dashapi@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Standard Requester",
        email: "requester.dashapi@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterId = requester.id;
    tokenRequester = generateToken(requester);

    const mustChange = await prisma.user.upsert({
      where: { email: "staff.mustchange@toktickit.local" },
      update: { isActive: true, mustChangePassword: true, role: "IT_STAFF" },
      create: {
        name: "Must Change Staff",
        email: "staff.mustchange@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: true,
      },
    });
    tokenMustChangePass = generateToken(mustChange);

    // 2. Fetch existing active Category & System
    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    if (!cat) throw new Error("No active category found");
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    if (!sys) throw new Error("No active related system found");
    systemId = sys.id;

    // Helper to create tickets
    const createTestTicket = async (
      status: any,
      priority: any,
      ownerId: number | null,
      summary: string
    ) => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-STAFFDASH-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          summary,
          description: "Staff dashboard metrics testing ticket",
          currentStatus: status,
          requestedPriority: priority,
          itPriority: priority,
          requesterId,
          ticketOwnerId: ownerId,
          categoryId,
          relatedSystemId: systemId,
        },
      });
      createdTicketIds.push(ticket.id);
      return ticket;
    };

    // 3. Populate controlled ticket test set:
    // Active tickets:
    // 1: NEW, LOW, unassigned
    await createTestTicket("NEW", "LOW", null, "New Low Unassigned");
    // 2: OPEN, MEDIUM, assigned to staff1
    await createTestTicket("OPEN", "MEDIUM", staff1Id, "Open Medium Staff1");
    // 3: IN_PROGRESS, HIGH, assigned to staff1
    await createTestTicket("IN_PROGRESS", "HIGH", staff1Id, "InProgress High Staff1");
    // 4: IN_PROGRESS, URGENT, assigned to staff2
    await createTestTicket("IN_PROGRESS", "URGENT", staff2Id, "InProgress Urgent Staff2");
    // 5: WAITING_FOR_REQUESTER, MEDIUM, unassigned
    await createTestTicket("WAITING_FOR_REQUESTER", "MEDIUM", null, "Waiting Medium Unassigned");
    // 6: REOPENED, HIGH, assigned to staff1
    await createTestTicket("REOPENED", "HIGH", staff1Id, "Reopened High Staff1");
    // 7: RESOLVED, LOW, assigned to staff1
    await createTestTicket("RESOLVED", "LOW", staff1Id, "Resolved Low Staff1");

    // Inactive tickets (CLOSED, CANCELLED):
    // 8: CLOSED, URGENT, assigned to staff1 (should not count in myAssignedTickets or byPriority)
    await createTestTicket("CLOSED", "URGENT", staff1Id, "Closed Urgent Staff1");
    // 9: CANCELLED, HIGH, unassigned (should not count in unassignedTickets or byPriority)
    await createTestTicket("CANCELLED", "HIGH", null, "Cancelled High Unassigned");
  });

  afterAll(async () => {
    if (createdTicketIds.length > 0) {
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }
  });

  // =========================================================================
  // Part 1: IT Staff Dashboard (GET /api/staff/dashboard)
  // =========================================================================

  describe("GET /api/staff/dashboard (API-10 / AC-13)", () => {
    it("returns 200 with accurate 5 primary cards, unassigned queue, 8-status distribution, priorities, and recent tickets", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");

      const { metrics, recentTickets } = res.body;

      // Primary cards
      expect(metrics.primary).toHaveProperty("newTickets");
      expect(metrics.primary).toHaveProperty("openTickets");
      expect(metrics.primary).toHaveProperty("inProgressTickets");
      expect(metrics.primary).toHaveProperty("waitingForRequesterTickets");
      expect(metrics.primary).toHaveProperty("myAssignedTickets");

      // Verify counts are numbers and >= seeded test tickets
      expect(metrics.primary.newTickets).toBeGreaterThanOrEqual(1);
      expect(metrics.primary.openTickets).toBeGreaterThanOrEqual(1);
      expect(metrics.primary.inProgressTickets).toBeGreaterThanOrEqual(2);
      expect(metrics.primary.waitingForRequesterTickets).toBeGreaterThanOrEqual(1);

      // myAssignedTickets for staff1: OPEN + IN_PROGRESS + REOPENED + RESOLVED = 4 active tickets
      // (CLOSED ticket #8 is strictly excluded from active assigned count)
      expect(metrics.primary.myAssignedTickets).toBe(4);

      // unassignedTickets (active, unassigned): NEW + WAITING_FOR_REQUESTER = at least 2
      expect(metrics.unassignedTickets).toBeGreaterThanOrEqual(2);

      // 8-status distribution
      expect(metrics.byStatus).toHaveProperty("new");
      expect(metrics.byStatus).toHaveProperty("open");
      expect(metrics.byStatus).toHaveProperty("inProgress");
      expect(metrics.byStatus).toHaveProperty("waitingForRequester");
      expect(metrics.byStatus).toHaveProperty("resolved");
      expect(metrics.byStatus).toHaveProperty("closed");
      expect(metrics.byStatus).toHaveProperty("reopened");
      expect(metrics.byStatus).toHaveProperty("cancelled");

      expect(metrics.byStatus.new).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.open).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.inProgress).toBeGreaterThanOrEqual(2);
      expect(metrics.byStatus.waitingForRequester).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.resolved).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.closed).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.reopened).toBeGreaterThanOrEqual(1);
      expect(metrics.byStatus.cancelled).toBeGreaterThanOrEqual(1);

      // Priority distribution across active tickets
      expect(metrics.byPriority).toHaveProperty("low");
      expect(metrics.byPriority).toHaveProperty("medium");
      expect(metrics.byPriority).toHaveProperty("high");
      expect(metrics.byPriority).toHaveProperty("urgent");

      expect(metrics.byPriority.low).toBeGreaterThanOrEqual(2);
      expect(metrics.byPriority.medium).toBeGreaterThanOrEqual(2);
      expect(metrics.byPriority.high).toBeGreaterThanOrEqual(2);
      expect(metrics.byPriority.urgent).toBeGreaterThanOrEqual(1);

      // Recent queue tickets
      expect(Array.isArray(recentTickets)).toBe(true);
      expect(recentTickets.length).toBeLessThanOrEqual(5);

      for (const ticket of recentTickets) {
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("currentStatus");
        expect(ticket).toHaveProperty("itPriority");
        expect(ticket).toHaveProperty("requester");
        expect(ticket.requester).toHaveProperty("name");
        expect(ticket).toHaveProperty("updatedAt");
        // Must be active (not CLOSED or CANCELLED)
        expect(["CLOSED", "CANCELLED"]).not.toContain(ticket.currentStatus);
      }
    });

    it("verifies myAssignedTickets differs between different IT Staff members", async () => {
      const resStaff2 = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${tokenStaff2}`);

      expect(resStaff2.status).toBe(200);
      // staff2 has only 1 active ticket assigned (IN_PROGRESS, URGENT)
      expect(resStaff2.body.metrics.primary.myAssignedTickets).toBe(1);
    });

    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects Requester with 403 Forbidden (API-11 / AC-14)", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff can access the Staff Dashboard");
    });

    it("rejects Administrator with 403 Forbidden (API-11 / AC-14)", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff can access the Staff Dashboard");
    });

    it("rejects IT Staff who must change password with 403 PASSWORD_CHANGE_REQUIRED", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${tokenMustChangePass}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });

  // =========================================================================
  // Part 2: Administrator Dashboard (GET /api/admin/dashboard)
  // =========================================================================

  describe("GET /api/admin/dashboard (API-12 / AC-19a)", () => {
    it("returns 200 with operational metrics, user statistics, and recent system queue for Administrator", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("operational");
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("recentTickets");

      const { operational, users, recentTickets } = res.body;

      // Operational metrics
      expect(operational).toHaveProperty("unassignedTickets");
      expect(operational).toHaveProperty("totalActiveTickets");
      expect(operational.unassignedTickets).toBeGreaterThanOrEqual(2);
      expect(operational.totalActiveTickets).toBeGreaterThanOrEqual(7);

      // User account statistics
      expect(users).toHaveProperty("totalUsers");
      expect(users).toHaveProperty("activeUsers");
      expect(users).toHaveProperty("inactiveUsers");
      expect(users).toHaveProperty("byRole");

      expect(users.totalUsers).toBeGreaterThanOrEqual(4);
      expect(users.activeUsers).toBeGreaterThanOrEqual(4);
      expect(users.totalUsers).toBe(users.activeUsers + users.inactiveUsers);

      expect(users.byRole).toHaveProperty("requester");
      expect(users.byRole).toHaveProperty("itStaff");
      expect(users.byRole).toHaveProperty("administrator");

      expect(users.byRole.requester).toBeGreaterThanOrEqual(1);
      expect(users.byRole.itStaff).toBeGreaterThanOrEqual(2);
      expect(users.byRole.administrator).toBeGreaterThanOrEqual(1);

      // Recent system tickets
      expect(Array.isArray(recentTickets)).toBe(true);
      expect(recentTickets.length).toBeLessThanOrEqual(5);

      for (const ticket of recentTickets) {
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("currentStatus");
        expect(ticket).toHaveProperty("requestedPriority");
        expect(ticket).toHaveProperty("itPriority");
        expect(ticket).toHaveProperty("requester");
        expect(ticket.requester).toHaveProperty("name");
        expect(ticket).toHaveProperty("updatedAt");
        // Must be active tickets
        expect(["CLOSED", "CANCELLED"]).not.toContain(ticket.currentStatus);
      }
    });

    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/admin/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects Requester with 403 Forbidden (API-13 / AC-19b)", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only Administrators can access the Administrator Dashboard");
    });

    it("rejects IT Staff with 403 Forbidden (API-13 / AC-19b)", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only Administrators can access the Administrator Dashboard");
    });
  });
});
