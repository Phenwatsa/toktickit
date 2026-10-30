import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 24: Performance Smoke Benchmarks (PERF-SMOKE-01)
// Asserts:
// - Dashboard aggregation response latency < 300ms
// - Actions list retrieval latency < 200ms
// Under standard database load.
// ---------------------------------------------------------------------------

describe("Performance Smoke Benchmarks (PERF-SMOKE-01)", { timeout: 30000 }, () => {
  const prisma = getPrisma();

  let tokenRequester: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  let requesterId: number;
  let staffId: number;
  let adminId: number;

  let categoryId: number;
  let systemId: number;
  let testTicketId: number;

  const createdActionIds: number[] = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const reqUser = await prisma.user.upsert({
      where: { email: "perf.requester@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "REQUESTER" },
      create: {
        name: "Perf Requester",
        email: "perf.requester@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Performance Testing",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterId = reqUser.id;
    tokenRequester = generateToken(reqUser);

    const staffUser = await prisma.user.upsert({
      where: { email: "perf.staff@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "IT_STAFF" },
      create: {
        name: "Perf Staff",
        email: "perf.staff@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "IT Infrastructure",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffId = staffUser.id;
    tokenStaff = generateToken(staffUser);

    const adminUser = await prisma.user.upsert({
      where: { email: "perf.admin@toktickit.local" },
      update: { isActive: true, mustChangePassword: false, role: "ADMINISTRATOR" },
      create: {
        name: "Perf Admin",
        email: "perf.admin@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminId = adminUser.id;
    tokenAdmin = generateToken(adminUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    if (!cat) throw new Error("No active category found");
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    if (!sys) throw new Error("No active related system found");
    systemId = sys.id;

    // Create a target ticket with multiple Actions Taken for actions list latency benchmark
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-PERF-${Date.now()}`,
        summary: "Performance Smoke Test Ticket",
        description: "Benchmark testing for actions list and dashboard endpoints",
        currentStatus: "IN_PROGRESS",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        requesterId,
        ticketOwnerId: staffId,
        categoryId,
        relatedSystemId: systemId,
      },
    });
    testTicketId = ticket.id;

    // Create 10 Actions Taken records on the ticket
    for (let i = 1; i <= 10; i++) {
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performedById: staffId,
          actionDateTime: new Date(Date.now() - (10 - i) * 60000),
          actionDescription: `Performance diagnostic intervention step ${i}`,
          result: `System telemetry collected successfully for step ${i}`,
          isFollowUpRequired: i % 3 === 0,
          followUpNote: i % 3 === 0 ? "Follow-up required with systems engineer" : null,
          attachmentNotes: `perf_log_${i}.txt`,
        },
      });
      createdActionIds.push(action.id);
    }
  });

  afterAll(async () => {
    if (createdActionIds.length > 0) {
      await prisma.actionTaken.deleteMany({
        where: { id: { in: createdActionIds } },
      });
    }
    if (testTicketId) {
      await prisma.ticket.deleteMany({
        where: { id: testTicketId },
      });
    }
  });

  /**
   * Helper function to benchmark an API request
   */
  async function benchmarkRequest(fn: () => Promise<request.Response>, iterations = 3): Promise<number[]> {
    // 1 warm-up request
    await fn();

    const latencies: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await fn();
      const duration = performance.now() - start;
      expect(res.status).toBe(200);
      latencies.push(duration);
    }
    return latencies;
  }

  describe("Dashboard Aggregation Endpoints Latency (< 300ms)", () => {
    it("asserts GET /api/requester/dashboard responds in < 300ms", async () => {
      const latencies = await benchmarkRequest(() =>
        request(app)
          .get("/api/requester/dashboard")
          .set("Authorization", `Bearer ${tokenRequester}`)
      );

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      // Verify both average and max response latency are within threshold (< 300ms)
      expect(avgLatency).toBeLessThan(300);
      expect(maxLatency).toBeLessThan(300);
    });

    it("asserts GET /api/staff/dashboard responds in < 300ms", async () => {
      const latencies = await benchmarkRequest(() =>
        request(app)
          .get("/api/staff/dashboard")
          .set("Authorization", `Bearer ${tokenStaff}`)
      );

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      expect(avgLatency).toBeLessThan(300);
      expect(maxLatency).toBeLessThan(300);
    });

    it("asserts GET /api/admin/dashboard responds in < 300ms", async () => {
      const latencies = await benchmarkRequest(() =>
        request(app)
          .get("/api/admin/dashboard")
          .set("Authorization", `Bearer ${tokenAdmin}`)
      );

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      expect(avgLatency).toBeLessThan(300);
      expect(maxLatency).toBeLessThan(300);
    });
  });

  describe("Actions Taken Retrieval Latency (< 200ms)", () => {
    it("asserts GET /api/tickets/:id/actions responds in < 200ms", async () => {
      const latencies = await benchmarkRequest(() =>
        request(app)
          .get(`/api/tickets/${testTicketId}/actions`)
          .set("Authorization", `Bearer ${tokenStaff}`)
      );

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      // Verify retrieval latency is within threshold (< 200ms)
      expect(avgLatency).toBeLessThan(200);
      expect(maxLatency).toBeLessThan(200);
    });
  });
});
