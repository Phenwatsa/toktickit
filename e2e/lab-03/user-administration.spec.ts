import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  captureScreenshot,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: Administrator User Management E2E Suite
// Covers:
// - E2E-06: User list, search/filter, user creation, duplicate email rejection,
//   role assignment, initial password reset, and self-deactivation guard
// ---------------------------------------------------------------------------

test.describe("Lab 3 Administrator User Management E2E Suite", () => {
  test.beforeAll(() => {
    ensureScreenshotsDir();
  });

  test("E2E-06: Admin User Management, Creation, Constraints, and Password Reset", async ({
    page,
  }) => {
    // 1. Login as Administrator (System Administrator)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "admin@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/admin-users/);
    await page.waitForSelector('[data-testid="admin-user-management"]');

    // 2. User List Desktop View
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "user-management", "01-user-list-desktop");

    // 3. Search and Role Filters
    await page.selectOption('[data-testid="admin-role-filter"]', "IT_STAFF");
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();

    await page.selectOption('[data-testid="admin-role-filter"]', "ALL");
    await page.waitForTimeout(300);

    await page.fill('[data-testid="admin-search-input"]', "Jennifer");
    await page.waitForTimeout(300);
    await expect(page.locator('text=jennifer.a@toktickit.local')).toBeVisible();

    await page.fill('[data-testid="admin-search-input"]', "");
    await page.waitForTimeout(300);

    // 4. Open Create User Modal
    await page.click('[data-testid="create-user-button"]');
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "user-management", "02-create-user-modal");

    // 5. Test Duplicate Email Rejection
    await page.fill('[data-testid="create-user-name"]', "Duplicate Email Test");
    await page.fill('[data-testid="create-user-email"]', "jennifer.a@toktickit.local");
    await page.fill('[data-testid="create-user-password"]', "Password123!");
    await page.click('[data-testid="create-user-submit"]');

    // Verify duplicate email error banner
    await expect(page.locator('[data-testid="create-user-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="create-user-error"]')).toContainText("already exists");
    await captureScreenshot(page, "user-management", "03-duplicate-email-error");

    // 6. Create Valid New User
    const uniqueEmail = `e2e_staff_${Date.now()}@toktickit.local`;
    await page.fill('[data-testid="create-user-name"]', "Automated E2E Staff");
    await page.fill('[data-testid="create-user-email"]', uniqueEmail);
    await page.fill('[data-testid="create-user-department"]', "IT Field Support");
    await page.selectOption('[data-testid="create-user-role"]', "IT_STAFF");
    await page.fill('[data-testid="create-user-password"]', "InitPassword123!");
    await page.click('[data-testid="create-user-submit"]');

    // Verify modal closes and new user appears in list
    await expect(page.locator('[data-testid="create-user-modal"]')).not.toBeVisible({ timeout: 8000 });
    await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible({ timeout: 8000 });

    // 7. Test Admin Self-Deactivation Guard
    // Find the row for current logged in admin (contains "You" badge)
    const adminRow = page.locator('tr:has(span:text-is("You"))');
    await expect(adminRow).toBeVisible();
    await adminRow.locator('button:has-text("Edit")').click();

    // Verify edit modal opens
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();

    // Verify Active toggle is disabled for self
    await expect(page.locator('[data-testid="edit-user-active-toggle"]')).toBeDisabled();

    // Verify self-deactivation notice is shown
    await expect(page.locator('[data-testid="self-deactivation-notice"]')).toBeVisible();
    await captureScreenshot(page, "user-management", "04-edit-user-self-deactivation-blocked");

    // Close edit modal
    await page.click('[data-testid="edit-user-cancel"]');
    await expect(page.locator('[data-testid="edit-user-modal"]')).not.toBeVisible();

    // 8. Test Reset Initial Password on Non-Admin User
    const targetUserRow = page.locator(`tr:has-text("${uniqueEmail}")`);
    await targetUserRow.locator('button:has-text("Edit")').click();
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();

    // Fill new initial password in reset password section
    await page.fill('[data-testid="reset-password-input"]', "ResetSecretKey456!");
    await page.click('[data-testid="reset-password-button"]');

    // Verify success banner appears
    await expect(page.locator('[data-testid="reset-password-success"]')).toBeVisible({ timeout: 8000 });
    await captureScreenshot(page, "user-management", "05-reset-password-section");

    // Close modal
    await page.click('[data-testid="edit-user-cancel"]');
    await expect(page.locator('[data-testid="edit-user-modal"]')).not.toBeVisible();

    // Logout Administrator
    await logoutUser(page);
  });
});
