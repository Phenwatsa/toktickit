import { Page, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

export const SCREENSHOTS_BASE_DIR = path.join(process.cwd(), "artifacts", "lab-04", "screenshots");
const DEFAULT_PASSWORD_HASH = "$2a$10$YFM5cCrfTzXKdMJqMYdKwef2eP16HYUPht8JPByEaTqNmUTrNms4C";

export type ScreenshotCategory =
  | "staff-dashboard"
  | "requester-dashboard"
  | "admin-dashboard"
  | "actions-taken";

export function ensureScreenshotsDir(): void {
  const dirs = [
    SCREENSHOTS_BASE_DIR,
    path.join(SCREENSHOTS_BASE_DIR, "staff-dashboard"),
    path.join(SCREENSHOTS_BASE_DIR, "requester-dashboard"),
    path.join(SCREENSHOTS_BASE_DIR, "admin-dashboard"),
    path.join(SCREENSHOTS_BASE_DIR, "actions-taken"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Capture high-resolution screenshot into artifacts/lab-04/screenshots/ directory
 */
export async function captureScreenshot(
  page: Page,
  category: ScreenshotCategory,
  filename: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  ensureScreenshotsDir();
  const filePath = path.join(
    SCREENSHOTS_BASE_DIR,
    category,
    filename.endsWith(".png") ? filename : `${filename}.png`
  );
  await page.waitForTimeout(400);

  // Check if modal or dialog is present
  const hasModal =
    (await page
      .locator('.modal, [role="dialog"], [data-testid$="modal"], .modal-backdrop-custom')
      .count()) > 0;

  // Always scroll to top before taking screenshots so sticky elements do not float mid-page
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);

  // Determine whether to use fullPage:
  // Responsive views (tablet / mobile or viewport width <= 768) should NOT be fullPage unless requested
  // Modals should NOT be fullPage
  const viewport = page.viewportSize();
  const isResponsiveDevice =
    (viewport && viewport.width <= 768) ||
    filename.includes("tablet") ||
    filename.includes("mobile");

  const isFullPage = options?.fullPage ?? (!hasModal && !isResponsiveDevice);

  // If fullPage is true, temporarily disable position: sticky on header so it renders cleanly at top
  if (isFullPage) {
    await page.evaluate(() => {
      const header = document.querySelector(".zen-header") as HTMLElement;
      if (header) {
        header.style.position = "static";
      }
    });
  }

  await page.screenshot({ path: filePath, fullPage: isFullPage });

  // Restore position on header
  if (isFullPage) {
    await page.evaluate(() => {
      const header = document.querySelector(".zen-header") as HTMLElement;
      if (header) {
        header.style.position = "";
      }
    });
  }
}

/**
 * Assert that the document has zero horizontal overflow across any viewport
 * (scrollWidth === clientWidth and scrollX === 0)
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflowState = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const scrollX = window.scrollX;
    return {
      isOverflowing: scrollWidth > clientWidth,
      scrollWidth,
      clientWidth,
      scrollX,
    };
  });

  expect(
    overflowState.isOverflowing,
    `Horizontal overflow detected: scrollWidth (${overflowState.scrollWidth}px) > clientWidth (${overflowState.clientWidth}px)`
  ).toBe(false);
  expect(overflowState.scrollX).toBe(0);
}

/**
 * Helper to log in as a given user
 */
export async function loginAs(page: Page, email: string, password = "Password123!"): Promise<void> {
  await page.goto("/#/login");
  await page.waitForSelector('[data-testid="login-container"]', { timeout: 15000 });

  await page.fill("#email-input", email);
  await page.fill("#password-input", password);
  await page.click('[data-testid="login-submit-btn"]');

  // Wait for login redirection away from /login
  await page.waitForURL((url) => !url.hash.includes("/login"), { timeout: 15000 });
}

/**
 * Helper to log out from any device (Desktop or Mobile drawer)
 */
export async function logoutUser(page: Page): Promise<void> {
  const desktopLogout = page.locator('[data-testid="header-logout-btn"]');
  if (await desktopLogout.isVisible()) {
    await desktopLogout.click();
  } else {
    const hamburger = page.locator('[data-testid="hamburger-menu-btn"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForSelector('[data-testid="drawer-logout-btn"]', { timeout: 5000 });
      await page.click('[data-testid="drawer-logout-btn"]');
    }
  }

  await expect(page.locator('[data-testid="login-container"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to reset a user's password and mustChangePassword status in Prisma DB
 */
export async function resetTestUserInDb(
  email: string,
  plainPassword = "Password123!",
  mustChangePassword = false,
  isActive = true
): Promise<void> {
  try {
    const { PrismaClient } = await import(
      path.join(process.cwd(), "server", "node_modules", "@prisma", "client", "index.js")
    );
    const prisma = new PrismaClient();
    let passwordHash = DEFAULT_PASSWORD_HASH;
    if (plainPassword !== "Password123!") {
      const bcrypt = await import(
        path.join(process.cwd(), "server", "node_modules", "bcryptjs", "index.js")
      );
      passwordHash = await (bcrypt.default || bcrypt).hash(plainPassword, 10);
    }
    await prisma.user.updateMany({
      where: { email },
      data: {
        passwordHash,
        mustChangePassword,
        isActive,
      },
    });
    await prisma.$disconnect();
  } catch (err) {
    console.error(`Failed to reset test user ${email} in DB:`, err);
  }
}

/**
 * Helper to get a PrismaClient instance for test state inspection
 */
export async function getPrismaClient() {
  const { PrismaClient } = await import(
    path.join(process.cwd(), "server", "node_modules", "@prisma", "client", "index.js")
  );
  return new PrismaClient();
}
