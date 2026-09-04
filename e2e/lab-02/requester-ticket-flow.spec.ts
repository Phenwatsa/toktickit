import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 10: End-to-End Testing & Responsive Polish
// ---------------------------------------------------------------------------

const screenshotsDir = path.join(process.cwd(), "artifacts", "lab-02", "screenshots");

function ensureScreenshotsDir() {
  const dirs = [
    screenshotsDir,
    path.join(screenshotsDir, "create-ticket"),
    path.join(screenshotsDir, "my-tickets"),
    path.join(screenshotsDir, "ticket-detail"),
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }
}

// Helper: Assert zero horizontal scrolling
async function assertNoHorizontalOverflow(page: any) {
  const isOverflowing = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(isOverflowing).toBe(false);
}

// Helper: Change Requester with confirmation modal support
async function clickChangeRequester(page: any) {
  const changeBtn = page.locator('[data-testid="change-requester-btn"]');
  if (await changeBtn.isVisible()) {
    await changeBtn.click();
  } else {
    // If on mobile, open drawer to switch requester
    const hamburger = page.locator('[data-testid="hamburger-menu-btn"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForSelector('[data-testid="mobile-drawer"]');
      await page.click('button:has-text("Switch Development User")');
    } else {
      const switchBtn = page.locator('button.zen-header-change-btn:has-text("Switch")');
      if (await switchBtn.isVisible()) {
        await switchBtn.click();
      }
    }
  }

  const confirmBtn = page.locator('[data-testid="confirm-change-requester-btn"]');
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
  }
}

// Helper: Ensure a specific requester index is selected
async function selectRequesterByIndex(page: any, index: number) {
  await page.goto("/");
  const selectorTitle = page.locator("text=Select Development Requester");
  if (await selectorTitle.isVisible()) {
    await page.selectOption("#requesterSelect", { index });
    await page.click('[data-testid="continue-requester-btn"]');
  } else {
    await clickChangeRequester(page);
    await page.waitForSelector("#requesterSelect");
    await page.selectOption("#requesterSelect", { index });
    await page.click('[data-testid="continue-requester-btn"]');
  }
}

