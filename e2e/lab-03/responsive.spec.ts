import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
  resetTestUserInDb,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: Cross-Viewport Responsive Layout & Overflow Audit
// Covers:
// - E2E-08: Comprehensive audit asserting zero horizontal overflow
//   (scrollWidth <= clientWidth) across Desktop (1280x800), Tablet (768x1024),
//   and Mobile (375x667) across all application screens, modals, and drawers.
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "Desktop", width: 1280, height: 800 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 375, height: 667 },
];

test.describe("Lab 3 Responsive Layout & Zero Overflow Audit", () => {
  test.beforeAll(async () => {
    ensureScreenshotsDir();
    await resetTestUserInDb("firstlogin.req@toktickit.local", "Password123!", true, true);
  });

  test.afterAll(async () => {
    await resetTestUserInDb("firstlogin.req@toktickit.local", "Password123!", true, true);
  });

  // -------------------------------------------------------------------------
  // 1. Login Viewport Audit
  // -------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`Login View - ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/#/login");
      await page.waitForSelector('[data-testid="login-container"]');
      await assertNoHorizontalOverflow(page);
    });
  }

  // -------------------------------------------------------------------------
  // 2. Change Password Intercept Viewport Audit
  // -------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`Change Password View - ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAs(page, "firstlogin.req@toktickit.local", "Password123!");
      await expect(page.locator('[data-testid="change-password-container"]')).toBeVisible();
      await assertNoHorizontalOverflow(page);

      // Sign out via change password view
      await page.click('[data-testid="change-password-logout-btn"]');
      await expect(page.locator('[data-testid="login-container"]')).toBeVisible();
    });
  }

  // -------------------------------------------------------------------------
  // 3. Requester Views Audit (My Tickets, Create Ticket, Detail, Mobile Drawer)
  // -------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`Requester Views - ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
      await expect(page).toHaveURL(/#\/my-tickets/);

      // My Tickets View
      await page.waitForSelector("text=My Support Tickets");
      await assertNoHorizontalOverflow(page);

      // Mobile Drawer (if mobile/tablet hamburger is visible)
      const hamburger = page.locator('[data-testid="hamburger-menu-btn"]');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForSelector('[data-testid="mobile-drawer"]');
        await assertNoHorizontalOverflow(page);
        await page.click('[data-testid="drawer-nav-create-ticket"]');
      } else {
        await page.click('[data-testid="nav-create-ticket"]');
      }

      // Create Ticket View
      await page.waitForSelector("text=Create IT Support Ticket");
      await assertNoHorizontalOverflow(page);

      // Navigate to Ticket Detail View
      await page.goto("/#/my-tickets");
      await page.waitForSelector("text=My Support Tickets");
      const firstViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
      if (await firstViewBtn.isVisible()) {
        await firstViewBtn.click();
        await page.waitForSelector('[data-testid="ticket-detail-view"]');
        await assertNoHorizontalOverflow(page);
      }

      await logoutUser(page);
    });
  }

  // -------------------------------------------------------------------------
  // 4. IT Staff Views Audit (Queue, Mobile Cards, Filter Modal, Detail)
  // -------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`IT Staff Views - ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAs(page, "alice.staff@toktickit.local", "Password123!");
      await expect(page).toHaveURL(/#\/staff-queue/);

      // Staff Ticket Queue View
      await page.waitForSelector('[data-testid="staff-ticket-queue-page"]');
      await assertNoHorizontalOverflow(page);

      // Mobile Filter Modal Bottom-Sheet (if on mobile)
      const filterTrigger = page.locator('[data-testid="staff-queue-mobile-filter-trigger-btn"]');
      if (await filterTrigger.isVisible()) {
        await filterTrigger.click();
        await page.waitForSelector('[data-testid="staff-queue-mobile-filter-modal"]');
        await assertNoHorizontalOverflow(page);
        await page.click('button:has-text("Apply Filters")');
        await page.waitForTimeout(200);
      }

      // Staff Ticket Detail View
      const firstStaffViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
      if (await firstStaffViewBtn.isVisible()) {
        await firstStaffViewBtn.click();
        await page.waitForSelector('[data-testid="staff-ticket-detail-view"]');
        await assertNoHorizontalOverflow(page);
      }

      await logoutUser(page);
    });
  }

  // -------------------------------------------------------------------------
  // 5. Administrator Views Audit (User List, Create Modal, Edit Modal)
  // -------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`Administrator Views - ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAs(page, "admin@toktickit.local", "Password123!");
      await expect(page).toHaveURL(/#\/admin-users/);

      // Users List View
      await page.waitForSelector('[data-testid="admin-user-management"]');
      await assertNoHorizontalOverflow(page);

      // Create User Modal
      await page.click('[data-testid="create-user-button"]');
      await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await page.click('[data-testid="create-user-cancel"]');
      await expect(page.locator('[data-testid="create-user-modal"]')).not.toBeVisible();

      // Edit User Modal
      const firstEditBtn = page.locator('button:has-text("Edit")').first();
      if (await firstEditBtn.isVisible()) {
        await firstEditBtn.click();
        await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
        await assertNoHorizontalOverflow(page);
        await page.click('[data-testid="edit-user-cancel"]');
      }

      await logoutUser(page);
    });
  }
});
