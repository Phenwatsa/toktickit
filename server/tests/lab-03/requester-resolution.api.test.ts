import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: Requester Resolution Indication API Tests
// Covers:
// - API-22: Requester owner marks problem resolved without altering official status (AC-21)
// - Role restrictions: Non-owner, IT Staff, and Admin forbidden
// ---------------------------------------------------------------------------

describe("Lab 3 Requester Resolution Indication API (requester-resolution.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenOwner: string;
  let tokenOtherRequester: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  let ownerId: number;
  let otherRequesterId: number;
  let staffId: number;
  let categoryId: number;
  let systemId: number;

  let ticketId: number;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const cat = await prisma.category.findFirstOrThrow({ where: { name: "Hardware" } });
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Corporate Laptop" } });
    systemId = sys.id;

    // 1. Owner Requester
    const owner = await prisma.user.upsert({
      where: { email: "owner.res@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Ticket Owner Requester",
        email: "owner.res@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    ownerId = owner.id;
    tokenOwner = generateToken(owner);

    // 2. Other Requester
    const otherReq = await prisma.user.upsert({
      where: { email: "other.res@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Other Requester",
        email: "other.res@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Sales",
        isActive: true,
        mustChangePassword: false,
      },
    });
    otherRequesterId = otherReq.id;
    tokenOtherRequester = generateToken(otherReq);

    // 3. Staff
    const staff = await prisma.user.upsert({
      where: { email: "staff.res@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff Person",
        email: "staff.res@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Helpdesk",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffId = staff.id;
    tokenStaff = generateToken(staff);

    // 4. Admin
    const admin = await prisma.user.upsert({
      where: { email: "admin.res@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Admin Person",
        email: "admin.res@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });
    tokenAdmin = generateToken(admin);

    // 5. Create Ticket owned by ownerId in IN_PROGRESS status
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-RES-TEST-${Date.now()}`,
        summary: "Monitor flickering issue",
        description: "External monitor flickers every few minutes over HDMI.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "IN_PROGRESS",
        problemAppearsResolved: false,
        requesterId: ownerId,
        ticketOwnerId: staffId,
        categoryId,
        relatedSystemId: systemId,
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    if (ticketId) {
      await prisma.ticket.deleteMany({ where: { id: ticketId } });
    }
  });

  it("allows ticket requester owner to mark problem appears resolved (API-22 / AC-21)", async () => {
    const res = await request(app)
      .patch(`/api/requester/tickets/${ticketId}/resolve-indication`)
      .set("Authorization", `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.problemAppearsResolved).toBe(true);
    expect(res.body.message).toContain("Problem indicated as resolved");

    // Verify official currentStatus remains IN_PROGRESS and problemAppearsResolved is true in DB
    const inDb = await prisma.ticket.findUnique({ where: { id: ticketId } });
    expect(inDb?.problemAppearsResolved).toBe(true);
    expect(inDb?.currentStatus).toBe("IN_PROGRESS");
  });

  it("rejects non-owner requester with 403 Forbidden", async () => {
    const res = await request(app)
      .patch(`/api/requester/tickets/${ticketId}/resolve-indication`)
      .set("Authorization", `Bearer ${tokenOtherRequester}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("rejects IT Staff from calling requester resolve-indication with 403 Forbidden", async () => {
    const res = await request(app)
      .patch(`/api/requester/tickets/${ticketId}/resolve-indication`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("rejects Administrator from calling requester resolve-indication with 403 Forbidden", async () => {
    const res = await request(app)
      .patch(`/api/requester/tickets/${ticketId}/resolve-indication`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("returns 404 for nonexistent ticket ID", async () => {
    const res = await request(app)
      .patch("/api/requester/tickets/99999999/resolve-indication")
      .set("Authorization", `Bearer ${tokenOwner}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("rejects unauthenticated calls with 401 Unauthorized", async () => {
    const res = await request(app).patch(`/api/requester/tickets/${ticketId}/resolve-indication`);
    expect(res.status).toBe(401);
  });
});
