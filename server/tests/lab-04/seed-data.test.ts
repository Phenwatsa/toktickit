import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 21: Seed Data Integrity & Idempotency Verification
// Covers: SEED-01, AC-22 (Handout §5.3)
// ---------------------------------------------------------------------------

describe("SEED-01: Seed Data Verification & Idempotency (seed-data.test.ts)", () => {
  const prisma = getPrisma();
  const serverDir = path.resolve(__dirname, "../..");

  it("populates tickets across all 8 lifecycle statuses", async () => {
    const statuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "CANCELLED",
    ] as const;

    for (const status of statuses) {
      const count = await prisma.ticket.count({ where: { currentStatus: status } });
      expect(count, `Expected at least one ticket with status ${status}`).toBeGreaterThan(0);
    }
  });

  it("populates tickets across all 4 priority levels", async () => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

    for (const priority of priorities) {
      const count = await prisma.ticket.count({ where: { itPriority: priority } });
      expect(count, `Expected at least one ticket with itPriority ${priority}`).toBeGreaterThan(0);
    }
  });

  it("populates tickets with both assigned and unassigned ownership", async () => {
    const assignedCount = await prisma.ticket.count({
      where: { ticketOwnerId: { not: null } },
    });
    const unassignedCount = await prisma.ticket.count({
      where: { ticketOwnerId: null },
    });

    expect(assignedCount, "Expected assigned tickets").toBeGreaterThan(0);
    expect(unassignedCount, "Expected unassigned tickets").toBeGreaterThan(0);
  });

  it("populates tickets across Actions Taken multiplicity (0, 1, and >= 2)", async () => {
    const allTickets = await prisma.ticket.findMany({
      include: {
        actionsTaken: true,
      },
    });

    const zeroActions = allTickets.filter((t) => t.actionsTaken.length === 0);
    const oneAction = allTickets.filter((t) => t.actionsTaken.length === 1);
    const multipleActions = allTickets.filter((t) => t.actionsTaken.length >= 2);

    expect(zeroActions.length, "Expected tickets with 0 Actions Taken").toBeGreaterThan(0);
    expect(oneAction.length, "Expected tickets with 1 Action Taken").toBeGreaterThan(0);
    expect(multipleActions.length, "Expected tickets with >= 2 Actions Taken").toBeGreaterThan(0);

    // Verify varied performers (owner vs non-owner)
    const ticketsWithOtherPerformer = allTickets.filter((t) =>
      t.actionsTaken.some((a) => a.performedById !== t.ticketOwnerId)
    );
    expect(ticketsWithOtherPerformer.length, "Expected actions performed by non-owner staff").toBeGreaterThan(0);
  });

  it("populates clean baseline accounts for zero-metric verification alongside non-zero profiles", async () => {
    // 1. Fresh Requester has 0 tickets
    const freshReq = await prisma.user.findUniqueOrThrow({
      where: { email: "fresh.requester@toktickit.local" },
      include: { tickets: true },
    });
    expect(freshReq.tickets.length, "Fresh requester must have 0 tickets").toBe(0);

    // 2. Active Requesters have > 0 tickets
    const activeReq = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.a@toktickit.local" },
      include: { tickets: true },
    });
    expect(activeReq.tickets.length, "Active requester must have > 0 tickets").toBeGreaterThan(0);

    // 3. Fresh Staff has 0 assigned tickets
    const freshStaff = await prisma.user.findUniqueOrThrow({
      where: { email: "fresh.staff@toktickit.local" },
      include: { assignedTickets: true },
    });
    expect(freshStaff.assignedTickets.length, "Fresh staff must have 0 assigned tickets").toBe(0);

    // 4. Active Staff has > 0 assigned tickets
    const activeStaff = await prisma.user.findUniqueOrThrow({
      where: { email: "alice.staff@toktickit.local" },
      include: { assignedTickets: true },
    });
    expect(activeStaff.assignedTickets.length, "Active staff must have > 0 assigned tickets").toBeGreaterThan(0);
  });

  it("runs idempotently across repeated executions without constraint collisions or row count inflation", async () => {
    // Snapshot counts before re-run
    const beforeCategories = await prisma.category.count();
    const beforeSystems = await prisma.relatedSystem.count();
    const beforeUsers = await prisma.user.count();
    const beforeTickets = await prisma.ticket.count();
    const beforeComments = await prisma.publicComment.count();
    const beforeNotes = await prisma.internalNote.count();
    const beforeActions = await prisma.actionTaken.count();

    // Re-run seed script (run 2)
    execSync("npx tsx prisma/seed.ts", {
      cwd: serverDir,
      env: process.env,
      stdio: "pipe",
    });

    // Verify counts are identical after run 2
    const afterCategories = await prisma.category.count();
    const afterSystems = await prisma.relatedSystem.count();
    const afterUsers = await prisma.user.count();
    const afterTickets = await prisma.ticket.count();
    const afterComments = await prisma.publicComment.count();
    const afterNotes = await prisma.internalNote.count();
    const afterActions = await prisma.actionTaken.count();

    expect(afterCategories).toBe(beforeCategories);
    expect(afterSystems).toBe(beforeSystems);
    expect(afterUsers).toBe(beforeUsers);
    expect(afterTickets).toBe(beforeTickets);
    expect(afterComments).toBe(beforeComments);
    expect(afterNotes).toBe(beforeNotes);
    expect(afterActions).toBe(beforeActions);
  });
});
