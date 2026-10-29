import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 22: Ticket Workflow Hardening & Resolution Gate Test Suite
// Covers: WF-01, WF-02, WF-03, API-07, API-08, API-10b, API-14b, API-15
// Acceptance Criteria: AC-07, AC-08, AC-09, AC-10, AC-11, AC-23, AC-25
// ---------------------------------------------------------------------------

describe("Lab 4 Ticket Workflow API Tests (ticket-workflow.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenRequester1: string;
  let tokenRequester2: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenInactiveStaff: string;
  let tokenAdmin: string;

  let requester1Id: number;
  let requester2Id: number;
  let staff1Id: number;
  let staff2Id: number;
  let inactiveStaffId: number;
  let adminId: number;

  let categoryId: number;
  let systemId: number;

  // Clean-up tracker for created test ticket IDs
  const createdTicketIds: number[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Setup Test Users
    const req1 = await prisma.user.upsert({
      where: { email: "req1.workflowtest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Workflow Requester 1",
        email: "req1.workflowtest@toktickit.local",
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
      where: { email: "req2.workflowtest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Workflow Requester 2",
        email: "req2.workflowtest@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester2Id = req2.id;
    tokenRequester2 = generateToken(req2);

    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.workflowtest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Workflow Staff 1",
        email: "staff1.workflowtest@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Infrastructure",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff1Id = staff1.id;
    tokenStaff1 = generateToken(staff1);

    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.workflowtest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Workflow Staff 2",
        email: "staff2.workflowtest@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff2Id = staff2.id;
    tokenStaff2 = generateToken(staff2);

    const inactiveStaff = await prisma.user.upsert({
      where: { email: "inactive.staff.workflowtest@toktickit.local" },
      update: { isActive: false, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Inactive Staff",
        email: "inactive.staff.workflowtest@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: false,
        mustChangePassword: false,
      },
    });
    inactiveStaffId = inactiveStaff.id;
    tokenInactiveStaff = generateToken(inactiveStaff);

    const admin = await prisma.user.upsert({
      where: { email: "admin.workflowtest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "ADMINISTRATOR" },
      create: {
        name: "Workflow Admin",
        email: "admin.workflowtest@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "IT Leadership",
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    tokenAdmin = generateToken(admin);

    // 2. Fetch or seed category and related system
    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    if (!cat) throw new Error("No active category found");
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    if (!sys) throw new Error("No active related system found");
    systemId = sys.id;
  });

  afterAll(async () => {
    if (createdTicketIds.length > 0) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
      await prisma.publicComment.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
      await prisma.internalNote.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
      await prisma.attachment.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
      await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
    }
  });

  // Helper to create test ticket with explicit status
  async function createTestTicket(status: any = "NEW", requesterId = requester1Id, ownerId: number | null = staff1Id) {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        summary: `Workflow Test Ticket ${status}`,
        description: "Test ticket for validating workflow state enforcement and resolution gate",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: status,
        requesterId,
        ticketOwnerId: ownerId,
        categoryId,
        relatedSystemId: systemId,
      },
    });
    createdTicketIds.push(ticket.id);
    return ticket;
  }

  // =========================================================================
  // 1. Resolution Gate Enforcement (WF-01 / AC-07 / BR-08)
  // =========================================================================
  describe("Resolution Gate Enforcement (WF-01 / AC-07 / BR-08)", () => {
    it("rejects direct status transition attempt to RESOLVED by a Requester with 403 FORBIDDEN", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenRequester1}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Access denied. Only IT Staff and Administrators");

      // Verify ticket status in DB remains IN_PROGRESS
      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("IN_PROGRESS");
    });

    it("rejects direct status transition attempt to CLOSED by a Requester with 403 FORBIDDEN", async () => {
      const ticket = await createTestTicket("RESOLVED");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenRequester1}`)
        .send({
          status: "CLOSED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");

      // Verify status in DB remains RESOLVED
      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("RESOLVED");
    });

    it("allows IT Staff to formally transition ticket to RESOLVED (200 OK)", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
      expect(res.body.message).toContain("successfully");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("RESOLVED");
    });

    it("allows Administrator to formally transition ticket to RESOLVED and CLOSED (200 OK)", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      // 1. IN_PROGRESS -> RESOLVED by Admin
      const resResolved = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(resResolved.status).toBe(200);
      expect(resResolved.body.currentStatus).toBe("RESOLVED");

      // 2. RESOLVED -> CLOSED by Admin
      const resClosed = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          status: "CLOSED",
          expectedUpdatedAt: resResolved.body.updatedAt,
        });

      expect(resClosed.status).toBe(200);
      expect(resClosed.body.currentStatus).toBe("CLOSED");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("CLOSED");
    });
  });

  // =========================================================================
  // 2. Advisory Resolution Indication (WF-02 / AC-08 / BR-09)
  // =========================================================================
  describe("Advisory Resolution Indication (WF-02 / AC-08 / BR-09)", () => {
    it("permits ticket requester to indicate resolution while preserving currentStatus (200 OK)", async () => {
      const ticket = await createTestTicket("IN_PROGRESS", requester1Id);

      const res = await request(app)
        .patch(`/api/requester/tickets/${ticket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${tokenRequester1}`);

      expect(res.status).toBe(200);
      expect(res.body.problemAppearsResolved).toBe(true);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
      expect(res.body.message).toContain("Problem indicated as resolved");

      // Assert database record: problemAppearsResolved is true but currentStatus is NOT modified
      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.problemAppearsResolved).toBe(true);
      expect(inDb?.currentStatus).toBe("IN_PROGRESS");
    });

    it("rejects non-owner requester from indicating resolution (403 FORBIDDEN)", async () => {
      const ticket = await createTestTicket("IN_PROGRESS", requester1Id);

      const res = await request(app)
        .patch(`/api/requester/tickets/${ticket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${tokenRequester2}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("subsequent formal inspection by IT Staff transitions advisory ticket to RESOLVED (200 OK)", async () => {
      const ticket = await createTestTicket("IN_PROGRESS", requester1Id);

      // Requester advises
      await request(app)
        .patch(`/api/requester/tickets/${ticket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${tokenRequester1}`);

      const advisedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(advisedTicket?.problemAppearsResolved).toBe(true);
      expect(advisedTicket?.currentStatus).toBe("IN_PROGRESS");

      // IT Staff executes authoritative resolution
      const resStaffResolve = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: advisedTicket!.updatedAt.toISOString(),
        });

      expect(resStaffResolve.status).toBe(200);
      expect(resStaffResolve.body.currentStatus).toBe("RESOLVED");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("RESOLVED");
    });
  });

  // =========================================================================
  // 3. Strict 8-Status Transition Matrix Multi-Step Workflow (WF-03 / AC-09 / BR-07)
  // =========================================================================
  describe("Strict 8-Status Transition Matrix Multi-Step Workflow (WF-03 / AC-09 / BR-07)", () => {
    it("executes full permitted sequential lifecycle: NEW -> OPEN -> IN_PROGRESS -> WAITING_FOR_REQUESTER -> RESOLVED -> CLOSED", async () => {
      const ticket = await createTestTicket("NEW");

      // Step 1: NEW -> OPEN
      const resOpen = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "OPEN", expectedUpdatedAt: ticket.updatedAt.toISOString() });
      expect(resOpen.status).toBe(200);
      expect(resOpen.body.currentStatus).toBe("OPEN");

      // Step 2: OPEN -> IN_PROGRESS
      const resInProgress = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "IN_PROGRESS", expectedUpdatedAt: resOpen.body.updatedAt });
      expect(resInProgress.status).toBe(200);
      expect(resInProgress.body.currentStatus).toBe("IN_PROGRESS");

      // Step 3: IN_PROGRESS -> WAITING_FOR_REQUESTER
      const resWaiting = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "WAITING_FOR_REQUESTER", expectedUpdatedAt: resInProgress.body.updatedAt });
      expect(resWaiting.status).toBe(200);
      expect(resWaiting.body.currentStatus).toBe("WAITING_FOR_REQUESTER");

      // Step 4: WAITING_FOR_REQUESTER -> RESOLVED
      const resResolved = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "RESOLVED", expectedUpdatedAt: resWaiting.body.updatedAt });
      expect(resResolved.status).toBe(200);
      expect(resResolved.body.currentStatus).toBe("RESOLVED");

      // Step 5: RESOLVED -> CLOSED
      const resClosed = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CLOSED", expectedUpdatedAt: resResolved.body.updatedAt });
      expect(resClosed.status).toBe(200);
      expect(resClosed.body.currentStatus).toBe("CLOSED");

      // Step 6: CLOSED -> REOPENED (Sprint 4 Addition)
      const resReopened = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "REOPENED", expectedUpdatedAt: resClosed.body.updatedAt });
      expect(resReopened.status).toBe(200);
      expect(resReopened.body.currentStatus).toBe("REOPENED");

      // Step 7: REOPENED -> WAITING_FOR_REQUESTER (Sprint 4 Addition)
      const resReopenedToWait = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "WAITING_FOR_REQUESTER", expectedUpdatedAt: resReopened.body.updatedAt });
      expect(resReopenedToWait.status).toBe(200);
      expect(resReopenedToWait.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
    });

    it("rejects NEW -> IN_PROGRESS with 400 INVALID_TRANSITION (Sprint 4 Refinement 1)", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "IN_PROGRESS", expectedUpdatedAt: ticket.updatedAt.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRANSITION");
      expect(res.body.error).toContain("Cannot transition status from NEW to IN_PROGRESS");
    });

    it("rejects OPEN -> RESOLVED with 400 INVALID_TRANSITION (Sprint 4 Refinement 2)", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "RESOLVED", expectedUpdatedAt: ticket.updatedAt.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRANSITION");
      expect(res.body.error).toContain("Cannot transition status from OPEN to RESOLVED");
    });

    it("rejects invalid transitions: NEW -> RESOLVED, NEW -> CLOSED, IN_PROGRESS -> CLOSED", async () => {
      const ticketNew = await createTestTicket("NEW");
      const resNewResolved = await request(app)
        .patch(`/api/staff/tickets/${ticketNew.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "RESOLVED", expectedUpdatedAt: ticketNew.updatedAt.toISOString() });
      expect(resNewResolved.status).toBe(400);
      expect(resNewResolved.body.code).toBe("INVALID_TRANSITION");

      const resNewClosed = await request(app)
        .patch(`/api/staff/tickets/${ticketNew.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CLOSED", expectedUpdatedAt: ticketNew.updatedAt.toISOString() });
      expect(resNewClosed.status).toBe(400);
      expect(resNewClosed.body.code).toBe("INVALID_TRANSITION");

      const ticketProgress = await createTestTicket("IN_PROGRESS");
      const resProgressClosed = await request(app)
        .patch(`/api/staff/tickets/${ticketProgress.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CLOSED", expectedUpdatedAt: ticketProgress.updatedAt.toISOString() });
      expect(resProgressClosed.status).toBe(400);
      expect(resProgressClosed.body.code).toBe("INVALID_TRANSITION");
    });

    it("rejects transition to the exact same status", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "IN_PROGRESS", expectedUpdatedAt: ticket.updatedAt.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRANSITION");
    });
  });

  // =========================================================================
  // 4. Optimistic Concurrency Protection (API-07 / API-08 / AC-10 / AC-11 / BR-10)
  // =========================================================================
  describe("Optimistic Concurrency Protection (API-07 / API-08 / AC-10 / AC-11 / BR-10)", () => {
    it("API-07: rejects missing expectedUpdatedAt with 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details[0].field).toBe("expectedUpdatedAt");
      expect(res.body.details[0].message).toContain("required for concurrency control");
    });

    it("API-07: rejects malformed expectedUpdatedAt with 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "OPEN", expectedUpdatedAt: "not-a-valid-iso-date" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details[0].field).toBe("expectedUpdatedAt");
      expect(res.body.details[0].message).toContain("must be a valid ISO-8601 UTC date string");
    });

    it("API-08: detects stale update mismatch returning 409 STALE_UPDATE_CONFLICT and recovers cleanly upon refresh", async () => {
      const ticket = await createTestTicket("OPEN");
      const staleTimestamp = ticket.updatedAt.toISOString();

      // Another user transitions ticket to IN_PROGRESS (updating updatedAt in DB)
      const resFirstUpdate = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff2}`)
        .send({ status: "IN_PROGRESS", expectedUpdatedAt: staleTimestamp });
      expect(resFirstUpdate.status).toBe(200);
      const latestTimestamp = resFirstUpdate.body.updatedAt;

      // Staff 1 tries to transition using stale timestamp
      const resStale = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CANCELLED", expectedUpdatedAt: staleTimestamp });

      expect(resStale.status).toBe(409);
      expect(resStale.body.code).toBe("STALE_UPDATE_CONFLICT");
      expect(resStale.body.error).toContain("Conflict: Ticket has been modified");
      expect(resStale.body.currentUpdatedAt).toBe(latestTimestamp);

      // Staff 1 reviews conflict, adopts latest timestamp, and successfully updates ticket
      const resRetry = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CANCELLED", expectedUpdatedAt: latestTimestamp });

      expect(resRetry.status).toBe(200);
      expect(resRetry.body.currentStatus).toBe("CANCELLED");
    });

    it("API-07: rejects non-existent calendar date (e.g. Feb 31) with 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "OPEN", expectedUpdatedAt: "2026-02-31T12:00:00Z" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details[0].field).toBe("expectedUpdatedAt");
      expect(res.body.details[0].message).toContain("must be a valid ISO-8601 UTC date string");
    });

    it("API-08: guarantees atomic race condition resolution when two concurrent requests update with the same timestamp", async () => {
      const ticket = await createTestTicket("OPEN");
      const initialTimestamp = ticket.updatedAt.toISOString();

      // Launch two concurrent status transitions targeting different valid target statuses (IN_PROGRESS vs WAITING_FOR_REQUESTER)
      const [reqA, reqB] = await Promise.all([
        request(app)
          .patch(`/api/staff/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({ status: "IN_PROGRESS", expectedUpdatedAt: initialTimestamp }),
        request(app)
          .patch(`/api/staff/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff2}`)
          .send({ status: "WAITING_FOR_REQUESTER", expectedUpdatedAt: initialTimestamp }),
      ]);

      const statuses = [reqA.status, reqB.status].sort();
      expect(statuses).toEqual([200, 409]);

      const successReq = reqA.status === 200 ? reqA : reqB;
      const conflictReq = reqA.status === 409 ? reqA : reqB;

      expect(successReq.body.currentStatus).toBeDefined();
      expect(conflictReq.body.code).toBe("STALE_UPDATE_CONFLICT");
      expect(conflictReq.body.currentUpdatedAt).toBeDefined();

      // Verify the final state in the database matches the successful transition
      const finalTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(finalTicket?.currentStatus).toBe(successReq.body.currentStatus);
    });

    it("API-08: guarantees strict timestamp monotonicity and rejects identical-timestamp re-update (same-millisecond OCC)", async () => {
      const ticket = await createTestTicket("OPEN");
      const initialTimestamp = ticket.updatedAt.toISOString();

      // Request 1 updates the ticket using initialTimestamp
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "IN_PROGRESS", expectedUpdatedAt: initialTimestamp });

      expect(res1.status).toBe(200);
      expect(res1.body.currentStatus).toBe("IN_PROGRESS");
      const updatedTimestamp = res1.body.updatedAt;

      // Monotonicity assertion: new updatedAt MUST be strictly greater than initialTimestamp by at least 1ms
      expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(new Date(initialTimestamp).getTime());

      // Request 2 immediately attempts to re-update using the exact same initialTimestamp
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff2}`)
        .send({ status: "WAITING_FOR_REQUESTER", expectedUpdatedAt: initialTimestamp });

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe("STALE_UPDATE_CONFLICT");
      expect(res2.body.currentUpdatedAt).toBe(updatedTimestamp);

      // Verify the database status remains IN_PROGRESS and was not overwritten by Request 2
      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("IN_PROGRESS");
    });
  });

  // =========================================================================
  // 5. Terminal CANCELLED Ticket Immutability (API-14b / AC-23 / BR-11)
  // =========================================================================
  describe("Terminal CANCELLED Ticket Immutability (API-14b / AC-23 / BR-11)", () => {
    it("rejects status transitions on CANCELLED ticket with 400 TICKET_CANCELLED", async () => {
      const ticket = await createTestTicket("CANCELLED");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "OPEN", expectedUpdatedAt: ticket.updatedAt.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("TICKET_CANCELLED");
      expect(res.body.error).toBe("Cannot transition status of a cancelled ticket");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("CANCELLED");
    });

    it("rejects advisory resolution indication on CANCELLED ticket with 400 TICKET_CANCELLED", async () => {
      const ticket = await createTestTicket("CANCELLED", requester1Id);

      const res = await request(app)
        .patch(`/api/requester/tickets/${ticket.id}/resolve-indication`)
        .set("Authorization", `Bearer ${tokenRequester1}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("TICKET_CANCELLED");
      expect(res.body.error).toBe("Cannot submit resolution indication on a cancelled ticket");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("CANCELLED");
      expect(inDb?.problemAppearsResolved).toBe(false);
    });
  });

  // =========================================================================
  // 6. Ticket Reassignment Active Staff Enforcement (API-15 / AC-25 / BR-18)
  // =========================================================================
  describe("Ticket Reassignment Validation (API-15 / AC-25 / BR-18)", () => {
    it("rejects non-existent newOwnerId with 400 INVALID_OWNER, verifying ticket owner remains unchanged", async () => {
      const ticket = await createTestTicket("OPEN", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: 99999999 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_OWNER");
      expect(res.body.error).toContain("Target user must be an active IT Staff member");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
    });

    it("rejects inactive user with 400 INVALID_OWNER, verifying ticket owner remains unchanged", async () => {
      const ticket = await createTestTicket("OPEN", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: inactiveStaffId });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_OWNER");
      expect(res.body.error).toContain("Target user must be an active IT Staff member");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
    });

    it("rejects non-IT-Staff user (e.g. Requester) with 400 INVALID_OWNER, verifying ticket owner remains unchanged", async () => {
      const ticket = await createTestTicket("OPEN", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: requester2Id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_OWNER");
      expect(res.body.error).toContain("Target user must be an active IT Staff member");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
    });

    it("rejects reassignment on CLOSED ticket with 400 INVALID_STATE, verifying ticket remains unchanged", async () => {
      const ticket = await createTestTicket("CLOSED", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: staff2Id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATE");
      expect(res.body.error).toContain("Cannot reassign a closed or cancelled ticket");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
      expect(inDb?.currentStatus).toBe("CLOSED");
    });

    it("rejects reassignment on CANCELLED ticket with 400 INVALID_STATE, verifying ticket remains unchanged", async () => {
      const ticket = await createTestTicket("CANCELLED", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: staff2Id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATE");
      expect(res.body.error).toContain("Cannot reassign a closed or cancelled ticket");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
      expect(inDb?.currentStatus).toBe("CANCELLED");
    });

    it("rejects non-staff user (Requester or Administrator) from invoking reassignment (403 FORBIDDEN)", async () => {
      const ticket = await createTestTicket("OPEN", requester1Id, staff1Id);

      const resReq = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenRequester1}`)
        .send({ newOwnerId: staff2Id });
      expect(resReq.status).toBe(403);
      expect(resReq.body.code).toBe("FORBIDDEN");

      const resAdmin = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ newOwnerId: staff2Id });
      expect(resAdmin.status).toBe(403);
      expect(resAdmin.body.code).toBe("FORBIDDEN");
    });

    it("successfully reassigns ticket to active IT Staff member (200 OK)", async () => {
      const ticket = await createTestTicket("OPEN", requester1Id, staff1Id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: staff2Id });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("successfully");
      expect(res.body.ticketOwner.id).toBe(staff2Id);

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.ticketOwnerId).toBe(staff2Id);
    });
  });

  // =========================================================================
  // 7. Administrator Supervisory Queue & Status Transition Authority (API-10b)
  // =========================================================================
  describe("Administrator Supervisory Oversight (API-10b / AC-07 / AC-09)", () => {
    it("allows Administrator to retrieve the Staff Ticket Queue (GET /api/staff/tickets -> 200 OK)", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty("totalRecords");
    });

    it("allows Administrator to execute ticket status transitions (PATCH /api/staff/tickets/:id/status -> 200 OK)", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          status: "OPEN",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("OPEN");

      const inDb = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(inDb?.currentStatus).toBe("OPEN");
    });

    it("allows Administrator supervisory read access to Ticket Detail (GET /api/staff/tickets/:id -> 200 OK)", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.ticket).toHaveProperty("id", ticket.id);
      expect(res.body.ticket).toHaveProperty("ticketNumber", ticket.ticketNumber);
      expect(res.body.ticket).toHaveProperty("currentStatus", "OPEN");
    });

    it("strictly blocks Requester from accessing Staff Ticket Detail (GET /api/staff/tickets/:id -> 403 Forbidden)", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${tokenRequester1}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("blocks unauthenticated requests to Staff Ticket Detail (GET /api/staff/tickets/:id -> 401 Unauthorized)", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });
});
