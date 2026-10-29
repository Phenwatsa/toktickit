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

/**
 * Assert that all 4 Zen Green design tokens are declared and have valid computed values
 * (--zg-primary, --zg-bg-page, --zg-surface, --zg-border) per FR-17 and AC-17.
 */
export async function assertZenGreenTokens(page: Page): Promise<void> {
  const tokens = await page.evaluate(() => {
    const style = window.getComputedStyle(document.documentElement);
    return {
      primary: style.getPropertyValue("--zg-primary").trim(),
      bgPage: style.getPropertyValue("--zg-bg-page").trim(),
      surface: style.getPropertyValue("--zg-surface").trim(),
      border: style.getPropertyValue("--zg-border").trim(),
    };
  });

  expect(tokens.primary, "Missing or empty --zg-primary token").toBeTruthy();
  expect(tokens.bgPage, "Missing or empty --zg-bg-page token").toBeTruthy();
  expect(tokens.surface, "Missing or empty --zg-surface token").toBeTruthy();
  expect(tokens.border, "Missing or empty --zg-border token").toBeTruthy();
}

/**
 * Assert metric grid column count on screens rendering .dashboard-metrics-grid
 * - Desktop: 5 columns
 * - Tablet: 2-3 columns
 * - Mobile: 1 column
 */
export async function assertGridColumnCount(
  page: Page,
  expectedCols: number | number[]
): Promise<void> {
  const grid = page.locator(".dashboard-metrics-grid").first();
  await expect(grid, "Expected .dashboard-metrics-grid to be present and visible").toBeVisible({
    timeout: 10000,
  });

  const colCount = await grid.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    const cols = computed.gridTemplateColumns;
    if (!cols || cols === "none") return 1;
    return cols.split(/\s+/).filter(Boolean).length;
  });

  if (Array.isArray(expectedCols)) {
    expect(
      expectedCols.includes(colCount),
      `Expected grid columns to be one of [${expectedCols.join(", ")}], but got ${colCount}`
    ).toBe(true);
  } else {
    expect(
      colCount,
      `Expected grid columns to be ${expectedCols}, but got ${colCount}`
    ).toBe(expectedCols);
  }
}

/**
 * Assert that visible interactive controls (buttons, links, inputs) in the page
 * do not have overlapping bounding boxes (zero control collisions)
 */
export async function assertNoControlCollisions(page: Page): Promise<void> {
  const collision = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]:not([tabindex="-1"]), [role="button"]:not([aria-hidden="true"])'
      )
    ).filter((el) => {
      if (el.closest('[aria-hidden="true"]')) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 8 &&
        rect.height > 8 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    });

    for (let i = 0; i < candidates.length; i++) {
      const a = candidates[i];
      const rA = a.getBoundingClientRect();
      for (let j = i + 1; j < candidates.length; j++) {
        const b = candidates[j];
        if (a.contains(b) || b.contains(a)) continue;
        const rB = b.getBoundingClientRect();

        const xOverlap = Math.max(0, Math.min(rA.right, rB.right) - Math.max(rA.left, rB.left));
        const yOverlap = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));

        // Detect significant intersection (> 6px in both directions)
        if (xOverlap > 6 && yOverlap > 6) {
          const aLabel = (a.getAttribute("data-testid") || a.innerText || a.tagName).slice(0, 30);
          const bLabel = (b.getAttribute("data-testid") || b.innerText || b.tagName).slice(0, 30);
          return `Control collision detected between [${aLabel}] and [${bLabel}] with overlap ${Math.round(xOverlap)}x${Math.round(yOverlap)}px`;
        }
      }
    }
    return null;
  });

  expect(collision, collision ?? undefined).toBeNull();
}

/**
 * Assert that headings, banners, and metric cards do not have clipped text
 * (scrollWidth <= clientWidth + 2 for non-scrolling text elements)
 */
export async function assertNoClippedText(page: Page): Promise<void> {
  const clipped = await page.evaluate(() => {
    const textElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, .zg-metric-card-title, .zg-metric-card-value, .dashboard-banner-title, .dashboard-banner-subtitle, [data-testid^='metric-card']"
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });

    for (const el of textElements) {
      const style = window.getComputedStyle(el);
      if (style.overflowX !== "auto" && style.overflowX !== "scroll") {
        if (el.scrollWidth > el.clientWidth + 2) {
          const tag = el.getAttribute("data-testid") || el.className || el.tagName;
          const text = (el.innerText || "").slice(0, 40);
          return `Clipped text detected in [${tag}] "${text}": scrollWidth (${el.scrollWidth}px) > clientWidth (${el.clientWidth}px)`;
        }
      }
    }
    return null;
  });

  expect(clipped, clipped ?? undefined).toBeNull();
}
