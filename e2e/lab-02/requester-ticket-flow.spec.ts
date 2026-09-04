import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 10: End-to-End Testing & Responsive Polish
// ---------------------------------------------------------------------------

const screenshotsDir = path.join(process.cwd(), "artifacts", "lab-02", "screenshots");

function ensureScreenshotsDir() {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
}

async function clickChangeRequester(page: any) {
  await page.click('[data-testid="change-requester-btn"]');
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
  test("E2E-01: Complete Requester Ticket Lifecycle (Create -> List -> Detail -> Soft-Remove)", async ({
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

    // Submit ticket
    await page.click('[data-testid="submit-ticket-button"]');

    // 3. Verify automatic redirection to My Tickets and presence of new ticket
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

    // 6. Upload attachment in Ticket Detail view
    const tempFilePath = path.join(process.cwd(), "temp-diagnostic-log.pdf");
    fs.writeFileSync(tempFilePath, "%PDF-1.4 dummy hardware diagnostic log for e2e testing");

    await page.setInputFiles('[data-testid="file-input"]', tempFilePath);

    // Verify uploaded attachment in Active Attachments list
    const attachmentItem = page.locator('[data-testid^="attachment-item-"]').first();
    await expect(attachmentItem).toBeVisible();
    await expect(attachmentItem.locator("text=temp-diagnostic-log.pdf")).toBeVisible();

    // Clean up temporary local file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // 7. Soft-Remove Attachment
    await attachmentItem.locator('button:has-text("Remove")').click();
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

    // 9. Test In-App / Browser Back Navigation
    await page.click('[data-testid="back-to-list-btn"]');
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-02: Multi-User Ownership & Tenant Isolation
  // -------------------------------------------------------------------------
  test("E2E-02: Multi-User Ownership Isolation between Jennifer and David", async ({ page }) => {
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
  // E2E-03: Responsive Layouts & Deliverable Screenshots
  // -------------------------------------------------------------------------
  test("E2E-03: Responsive Viewport Verification & Screenshot Capture", async ({ page }) => {
    // 1. Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Clear localStorage to capture initial Requester Selector
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("text=Select Development Requester");
    await page.screenshot({ path: path.join(screenshotsDir, "01-requester-selector.png") });

    // Select Jennifer (index 1)
    await page.selectOption("#requesterSelect", { index: 1 });
    await page.click('[data-testid="continue-requester-btn"]');

    // Desktop: My Tickets Table
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    await page.screenshot({ path: path.join(screenshotsDir, "03-my-tickets-desktop.png") });

    // Desktop: Filter No-results State
    await page.fill(".zen-search-input", "NONEXISTENT_QUERY_XYZ_9999");
    await page.waitForTimeout(400); // debounce
    await page.waitForSelector('[data-testid="no-results-state"]');
    await page.screenshot({ path: path.join(screenshotsDir, "05-my-tickets-no-results.png") });
    await page.click('[data-testid="clear-filters-btn"]');

    // Desktop: Create Ticket Form
    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    await page.waitForSelector("#ticketCategory");
    await page.screenshot({ path: path.join(screenshotsDir, "02-create-ticket-desktop.png") });

    // Desktop: Open Ticket Detail View
    await page.click('button.zen-nav-link:has-text("My Tickets")');
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    const firstViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
    if (await firstViewBtn.isVisible()) {
      await firstViewBtn.click();
      await page.waitForSelector('[data-testid="ticket-detail-view"]');
      await page.screenshot({ path: path.join(screenshotsDir, "06-ticket-detail-desktop.png") });

      // Check if active attachment exists or upload one
      let removeBtn = page.locator('[data-testid^="remove-btn-"]').first();
      if (!(await removeBtn.isVisible())) {
        const tempFile = path.join(process.cwd(), "temp-spec.pdf");
        fs.writeFileSync(tempFile, "%PDF-1.4 demo spec");
        await page.setInputFiles('[data-testid="file-input"]', tempFile);
        await page.waitForSelector('[data-testid^="attachment-item-"]');
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }

      removeBtn = page.locator('[data-testid^="remove-btn-"]').first();
      await page.waitForSelector('[data-testid^="remove-btn-"]');
      await removeBtn.click();
      await page.waitForSelector('[data-testid="removal-modal"]');
      await page.screenshot({ path: path.join(screenshotsDir, "07-attachment-soft-remove-modal.png") });

      // Complete removal for 08 screenshot
      await page.fill('[data-testid="removal-reason-input"]', "File superseded by latest revision.");
      await page.click('[data-testid="modal-confirm-btn"]');
      await page.waitForSelector('[data-testid="removed-attachments-section"]');
      await page.screenshot({ path: path.join(screenshotsDir, "08-ticket-detail-soft-removed.png") });

      await page.click('[data-testid="back-to-list-btn"]');
    }

    // Capture Empty State with Maria Garcia (index 3)
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 3 });
    await page.click('[data-testid="continue-requester-btn"]');
    await page.waitForSelector('[data-testid="empty-state"]');
    await page.screenshot({ path: path.join(screenshotsDir, "04-my-tickets-empty.png") });

    // 2. Mobile Viewport (375x667 - iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile: My Tickets (Empty State)
    await page.screenshot({ path: path.join(screenshotsDir, "03-my-tickets-mobile.png") });

    // Mobile: Create Ticket
    await page.click('button.zen-nav-link:has-text("Create Ticket")');
    await page.waitForSelector("#ticketCategory");
    await page.screenshot({ path: path.join(screenshotsDir, "02-create-ticket-mobile.png") });

    // Switch back to Jennifer (index 1) for mobile detail
    await clickChangeRequester(page);
    await page.selectOption("#requesterSelect", { index: 1 });
    await page.click('[data-testid="continue-requester-btn"]');

    // Mobile: Ticket Detail View
    await page.click('button.zen-nav-link:has-text("My Tickets")');
    await page.waitForSelector('[data-testid="tickets-table-card"]');
    const mobileViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
    if (await mobileViewBtn.isVisible()) {
      await mobileViewBtn.click();
      await page.waitForSelector('[data-testid="ticket-detail-view"]');
      await page.screenshot({ path: path.join(screenshotsDir, "06-ticket-detail-mobile.png") });
    }
  });
});
