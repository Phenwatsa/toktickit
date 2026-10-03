import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: IT Staff Ticket Operations API Tests
// Covers:
// - API-09: IT Staff claims unassigned ticket ownership (AC-07)
// - API-10: IT Staff updates itPriority preserving requestedPriority (AC-08)
// - API-11: IT Staff attempts invalid status transition (AC-09)
// - Role restrictions for staff detail, claim, assign, priority, and status
// ---------------------------------------------------------------------------

describe("Lab 3 IT Staff Ticket Operations API (staff-ticket-detail.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenRequester: string;
  let tokenAdmin: string;

  let staff1Id: number;
  let staff2Id: number;
  let requesterId: number;
  let categoryId: number;
  let systemId: number;

  let testTicketId: number;
  let testTicketNumber: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const cat = await prisma.category.findFirstOrThrow({ where: { name: "Hardware" } });
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Corporate Laptop" } });
    systemId = sys.id;

    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.detail@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff One Detail",
        email: "staff1.detail@toktickit.local",
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
      where: { email: "staff2.detail@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff Two Detail",
        email: "staff2.detail@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff2Id = staff2.id;
    tokenStaff2 = generateToken(staff2);

    const requester = await prisma.user.upsert({
      where: { email: "requester.detail@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Requester Detail",
        email: "requester.detail@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Finance",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterId = requester.id;
    tokenRequester = generateToken(requester);

    const admin = await prisma.user.upsert({
      where: { email: "admin.detail@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Admin Detail",
        email: "admin.detail@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });
    tokenAdmin = generateToken(admin);

    // Create a base ticket for staff operations
    testTicketNumber = `TKT-TEST-DETAIL-${Date.now()}`;
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: testTicketNumber,
        summary: "Laptop fan makes grinding noise",
        description: "Whenever CPU usage goes above 50%, fan makes loud grinding noise.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId,
        categoryId,
        relatedSystemId: systemId,
        ticketOwnerId: null, // initially unassigned
      },
    });
    testTicketId = ticket.id;

    // Attach sample comment, note, and attachment
    await prisma.publicComment.create({
      data: {
        ticketId: testTicketId,
        authorId: requesterId,
        content: "I also noticed the temperature reaches 90C.",
      },
    });

    await prisma.internalNote.create({
      data: {
        ticketId: testTicketId,
        authorId: staff1Id,
        content: "Check spare parts inventory for replacement fan unit.",
      },
    });

    await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        originalName: "fan_noise.wav",
        storedName: "fan_noise_stored.wav",
        mimeType: "audio/wav",
        sizeBytes: 204800,
      },
    });
  });

  afterAll(async () => {
    if (testTicketId) {
      await prisma.publicComment.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.internalNote.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.attachment.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.ticket.deleteMany({ where: { id: testTicketId } });
    }
  });

  // =========================================================================
  // 1. Role-Based Access Control
  // =========================================================================
  describe("Role-Based Access Control (403 Forbidden for non-staff)", () => {
    it("rejects Requester from accessing staff ticket detail", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("rejects Administrator from accessing staff ticket detail", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("rejects Requester and Administrator from claiming a ticket", async () => {
      const resReq = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${tokenRequester}`);
      expect(resReq.status).toBe(403);

      const resAdmin = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(resAdmin.status).toBe(403);
    });

    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get(`/api/staff/tickets/${testTicketId}`);
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. GET /api/staff/tickets/:id
  // =========================================================================
  describe("GET /api/staff/tickets/:id", () => {
    it("retrieves full ticket detail with attachments, public comments, and internal notes for IT Staff", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.ticket).toBeDefined();

      const { ticket } = res.body;
      expect(ticket.id).toBe(testTicketId);
      expect(ticket.ticketNumber).toBe(testTicketNumber);
      expect(ticket.summary).toBe("Laptop fan makes grinding noise");
      expect(ticket.category.name).toBe("Hardware");
      expect(ticket.relatedSystem.name).toBe("Corporate Laptop");
      expect(ticket.requestedPriority).toBe("MEDIUM");
      expect(ticket.itPriority).toBe("MEDIUM");
      expect(ticket.currentStatus).toBe("NEW");
      expect(ticket.requester.name).toBe("Requester Detail");

      // Attachments
      expect(ticket.attachments).toHaveLength(1);
      expect(ticket.attachments[0].fileName).toBe("fan_noise.wav");

      // Public comments
      expect(ticket.publicComments).toHaveLength(1);
      expect(ticket.publicComments[0].content).toContain("temperature reaches 90C");

      // Internal notes
      expect(ticket.internalNotes).toHaveLength(1);
      expect(ticket.internalNotes[0].content).toContain("spare parts inventory");
    });

    it("returns 404 Not Found for nonexistent ticket ID", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/99999999")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  // =========================================================================
  // 3. PATCH /api/staff/tickets/:id/claim (API-09 / AC-07)
  // =========================================================================
  describe("PATCH /api/staff/tickets/:id/claim (API-09 / AC-07)", () => {
    it("assigns authenticated staff member as ticket owner", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket successfully claimed");
      expect(res.body.ticketOwner).toBeDefined();
      expect(res.body.ticketOwner.id).toBe(staff1Id);
      expect(res.body.ticketOwner.name).toBe("Staff One Detail");

      // Verify in DB
      const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(inDb?.ticketOwnerId).toBe(staff1Id);
    });
  });

  // =========================================================================
  // 4. PATCH /api/staff/tickets/:id/assign (AC-07)
  // =========================================================================
  describe("PATCH /api/staff/tickets/:id/assign (AC-07)", () => {
    it("reassigns ticket owner to another active IT Staff member", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: staff2Id });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket reassigned successfully");
      expect(res.body.ticketOwner.id).toBe(staff2Id);
      expect(res.body.ticketOwner.name).toBe("Staff Two Detail");

      // Verify in DB
      const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(inDb?.ticketOwnerId).toBe(staff2Id);
    });

    it("rejects reassignment to non-IT Staff user with 400 INVALID_OWNER", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: requesterId });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_OWNER");
    });
  });

  // =========================================================================
  // 5. PATCH /api/staff/tickets/:id/priority (API-10 / AC-08)
  // =========================================================================
  describe("PATCH /api/staff/tickets/:id/priority (API-10 / AC-08)", () => {
    it("updates itPriority while original requestedPriority remains intact", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ itPriority: "URGENT" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("IT Priority updated");
      expect(res.body.itPriority).toBe("URGENT");

      // Verify requestedPriority remains MEDIUM in DB
      const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(inDb?.itPriority).toBe("URGENT");
      expect(inDb?.requestedPriority).toBe("MEDIUM");
    });

    it("rejects invalid priority value with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  // =========================================================================
  // 6. PATCH /api/staff/tickets/:id/status (API-11 / AC-09)
  // =========================================================================
  describe("PATCH /api/staff/tickets/:id/status (API-11 / AC-09)", () => {
    it("transitions NEW to IN_PROGRESS", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("rejects illegal direct transition from IN_PROGRESS to CLOSED (API-11 / AC-09)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRANSITION");
      expect(res.body.error).toContain("Invalid status transition from IN_PROGRESS to CLOSED");
    });

    it("transitions IN_PROGRESS to RESOLVED, and then RESOLVED to CLOSED", async () => {
      // 1. IN_PROGRESS -> RESOLVED
      const resResolved = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "RESOLVED" });
      expect(resResolved.status).toBe(200);
      expect(resResolved.body.currentStatus).toBe("RESOLVED");

      // 2. RESOLVED -> CLOSED
      const resClosed = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "CLOSED" });
      expect(resClosed.status).toBe(200);
      expect(resClosed.body.currentStatus).toBe("CLOSED");
    });

    it("blocks further transitions from terminal CLOSED status", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRANSITION");
    });

    it("blocks claim and assign on closed ticket", async () => {
      const resClaim = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${tokenStaff1}`);
      expect(resClaim.status).toBe(400);
      expect(resClaim.body.code).toBe("INVALID_STATE");

      const resAssign = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({ newOwnerId: staff1Id });
      expect(resAssign.status).toBe(400);
      expect(resAssign.body.code).toBe("INVALID_STATE");
    });
  });
});
