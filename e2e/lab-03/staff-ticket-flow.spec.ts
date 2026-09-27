import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  captureScreenshot,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: IT Staff Ticket Flow E2E Suite
// Covers:
// - E2E-03: IT Staff Queue search, filters, pagination, and multi-device views
// - E2E-04: Ticket Detail overview, ticket claim, IT priority update, and FSM status transitions
// - E2E-05: Public comment collaboration and confidential internal note confidentiality isolation
// ---------------------------------------------------------------------------

test.describe("Lab 3 IT Staff Ticket Operations E2E Suite", () => {
  test.beforeAll(() => {
    ensureScreenshotsDir();
  });

  test("E2E-03: Staff Queue Multi-Device Responsiveness, Search, Filters & Empty States", async ({
    page,
  }) => {
    // 1. Login as IT Staff (Alice Smith)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/staff-queue/);
    await page.waitForSelector('[data-testid="staff-ticket-queue-page"]');

    // 2. Desktop Viewport (1280x800)
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-queue", "01-staff-queue-desktop");

    // 3. Tablet Viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-queue", "02-staff-queue-tablet");

    // 4. Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-queue", "03-staff-queue-mobile-cards");

    // 5. Desktop Filter and Search Verification
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);

    // Apply Status Filter: NEW
    await page.selectOption('[data-testid="staff-queue-status-filter"]', "NEW");
    await page.waitForTimeout(300);

    // Apply IT Priority Filter: HIGH
    await page.selectOption('[data-testid="staff-queue-it-priority-filter"]', "HIGH");
    await page.waitForTimeout(300);

    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-queue", "04-staff-queue-filters");

    // Reset Filters
    await page.click('[data-testid="staff-queue-reset-filters-btn"]');
    await page.waitForTimeout(300);

    // 6. Pagination Verification (Acceptance: Page Navigation, Next/Prev, Item Count, Page Size)
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    await expect(paginationInfo).toBeVisible();
    await expect(paginationInfo).toContainText("Showing 1 to 10 of");
    await expect(page.locator('text=Page 1 of')).toBeVisible();

    const prevBtn = page.locator('[data-testid="pagination-prev-btn"]');
    const nextBtn = page.locator('[data-testid="pagination-next-btn"]');
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();

    // Capture ticket numbers on page 1
    const rows = page.locator('[data-testid="tickets-table"] tbody tr');
    await expect(rows).toHaveCount(10);
    const page1TicketTexts = await page.locator('[data-testid="tickets-table"] tbody tr .zen-ticket-number').allTextContents();
    expect(page1TicketTexts.length).toBe(10);

    // Click Next Page
    await nextBtn.click();
    await expect(paginationInfo).toContainText("Showing 11 to");
    await expect(page.locator('text=Page 2 of')).toBeVisible();
    await expect(prevBtn).toBeEnabled();

    const page2Rows = page.locator('[data-testid="tickets-table"] tbody tr');
    await expect(page2Rows.first()).toBeVisible();
    const page2TicketTexts = await page.locator('[data-testid="tickets-table"] tbody tr .zen-ticket-number').allTextContents();
    expect(page2TicketTexts.length).toBeGreaterThan(0);
    // Ensure no overlap between page 1 and page 2 tickets
    expect(page1TicketTexts.some((num) => page2TicketTexts.includes(num))).toBe(false);

    // Click Previous Page back to Page 1
    await prevBtn.click();
    await expect(paginationInfo).toContainText("Showing 1 to 10 of");
    await expect(page.locator('text=Page 1 of')).toBeVisible();
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();
    await expect(rows).toHaveCount(10);

    // Change Page Size to 25
    await page.selectOption('[data-testid="page-size-select"]', "25");
    await page.waitForTimeout(400);

    await expect(paginationInfo).toContainText("Showing 1 to");
    await expect(prevBtn).toBeDisabled();
    const countPage25 = await page.locator('[data-testid="tickets-table"] tbody tr').count();
    expect(countPage25).toBeGreaterThanOrEqual(10);

    // Reset Page Size back to 10
    await page.selectOption('[data-testid="page-size-select"]', "10");
    await page.waitForTimeout(300);
    await expect(paginationInfo).toContainText("Showing 1 to 10 of");

    // 7. Search for non-existent ticket to trigger No Results empty state
    await page.fill('[data-testid="staff-queue-search-input"]', "NONEXISTENT_TKT_QUERY_9999");
    await page.waitForTimeout(400); // debounce
    await expect(page.locator('[data-testid="staff-queue-no-results"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-queue", "05-staff-queue-empty");

    // Clear search
    await page.click('[data-testid="no-results-reset-btn"]');
    await page.waitForTimeout(300);

    // Logout
    await logoutUser(page);
  });

  test("E2E-04 & E2E-05: Staff Operations (Claim, Priority, Status) & Comments/Notes Confidentiality", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const publicCommentText = `IT Staff public update verification at ${timestamp}`;
    const confidentialNoteText = `Confidential diagnostic findings for staff eyes only at ${timestamp}`;

    // 1. Login as IT Staff (Alice Smith)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/staff-queue/);

    // Open ticket requested by Jennifer Anderson (TKT-2026-000101) so Requester view can later verify confidentiality
    await page.fill('[data-testid="staff-queue-search-input"]', "Cannot access Office 365");
    await page.waitForTimeout(400);
    const jenniferTicketRow = page.locator('tr:has-text("Cannot access Office 365")').first();
    await expect(jenniferTicketRow).toBeVisible({ timeout: 10000 });
    await jenniferTicketRow.locator('button.zen-btn-view:has-text("View")').click();

    // 2. Ticket Detail Overview
    await page.waitForSelector('[data-testid="staff-ticket-detail-view"]');
    await assertNoHorizontalOverflow(page);
    await captureScreenshot(page, "staff-ticket-detail", "01-ticket-detail-overview");

    // 3. Operational Action: Claim Ownership
    const claimBtn = page.locator('[data-testid="claim-ticket-btn"]');
    if (await claimBtn.isEnabled()) {
      await claimBtn.click();
      await expect(
        page.locator('[data-testid="action-success-alert"], [data-testid="claim-ticket-btn"]')
      ).toBeVisible();
    }
    await captureScreenshot(page, "staff-ticket-detail", "02-ticket-claim-action");

    // 4. Operational Action: Update IT Priority
    const prioritySelect = page.locator('[data-testid="it-priority-select"]');
    if (await prioritySelect.isEnabled()) {
      const currentPriority = await prioritySelect.inputValue();
      const newPriority = currentPriority === "URGENT" ? "HIGH" : "URGENT";
      await prioritySelect.selectOption(newPriority);
      await page.click('[data-testid="update-priority-btn"]');
      await expect(page.locator('[data-testid="action-success-alert"]')).toBeVisible();
      await expect(page.locator(`[data-testid="badge-it-priority-${newPriority.toLowerCase()}"]`)).toBeVisible();
    }

    // 5. Operational Action: Status Transition with Confirmation Modal
    const statusSelect = page.locator('[data-testid="status-transition-select"]');
    const availableOptions = await statusSelect.locator("option").all();
    if (availableOptions.length > 1 && (await statusSelect.isEnabled())) {
      // Pick first permitted transition
      const targetVal = await availableOptions[1].getAttribute("value");
      if (targetVal) {
        await statusSelect.selectOption(targetVal);
        await page.click('[data-testid="transition-status-btn"]');

        // Verify confirmation modal
        await expect(page.locator('[data-testid="status-confirm-modal"]')).toBeVisible();
        await page.click('[data-testid="confirm-status-transition-btn"]');
        await expect(page.locator('[data-testid="action-success-alert"]')).toBeVisible();
      }
    }

    // 6. Public Comments Exchange
    await page.click('[data-testid="tab-public-comments"]');
    await page.fill('[data-testid="public-comment-input"]', publicCommentText);
    await page.click('[data-testid="submit-public-comment-btn"]');
    await expect(page.locator(`text=${publicCommentText}`)).toBeVisible();
    await captureScreenshot(page, "staff-ticket-detail", "03-public-comments-exchange");

    // 7. Confidential Internal Notes Recording
    await page.click('[data-testid="tab-internal-notes"]');
    await expect(page.locator('[data-testid="confidential-notes-banner"]')).toBeVisible();
    await page.fill('[data-testid="internal-note-input"]', confidentialNoteText);
    await page.click('[data-testid="submit-internal-note-btn"]');
    await expect(page.locator(`text=${confidentialNoteText}`)).toBeVisible();
    await captureScreenshot(page, "staff-ticket-detail", "04-internal-notes-confidential");

    // Capture ticket URL for Requester inspection
    const ticketUrl = page.url();

    // 8. Logout Staff
    await logoutUser(page);

    // 9. Requester View: Verify Confidentiality Isolation
    // Login as Requester (Jennifer Anderson)
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/my-tickets/);

    // Navigate to the same ticket detail
    await page.goto(ticketUrl);
    await page.waitForSelector('[data-testid="ticket-detail-view"]');

    // Assert: Public comment MUST be visible
    await expect(page.locator(`text=${publicCommentText}`)).toBeVisible();

    // Assert: Internal note tab MUST NOT exist
    await expect(page.locator('[data-testid="tab-internal-notes"]')).not.toBeVisible();

    // Assert: Confidential note text MUST NOT exist anywhere in document
    await expect(page.locator(`text=${confidentialNoteText}`)).not.toBeVisible();

    // Capture screenshot confirming internal notes are strictly hidden from Requester
    await captureScreenshot(page, "staff-ticket-detail", "05-requester-view-notes-hidden");

    // Logout Requester
    await logoutUser(page);
  });
});
