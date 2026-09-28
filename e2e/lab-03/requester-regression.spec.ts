import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import {
  ensureScreenshotsDir,
  assertNoHorizontalOverflow,
  loginAs,
  logoutUser,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 18: Requester Regression E2E Suite
// Covers:
// - E2E-07: Verify Lab 2 Requester flows (create ticket, my tickets, view attachments,
//   soft-delete, supplementary uploads) function flawlessly under authenticated sessions
// ---------------------------------------------------------------------------

test.describe("Lab 3 Requester Regression E2E Suite", () => {
  test.beforeAll(() => {
    ensureScreenshotsDir();
  });

  test("E2E-07: Requester Ticket Lifecycle (Create -> List -> Detail -> Soft-Remove Attachment)", async ({
    page,
  }) => {
    // 1. Login as Requester (Jennifer Anderson)
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "jennifer.a@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/my-tickets/);
    await expect(page.locator("text=My Support Tickets")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 2. Navigate to Create Ticket
    await page.click('[data-testid="nav-create-ticket"]');
    await expect(page.locator("text=Create IT Support Ticket")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 3. Fill Form Fields
    await page.selectOption("#ticketCategory", { index: 1 });
    await page.selectOption("#ticketSystem", { index: 1 });
    await page.selectOption("#ticketPriority", "HIGH");

    const uniqueSummary = `Auth E2E Regression Ticket ${Date.now()}`;
    await page.fill("#ticketSummary", uniqueSummary);
    await page.fill(
      "#ticketDescription",
      "Regression verification under authenticated session. System diagnostic reports attached."
    );

    // Create and attach temporary initial file
    const tempInitialDoc = path.join(process.cwd(), "temp-auth-initial.pdf");
    fs.writeFileSync(tempInitialDoc, "%PDF-1.4 Initial Auth Regression Test File");
    await page.setInputFiles("#ticketAttachments", tempInitialDoc);
    await expect(page.locator("text=temp-auth-initial.pdf")).toBeVisible();

    // Submit ticket
    await page.click('[data-testid="submit-ticket-button"]');

    // 4. Verify Creation Success
    await expect(page.locator("text=Ticket Created Successfully!")).toBeVisible();
    await expect(page.locator('[data-testid="created-ticket-number"]')).toBeVisible();

    if (fs.existsSync(tempInitialDoc)) {
      fs.unlinkSync(tempInitialDoc);
    }

    // 5. Navigate to My Tickets
    await page.click('button:has-text("View in My Tickets")');
    await expect(page.locator("text=My Support Tickets")).toBeVisible();

    // Verify presence of ticket row
    const targetRow = page.locator("tr", { hasText: uniqueSummary });
    await expect(targetRow).toBeVisible();

    // 6. Open Ticket Detail View
    await targetRow.locator('button.zen-btn-view:has-text("View")').click();
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-summary"]')).toHaveText(uniqueSummary);
    await expect(page.locator('[data-testid="badge-priority-high"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 7. Verify Initial Attachment & Perform Soft-Removal
    await expect(page.locator("text=temp-auth-initial.pdf")).toBeVisible();
    const initialAttachmentItem = page.locator('[data-testid^="attachment-item-"]', {
      hasText: "temp-auth-initial.pdf",
    });
    await expect(initialAttachmentItem).toBeVisible();

    await initialAttachmentItem.locator('button:has-text("Remove")').click();
    await expect(page.locator('[data-testid="removal-modal"]')).toBeVisible();

    await page.fill(
      '[data-testid="removal-reason-input"]',
      "Superseded by updated authenticated diagnostics file."
    );
    await page.click('[data-testid="modal-confirm-btn"]');

    // 8. Verify Soft-Removed Audit Section
    await expect(page.locator('[data-testid="removed-attachments-section"]')).toBeVisible();
    await expect(page.locator("text=Superseded by updated authenticated diagnostics file")).toBeVisible();
    await expect(page.locator('[data-testid^="download-disabled-"]').first()).toBeVisible();

    // 9. Upload Supplementary Attachment
    const tempSupplementaryDoc = path.join(process.cwd(), "temp-auth-supplementary.pdf");
    fs.writeFileSync(tempSupplementaryDoc, "%PDF-1.4 Supplementary Auth Log");
    await page.setInputFiles('[data-testid="file-input"]', tempSupplementaryDoc);

    const supplementaryItem = page.locator('[data-testid^="attachment-item-"]', {
      hasText: "temp-auth-supplementary.pdf",
    });
    await expect(supplementaryItem).toBeVisible();

    if (fs.existsSync(tempSupplementaryDoc)) {
      fs.unlinkSync(tempSupplementaryDoc);
    }

    // 10. In-App Back Navigation
    await page.click('[data-testid="back-to-list-btn"]');
    await expect(page.locator("text=My Support Tickets")).toBeVisible();

    // Logout
    await logoutUser(page);
  });
});
