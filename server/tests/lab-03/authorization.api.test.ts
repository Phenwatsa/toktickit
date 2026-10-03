import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 13: Authorization & Ownership API Tests
// Covers: API-06, API-21
// ---------------------------------------------------------------------------

describe("Lab 3 Authorization & Ownership REST API (authorization.api.test.ts)", () => {
  const prisma = getPrisma();
  const tempTestDir = path.join(process.cwd(), "tests", "scratch_authz_upload");

  let tokenRequesterA: string;
  let tokenRequesterB: string;
  let tokenStaff: string;
  let tokenAdmin: string;
  let tokenPendingPasswordChange: string;

  let requesterAId: number;
  let requesterBId: number;

  let ticketAId: number;
  let ticketBId: number;
  const ticketANumber = "TKT-2026-600001";
  const ticketBNumber = "TKT-2026-600002";

  let attachmentAId: number;

  beforeAll(async () => {
    // Create test file directory
    if (!fs.existsSync(tempTestDir)) {
      fs.mkdirSync(tempTestDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tempTestDir, "authz-doc.pdf"), "%PDF-1.4 sample pdf content");

    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Ensure Requester A
    const reqA = await prisma.user.upsert({
      where: { email: "jennifer.a@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Jennifer Anderson",
        email: "jennifer.a@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Human Resources",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterAId = reqA.id;

    // Ensure Requester B
    const reqB = await prisma.user.upsert({
      where: { email: "david.l@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "David Lee",
        email: "david.l@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Engineering",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterBId = reqB.id;

    // Ensure IT Staff
    await prisma.user.upsert({
      where: { email: "alice.staff@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Alice Smith",
        email: "alice.staff@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Support",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Ensure Admin
    await prisma.user.upsert({
      where: { email: "admin@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "System Administrator",
        email: "admin@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "IT Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Obtain JWT tokens for each role
    const resLoginA = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.a@toktickit.local", password: "Password123!" });
    tokenRequesterA = resLoginA.body.token;

    const resLoginB = await request(app)
      .post("/api/auth/login")
      .send({ email: "david.l@toktickit.local", password: "Password123!" });
    tokenRequesterB = resLoginB.body.token;

    const resLoginStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice.staff@toktickit.local", password: "Password123!" });
    tokenStaff = resLoginStaff.body.token;

    const resLoginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.local", password: "Password123!" });
    tokenAdmin = resLoginAdmin.body.token;

    // Ensure User with mustChangePassword = true
    await prisma.user.upsert({
      where: { email: "pending.authz@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: true },
      create: {
        name: "Pending Authz User",
        email: "pending.authz@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Operations",
        isActive: true,
        mustChangePassword: true,
      },
    });

    const resLoginPending = await request(app)
      .post("/api/auth/login")
      .send({ email: "pending.authz@toktickit.local", password: "Password123!" });
    tokenPendingPasswordChange = resLoginPending.body.token;

    // Clean up test tickets
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { in: [ticketANumber, ticketBNumber] } },
    });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Seed test ticket for Requester A
    const tA = await prisma.ticket.create({
      data: {
        ticketNumber: ticketANumber,
        summary: "Requester A Confidential Ticket",
        description: "Contains confidential personal information.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "NEW",
        requesterId: requesterAId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });
    ticketAId = tA.id;

    // Seed test ticket for Requester B
    const tB = await prisma.ticket.create({
      data: {
        ticketNumber: ticketBNumber,
        summary: "Requester B Operational Ticket",
        description: "Contains engineering logs.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "OPEN",
        requesterId: requesterBId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });
    ticketBId = tB.id;
  });

  afterAll(async () => {
    // Clean up files and tickets
    if (fs.existsSync(tempTestDir)) {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    }
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { in: [ticketANumber, ticketBNumber] } },
    });
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // API-06: Ticket List Ownership Isolation
  // -------------------------------------------------------------------------
  it("API-06: Requester queries ticket list (GET /api/tickets) and session strictly derives ownership, excluding foreign tickets", async () => {
    // Requester A passes ?requesterId=requesterBId attempting to view Requester B's tickets
    const res = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .query({ requesterId: requesterBId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);

    const ticketNumbers = res.body.data.map((t: any) => t.ticketNumber);
    // Requester A's ticket MUST be included
    expect(ticketNumbers).toContain(ticketANumber);
    // Requester B's ticket MUST be strictly excluded
    expect(ticketNumbers).not.toContain(ticketBNumber);
  });

  // -------------------------------------------------------------------------
  // API-06: Ticket Detail Ownership Isolation
  // -------------------------------------------------------------------------
  it("API-06: Requester B attempting to access Requester A's ticket detail is rejected with HTTP 403 Forbidden", async () => {
    // Requester B tries to view ticket A
    const forbiddenRes = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenRequesterB}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body).toHaveProperty("code", "FORBIDDEN");

    // Requester A can view own ticket
    const allowedRes = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.id).toBe(ticketAId);

    // IT Staff can view any ticket detail
    const staffRes = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(staffRes.status).toBe(200);
    expect(staffRes.body.id).toBe(ticketAId);
  });

  // -------------------------------------------------------------------------
  // API-21: Attachment Upload Ownership Isolation
  // -------------------------------------------------------------------------
  it("API-21: Requester B and Administrator cannot upload attachments to Requester A's ticket (HTTP 403)", async () => {
    const filePath = path.join(tempTestDir, "authz-doc.pdf");

    // Requester B attempts upload to Requester A's ticket -> 403
    const reqBRes = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("Authorization", `Bearer ${tokenRequesterB}`)
      .attach("file", filePath);

    expect(reqBRes.status).toBe(403);
    expect(reqBRes.body).toHaveProperty("code", "FORBIDDEN");

    // Administrator attempts upload -> 403
    const adminRes = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .attach("file", filePath);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body).toHaveProperty("code", "FORBIDDEN");

    // Requester A uploads attachment to own ticket -> 201
    const allowedUploadRes = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .attach("file", filePath);

    expect(allowedUploadRes.status).toBe(201);
    expect(allowedUploadRes.body).toHaveProperty("id");
    attachmentAId = allowedUploadRes.body.id;
  });

  // -------------------------------------------------------------------------
  // API-21: Attachment Download Ownership Isolation
  // -------------------------------------------------------------------------
  it("API-21: Requester B and Administrator cannot download Requester A's attachment (HTTP 403)", async () => {
    // Requester B attempts download -> 403
    const reqBRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenRequesterB}`);

    expect(reqBRes.status).toBe(403);
    expect(reqBRes.body).toHaveProperty("code", "FORBIDDEN");

    // Administrator attempts download -> 403
    const adminRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body).toHaveProperty("code", "FORBIDDEN");

    // Requester A (owner) downloads attachment -> 200
    const ownerRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(ownerRes.status).toBe(200);

    // IT Staff downloads attachment from queue ticket -> 200
    const staffRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(staffRes.status).toBe(200);
  });

  // -------------------------------------------------------------------------
  // API-21: Attachment Soft-Delete Ownership Isolation & HTTP 410 Gone Check
  // -------------------------------------------------------------------------
  it("API-21: Requester B and Administrator cannot soft-delete Requester A's attachment; soft-removed returns HTTP 410", async () => {
    // Requester B attempts delete -> 403
    const reqBRes = await request(app)
      .delete(`/api/tickets/${ticketAId}/attachments/${attachmentAId}`)
      .set("Authorization", `Bearer ${tokenRequesterB}`)
      .send({ removalReason: "Attempted unauthorized deletion" });

    expect(reqBRes.status).toBe(403);
    expect(reqBRes.body).toHaveProperty("code", "FORBIDDEN");

    // Administrator attempts delete -> 403
    const adminRes = await request(app)
      .delete(`/api/tickets/${ticketAId}/attachments/${attachmentAId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ removalReason: "Admin attempted deletion" });

    expect(adminRes.status).toBe(403);
    expect(adminRes.body).toHaveProperty("code", "FORBIDDEN");

    // Requester A soft-deletes attachment -> 200
    const ownerDeleteRes = await request(app)
      .delete(`/api/tickets/${ticketAId}/attachments/${attachmentAId}`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ removalReason: "Uploaded wrong document version" });

    expect(ownerDeleteRes.status).toBe(200);
    expect(ownerDeleteRes.body.isRemoved).toBe(true);

    // After soft-removal, download returns HTTP 410 Gone
    const goneRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(goneRes.status).toBe(410);
    expect(goneRes.body).toHaveProperty("code", "GONE");
  });

  // -------------------------------------------------------------------------
  // requirePasswordChanged Middleware Strict Enforcement
  // -------------------------------------------------------------------------
  it("enforces requirePasswordChanged: user with mustChangePassword = true is blocked with HTTP 403 PASSWORD_CHANGE_REQUIRED", async () => {
    // 1. GET /api/tickets
    const listRes = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`);
    expect(listRes.status).toBe(403);
    expect(listRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");

    // 2. GET /api/tickets/:id
    const detailRes = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`);
    expect(detailRes.status).toBe(403);
    expect(detailRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");

    // 3. POST /api/tickets
    const createRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`)
      .send({
        summary: "Blocked due to pending password change",
        description: "This ticket creation must be blocked with HTTP 403.",
        requestedPriority: "LOW",
        categoryId: 1,
        relatedSystemId: 1,
      });
    expect(createRes.status).toBe(403);
    expect(createRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");

    // 4. POST /api/tickets/:id/attachments
    const uploadRes = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`);
    expect(uploadRes.status).toBe(403);
    expect(uploadRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");

    // 5. GET /api/attachments/:id/download
    const downloadRes = await request(app)
      .get(`/api/attachments/${attachmentAId}/download`)
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`);
    expect(downloadRes.status).toBe(403);
    expect(downloadRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");

    // 6. DELETE /api/tickets/:id/attachments/:attachmentId
    const deleteRes = await request(app)
      .delete(`/api/tickets/${ticketAId}/attachments/${attachmentAId}`)
      .set("Authorization", `Bearer ${tokenPendingPasswordChange}`)
      .send({ removalReason: "Should be blocked" });
    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body).toHaveProperty("code", "PASSWORD_CHANGE_REQUIRED");
  });

  // -------------------------------------------------------------------------
  // requireAuth Middleware Strict Enforcement (No Token / Invalid Token)
  // -------------------------------------------------------------------------
  it("enforces requireAuth: unauthenticated requests to functional endpoints return HTTP 401 UNAUTHORIZED", async () => {
    // 1. GET /api/tickets without token
    const listRes = await request(app).get("/api/tickets");
    expect(listRes.status).toBe(401);
    expect(listRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 2. GET /api/tickets/:id without token
    const detailRes = await request(app).get(`/api/tickets/${ticketAId}`);
    expect(detailRes.status).toBe(401);
    expect(detailRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 3. POST /api/tickets without token
    const createRes = await request(app).post("/api/tickets").send({
      summary: "Unauthorized ticket creation",
      description: "Must fail with 401 Unauthorized without Bearer token.",
      requestedPriority: "LOW",
      categoryId: 1,
      relatedSystemId: 1,
    });
    expect(createRes.status).toBe(401);
    expect(createRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 4. POST /api/tickets/:id/attachments without token
    const uploadRes = await request(app).post(`/api/tickets/${ticketAId}/attachments`);
    expect(uploadRes.status).toBe(401);
    expect(uploadRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 5. GET /api/attachments/:id/download without token
    const downloadRes = await request(app).get(`/api/attachments/${attachmentAId}/download`);
    expect(downloadRes.status).toBe(401);
    expect(downloadRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 6. DELETE /api/tickets/:id/attachments/:attachmentId without token
    const deleteRes = await request(app)
      .delete(`/api/tickets/${ticketAId}/attachments/${attachmentAId}`)
      .send({ removalReason: "No token" });
    expect(deleteRes.status).toBe(401);
    expect(deleteRes.body).toHaveProperty("code", "UNAUTHORIZED");
  });
});
