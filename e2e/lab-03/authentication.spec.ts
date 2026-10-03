import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  captureScreenshot,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
  resetTestUserInDb,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: Authentication & Session Lifecycle E2E Suite
// Covers:
// - E2E-01: Valid login across all 3 roles, role-specific landing views, role badges, and logout invalidation
// - E2E-02: Inactive account blockage, invalid credential handling, and mandatory first-login password change flow
// ---------------------------------------------------------------------------

test.describe("Lab 3 Authentication & Authorization E2E Suite", () => {
  test.beforeAll(async () => {
    ensureScreenshotsDir();
    // Ensure first-login test user is reset to initial state
    await resetTestUserInDb("firstlogin.req@toktickit.local", "Password123!", true, true);
  });

  test.afterAll(async () => {
    // Restore firstlogin user state for idempotency across runs
    await resetTestUserInDb("firstlogin.req@toktickit.local", "Password123!", true, true);
  });

  test("E2E-01: Valid Login Across All 3 Roles, Role-Based Landing Views & Navigation State", async ({
    page,
  }) => {
    // 1. Visit Login Page on Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/#/login");
    await page.waitForSelector('[data-testid="login-container"]');
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "authentication", "01-login-desktop");

    // 2. Role 1: Requester Login (Jennifer Anderson)
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/my-tickets/);
    await expect(page.locator('[data-testid="user-display-name"]')).toHaveText("Jennifer Anderson");
    await expect(page.locator('[data-testid="user-role-badge"]')).toHaveText("Requester");
    await expect(page.locator('[data-testid="nav-my-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-create-ticket"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Logout Requester
    await logoutUser(page);

    // 3. Role 2: IT Staff Login (Alice Smith)
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/staff-queue/);
    await expect(page.locator('[data-testid="user-display-name"]')).toHaveText("Alice Smith");
    await expect(page.locator('[data-testid="user-role-badge"]')).toHaveText("IT Staff");
    await expect(page.locator('[data-testid="nav-staff-queue"]')).toBeVisible();
    // Guard: IT Staff must not see admin navigation
    await expect(page.locator('[data-testid="nav-admin-users"]')).not.toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Logout IT Staff
    await logoutUser(page);

    // 4. Role 3: Administrator Login (System Administrator)
    await loginAs(page, "admin@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/admin-users/);
    await expect(page.locator('[data-testid="user-display-name"]')).toHaveText("System Administrator");
    await expect(page.locator('[data-testid="user-role-badge"]')).toHaveText("Administrator");
    await expect(page.locator('[data-testid="nav-admin-users"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Logout Administrator
    await logoutUser(page);
  });

  test("E2E-01: Logout Session Invalidation & Protected Route Interception", async ({ page }) => {
    // Login as IT Staff
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/staff-queue/);

    // Perform Logout
    await logoutUser(page);

    // Direct hash access to protected views must be intercepted and reverted to #/login
    await page.goto("/#/staff-queue");
    await expect(page.locator('[data-testid="login-container"]')).toBeVisible({ timeout: 5000 });

    await page.goto("/#/admin-users");
    await expect(page.locator('[data-testid="login-container"]')).toBeVisible({ timeout: 5000 });

    await page.goto("/#/my-tickets");
    await expect(page.locator('[data-testid="login-container"]')).toBeVisible({ timeout: 5000 });
  });

  test("E2E-02: Inactive Account Blockage, Invalid Credentials & Mobile Login View", async ({ page }) => {
    // 1. Mobile Viewport Login (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/#/login");
    await page.waitForSelector('[data-testid="login-container"]');
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "authentication", "02-login-mobile");

    // 2. Invalid Credentials Handling
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/#/login");
    await page.waitForSelector('[data-testid="login-container"]');

    await page.fill("#email-input", "jennifer.a@toktickit.local");
    await page.fill("#password-input", "WrongPassword999!");
    await page.click('[data-testid="login-submit-btn"]');

    await expect(page.locator('[data-testid="login-error-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error-banner"]')).toContainText(
      "Invalid email or password"
    );
    await captureScreenshot(page, "authentication", "03-login-invalid-error");

    // 3. Inactive Account Blockage (Alex Wilson - isActive: false)
    await page.fill("#email-input", "alex.w@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');

    await expect(page.locator('[data-testid="login-error-banner"]')).toBeVisible();
    await captureScreenshot(page, "authentication", "04-login-inactive-error");
  });

  test("E2E-02: Mandatory First-Login Password Change Flow & Policy Validation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login with user requiring mandatory password change (mustChangePassword: true)
    await loginAs(page, "firstlogin.req@toktickit.local", "Password123!");

    // Verify intercept to change password view
    await expect(page.locator('[data-testid="change-password-container"]')).toBeVisible();
    await captureScreenshot(page, "authentication", "05-password-change-intercept");

    // 2. Verify Real-Time Password Policy Checklist
    await page.fill('[data-testid="current-password-input"]', "Password123!");

    // Weak password: no upper, no number, < 8 chars
    await page.fill('[data-testid="new-password-input"]', "short");
    await page.fill('[data-testid="confirm-password-input"]', "short");

    // Verify submit button is disabled
    await expect(page.locator('[data-testid="change-password-submit-btn"]')).toBeDisabled();

    // 3. Enter compliant new password
    const newSecurePassword = "UpdatedSecurePassword456!";
    await page.fill('[data-testid="new-password-input"]', newSecurePassword);
    await page.fill('[data-testid="confirm-password-input"]', newSecurePassword);

    // Verify all policy checklist items pass
    await expect(page.locator('[data-testid="rule-min-length"]')).toContainText("✓");
    await expect(page.locator('[data-testid="rule-upper-lower"]')).toContainText("✓");
    await expect(page.locator('[data-testid="rule-number"]')).toContainText("✓");
    await expect(page.locator('[data-testid="rule-match"]')).toContainText("✓");
    await expect(page.locator('[data-testid="change-password-submit-btn"]')).toBeEnabled();

    // 4. Submit password change
    await page.click('[data-testid="change-password-submit-btn"]');

    // Verify successful progression into the application
    await expect(page.locator("text=My Support Tickets")).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/#\/my-tickets/);

    // 5. Logout
    await logoutUser(page);
  });
});
