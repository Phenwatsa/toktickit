import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  captureScreenshot,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
  getPrismaClient,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 26: Dashboards Drill-Down, Quick Actions & Multi-Viewport Responsive Audit
// Covers:
// - E2E-03a: Requester, IT Staff, Admin Dashboard metric cards & drill-downs
// - E2E-03b: Cross-role Dashboard Quick Actions navigation
// - E2E-04: Multi-viewport responsive layout audit across Desktop (1280px),
//   Tablet (768px), and Mobile (375px) across all 4 core screens (FR-17, AC-17)
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 667 },
];

test.describe("Lab 4 E2E-03 & E2E-04: Dashboards & Responsive Audit", () => {
  let sampleTicketId: number;

  test.beforeAll(async () => {
    ensureScreenshotsDir();
    const prisma = await getPrismaClient();
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000102" },
    });
    if (ticket) {
      sampleTicketId = ticket.id;
    } else {
      const anyTicket = await prisma.ticket.findFirst({
        where: { currentStatus: { notIn: ["CANCELLED"] } },
      });
      if (!anyTicket) throw new Error("No ticket found in database");
      sampleTicketId = anyTicket.id;
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. Requester Dashboard: Metrics, Drill-Downs & Quick Actions (E2E-03a, E2E-03b)
  // =========================================================================
  test("E2E-03a & E2E-03b Part 1: Requester Dashboard metrics, drill-downs, and quick actions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");

    // Verify Requester Dashboard loads
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 15000 });

    // Assert primary metric cards exist
    await expect(page.locator('[data-testid="metric-card-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-waiting-for-requester"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-resolved"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-closed"]')).toBeVisible();

    // Capture Requester Desktop Screenshot
    await captureScreenshot(page, "requester-dashboard", "01-requester-dashboard-desktop.png");

    // Drill-Down: Click Open Tickets Card
    await page.click('[data-testid="metric-card-open"]');
    await expect(page).toHaveURL(/#\/my-tickets\?status=OPEN_GROUP/);
    await expect(page.locator("text=My Support Tickets")).toBeVisible();

    // Capture Requester Drilldown Screenshot
    await captureScreenshot(page, "requester-dashboard", "04-requester-dashboard-drilldown.png");

    // Return to dashboard
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="requester-dashboard"]');

    // Quick Actions (E2E-03b):
    // 1. Create Ticket shortcut
    await page.click('[data-testid="quick-action-create-ticket"]');
    await expect(page).toHaveURL(/#\/create-ticket/);
    await expect(page.locator("text=Create IT Support Ticket")).toBeVisible();

    // 2. View All Tickets shortcut
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="requester-dashboard"]');
    await page.click('[data-testid="quick-action-view-tickets"]');
    await expect(page).toHaveURL(/#\/my-tickets/);

    await logoutUser(page);
  });

  // =========================================================================
  // 2. IT Staff Dashboard: Metrics, Drill-Downs & Quick Actions (E2E-03a, E2E-03b)
  // =========================================================================
  test("E2E-03a & E2E-03b Part 2: IT Staff Dashboard metrics, drill-downs, and quick actions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");

    // Verify IT Staff Dashboard loads
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 15000 });

    // Assert 5 primary cards + unassigned indicator
    await expect(page.locator('[data-testid="metric-card-new"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-waiting"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-my-assigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-unassigned"]')).toBeVisible();

    // Capture IT Staff Desktop Screenshot
    await captureScreenshot(page, "staff-dashboard", "01-staff-dashboard-desktop.png");

    // Drill-Down: Click "My Assigned Tickets" Card
    await page.click('[data-testid="metric-card-my-assigned"]');
    await expect(page).toHaveURL(/#\/staff-queue\?owner=me/);
    await expect(page.locator("text=IT Staff Ticket Queue")).toBeVisible();

    // Capture Staff Drilldown Screenshot
    await captureScreenshot(page, "staff-dashboard", "04-staff-dashboard-drilldown.png");

    // Drill-Down: Unassigned Queue
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="staff-dashboard"]');
    await page.click('[data-testid="metric-card-unassigned"]');
    await expect(page).toHaveURL(/#\/staff-queue\?owner=unassigned/);

    // Quick Actions (E2E-03b):
    // 1. Create Ticket
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="staff-dashboard"]');
    await page.click('[data-testid="quick-action-create-ticket"]');
    await expect(page).toHaveURL(/#\/create-ticket/);

    // 2. Search Tickets / Ticket Queue
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="staff-dashboard"]');
    await page.click('[data-testid="quick-action-search-tickets"]');
    await expect(page).toHaveURL(/#\/staff-queue/);

    // 3. My Assigned Queue shortcut
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="staff-dashboard"]');
    await page.click('[data-testid="quick-action-my-queue"]');
    await expect(page).toHaveURL(/#\/staff-queue\?owner=me/);

    await logoutUser(page);
  });

  // =========================================================================
  // 3. Admin Dashboard: Metrics, Drill-Downs & Quick Actions (E2E-03a, E2E-03b)
  // =========================================================================
  test("E2E-03a & E2E-03b Part 3: Administrator Dashboard operational & user metrics, drill-downs, and quick actions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "admin@toktickit.local", "Password123!");

    // Verify Admin Dashboard loads
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 15000 });

    // Assert 5 operational and user cards
    await expect(page.locator('[data-testid="admin-card-active-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-card-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-card-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-card-active-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-card-inactive-users"]')).toBeVisible();

    // Capture Admin Desktop Screenshot
    await captureScreenshot(page, "admin-dashboard", "01-admin-dashboard-desktop.png");

    // Drill-Down: Total Active Tickets -> staff queue
    await page.click('[data-testid="admin-card-active-tickets"]');
    await expect(page).toHaveURL(/#\/staff-queue/);

    // Capture Admin Drilldown Screenshot
    await captureScreenshot(page, "admin-dashboard", "04-admin-dashboard-drilldown.png");

    // Drill-Down: Total Users -> admin-users
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    await page.click('[data-testid="admin-card-total-users"]');
    await expect(page).toHaveURL(/#\/admin-users/);
    await expect(
      page.locator('[data-testid="admin-user-management"]').getByText("User Management").first()
    ).toBeVisible();

    // Quick Actions (E2E-03b):
    // 1. User Management
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    await page.click('[data-testid="admin-action-users"]');
    await expect(page).toHaveURL(/#\/admin-users/);

    // 2. Ticket Queue
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    await page.click('[data-testid="admin-action-queue"]');
    await expect(page).toHaveURL(/#\/staff-queue/);

    // 3. Create Ticket
    await page.goto("/#/dashboard");
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    await page.click('[data-testid="admin-action-create"]');
    await expect(page).toHaveURL(/#\/create-ticket/);

    await logoutUser(page);
  });

  // =========================================================================
  // 4. Responsive Layout & Zero Overflow Audit (E2E-04 & AC-17)
  // Across Desktop (1280px), Tablet (768px), and Mobile (375px) on 4 Core Screens
  // =========================================================================
  test("E2E-04: Multi-viewport audit across Requester, Staff, Admin dashboards and Ticket Detail", async ({
    page,
  }) => {
    // 4.1 Requester Dashboard Responsive Audit (Desktop, Tablet, Mobile)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await page.waitForSelector('[data-testid="requester-dashboard"]', { timeout: 15000 });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Assert zero horizontal overflow
      await assertNoHorizontalOverflow(page);

      // Verify Zen Green tokens are applied
      const zgPrimary = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue("--zg-primary").trim();
      });
      expect(zgPrimary).toBeTruthy();

      // Capture screenshots for tablet and mobile
      if (vp.name === "tablet") {
        await captureScreenshot(page, "requester-dashboard", "02-requester-dashboard-tablet.png");
      } else if (vp.name === "mobile") {
        await captureScreenshot(page, "requester-dashboard", "03-requester-dashboard-mobile.png");
      }
    }
    await logoutUser(page);

    // 4.2 IT Staff Dashboard Responsive Audit (Desktop, Tablet, Mobile)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.waitForSelector('[data-testid="staff-dashboard"]', { timeout: 15000 });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      await assertNoHorizontalOverflow(page);

      if (vp.name === "tablet") {
        await captureScreenshot(page, "staff-dashboard", "02-staff-dashboard-tablet.png");
      } else if (vp.name === "mobile") {
        await captureScreenshot(page, "staff-dashboard", "03-staff-dashboard-mobile.png");
      }
    }
    await logoutUser(page);

    // 4.3 Admin Dashboard Responsive Audit (Desktop, Tablet, Mobile)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "admin@toktickit.local", "Password123!");
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 15000 });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      await assertNoHorizontalOverflow(page);

      if (vp.name === "tablet") {
        await captureScreenshot(page, "admin-dashboard", "02-admin-dashboard-tablet.png");
      } else if (vp.name === "mobile") {
        await captureScreenshot(page, "admin-dashboard", "03-admin-dashboard-mobile.png");
      }
    }
    await logoutUser(page);

    // 4.4 Ticket Detail Screen Responsive Audit (Desktop, Tablet, Mobile)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${sampleTicketId}`);
    await page.waitForSelector('[data-testid="ticket-header-card"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      await assertNoHorizontalOverflow(page);

      // On mobile viewports, verify that responsive card or table layout does not collide or overflow
      if (vp.width <= 768) {
        const hasMobileCards = await page.locator(".actions-taken-mobile-cards").isVisible();
        const hasTable = await page.locator(".actions-taken-table-wrap").isVisible();
        const hasEmpty = await page.locator('[data-testid="actions-empty-state"]').isVisible();
        expect(hasMobileCards || hasTable || hasEmpty).toBe(true);
      }
    }

    await logoutUser(page);
  });
});
