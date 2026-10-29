import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
  getPrismaClient,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 26: Ticket Resolution & Workflow Enforcement E2E Suite
// Covers:
// - E2E-02: Requester advisory indication, IT Staff formal resolution,
//   status transitions, 409 Conflict handling, and form state preservation
// ---------------------------------------------------------------------------

test.describe("Lab 4 E2E-02: Ticket Resolution Flow & Concurrency", () => {
  let resolutionTicketId: number;

  test.beforeAll(async () => {
    ensureScreenshotsDir();
    const prisma = await getPrismaClient();

    // Reset ticket TKT-2026-000103 to clean WAITING_FOR_REQUESTER baseline
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000103" },
    });

    if (ticket) {
      resolutionTicketId = ticket.id;
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          currentStatus: "WAITING_FOR_REQUESTER",
          problemAppearsResolved: false,
        },
      });
    } else {
      const anyTicket = await prisma.ticket.findFirst({
        where: { currentStatus: "WAITING_FOR_REQUESTER" },
      });
      if (!anyTicket) throw new Error("No ticket in WAITING_FOR_REQUESTER found");
      resolutionTicketId = anyTicket.id;
    }

    await prisma.$disconnect();
  });

  test("E2E-02 Part 1: Requester advisory indication enforces resolution gate", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as Requester Sarah Johnson (owner of TKT-2026-000103)
    await loginAs(page, "sarah.j@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/dashboard/);

    // 2. Open Ticket Detail
    await page.goto(`/#/ticket/${resolutionTicketId}`);
    await page.waitForSelector('[data-testid="mark-resolved-btn"]', { timeout: 15000 });
    await assertNoHorizontalOverflow(page);

    // 3. Click "Problem Appears Resolved" advisory button
    await page.click('[data-testid="mark-resolved-btn"]');

    // 4. Verify Requester Advisory Banner is displayed
    const indicator = page.locator('[data-testid="requester-resolved-indicator"]');
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText("You indicated this problem appears resolved.");

    // 5. Verification of Resolution Gate: Ticket status remains WAITING_FOR_REQUESTER
    // (Requester cannot resolve ticket directly)
    await expect(page.getByText("Waiting for Requester").first()).toBeVisible();

    await logoutUser(page);
  });

  test("E2E-02 Part 2: IT Staff sees advisory indication and executes formal resolution", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as IT Staff Bob Jones (assigned owner of TKT-2026-000103)
    await loginAs(page, "bob.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${resolutionTicketId}`);
    await page.waitForSelector('[data-testid="ticket-header-card"]', { timeout: 15000 });

    // 2. Verify IT Staff sees the Requester's advisory indication alert
    const staffAlert = page.locator('[data-testid="resolved-indication-banner"]');
    await expect(staffAlert).toBeVisible();
    await expect(staffAlert).toContainText("Requester marked problem as resolved!");

    // 3. Transition status to RESOLVED
    const statusSelect = page.locator('[data-testid="status-transition-select"]');
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption("RESOLVED");

    await page.click('[data-testid="transition-status-btn"]');

    // Confirm in modal
    const confirmModal = page.locator('[data-testid="status-confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.click('[data-testid="confirm-status-transition-btn"]');
    await expect(confirmModal).toBeHidden({ timeout: 10000 });

    // 4. Verify Ticket status updated to RESOLVED
    await expect(page.locator(".zen-badge-resolved").first()).toBeVisible();

    await logoutUser(page);
  });

  test("E2E-02 Part 3: Stale update 409 conflict detection and form state preservation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as IT Staff
    await loginAs(page, "bob.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${resolutionTicketId}`);
    await page.waitForSelector('[data-testid="status-transition-select"]', { timeout: 15000 });

    // 2. Select next status 'CLOSED'
    const statusSelect = page.locator('[data-testid="status-transition-select"]');
    await statusSelect.selectOption("CLOSED");

    // 3. Simulate Concurrent Background Update in Database (mutating updatedAt timestamp)
    const prisma = await getPrismaClient();
    await prisma.ticket.update({
      where: { id: resolutionTicketId },
      data: {
        summary: `Updated concurrently by background worker [${Date.now()}]`,
        updatedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    // 4. Staff attempts to submit transition with stale expectedUpdatedAt
    await page.click('[data-testid="transition-status-btn"]');
    const confirmModal = page.locator('[data-testid="status-confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.click('[data-testid="confirm-status-transition-btn"]');

    // 5. Verify 409 Conflict Alert is rendered
    const conflictAlert = page.locator('[data-testid="conflict-alert"]');
    await expect(conflictAlert).toBeVisible({ timeout: 10000 });
    await expect(conflictAlert).toContainText("Conflict: This ticket was updated by another team member");

    // 6. Verify Form State Preservation (BR-16, AC-28, UI-04b):
    // The uncommitted target status 'CLOSED' must remain selected in the dropdown!
    await expect(statusSelect).toHaveValue("CLOSED");

    // 7. Click "Refresh Ticket State" button
    const refreshBtn = page.locator('[data-testid="refresh-ticket-state-btn"]');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // Conflict alert clears
    await expect(conflictAlert).toBeHidden({ timeout: 10000 });

    // 8. Successfully transition to CLOSED with refreshed timestamp
    await statusSelect.selectOption("CLOSED");
    await page.click('[data-testid="transition-status-btn"]');
    await expect(confirmModal).toBeVisible();
    await page.click('[data-testid="confirm-status-transition-btn"]');
    await expect(confirmModal).toBeHidden({ timeout: 10000 });

    // Verify ticket reached CLOSED
    await expect(page.locator(".zen-badge-closed").first()).toBeVisible();

    await logoutUser(page);
  });
});
