import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 21: Actions Taken Backend REST APIs Test Suite
// Covers: API-01, API-02, API-03a, API-03b, API-04, API-05, API-06, API-14a, API-16, API-17
// Acceptance Criteria: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-23, AC-26, AC-27
// ---------------------------------------------------------------------------

describe("Lab 4 Actions Taken API Tests (actions-taken.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenRequester1: string;
  let tokenRequester2: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let requester1Id: number;
  let requester2Id: number;
  let staff1Id: number;
  let staff2Id: number;
  let adminId: number;

  let ticket1Id: number; // Owned by Requester 1, assigned to Staff 1
  let ticket2Id: number; // Owned by Requester 2, assigned to Staff 2
  let cancelledTicketId: number; // In CANCELLED status

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Setup Test Users
    const req1 = await prisma.user.upsert({
      where: { email: "req1.actionstest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Test Requester 1",
        email: "req1.actionstest@toktickit.local",
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
      where: { email: "req2.actionstest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Test Requester 2",
        email: "req2.actionstest@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester2Id = req2.id;
    tokenRequester2 = generateToken(req2);

    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.actionstest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Test Staff 1",
        email: "staff1.actionstest@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff1Id = staff1.id;
    tokenStaff1 = generateToken(staff1);

    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.actionstest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Test Staff 2",
        email: "staff2.actionstest@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff2Id = staff2.id;
    tokenStaff2 = generateToken(staff2);

    const admin = await prisma.user.upsert({
      where: { email: "admin.actionstest@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "ADMINISTRATOR" },
      create: {
        name: "Test Administrator",
        email: "admin.actionstest@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "IT Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    tokenAdmin = generateToken(admin);

    // 2. Fetch or create Categories and Systems
    const cat = await prisma.category.findFirstOrThrow({ where: { name: "Hardware" } });
    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Corporate Laptop" } });

    // 3. Setup Test Tickets
    const t1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-TEST-ACT-001" },
      update: {
        currentStatus: "IN_PROGRESS",
        requesterId: requester1Id,
        ticketOwnerId: staff1Id,
      },
      create: {
        ticketNumber: "TKT-TEST-ACT-001",
        summary: "Actions Test Ticket 1",
        description: "Ticket for verifying Actions Taken creation and updates",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        requesterId: requester1Id,
        ticketOwnerId: staff1Id,
        categoryId: cat.id,
        relatedSystemId: sys.id,
      },
    });
    ticket1Id = t1.id;

    const t2 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-TEST-ACT-002" },
      update: {
        currentStatus: "IN_PROGRESS",
        requesterId: requester2Id,
        ticketOwnerId: staff2Id,
      },
      create: {
        ticketNumber: "TKT-TEST-ACT-002",
        summary: "Actions Test Ticket 2",
        description: "Ticket for verifying scoping and tenant isolation",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "IN_PROGRESS",
        requesterId: requester2Id,
        ticketOwnerId: staff2Id,
        categoryId: cat.id,
        relatedSystemId: sys.id,
      },
    });
    ticket2Id = t2.id;

    const tCancelled = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-TEST-ACT-CANCELLED" },
      update: {
        currentStatus: "CANCELLED",
        requesterId: requester1Id,
        ticketOwnerId: null,
      },
      create: {
        ticketNumber: "TKT-TEST-ACT-CANCELLED",
        summary: "Cancelled Actions Test Ticket",
        description: "Cancelled ticket for verifying terminal immutability",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "CANCELLED",
        requesterId: requester1Id,
        ticketOwnerId: null,
        categoryId: cat.id,
        relatedSystemId: sys.id,
      },
    });
    cancelledTicketId = tCancelled.id;

    // Clean any prior actions on test tickets
    await prisma.actionTaken.deleteMany({
      where: { ticketId: { in: [ticket1Id, ticket2Id, cancelledTicketId] } },
    });
  });

  afterAll(async () => {
    // Cleanup test actions and tickets
    await prisma.actionTaken.deleteMany({
      where: { ticketId: { in: [ticket1Id, ticket2Id, cancelledTicketId] } },
    });
    await prisma.ticket.deleteMany({
      where: { id: { in: [ticket1Id, ticket2Id, cancelledTicketId] } },
    });
  });

  // -------------------------------------------------------------------------
  // API-01 / AC-01: Create Action Taken by Staff and Admin with auto-attribution
  // -------------------------------------------------------------------------
  describe("API-01 / AC-01: Valid Action Taken creation and auto-performer attribution", () => {
    it("creates an Action Taken when submitted by IT Staff and auto-populates performedById", async () => {
      const payload = {
        actionDateTime: "2026-10-10T14:30:00.000Z",
        actionDescription: "Checked server event logs and identified memory leak in service worker.",
        result: "Restarted background service and cleared temporary buffer pool.",
        isFollowUpRequired: true,
        followUpNote: "Monitor memory consumption every 6 hours over the weekend.",
        attachmentNotes: "log-extract-oct10.txt",
        // Client attempts to spoof performedById: should be ignored
        performedById: 9999,
      };

      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ticketId).toBe(ticket1Id);
      expect(res.body.actionDescription).toBe(payload.actionDescription);
      expect(res.body.result).toBe(payload.result);
      expect(res.body.isFollowUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe(payload.followUpNote);
      expect(res.body.attachmentNotes).toBe(payload.attachmentNotes);
      // Auto-set from session (req.user.id)
      expect(res.body.performedBy.id).toBe(staff1Id);
      expect(res.body.performedBy.role).toBe("IT_STAFF");
    });

    it("creates an Action Taken when submitted by another active IT Staff member", async () => {
      const payload = {
        actionDescription: "Secondary IT Staff investigated switch transceiver performance.",
        result: "Verified fiber attenuation within optimal thresholds.",
        isFollowUpRequired: false,
      };

      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff2}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ticketId).toBe(ticket1Id);
      expect(res.body.performedBy.id).toBe(staff2Id);
      expect(res.body.performedBy.role).toBe("IT_STAFF");
      expect(res.body.isFollowUpRequired).toBe(false);
      expect(res.body.followUpNote).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // API-02 / AC-02: Follow-up note validation (< 3 non-whitespace chars rejected)
  // -------------------------------------------------------------------------
  describe("API-02 / AC-02: Follow-up note validation enforcement", () => {
    it("rejects with 400 VALIDATION_ERROR when isFollowUpRequired is not a boolean (e.g. string 'false')", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed network adapter reset.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: "false",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "isFollowUpRequired",
            message: "isFollowUpRequired must be a boolean",
          }),
        ])
      );
    });

    it("rejects with 400 VALIDATION_ERROR when isFollowUpRequired is a number", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed network adapter reset.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "isFollowUpRequired",
            message: "isFollowUpRequired must be a boolean",
          }),
        ])
      );
    });

    it("rejects with 400 VALIDATION_ERROR when isFollowUpRequired is true and followUpNote is omitted", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed firmware reset on network adapter.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: true,
          // followUpNote omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "followUpNote",
            message: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed",
          }),
        ])
      );
    });

    it("rejects with 400 VALIDATION_ERROR when followUpNote contains only whitespace", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed firmware reset on network adapter.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: true,
          followUpNote: "     ",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details[0].field).toBe("followUpNote");
    });

    it("rejects with 400 VALIDATION_ERROR when followUpNote has fewer than 3 non-whitespace characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed firmware reset on network adapter.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: true,
          followUpNote: "  ab  ",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details[0].field).toBe("followUpNote");
    });

    it("accepts when followUpNote has 3 or more non-whitespace characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Performed firmware reset on network adapter.",
          result: "Interface initialized successfully.",
          isFollowUpRequired: true,
          followUpNote: "abc",
        });

      expect(res.status).toBe(201);
      expect(res.body.isFollowUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("abc");
    });
  });

  // -------------------------------------------------------------------------
  // API-03a, API-03b / AC-03: Requester & Administrator blocked from create/edit (403)
  // -------------------------------------------------------------------------
  describe("API-03a & API-03b / AC-03: Requester and Administrator role authorization guards", () => {
    it("API-03a: rejects with 403 Forbidden when Requester attempts to create Action Taken", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenRequester1}`)
        .send({
          actionDescription: "Requester trying to submit an action.",
          result: "Should be forbidden.",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff may record Actions Taken");
    });

    it("API-03a: rejects with 403 Forbidden when Administrator attempts to create Action Taken", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          actionDescription: "Administrator trying to submit an action.",
          result: "Should be forbidden.",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff may record Actions Taken");
    });

    it("API-03b: rejects with 403 Forbidden when Requester attempts to edit an existing Action Taken", async () => {
      const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket1Id } });

      const res = await request(app)
        .patch(`/api/tickets/${ticket1Id}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenRequester1}`)
        .send({
          actionDescription: "Requester trying to modify an action.",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff may modify Actions Taken");
    });

    it("API-03b: rejects with 403 Forbidden when Administrator attempts to edit an existing Action Taken", async () => {
      const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket1Id } });

      const res = await request(app)
        .patch(`/api/tickets/${ticket1Id}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          actionDescription: "Administrator trying to modify an action.",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("Only IT Staff may modify Actions Taken");
    });
  });

  // -------------------------------------------------------------------------
  // API-04, API-05 / AC-04, AC-05: List actions & Tenant Isolation
  // -------------------------------------------------------------------------
  describe("API-04 & API-05 / AC-04, AC-05: Actions listing order and Tenant Isolation", () => {
    let earlyActionId: number;
    let lateActionId: number;

    beforeAll(async () => {
      // Seed two specific actions on ticket2 with known timestamps
      const early = await prisma.actionTaken.create({
        data: {
          ticketId: ticket2Id,
          actionDateTime: new Date("2026-10-09T08:00:00.000Z"),
          actionDescription: "First chronological diagnosis step.",
          result: "Identified initial issue.",
          performedById: staff2Id,
        },
      });
      earlyActionId = early.id;

      const late = await prisma.actionTaken.create({
        data: {
          ticketId: ticket2Id,
          actionDateTime: new Date("2026-10-10T12:00:00.000Z"),
          actionDescription: "Second chronological repair step.",
          result: "Resolved hardware defect.",
          performedById: staff2Id,
        },
      });
      lateActionId = late.id;
    });

    it("API-04 / AC-04: returns Actions Taken in deterministic order (actionDateTime ASC, id ASC) to ticket owner", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket2Id}/actions`)
        .set("Authorization", `Bearer ${tokenRequester2}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Verify deterministic ascending chronological sort
      const ids = res.body.map((a: any) => a.id);
      expect(ids.indexOf(earlyActionId)).toBeLessThan(ids.indexOf(lateActionId));

      const timestamps = res.body.map((a: any) => new Date(a.actionDateTime).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i + 1]);
      }
    });

    it("API-05 / AC-05: blocks non-owner Requester from viewing actions on another user's ticket with 403 Forbidden", async () => {
      // Requester 1 attempts to view ticket 2 (owned by Requester 2)
      const res = await request(app)
        .get(`/api/tickets/${ticket2Id}/actions`)
        .set("Authorization", `Bearer ${tokenRequester1}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toContain("You do not have permission to view actions on this ticket");
    });

    it("allows IT Staff and Administrators to view any ticket's Actions Taken", async () => {
      // IT Staff 1 views ticket 2
      const resStaff = await request(app)
        .get(`/api/tickets/${ticket2Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`);
      expect(resStaff.status).toBe(200);

      // Admin views ticket 2
      const resAdmin = await request(app)
        .get(`/api/tickets/${ticket2Id}/actions`)
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(resAdmin.status).toBe(200);
    });

    it("returns 404 Not Found when ticket does not exist", async () => {
      const res = await request(app)
        .get("/api/tickets/999999/actions")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  // -------------------------------------------------------------------------
  // API-06 / AC-06: Ticket Scoping Check on PATCH
  // -------------------------------------------------------------------------
  describe("API-06 / AC-06: Ticket Scoping Invariant on Update", () => {
    it("returns 404 NOT_FOUND when actionId does not belong to the route ticketId", async () => {
      // Action belongs to ticket 2
      const actionOnTicket2 = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket2Id } });

      // Attempt to PATCH via ticket 1 route
      const res = await request(app)
        .patch(`/api/tickets/${ticket1Id}/actions/${actionOnTicket2.id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Attempting cross-ticket action modification.",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.body.error).toContain("Action Taken record not found under this ticket");
    });

    it("updates Action Taken successfully when actionId correctly belongs to ticketId", async () => {
      const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket1Id } });

      const res = await request(app)
        .patch(`/api/tickets/${ticket1Id}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Updated description verifying in-place correction.",
          result: "Verified system stability post-modification.",
          isFollowUpRequired: false,
          followUpNote: null,
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(action.id);
      expect(res.body.actionDescription).toBe("Updated description verifying in-place correction.");
      expect(res.body.result).toBe("Verified system stability post-modification.");
      expect(res.body.isFollowUpRequired).toBe(false);
      expect(res.body.followUpNote).toBeNull();
    });

    it("rejects with 400 VALIDATION_ERROR when PATCH receives non-boolean isFollowUpRequired (e.g. string 'false')", async () => {
      const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket1Id } });

      const res = await request(app)
        .patch(`/api/tickets/${ticket1Id}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          isFollowUpRequired: "false",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "isFollowUpRequired",
            message: "isFollowUpRequired must be a boolean",
          }),
        ])
      );
    });
  });

  // -------------------------------------------------------------------------
  // API-14a / AC-23: Terminal CANCELLED ticket rejection
  // -------------------------------------------------------------------------
  describe("API-14a / AC-23: Terminal CANCELLED ticket immutability", () => {
    it("rejects Action Taken creation on a CANCELLED ticket with 400 TICKET_CANCELLED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${cancelledTicketId}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Attempting to add action to cancelled ticket.",
          result: "Should fail.",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("TICKET_CANCELLED");
      expect(res.body.error).toContain("Cannot add Actions Taken to a cancelled ticket");
    });

    it("rejects Action Taken modification on a CANCELLED ticket with 400 TICKET_CANCELLED", async () => {
      // Create a test action directly via prisma to test PATCH rejection
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: cancelledTicketId,
          actionDescription: "Pre-cancellation residual action record.",
          result: "Initial triage.",
          performedById: staff1Id,
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${cancelledTicketId}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Attempting to update action on cancelled ticket.",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("TICKET_CANCELLED");
      expect(res.body.error).toContain("Cannot modify Actions Taken on a cancelled ticket");
    });
  });

  // -------------------------------------------------------------------------
  // API-16 / AC-26: Field boundary validations
  // -------------------------------------------------------------------------
  describe("API-16 / AC-26: Field boundary validation enforcement", () => {
    it("rejects actionDescription under 5 characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "1234",
          result: "Valid result text.",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "actionDescription" })])
      );
    });

    it("rejects result under 3 characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Valid action description.",
          result: "12",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "result" })])
      );
    });

    it("rejects attachmentNotes exceeding 500 characters", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Valid action description.",
          result: "Valid result text.",
          attachmentNotes: "a".repeat(501),
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "attachmentNotes" })])
      );
    });

    it("rejects malformed actionDateTime", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/actions`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Valid action description.",
          result: "Valid result text.",
          actionDateTime: "not-a-valid-date",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "actionDateTime" })])
      );
    });
  });

  // -------------------------------------------------------------------------
  // API-17 / AC-27: Non-deletable audit trail invariant
  // -------------------------------------------------------------------------
  describe("API-17 / AC-27: Append-only audit trail invariant (No DELETE route)", () => {
    it("returns 404 for HTTP DELETE requests asserting deletion is strictly unhandled and prohibited", async () => {
      const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: ticket1Id } });

      const res = await request(app)
        .delete(`/api/tickets/${ticket1Id}/actions/${action.id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      // Route is not implemented; Express returns 404 Cannot DELETE
      expect(res.status).toBe(404);

      // Verify record is still present in the database
      const record = await prisma.actionTaken.findUnique({ where: { id: action.id } });
      expect(record).not.toBeNull();
    });
  });
});
