import { test, expect } from "@playwright/test";
import {
  ensureScreenshotsDir,
  loginAs,
  logoutUser,
  getPrismaClient,
} from "./helpers/test-utils.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 26: Accessibility & Modal Focus Trapping E2E Suite
// Covers:
// - A11Y-01: Modal focus trapping (ActionTakenModal), focus restoration,
//   keyboard cycling, Escape key dismissal, and ARIA feedback
// ---------------------------------------------------------------------------

test.describe("Lab 4 A11Y-01: Accessibility & Modal Focus Management", () => {
  let sampleTicketId: number;

  test.beforeAll(async () => {
    ensureScreenshotsDir();
    const prisma = await getPrismaClient();
    const ticket = await prisma.ticket.findFirst({
      where: { currentStatus: { notIn: ["CANCELLED"] } },
    });
    if (!ticket) throw new Error("No ticket found in database");
    sampleTicketId = ticket.id;
    await prisma.$disconnect();
  });

  test("A11Y-01 Part 1: ActionTakenModal traps focus within modal and wraps cycling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Login as IT Staff
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${sampleTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    // 2. Open Add Action Modal
    const addBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();

    // 3. Verify modal dialog semantic ARIA attributes
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "action-modal-title");

    // 4. Verify initial focus landed inside modal on first interactive input
    await page.waitForTimeout(100);
    const initialFocusedEl = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        id: active?.id,
        tagName: active?.tagName,
        testId: active?.getAttribute("data-testid"),
      };
    });
    expect(initialFocusedEl.testId).toBe("action-datetime-input");

    // 5. Test Focus Trapping: Tab through all focusable elements inside the modal
    // Tab multiple times to reach the last element (modal-submit-btn)
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(50);
      // Ensure current focused element remains INSIDE the modal
      const isInsideModal = await page.evaluate(() => {
        const modalEl = document.querySelector('[data-testid="action-taken-modal"]');
        return modalEl ? modalEl.contains(document.activeElement) : false;
      });
      expect(isInsideModal).toBe(true);
    }

    // 6. Test Wrap-around on Shift+Tab from first element
    // Focus the first element explicitly
    await page.focus('[data-testid="modal-close-icon-btn"]');
    await page.keyboard.press("Shift+Tab");
    // Focus should wrap to the last focusable element (modal-submit-btn)
    const wrappedFocusTestId = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-testid");
    });
    expect(wrappedFocusTestId).toBe("modal-submit-btn");

    // 7. Close modal before logging out
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    await logoutUser(page);
  });

  test("A11Y-01 Part 2: Focus restoration back to triggering button upon modal close", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${sampleTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    const addBtn = page.locator('[data-testid="add-action-btn"]');
    const modal = page.locator('[data-testid="action-taken-modal"]');

    // 1. Open via Add button and close with Cancel button
    await addBtn.click();
    await expect(modal).toBeVisible();
    await page.click('[data-testid="modal-cancel-btn"]');
    await expect(modal).toBeHidden();

    // Verify focus returned to addBtn
    await page.waitForTimeout(100);
    const activeTestId1 = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    expect(activeTestId1).toBe("add-action-btn");

    // 2. Open via Add button and close with Escape key
    await addBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    // Verify focus restored to addBtn
    await page.waitForTimeout(100);
    const activeTestId2 = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    expect(activeTestId2).toBe("add-action-btn");

    // 3. Open via Edit button and close with Escape key
    const editBtn = page.locator('[data-testid="edit-action-btn"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(modal).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(modal).toBeHidden();

      await page.waitForTimeout(100);
      const activeTestId3 = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
      expect(activeTestId3).toBe("edit-action-btn");
    }

    await logoutUser(page);
  });

  test("A11Y-01 Part 3: ARIA feedback, live regions and keyboard form interaction", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "alice.staff@toktickit.local", "Password123!");
    await page.goto(`/#/ticket/${sampleTicketId}`);
    await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 15000 });

    // Open modal
    await page.click('[data-testid="add-action-btn"]');
    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();

    // Keyboard toggle Follow-up checkbox
    await page.focus('[data-testid="action-followup-checkbox"]');
    await page.keyboard.press("Space");
    const isChecked = await page.isChecked('[data-testid="action-followup-checkbox"]');
    expect(isChecked).toBe(true);

    // Verify ARIA expanded attribute on checkbox
    await expect(page.locator('[data-testid="action-followup-checkbox"]')).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    // Trigger validation error
    await page.fill('[data-testid="action-description-input"]', "Diagnostic test memory analysis");
    await page.fill('[data-testid="action-result-input"]', "Memory test passed");
    await page.click('[data-testid="modal-submit-btn"]');

    // Assert ARIA live region and role=alert on follow-up error banner
    const errorBanner = page.locator('[data-testid="error-followup-note"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toHaveAttribute("role", "alert");
    await expect(errorBanner).toHaveAttribute("aria-live", "polite");

    // Close modal with Escape
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    await logoutUser(page);
  });
});
