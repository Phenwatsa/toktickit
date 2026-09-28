import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: Requester Problem Resolution Flow E2E Suite
// Covers:
// - E2E-09: Requester marking "Problem Appears Resolved", verifying persistent
//   non-final indicator while official status remains active, and verifying
//   prominent IT Staff banner visibility.
// ---------------------------------------------------------------------------

test.describe("Lab 3 Requester Resolution Indication E2E Suite", () => {
  test.beforeAll(() => {
    ensureScreenshotsDir();
  });

  test("E2E-09: Mark Problem Appears Resolved, State Persistence & Staff Visibility", async ({
    page,
  }) => {
    // 1. Login as Requester (Jennifer Anderson)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/my-tickets/);

    // 2. Create a fresh ticket to test resolution flow reliably
    await page.click('[data-testid="nav-create-ticket"]');
    await expect(page.locator("text=Create IT Support Ticket")).toBeVisible();

    const uniqueSummary = `Resolution Flow Test ${Date.now()}`;
    await page.selectOption("#ticketCategory", { index: 1 });
    await page.selectOption("#ticketSystem", { index: 1 });
    await page.selectOption("#ticketPriority", "MEDIUM");
    await page.fill("#ticketSummary", uniqueSummary);
    await page.fill(
      "#ticketDescription",
      "Testing the Problem Appears Resolved signal and its persistence across sessions."
    );
    await page.click('[data-testid="submit-ticket-button"]');

    // 3. Navigate into the new ticket detail view
    await expect(page.locator("text=Ticket Created Successfully!")).toBeVisible();
    await page.click('button:has-text("View in My Tickets")');

    const targetRow = page.locator("tr", { hasText: uniqueSummary });
    await expect(targetRow).toBeVisible();
    await targetRow.locator('button.zen-btn-view:has-text("View")').click();

    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
    const ticketUrl = page.url();

    // 4. Verify "Mark Problem as Resolved" button is available
    const markResolvedBtn = page.locator('[data-testid="mark-resolved-btn"]');
    await expect(markResolvedBtn).toBeVisible();

    // Check official initial status is active (e.g. NEW)
    await expect(page.locator('[data-testid="badge-status-new"]')).toBeVisible();

    // 5. Click "Mark Problem as Resolved"
    await markResolvedBtn.click();

    // 6. Verify persistent indicator banner appears immediately
    await expect(page.locator('[data-testid="requester-resolved-indicator"]')).toBeVisible();
    await expect(markResolvedBtn).not.toBeVisible();

    // Verify official status is still active (NEW), NOT automatically closed
    await expect(page.locator('[data-testid="badge-status-new"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 7. Test Persistence across Page Reload
    await page.reload();
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="requester-resolved-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="badge-status-new"]')).toBeVisible();

    // 8. Logout Requester
    await logoutUser(page);

    // 9. Login as IT Staff (Alice Smith) and verify Staff visibility
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/staff-queue/);

    // Navigate directly to the ticket URL
    await page.goto(ticketUrl);
    await page.waitForSelector('[data-testid="staff-ticket-detail-view"]');

    // 10. Verify Staff view displays the prominent alert banner
    await expect(page.locator('[data-testid="resolved-indication-banner"]')).toBeVisible();
    await expect(page.locator("text=Requester marked problem as resolved!")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 11. Logout Staff
    await logoutUser(page);
  });
});
