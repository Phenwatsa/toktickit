import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 15: Staff Ticket Queue API Tests
// Covers: API-07 (Query, Search, Filter, Sort, Paginate), API-08 (Role Access Control)
// ---------------------------------------------------------------------------

describe("Lab 3 IT Staff Ticket Queue API (staff-queue.api.test.ts)", () => {
  const prisma = getPrisma();

  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenRequester: string;
  let tokenAdmin: string;
  let tokenPendingPasswordStaff: string;

  let staff1Id: number;
  let staff2Id: number;
  let requesterId: number;
  let category1Id: number;
  let category2Id: number;
  let systemId: number;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Fetch Existing Seed Categories
    const cat1 = await prisma.category.findFirstOrThrow({ where: { name: "Hardware" } });
    category1Id = cat1.id;

    const cat2 = await prisma.category.findFirstOrThrow({ where: { name: "Software" } });
    category2Id = cat2.id;

    // 2. Fetch Existing Seed Related System
    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Corporate Laptop" } });
    systemId = sys.id;

    // 3. Ensure Staff 1
    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.queue@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff One",
        email: "staff1.queue@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff1Id = staff1.id;
    tokenStaff1 = generateToken(staff1);

    // 4. Ensure Staff 2
    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.queue@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff Two",
        email: "staff2.queue@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Infrastructure",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staff2Id = staff2.id;
    tokenStaff2 = generateToken(staff2);

    // 5. Ensure Requester
    const reqUser = await prisma.user.upsert({
      where: { email: "requester.queue@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Queue Requester",
        email: "requester.queue@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterId = reqUser.id;
    tokenRequester = generateToken(reqUser);

    // 6. Ensure Administrator
    const adminUser = await prisma.user.upsert({
      where: { email: "admin.queue@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Queue Admin",
        email: "admin.queue@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Executive",
        isActive: true,
        mustChangePassword: false,
      },
    });
    tokenAdmin = generateToken(adminUser);

    // 7. Ensure Staff with mustChangePassword = true
    const pendingStaff = await prisma.user.upsert({
      where: { email: "pending.staff.queue@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: true },
      create: {
        name: "Pending Staff",
        email: "pending.staff.queue@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Helpdesk",
        isActive: true,
        mustChangePassword: true,
      },
    });
    tokenPendingPasswordStaff = generateToken(pendingStaff);

    // 8. Seed dedicated test tickets
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-QUEUE-TEST-001" },
      update: {
        summary: "Alpha printer network failure",
        description: "Laser printer offline in room 302",
        requestedPriority: "LOW",
        itPriority: "HIGH",
        currentStatus: "NEW",
        categoryId: category1Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: null, // unassigned
      },
      create: {
        ticketNumber: "TKT-QUEUE-TEST-001",
        summary: "Alpha printer network failure",
        description: "Laser printer offline in room 302",
        requestedPriority: "LOW",
        itPriority: "HIGH",
        currentStatus: "NEW",
        categoryId: category1Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: null,
      },
    });

    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-QUEUE-TEST-002" },
      update: {
        summary: "Beta VPN connection dropout",
        description: "Cannot connect to campus VPN",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        currentStatus: "IN_PROGRESS",
        categoryId: category2Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: staff1Id, // assigned to staff 1
      },
      create: {
        ticketNumber: "TKT-QUEUE-TEST-002",
        summary: "Beta VPN connection dropout",
        description: "Cannot connect to campus VPN",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        currentStatus: "IN_PROGRESS",
        categoryId: category2Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: staff1Id,
      },
    });

    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-QUEUE-TEST-003" },
      update: {
        summary: "Gamma monitor display flickering",
        description: "Secondary screen flickers continuously",
        requestedPriority: "MEDIUM",
        itPriority: "LOW",
        currentStatus: "RESOLVED",
        categoryId: category1Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: staff2Id, // assigned to staff 2
      },
      create: {
        ticketNumber: "TKT-QUEUE-TEST-003",
        summary: "Gamma monitor display flickering",
        description: "Secondary screen flickers continuously",
        requestedPriority: "MEDIUM",
        itPriority: "LOW",
        currentStatus: "RESOLVED",
        categoryId: category1Id,
        relatedSystemId: systemId,
        requesterId,
        ticketOwnerId: staff2Id,
      },
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          in: ["TKT-QUEUE-TEST-001", "TKT-QUEUE-TEST-002", "TKT-QUEUE-TEST-003"],
        },
      },
    });
  });

  // =========================================================================
  // API-07: IT Staff queries ticket queue with search and filters
  // =========================================================================
  describe("API-07: IT Staff queries ticket queue (GET /api/staff/tickets)", () => {
    it("returns 200 OK with paginated ticket queue including all metadata fields", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      expect(res.body.pagination).toMatchObject({
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalRecords: expect.any(Number),
        totalPages: expect.any(Number),
      });

      const ticket = res.body.data.find((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-001");
      expect(ticket).toBeDefined();
      expect(ticket).toMatchObject({
        ticketNumber: "TKT-QUEUE-TEST-001",
        summary: "Alpha printer network failure",
        requestedPriority: "LOW",
        itPriority: "HIGH",
        currentStatus: "NEW",
        category: {
          id: category1Id,
          name: "Hardware",
        },
        requester: {
          id: requesterId,
          name: "Queue Requester",
          email: "requester.queue@toktickit.local",
        },
        ticketOwner: null,
      });
      expect(ticket).toHaveProperty("createdAt");
      expect(ticket).toHaveProperty("updatedAt");
    });

    it("filters tickets by keyword search against ticketNumber", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=QUEUE-TEST-001")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].ticketNumber).toBe("TKT-QUEUE-TEST-001");
    });

    it("filters tickets by case-insensitive keyword search against summary", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=printer")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-001")).toBe(true);
      expect(res.body.data.every((t: any) => t.summary.toLowerCase().includes("printer"))).toBe(true);
    });

    it("filters tickets by single status", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?status=IN_PROGRESS")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((t: any) => t.currentStatus === "IN_PROGRESS")).toBe(true);
      expect(res.body.data.some((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-002")).toBe(true);
    });

    it("filters tickets by comma-separated statuses", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?status=NEW,RESOLVED")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((t: any) => ["NEW", "RESOLVED"].includes(t.currentStatus))).toBe(true);
    });

    it("filters tickets by categoryId", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?categoryId=${category2Id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.category.id === category2Id)).toBe(true);
      expect(res.body.data.some((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-002")).toBe(true);
    });

    it("filters tickets by requestedPriority and itPriority", async () => {
      const resRequested = await request(app)
        .get("/api/staff/tickets?requestedPriority=URGENT")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resRequested.status).toBe(200);
      expect(resRequested.body.data.every((t: any) => t.requestedPriority === "URGENT")).toBe(true);

      const resIt = await request(app)
        .get("/api/staff/tickets?itPriority=HIGH")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resIt.status).toBe(200);
      expect(resIt.body.data.every((t: any) => t.itPriority === "HIGH")).toBe(true);
    });

    it("filters tickets by ownerId=unassigned", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=unassigned")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.ticketOwner === null)).toBe(true);
      expect(res.body.data.some((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-001")).toBe(true);
    });

    it("filters tickets by specific assigned ownerId", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?ownerId=${staff1Id}`)
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.ticketOwner?.id === staff1Id)).toBe(true);
      expect(res.body.data.some((t: any) => t.ticketNumber === "TKT-QUEUE-TEST-002")).toBe(true);
    });

    it("supports sorting by ticketNumber in asc and desc order", async () => {
      const resAsc = await request(app)
        .get("/api/staff/tickets?search=QUEUE-TEST&sortBy=ticketNumber&sortOrder=asc")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resAsc.status).toBe(200);
      const ticketsAsc = resAsc.body.data.map((t: any) => t.ticketNumber);
      const sortedAsc = [...ticketsAsc].sort();
      expect(ticketsAsc).toEqual(sortedAsc);

      const resDesc = await request(app)
        .get("/api/staff/tickets?search=QUEUE-TEST&sortBy=ticketNumber&sortOrder=desc")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resDesc.status).toBe(200);
      const ticketsDesc = resDesc.body.data.map((t: any) => t.ticketNumber);
      const sortedDesc = [...ticketsDesc].sort().reverse();
      expect(ticketsDesc).toEqual(sortedDesc);
    });

    it("supports pagination with page and pageSize", async () => {
      const resPage1 = await request(app)
        .get("/api/staff/tickets?search=QUEUE-TEST&page=1&pageSize=2&sortBy=ticketNumber&sortOrder=asc")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data.length).toBe(2);
      expect(resPage1.body.pagination.page).toBe(1);
      expect(resPage1.body.pagination.pageSize).toBe(2);
      expect(resPage1.body.pagination.totalRecords).toBe(3);
      expect(resPage1.body.pagination.totalPages).toBe(2);

      const resPage2 = await request(app)
        .get("/api/staff/tickets?search=QUEUE-TEST&page=2&pageSize=2&sortBy=ticketNumber&sortOrder=asc")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.length).toBe(1);
      expect(resPage2.body.pagination.page).toBe(2);

      // Verify no duplicate tickets between page 1 and page 2
      const page1Ids = resPage1.body.data.map((t: any) => t.id);
      const page2Ids = resPage2.body.data.map((t: any) => t.id);
      expect(page1Ids.some((id: number) => page2Ids.includes(id))).toBe(false);
    });

    it("GET /api/staff/members returns list of active IT staff members", async () => {
      const res = await request(app)
        .get("/api/staff/members")
        .set("Authorization", `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body.some((m: any) => m.id === staff1Id)).toBe(true);
      expect(res.body.some((m: any) => m.id === staff2Id)).toBe(true);
    });
  });

  // =========================================================================
  // API-08: Unauthorized roles attempt to access staff queue
  // =========================================================================
  describe("API-08: Role Access Control on GET /api/staff/tickets", () => {
    it("returns HTTP 403 Forbidden when requested by a REQUESTER", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      });
      // Zero queue data leaked
      expect(res.body.data).toBeUndefined();
    });

    it("returns HTTP 403 Forbidden when requested by an ADMINISTRATOR", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      });
      expect(res.body.data).toBeUndefined();
    });

    it("returns HTTP 401 Unauthorized when no Authorization header is provided", async () => {
      const res = await request(app).get("/api/staff/tickets");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
      expect(res.body.data).toBeUndefined();
    });

    it("returns HTTP 401 Unauthorized when an invalid or corrupt token is provided", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
      expect(res.body.data).toBeUndefined();
    });

    it("returns HTTP 403 Forbidden when user has mustChangePassword = true", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${tokenPendingPasswordStaff}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("PASSWORD_CHANGE_REQUIRED");
      expect(res.body.data).toBeUndefined();
    });
  });
});
