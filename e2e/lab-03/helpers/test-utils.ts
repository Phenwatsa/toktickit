import { Page, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

export const SCREENSHOTS_BASE_DIR = path.join(process.cwd(), "artifacts", "lab-03", "screenshots");
const DEFAULT_PASSWORD_HASH = "$2a$10$YFM5cCrfTzXKdMJqMYdKwef2eP16HYUPht8JPByEaTqNmUTrNms4C";

export function ensureScreenshotsDir(): void {
  const dirs = [
    SCREENSHOTS_BASE_DIR,
    path.join(SCREENSHOTS_BASE_DIR, "authentication"),
    path.join(SCREENSHOTS_BASE_DIR, "staff-queue"),
    path.join(SCREENSHOTS_BASE_DIR, "staff-ticket-detail"),
    path.join(SCREENSHOTS_BASE_DIR, "user-management"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Capture high-resolution screenshot into artifacts directory
 */
export async function captureScreenshot(
  page: Page,
  category: "authentication" | "staff-queue" | "staff-ticket-detail" | "user-management",
  filename: string
): Promise<void> {
  ensureScreenshotsDir();
  const filePath = path.join(SCREENSHOTS_BASE_DIR, category, filename.endsWith(".png") ? filename : `${filename}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

/**
 * Assert that the document has zero horizontal overflow across any viewport
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(isOverflowing).toBe(false);
}

/**
 * Helper to log in as a given user
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/#/login");
  await page.waitForSelector('[data-testid="login-container"]', { timeout: 15000 });

  await page.fill("#email-input", email);
  await page.fill("#password-input", password);
  await page.click('[data-testid="login-submit-btn"]');
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
      await page.waitForSelector('[data-testid="drawer-logout-btn"]');
      await page.click('[data-testid="drawer-logout-btn"]');
    }
  }

  await expect(page.locator('[data-testid="login-container"]')).toBeVisible({ timeout: 10000 });
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