test.describe("Lab 2 Requester Ticketing End-to-End Suite", () => {
  test.beforeAll(() => {
    ensureScreenshotsDir();
  });

  // -------------------------------------------------------------------------
  // E2E-01: Full Requester Ticket Lifecycle
  // -------------------------------------------------------------------------
  test("E2E-01: Complete Requester Ticket Lifecycle (Create with Attachment -> List -> Detail -> Soft-Remove)", async ({
    page,
  }) => {
    // 1. Visit root and select Jennifer Anderson (index 1)
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator("text=Select Development Requester")).toBeVisible();
    await page.selectOption("#requesterSelect", { index: 1 });
    await page.click('[data-testid="continue-requester-btn"]');

    // Verify My Support Tickets loaded with Jennifer
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
    await expect(page.locator(".zen-header").locator("text=Jennifer Anderson")).toBeVisible();

    // 2. Navigate to Create Ticket
    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    await expect(page.locator("text=Create IT Support Ticket")).toBeVisible();

    // Fill form fields
    await page.selectOption("#ticketCategory", { index: 1 });
    await page.selectOption("#ticketSystem", { index: 1 });
    await page.selectOption("#ticketPriority", "HIGH");

    const uniqueSummary = `E2E Laptop Battery Failure ${Date.now()}`;
    await page.fill("#ticketSummary", uniqueSummary);
    await page.fill(
      "#ticketDescription",
      "Laptop battery drains rapidly within 20 minutes under normal load. Please inspect and replace battery."
    );

    // Attach file during ticket creation
    const initialFilePath = path.join(process.cwd(), "temp-initial-spec.pdf");
    fs.writeFileSync(initialFilePath, "%PDF-1.4 initial hardware diagnostic log");
    await page.setInputFiles("#ticketAttachments", initialFilePath);
    await expect(page.locator("text=temp-initial-spec.pdf")).toBeVisible();

    // Submit ticket
    await page.click('[data-testid="submit-ticket-button"]');

    // Verify success view with created ticket number
    await expect(page.locator("text=Ticket Created Successfully!")).toBeVisible();
    await expect(page.locator('[data-testid="created-ticket-number"]')).toBeVisible();

    // Clean up temporary local file AFTER submission has completed
    if (fs.existsSync(initialFilePath)) {
      fs.unlinkSync(initialFilePath);
    }

    // 3. Click "View in My Tickets" button
    await page.click('button:has-text("View in My Tickets")');

    // Verify presence of new ticket in My Tickets table
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
    const targetRow = page.locator("tr", { hasText: uniqueSummary });
    await expect(targetRow).toBeVisible();

    // 4. Click "View" button to open Ticket Detail
    await targetRow.locator('button.zen-btn-view:has-text("View")').click();

    // 5. Verify Ticket Detail View
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-summary"]')).toHaveText(uniqueSummary);
    await expect(page.locator('[data-testid="badge-priority-high"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-meta-grid"]').locator("text=Jennifer Anderson")).toBeVisible();

    // 6. Verify that the initial attachment uploaded during creation appears in Active Attachments
    await expect(page.locator("text=temp-initial-spec.pdf")).toBeVisible();
    const initialAttachmentItem = page.locator('[data-testid^="attachment-item-"]', { hasText: "temp-initial-spec.pdf" });
    await expect(initialAttachmentItem).toBeVisible();

    // 7. Soft-Remove the initial Attachment
    await initialAttachmentItem.locator('button:has-text("Remove")').click();
    await expect(page.locator('[data-testid="removal-modal"]')).toBeVisible();

    // Enter non-empty removal reason
    await page.fill(
      '[data-testid="removal-reason-input"]',
      "Attached outdated diagnostic log by mistake, soft-removing for audit."
    );
    await page.click('[data-testid="modal-confirm-btn"]');

    // 8. Verify audit history shows soft-removed item with disabled download
    await expect(page.locator('[data-testid="removed-attachments-section"]')).toBeVisible();
    await expect(page.locator("text=Attached outdated diagnostic log by mistake")).toBeVisible();
    await expect(page.locator('[data-testid^="download-disabled-"]').first()).toBeVisible();

    // 9. Upload supplementary attachment in Ticket Detail view
    const tempFilePath = path.join(process.cwd(), "temp-supplementary-log.pdf");
    fs.writeFileSync(tempFilePath, "%PDF-1.4 supplementary log for e2e testing");

    await page.setInputFiles('[data-testid="file-input"]', tempFilePath);

    // Verify uploaded attachment in Active Attachments list
    const supplementaryItem = page.locator('[data-testid^="attachment-item-"]', { hasText: "temp-supplementary-log.pdf" });
    await expect(supplementaryItem).toBeVisible();

    // Clean up temporary local file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // 10. Test In-App Back Navigation
    await page.click('[data-testid="back-to-list-btn"]');
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-02: Multi-User Ownership Isolation & Unauthorized Access Protection
  // -------------------------------------------------------------------------
  test("E2E-02: Multi-User Ownership Isolation & Unauthorized Access Protection", async ({ page }) => {
    // 1. Select Jennifer (index 1) and create a private ticket
    await selectRequesterByIndex(page, 1);

    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    const jenniferSummary = `Jennifer Confidential Security Audit ${Date.now()}`;

    await page.selectOption("#ticketCategory", { index: 1 });
    await page.selectOption("#ticketSystem", { index: 1 });
    await page.selectOption("#ticketPriority", "URGENT");
    await page.fill("#ticketSummary", jenniferSummary);
    await page.fill("#ticketDescription", "Private HR data sync access request for confidential audit.");
    await page.click('[data-testid="submit-ticket-button"]');

    await expect(page.locator("text=Ticket Created Successfully!")).toBeVisible();
    await page.click('button:has-text("View in My Tickets")');

    // Verify Jennifer sees her ticket in My Tickets
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
    await expect(page.locator(`text=${jenniferSummary}`)).toBeVisible();

    // 2. Switch requester to David Lee (index 2) via confirmation modal
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 2 });
    await page.click('[data-testid="continue-requester-btn"]');

    // 3. Verify David's ticket list DOES NOT contain Jennifer's ticket
    await expect(page.locator(".zen-header").locator("text=David Lee")).toBeVisible();
    await expect(page.locator(`text=${jenniferSummary}`)).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-03: Responsive Layouts across Desktop, Tablet & Mobile with Zero Overflow
  // -------------------------------------------------------------------------
  test("E2E-03: Responsive Viewport Verification (Desktop, Tablet, Mobile) & Deliverable Screenshots", async ({
    page,
  }) => {
    // =========================================================================
    // 1. Desktop Viewport (1280x800 - >= 992px)
    // =========================================================================
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Clear localStorage to capture initial Requester Selector
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("text=Select Development Requester");
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "01-requester-selector.png") });

    // Select Jennifer (index 1)
    await page.selectOption("#requesterSelect", { index: 1 });
    await page.click('[data-testid="continue-requester-btn"]');

    // Desktop: My Tickets Table (Requester A)
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "03-my-tickets-desktop.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "01-my-tickets-requester-a.png") });

    // Desktop: Search and Filter Applied
    await page.selectOption(".zen-filter-select", { index: 1 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "03-my-tickets-filter-search.png") });
    await page.click('[data-testid="clear-filters-btn"]');

    // Desktop: Filter No-results State
    await page.fill(".zen-search-input", "NONEXISTENT_QUERY_XYZ_9999");
    await page.waitForTimeout(400); // debounce
    await page.waitForSelector('[data-testid="no-results-state"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "05-my-tickets-no-results.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "05-my-tickets-no-results.png") });
    await page.click('[data-testid="clear-filters-btn"]');

    // Switch to David (index 2) to capture Requester B tickets view
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 2 });
    await page.click('[data-testid="continue-requester-btn"]');
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "02-my-tickets-requester-b.png") });

    // Switch to Maria (index 3) to capture Empty State
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 3 });
    await page.click('[data-testid="continue-requester-btn"]');
    await page.waitForSelector('[data-testid="empty-state"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "04-my-tickets-empty.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "04-my-tickets-empty-state.png") });

    // Switch back to Jennifer (index 1) for Create Ticket flow
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 1 });
    await page.click('[data-testid="continue-requester-btn"]');

    // Desktop: Create Ticket Form (Initial State)
    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    await page.waitForSelector("#ticketCategory");
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "02-create-ticket-desktop.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "01-create-ticket-desktop.png") });

    // Desktop: Create Ticket Validation Error State
    await page.click('[data-testid="submit-ticket-button"]');
    await page.waitForSelector(".zen-invalid-feedback");
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "02-create-ticket-validation-errors.png") });

    // Desktop: Create Ticket Invalid Attachment (rejected format)
    const invalidFile = path.join(process.cwd(), "unsupported-script.exe");
    fs.writeFileSync(invalidFile, "fake binary data");
    await page.setInputFiles("#ticketAttachments", invalidFile);
    await page.waitForSelector(".zen-invalid-feedback");
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "05-create-ticket-invalid-attachment.png") });
    if (fs.existsSync(invalidFile)) fs.unlinkSync(invalidFile);

    // Desktop: Create Ticket API Failure & Preserved Form State
    await page.selectOption("#ticketCategory", { index: 1 });
    await page.selectOption("#ticketSystem", { index: 1 });
    await page.selectOption("#ticketPriority", "HIGH");
    await page.fill("#ticketSummary", "Preserved summary test across API failure");
    await page.fill("#ticketDescription", "Preserved description test across API failure scenario.");

    // Intercept with 500 error to capture preserved state
    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error: Database cluster temporarily unavailable" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.click('[data-testid="submit-ticket-button"]');
    await page.waitForSelector("text=Database cluster temporarily unavailable");
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "06-create-ticket-api-failure-preserved.png") });
    await page.unroute("**/api/tickets");

    // Desktop: Create Ticket Submitting Busy State
    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 1200));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const createRespPromise = page.waitForResponse((resp) => resp.url().includes("/api/tickets") && resp.request().method() === "POST");
    await page.click('[data-testid="submit-ticket-button"]');
    await page.waitForSelector("text=Submitting Ticket...");
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "03-create-ticket-submitting-busy.png") });
    await createRespPromise;
    await page.unroute("**/api/tickets");

    // Desktop: Create Ticket Success Screen with Ticket Number
    await page.waitForSelector("text=Ticket Created Successfully!");
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "create-ticket", "04-create-ticket-success.png") });

    // Click "View in My Tickets"
    await page.click('button:has-text("View in My Tickets")');
    await page.waitForSelector('[data-testid="tickets-table-card"]');

    // Desktop: Open Ticket Detail View
    const firstViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
    await firstViewBtn.click();
    await page.waitForSelector('[data-testid="ticket-detail-view"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "06-ticket-detail-desktop.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "01-ticket-detail-view.png") });

    // Detail: Upload Attachment and Download view
    let removeBtn = page.locator('[data-testid^="remove-btn-"]').first();
    if (!(await removeBtn.isVisible())) {
      const tempDoc = path.join(process.cwd(), "network-diagnostics.pdf");
      fs.writeFileSync(tempDoc, "%PDF-1.4 network diagnostics capture");
      await page.setInputFiles('[data-testid="file-input"]', tempDoc);
      await page.waitForSelector('[data-testid^="attachment-item-"]');
      if (fs.existsSync(tempDoc)) fs.unlinkSync(tempDoc);
    }
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "02-attachment-add-and-download.png") });

    // Detail: Soft-Removal Modal
    removeBtn = page.locator('[data-testid^="remove-btn-"]').first();
    await removeBtn.click();
    await page.waitForSelector('[data-testid="removal-modal"]');
    await page.screenshot({ path: path.join(screenshotsDir, "07-attachment-soft-remove-modal.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "03-attachment-soft-removal.png") });

    // Detail: Confirm Soft-Removal & View Audit Record
    await page.fill('[data-testid="removal-reason-input"]', "File superseded by latest revision.");
    await page.click('[data-testid="modal-confirm-btn"]');
    await page.waitForSelector('[data-testid="removed-attachments-section"]');
    await page.screenshot({ path: path.join(screenshotsDir, "08-ticket-detail-soft-removed.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "04-attachment-removed-metadata.png") });

    // Detail: Unauthorized Access Rejection Error Screen
    await page.route("**/api/tickets/*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ error: "Access Denied: You do not have permission to access tickets owned by another requester." }),
        });
      } else {
        await route.continue();
      }
    });
    await page.reload();
    await page.waitForSelector('[data-testid="detail-error"]');
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "05-unauthorized-access-rejected.png") });
    await page.unroute("**/api/tickets/*");

    // =========================================================================
    // 2. Tablet Viewport (820x1180 - iPad Air / 768-991px)
    // =========================================================================
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/#/my-tickets");
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "03-my-tickets-tablet.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "07-my-tickets-tablet.png") });

    // Tablet: Create Ticket
    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    await page.waitForSelector("#ticketCategory");
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "02-create-ticket-tablet.png") });

    // Tablet: Ticket Detail View
    await page.click('button.zen-nav-link:has-text("My Tickets")');
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    const tabletViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
    if (await tabletViewBtn.isVisible()) {
      await tabletViewBtn.click();
      await page.waitForSelector('[data-testid="ticket-detail-view"]');
      await assertNoHorizontalOverflow(page);
      await page.screenshot({ path: path.join(screenshotsDir, "06-ticket-detail-tablet.png") });
      await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "06-ticket-detail-tablet.png") });
    }

    // =========================================================================
    // 3. Mobile Viewport (375x667 - iPhone SE / < 768px)
    // =========================================================================
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile: Ticket Detail View
    await page.waitForSelector('[data-testid="ticket-detail-view"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "06-ticket-detail-mobile.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "ticket-detail", "07-ticket-detail-mobile.png") });

    // Mobile: Back to My Tickets & Mobile Cards View
    await page.click('[data-testid="back-to-list-btn"]');
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "03-my-tickets-mobile.png") });
    await page.screenshot({ path: path.join(screenshotsDir, "my-tickets", "06-my-tickets-mobile-cards.png") });

    // Mobile: Filter Popup Modal
    await page.click('[data-testid="mobile-filter-trigger-btn"]');
    await page.waitForSelector('[data-testid="mobile-filter-modal"]');
    await assertNoHorizontalOverflow(page);
    await page.click('button:has-text("Apply Filters")');

    // Mobile: Sidebar Drawer & Create Ticket View
    await page.click('[data-testid="hamburger-menu-btn"]');
    await page.waitForSelector('[data-testid="mobile-drawer"]');
    await page.click('button.zen-drawer-nav-item:has-text("Create New Ticket")');

    // Mobile: Create Ticket View
    await page.waitForSelector("#ticketCategory");
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(screenshotsDir, "02-create-ticket-mobile.png") });
  });
});

