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
// Lab 4 — Issue 26: Actions Taken Complete Flow E2E Suite
// Covers:
// - E2E-01: IT Staff & Admin adding/editing Actions Taken, validation trigger,
//   auto-attribution, attachment notes, and Requester read-only verification
// ---------------------------------------------------------------------------

test.describe("Lab 4 E2E-01: Actions Taken Flow & Role Permissions", () => {
  let targetTicketId: number;

  test.beforeAll(async () => {
    ensureScreenshotsDir();
    const prisma = await getPrismaClient();

    // Find the seed ticket TKT-2026-000102 (owned by Alice Smith, requester David Lee)
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000102" },
    });

    if (ticket) {
      targetTicketId = ticket.id;
    } else {
      // Fallback: fetch any active ticket
      const anyTicket = await prisma.ticket.findFirst({
        where: { currentStatus: { notIn: ["CANCELLED", "CLOSED"] } },
      });
      if (!anyTicket) throw new Error("No available tickets found in test database");
      targetTicketId = anyTicket.id;
    }

    await prisma.$disconnect();
  });

  test("E2E-01 Part 1: IT Staff creates Action Taken with validation and auto-attribution", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as IT Staff (Alice Smith)
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/dashboard/);

    // 2. Navigate to Ticket Detail
    await page.goto(`/#/ticket/${targetTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });
    await assertNoHorizontalOverflow(page);

    // Capture initial staff ticket detail with Actions Taken section
    await captureScreenshot(page, "actions-taken", "01-actions-taken-list-staff.png");

    // 3. Open "Add Action Taken" Modal
    const addActionBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="action-modal-title"]')).toHaveText("Add Action Taken");

    // Capture open modal screenshot
    await captureScreenshot(page, "actions-taken", "02-actions-taken-modal-create.png");

    // 4. Verify Performed By auto-attribution (Read-Only)
    const performedByInput = page.locator('[data-testid="action-performed-by-input"]');
    await expect(performedByInput).toHaveAttribute("readonly", "");
    const performedByVal = await performedByInput.inputValue();
    expect(performedByVal).toContain("Alice Smith");

    // 5. Test Conditional Validation: Follow-up checked without valid note (< 3 chars)
    await page.fill(
      '[data-testid="action-description-input"]',
      "Hardware thermal benchmark and GPU stress test"
    );
    await page.fill('[data-testid="action-result-input"]', "Throttling detected at 88C");

    // Check Follow-Up checkbox
    const followUpCheckbox = page.locator('[data-testid="action-followup-checkbox"]');
    await followUpCheckbox.check();
    await expect(followUpCheckbox).toBeChecked();

    // Attempt submission with empty follow-up note
    await page.click('[data-testid="modal-submit-btn"]');

    // Error banner must appear
    const followUpError = page.locator('[data-testid="error-followup-note"]');
    await expect(followUpError).toBeVisible();
    await expect(followUpError).toContainText("Follow-up note is required (minimum 3 non-whitespace characters)");

    // Capture validation error screenshot
    await captureScreenshot(page, "actions-taken", "03-actions-taken-validation-error.png");

    // 6. Complete form with valid Follow-up note and attachment notes
    const validFollowUpNote = "Inspect copper heat-pipe assembly and replace thermal pads";
    await page.fill('[data-testid="action-followup-note-input"]', validFollowUpNote);
    await page.fill(
      '[data-testid="action-attachment-notes-input"]',
      "thermal-profile-run1.csv, heatsink-photo.png"
    );

    // Submit valid action taken
    await page.click('[data-testid="modal-submit-btn"]');
    await expect(modal).toBeHidden({ timeout: 10000 });

    // 7. Verify new action appears in the Actions Taken table
    await expect(
      page.locator('[data-testid="actions-taken-section"]').getByText("Hardware thermal benchmark and GPU stress test").first()
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="actions-taken-section"]').getByText(validFollowUpNote).first()
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="actions-taken-section"]').getByText("thermal-profile-run1.csv").first()
    ).toBeVisible();

    await logoutUser(page);
  });

  test("E2E-01 Part 2: IT Staff edits existing Action Taken", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as IT Staff (Alice Smith)
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${targetTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    // 2. Locate and click Edit button on the first action row
    const editBtn = page.locator('[data-testid="edit-action-btn"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="action-modal-title"]')).toHaveText("Edit Action Taken");

    // Capture Edit modal screenshot
    await captureScreenshot(page, "actions-taken", "04-actions-taken-edit-modal.png");

    // 3. Modify Result field
    const updatedResultText = `Thermal pads replaced successfully and verified under 100% stress test. [Audit ${Date.now()}]`;
    await page.fill('[data-testid="action-result-input"]', updatedResultText);

    // Save changes
    await page.click('[data-testid="modal-submit-btn"]');
    await expect(modal).toBeHidden({ timeout: 10000 });

    // Verify updated content in list
    await expect(
      page.locator('[data-testid="actions-taken-section"]').getByText(updatedResultText).first()
    ).toBeVisible();

    await logoutUser(page);
  });

  test("E2E-01 Part 3: Administrator has full authority to add and edit Actions Taken", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as System Administrator
    await loginAs(page, "admin@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${targetTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    // 2. Verify Add button is accessible to Administrator
    const addActionBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();

    // Verify Admin auto-attribution
    const performedByInput = page.locator('[data-testid="action-performed-by-input"]');
    const performedByVal = await performedByInput.inputValue();
    expect(performedByVal).toContain("System Administrator");

    // Add action as Administrator
    const adminActionDesc = `Admin supervisory diagnostic check performed at ${Date.now()}`;
    await page.fill('[data-testid="action-description-input"]', adminActionDesc);
    await page.fill(
      '[data-testid="action-result-input"]',
      "System logs reviewed; confirmed hardware repair meets SLA standards."
    );
    await page.click('[data-testid="modal-submit-btn"]');
    await expect(modal).toBeHidden({ timeout: 10000 });

    // Verify Admin action appears in the table
    await expect(
      page.locator('[data-testid="actions-taken-section"]').getByText(adminActionDesc).first()
    ).toBeVisible();

    await logoutUser(page);
  });

  test("E2E-01 Part 4: Requester views Actions Taken in read-only mode with zero edit controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as Requester owner of the ticket (David Lee)
    await loginAs(page, "david.l@toktickit.local", "Password123!");
    await expect(page).toHaveURL(/#\/dashboard/);

    // 2. Navigate to Ticket Detail
    await page.goto(`/#/ticket/${targetTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });
    await assertNoHorizontalOverflow(page);

    // 3. Verify Actions Taken section renders for requester
    const actionsSection = page.locator('[data-testid="actions-taken-section"]');
    await expect(actionsSection).toBeVisible();

    // 4. Assert Add Action button is NOT rendered
    const addBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(addBtn).toHaveCount(0);

    // 5. Assert Edit buttons are NOT rendered anywhere in the table
    const editBtns = page.locator('[data-testid="edit-action-btn"]');
    await expect(editBtns).toHaveCount(0);

    // 6. Capture Requester Read-Only screenshot
    await captureScreenshot(page, "actions-taken", "05-actions-taken-requester-readonly.png");

    await logoutUser(page);
  });
});
