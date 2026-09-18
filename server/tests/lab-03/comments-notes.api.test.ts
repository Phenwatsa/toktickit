import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: Comments & Internal Notes API Tests
// Covers:
// - API-12: Requester and IT Staff exchange Public Comments (AC-10)
// - API-13: Confidentiality of Internal Notes against Requester and Admin (AC-04)
// - Content validation (min 2, max 2000 non-whitespace chars, BR-09)
// ---------------------------------------------------------------------------

describe("Lab 3 Comments & Notes API (comments-notes.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenRequesterA: string;
  let tokenRequesterB: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  let requesterAId: number;
  let requesterBId: number;
  let staffId: number;
  let categoryId: number;
  let systemId: number;

  let ticketAId: number;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const cat = await prisma.category.findFirstOrThrow({ where: { name: "Software" } });
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Corporate Laptop" } });
    systemId = sys.id;

    // Requester A (Owner of ticket A)
    const reqA = await prisma.user.upsert({
      where: { email: "requesterA.cn@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Requester A",
        email: "requesterA.cn@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterAId = reqA.id;
    tokenRequesterA = generateToken(reqA);

    // Requester B (Non-owner)
    const reqB = await prisma.user.upsert({
      where: { email: "requesterB.cn@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Requester B",
        email: "requesterB.cn@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Sales",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterBId = reqB.id;
    tokenRequesterB = generateToken(reqB);

    // IT Staff
    const staff = await prisma.user.upsert({
      where: { email: "staff.cn@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff Member",
        email: "staff.cn@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Helpdesk",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffId = staff.id;
    tokenStaff = generateToken(staff);

    // Administrator
    const admin = await prisma.user.upsert({
      where: { email: "admin.cn@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Admin User",
        email: "admin.cn@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Administration",
        isActive: true,
        mustChangePassword: false,
      },
    });
    tokenAdmin = generateToken(admin);

    // Create Ticket owned by Requester A
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-CN-TEST-${Date.now()}`,
        summary: "VPN authentication timeout",
        description: "Cannot connect to VPN from home office after network update.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "OPEN",
        requesterId: requesterAId,
        categoryId,
        relatedSystemId: systemId,
      },
    });
    ticketAId = ticket.id;
  });

  afterAll(async () => {
    if (ticketAId) {
      await prisma.publicComment.deleteMany({ where: { ticketId: ticketAId } });
      await prisma.internalNote.deleteMany({ where: { ticketId: ticketAId } });
      await prisma.ticket.deleteMany({ where: { id: ticketAId } });
    }
  });

  // =========================================================================
  // 1. Public Comments (API-12 / AC-10)
  // =========================================================================
  describe("API-12: Public Comments (AC-10)", () => {
    it("allows ticket requester owner to post a public comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ content: "I tried rebooting my router but it still fails." });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe("I tried rebooting my router but it still fails.");
      expect(res.body.author.name).toBe("Requester A");
      expect(res.body.author.role).toBe("REQUESTER");
    });

    it("allows IT Staff to post a public comment on the ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenStaff}`)
        .send({ content: "Please verify if your certificate is up to date." });

      expect(res.status).toBe(201);
      expect(res.body.author.name).toBe("Staff Member");
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("allows both Requester A and IT Staff to read public comments", async () => {
      const resReq = await request(app)
        .get(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`);

      expect(resReq.status).toBe(200);
      expect(resReq.body).toHaveLength(2);

      const resStaff = await request(app)
        .get(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(resStaff.status).toBe(200);
      expect(resStaff.body).toHaveLength(2);
    });

    it("rejects non-owner Requester B from reading or posting public comments", async () => {
      const resGet = await request(app)
        .get(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterB}`);
      expect(resGet.status).toBe(403);

      const resPost = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterB}`)
        .send({ content: "Intruder comment" });
      expect(resPost.status).toBe(403);
    });

    it("rejects Administrator from reading or posting public comments", async () => {
      const resGet = await request(app)
        .get(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(resGet.status).toBe(403);

      const resPost = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ content: "Admin comment" });
      expect(resPost.status).toBe(403);
    });

    it("rejects empty or whitespace-only comment submissions (BR-09)", async () => {
      const resEmpty = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ content: "   " });

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.code).toBe("VALIDATION_ERROR");

      const resTooShort = await request(app)
        .post(`/api/tickets/${ticketAId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ content: "a" });

      expect(resTooShort.status).toBe(400);
      expect(resTooShort.body.code).toBe("VALIDATION_ERROR");
    });
  });

  // =========================================================================
  // 2. Internal Notes Confidentiality (API-13 / AC-04)
  // =========================================================================
  describe("API-13: Internal Notes Confidentiality (AC-04)", () => {
    it("allows IT Staff to post and retrieve internal notes", async () => {
      const resPost = await request(app)
        .post(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenStaff}`)
        .send({ content: "VPN RADIUS logs show authentication timeout on server 10.0.0.5." });

      expect(resPost.status).toBe(201);
      expect(resPost.body.content).toContain("RADIUS logs show authentication timeout");
      expect(resPost.body.author.name).toBe("Staff Member");
      expect(resPost.body.author.role).toBe("IT_STAFF");

      const resGet = await request(app)
        .get(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(resGet.status).toBe(200);
      expect(resGet.body).toHaveLength(1);
      expect(resGet.body[0].content).toContain("RADIUS logs show");
    });

    it("strictly blocks Requester from reading internal notes with 403 Forbidden and zero leaked data", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenRequesterA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.notes).toBeUndefined();
    });

    it("strictly blocks Requester from posting internal notes with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ content: "Unauthorized note attempt" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("strictly blocks Administrator from reading or posting internal notes with 403 Forbidden", async () => {
      const resGet = await request(app)
        .get(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(resGet.status).toBe(403);
      expect(resGet.body.code).toBe("FORBIDDEN");

      const resPost = await request(app)
        .post(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ content: "Admin note attempt" });
      expect(resPost.status).toBe(403);
      expect(resPost.body.code).toBe("FORBIDDEN");
    });

    it("rejects empty or whitespace-only internal note submissions (BR-09)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketAId}/notes`)
        .set("Authorization", `Bearer ${tokenStaff}`)
        .send({ content: "   \n\t  " });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
