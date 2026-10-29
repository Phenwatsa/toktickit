import { test, expect, Page } from "@playwright/test";
import {
  ensureScreenshotsDir,
  captureScreenshot,
  assertNoHorizontalOverflow,
  assertZenGreenTokens,
  assertGridColumnCount,
  assertNoControlCollisions,
  assertNoClippedText,
  assertAccessibleTouchTargets,
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
    // 1. Query authoritative metrics from database for comparison
    const prisma = await getPrismaClient();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "jennifer.a@toktickit.local" },
    });
    const reqTickets = await prisma.ticket.findMany({
      where: { requesterId: user.id },
    });
    await prisma.$disconnect();

    const expectedOpen = reqTickets.filter((t) =>
      ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"].includes(t.currentStatus)
    ).length;
    const expectedInProgress = reqTickets.filter((t) => t.currentStatus === "IN_PROGRESS").length;
    const expectedWaiting = reqTickets.filter(
      (t) => t.currentStatus === "WAITING_FOR_REQUESTER"
    ).length;
    const expectedResolved = reqTickets.filter((t) => t.currentStatus === "RESOLVED").length;
    const expectedClosed = reqTickets.filter((t) => t.currentStatus === "CLOSED").length;

    // 2. Intercept API response during page load
    const dashboardRespPromise = page.waitForResponse(
      (r) => r.url().includes("/api/requester/dashboard") && r.status() === 200
    );

    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");

    // Verify Requester Dashboard loads
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 15000 });

    const dashboardResp = await dashboardRespPromise;
    const apiData = await dashboardResp.json();
    const metrics = apiData.metrics || apiData;
    expect(metrics.openTickets).toBe(expectedOpen);
    expect(metrics.inProgressTickets).toBe(expectedInProgress);
    expect(metrics.waitingForRequesterTickets).toBe(expectedWaiting);
    expect(metrics.resolvedTickets).toBe(expectedResolved);
    expect(metrics.closedTickets).toBe(expectedClosed);

    // 3. Assert primary metric cards display authoritative calculated values
    await expect(page.locator('[data-testid="metric-card-open"] .zg-metric-card-value')).toHaveText(
      String(expectedOpen)
    );
    await expect(
      page.locator('[data-testid="metric-card-in-progress"] .zg-metric-card-value')
    ).toHaveText(String(expectedInProgress));
    await expect(
      page.locator('[data-testid="metric-card-waiting-for-requester"] .zg-metric-card-value')
    ).toHaveText(String(expectedWaiting));
    await expect(
      page.locator('[data-testid="metric-card-resolved"] .zg-metric-card-value')
    ).toHaveText(String(expectedResolved));
    await expect(page.locator('[data-testid="metric-card-closed"] .zg-metric-card-value')).toHaveText(
      String(expectedClosed)
    );

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
    // 1. Query authoritative metrics from database
    const prisma = await getPrismaClient();
    const staffUser = await prisma.user.findUniqueOrThrow({
      where: { email: "alice.staff@toktickit.local" },
    });
    const allTickets = await prisma.ticket.findMany();
    await prisma.$disconnect();

    const expectedNew = allTickets.filter((t) => t.currentStatus === "NEW").length;
    const expectedOpen = allTickets.filter((t) => t.currentStatus === "OPEN").length;
    const expectedInProgress = allTickets.filter((t) => t.currentStatus === "IN_PROGRESS").length;
    const expectedWaiting = allTickets.filter(
      (t) => t.currentStatus === "WAITING_FOR_REQUESTER"
    ).length;
    const expectedMyAssigned = allTickets.filter(
      (t) =>
        t.ticketOwnerId === staffUser.id &&
        !["CLOSED", "CANCELLED"].includes(t.currentStatus)
    ).length;
    const expectedUnassigned = allTickets.filter(
      (t) => !t.ticketOwnerId && !["CLOSED", "CANCELLED"].includes(t.currentStatus)
    ).length;

    // 2. Intercept API response
    const staffRespPromise = page.waitForResponse(
      (r) => r.url().includes("/api/staff/dashboard") && r.status() === 200
    );

    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");

    // Verify IT Staff Dashboard loads
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 15000 });

    const staffResp = await staffRespPromise;
    const staffApi = await staffResp.json();
    const primary = staffApi.metrics?.primary || staffApi.primary;
    const unassignedCount = staffApi.metrics?.unassignedTickets ?? staffApi.unassignedTickets;
    expect(primary?.newTickets).toBe(expectedNew);
    expect(primary?.openTickets).toBe(expectedOpen);
    expect(primary?.inProgressTickets).toBe(expectedInProgress);
    expect(primary?.waitingForRequesterTickets).toBe(expectedWaiting);
    expect(primary?.myAssignedTickets).toBe(expectedMyAssigned);
    expect(unassignedCount).toBe(expectedUnassigned);

    // 3. Assert displayed card values match authoritative metrics
    await expect(page.locator('[data-testid="metric-card-new"] .zg-metric-card-value')).toHaveText(
      String(expectedNew)
    );
    await expect(page.locator('[data-testid="metric-card-open"] .zg-metric-card-value')).toHaveText(
      String(expectedOpen)
    );
    await expect(
      page.locator('[data-testid="metric-card-in-progress"] .zg-metric-card-value')
    ).toHaveText(String(expectedInProgress));
    await expect(
      page.locator('[data-testid="metric-card-waiting"] .zg-metric-card-value')
    ).toHaveText(String(expectedWaiting));
    await expect(
      page.locator('[data-testid="metric-card-my-assigned"] .zg-metric-card-value')
    ).toHaveText(String(expectedMyAssigned));
    await expect(
      page.locator('[data-testid="metric-card-unassigned"]').locator("div").first()
    ).toHaveText(String(expectedUnassigned));

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
    // 1. Query authoritative metrics from database
    const prisma = await getPrismaClient();
    const allTickets = await prisma.ticket.findMany();
    const allUsers = await prisma.user.findMany();
    await prisma.$disconnect();

    const expectedActiveTickets = allTickets.filter(
      (t) => !["CLOSED", "CANCELLED"].includes(t.currentStatus)
    ).length;
    const expectedUnassigned = allTickets.filter(
      (t) => !t.ticketOwnerId && !["CLOSED", "CANCELLED"].includes(t.currentStatus)
    ).length;
    const expectedTotalUsers = allUsers.length;
    const expectedActiveUsers = allUsers.filter((u) => u.isActive).length;
    const expectedInactiveUsers = allUsers.filter((u) => !u.isActive).length;

    // 2. Intercept API response
    const adminRespPromise = page.waitForResponse(
      (r) => r.url().includes("/api/admin/dashboard") && r.status() === 200
    );

    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "admin@toktickit.local", "Password123!");

    // Verify Admin Dashboard loads
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 15000 });

    const adminResp = await adminRespPromise;
    const adminApi = await adminResp.json();
    expect(adminApi.operational?.totalActiveTickets).toBe(expectedActiveTickets);
    expect(adminApi.operational?.unassignedTickets).toBe(expectedUnassigned);
    expect(adminApi.users?.totalUsers).toBe(expectedTotalUsers);
    expect(adminApi.users?.activeUsers).toBe(expectedActiveUsers);
    expect(adminApi.users?.inactiveUsers).toBe(expectedInactiveUsers);

    // 3. Assert 5 operational and user cards display authoritative metric values
    await expect(
      page.locator('[data-testid="admin-card-active-tickets"] .zg-metric-card-value')
    ).toHaveText(String(expectedActiveTickets));
    await expect(
      page.locator('[data-testid="admin-card-unassigned"] .zg-metric-card-value')
    ).toHaveText(String(expectedUnassigned));
    await expect(
      page.locator('[data-testid="admin-card-total-users"] .zg-metric-card-value')
    ).toHaveText(String(expectedTotalUsers));
    await expect(
      page.locator('[data-testid="admin-card-active-users"] .zg-metric-card-value')
    ).toHaveText(String(expectedActiveUsers));
    await expect(
      page.locator('[data-testid="admin-card-inactive-users"] .zg-metric-card-value')
    ).toHaveText(String(expectedInactiveUsers));

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
    // Helper to run comprehensive responsive audit on a given screen & viewport
    async function runResponsiveAudit(
      p: Page,
      vp: { name: string; width: number; height: number },
      options?: { isDashboard?: boolean }
    ) {
      await p.setViewportSize({ width: vp.width, height: vp.height });
      await p.waitForTimeout(300);

      // 1. Zero horizontal overflow (scrollWidth === clientWidth and scrollX === 0)
      await assertNoHorizontalOverflow(p);

      // 2. All 4 Zen Green tokens present and computed
      await assertZenGreenTokens(p);

      // 3. Grid restructuring (Desktop: 5 cols, Tablet: 2-3 cols, Mobile: 1 col)
      if (options?.isDashboard) {
        if (vp.width >= 1200) {
          await assertGridColumnCount(p, 5);
        } else if (vp.width >= 768) {
          await assertGridColumnCount(p, [2, 3]);
        } else {
          await assertGridColumnCount(p, 1);
        }
      }

      // 4. Zero interactive control collisions
      await assertNoControlCollisions(p);

      // 5. Zero clipped text
      await assertNoClippedText(p);

      // 6. Accessible touch targets (>= 44px min-height per Apple HIG / WCAG 2.1 AAA)
      if (options?.isDashboard && vp.width <= 768) {
        await assertAccessibleTouchTargets(p);
      }
    }

    // 4.1 Requester Dashboard Responsive Audit (Desktop, Tablet, Mobile)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await page.waitForSelector('[data-testid="requester-dashboard"]', { timeout: 15000 });

    for (const vp of VIEWPORTS) {
      await runResponsiveAudit(page, vp, { isDashboard: true });

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
      await runResponsiveAudit(page, vp, { isDashboard: true });

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
      await runResponsiveAudit(page, vp, { isDashboard: true });

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
      await runResponsiveAudit(page, vp, { isDashboard: false });

      // On mobile viewports, verify that responsive card or table layout is present
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
