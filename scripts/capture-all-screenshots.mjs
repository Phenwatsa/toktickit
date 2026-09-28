import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "artifacts", "lab-03", "screenshots");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function resetUsers() {
  try {
    const prismaModule = await import(path.join(ROOT_DIR, "server", "node_modules", "@prisma", "client", "index.js"));
    const prisma = new prismaModule.PrismaClient();
    const DEFAULT_HASH = "$2a$10$YFM5cCrfTzXKdMJqMYdKwef2eP16HYUPht8JPByEaTqNmUTrNms4C"; // Password123!

    // Reset all users to default password and active status
    await prisma.user.updateMany({
      data: {
        passwordHash: DEFAULT_HASH,
        mustChangePassword: false,
        isActive: true,
      },
    });

    // Set firstlogin requester mustChangePassword = true
    await prisma.user.updateMany({
      where: { email: "firstlogin.req@toktickit.local" },
      data: {
        mustChangePassword: true,
      },
    });

    // Set alex.w isActive = false
    await prisma.user.updateMany({
      where: { email: "alex.w@toktickit.local" },
      data: {
        isActive: false,
      },
    });

    await prisma.$disconnect();
    console.log("✓ Reset all database test users (passwords and flags)");
  } catch (err) {
    console.warn("Could not reset users via Prisma:", err.message);
  }
}

async function capture(page, category, filename, isFullPage = false) {
  const targetDir = path.join(SCREENSHOTS_DIR, category);
  ensureDir(targetDir);
  const targetFile = path.join(targetDir, `${filename}.png`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: targetFile, fullPage: isFullPage });
  console.log(`  [Captured] ${category}/${filename}.png`);
}

async function main() {
  console.log("=================================================");
  console.log("  TOK TICK IT - LAB 3 FHD SCREENSHOT GENERATOR   ");
  console.log("=================================================");

  ensureDir(SCREENSHOTS_DIR);
  ensureDir(path.join(SCREENSHOTS_DIR, "authentication"));
  ensureDir(path.join(SCREENSHOTS_DIR, "staff-queue"));
  ensureDir(path.join(SCREENSHOTS_DIR, "staff-ticket-detail"));
  ensureDir(path.join(SCREENSHOTS_DIR, "user-management"));

  await resetUsers();

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION (5 Screenshots)
  // -------------------------------------------------------------------------
  console.log("\n📸 1. Capturing Authentication Screenshots...");
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    // 01-login-desktop (1920x1080)
    await page.goto("/#/login");
    await page.waitForSelector('[data-testid="login-container"]');
    await capture(page, "authentication", "01-login-desktop");

    // 02-login-mobile (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await capture(page, "authentication", "02-login-mobile");

    // 03-login-invalid-error (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/#/login");
    await page.fill("#email-input", "jennifer.a@toktickit.local");
    await page.fill("#password-input", "WrongPassword999!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="login-error-banner"]');
    await capture(page, "authentication", "03-login-invalid-error");

    // 04-login-inactive-error (1920x1080)
    await page.goto("/#/login");
    await page.fill("#email-input", "alex.w@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="login-error-banner"]');
    await capture(page, "authentication", "04-login-inactive-error");

    // 05-password-change-intercept (1920x1080)
    await page.goto("/#/login");
    await page.fill("#email-input", "firstlogin.req@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="change-password-container"]');
    await capture(page, "authentication", "05-password-change-intercept");

    await context.close();
  }

  // -------------------------------------------------------------------------
  // 2. STAFF QUEUE (5 Screenshots)
  // -------------------------------------------------------------------------
  console.log("\n📸 2. Capturing Staff Queue Screenshots...");
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    await page.goto("/#/login");
    await page.fill("#email-input", "alice.staff@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForURL(/#\/staff-queue/);
    await page.waitForSelector('[data-testid="staff-ticket-queue-page"]');

    // 01-staff-queue-desktop (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(600);
    await capture(page, "staff-queue", "01-staff-queue-desktop");

    // 02-staff-queue-tablet (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await capture(page, "staff-queue", "02-staff-queue-tablet");

    // 03-staff-queue-mobile-cards (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await capture(page, "staff-queue", "03-staff-queue-mobile-cards");

    // 04-staff-queue-filters (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    await page.selectOption('[data-testid="staff-queue-status-filter"]', "NEW");
    await page.waitForTimeout(300);
    await page.selectOption('[data-testid="staff-queue-it-priority-filter"]', "HIGH");
    await page.waitForTimeout(400);
    await capture(page, "staff-queue", "04-staff-queue-filters");

    // 05-staff-queue-empty (1920x1080)
    await page.fill('[data-testid="staff-queue-search-input"]', "NONEXISTENT_TKT_QUERY_9999");
    await page.waitForSelector('[data-testid="staff-queue-no-results"]');
    await capture(page, "staff-queue", "05-staff-queue-empty");

    await context.close();
  }

  // -------------------------------------------------------------------------
  // 3. STAFF TICKET DETAIL (5 Screenshots)
  // -------------------------------------------------------------------------
  console.log("\n📸 3. Capturing Staff Ticket Detail Screenshots...");
  let detailTicketUrl = "";
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    await page.goto("/#/login");
    await page.fill("#email-input", "alice.staff@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForURL(/#\/staff-queue/);
    await page.waitForSelector('[data-testid="staff-ticket-queue-page"]');

    // Open first ticket
    const firstViewBtn = page.locator('button.zen-btn-view:has-text("View")').first();
    await firstViewBtn.waitFor({ state: "visible", timeout: 8000 });
    await firstViewBtn.click();
    await page.waitForSelector('[data-testid="staff-ticket-detail-view"]');
    detailTicketUrl = page.url();

    // 01-ticket-detail-overview (1920x1080)
    await page.waitForTimeout(500);
    await capture(page, "staff-ticket-detail", "01-ticket-detail-overview");

    // 02-ticket-claim-action (1920x1080)
    const claimBtn = page.locator('[data-testid="claim-ticket-btn"]');
    if (await claimBtn.isVisible() && (await claimBtn.isEnabled())) {
      await claimBtn.click();
      await page.waitForTimeout(600);
    }
    await capture(page, "staff-ticket-detail", "02-ticket-claim-action");

    // 03-public-comments-exchange (1920x1080)
    const timestamp = Date.now();
    const publicComment = `IT Support update and verification note at ${timestamp}`;
    const internalNote = `CONFIDENTIAL INTERNAL DIAGNOSTICS: Server logs analyzed, memory stable at ${timestamp}`;

    await page.click('[data-testid="tab-public-comments"]');
    await page.waitForTimeout(300);
    await page.fill('[data-testid="public-comment-input"]', publicComment);
    await page.click('[data-testid="submit-public-comment-btn"]');
    await page.waitForSelector(`text=${publicComment}`);
    await capture(page, "staff-ticket-detail", "03-public-comments-exchange");

    // 04-internal-notes-confidential (1920x1080)
    await page.click('[data-testid="tab-internal-notes"]');
    await page.waitForSelector('[data-testid="confidential-notes-banner"]');
    await page.fill('[data-testid="internal-note-input"]', internalNote);
    await page.click('[data-testid="submit-internal-note-btn"]');
    await page.waitForSelector(`text=${internalNote}`);
    await capture(page, "staff-ticket-detail", "04-internal-notes-confidential");

    await context.close();
  }

  // 05-requester-view-notes-hidden (1920x1080)
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    await page.goto("/#/login");
    await page.fill("#email-input", "jennifer.a@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="filter-bar"], [data-testid="tickets-table"]');

    await page.goto(detailTicketUrl);
    await page.waitForSelector('[data-testid="ticket-detail-view"]');
    await page.waitForTimeout(600);
    await capture(page, "staff-ticket-detail", "05-requester-view-notes-hidden");

    await context.close();
  }

  // -------------------------------------------------------------------------
  // 4. USER MANAGEMENT (5 Screenshots)
  // -------------------------------------------------------------------------
  console.log("\n📸 4. Capturing User Management Screenshots...");
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    await page.goto("/#/login");
    await page.fill("#email-input", "admin@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="admin-user-management"]');
    await page.waitForSelector('[data-testid="users-table"]');

    // 01-user-list-desktop (1920x1080)
    await page.waitForTimeout(600);
    await capture(page, "user-management", "01-user-list-desktop");

    // 02-create-user-modal (1920x1080 modal, clean centered without duplicated navbars)
    await page.click('[data-testid="create-user-button"]');
    await page.waitForSelector('[data-testid="create-user-modal"]', { state: "visible" });
    await page.waitForTimeout(500);
    await capture(page, "user-management", "02-create-user-modal", false);

    // 03-duplicate-email-error (1920x1080 modal with error banner)
    await page.fill('[data-testid="create-user-name"]', "Duplicate Email Test");
    await page.fill('[data-testid="create-user-email"]', "jennifer.a@toktickit.local");
    await page.fill('[data-testid="create-user-password"]', "Password123!");
    await page.click('[data-testid="create-user-submit"]');
    await page.waitForSelector('[data-testid="create-user-error"]', { state: "visible" });
    await page.waitForTimeout(500);
    await capture(page, "user-management", "03-duplicate-email-error", false);

    // Close create modal
    await page.click('[data-testid="create-user-cancel"]');
    await page.waitForSelector('[data-testid="create-user-modal"]', { state: "hidden" });
    await page.waitForTimeout(400);

    // 04-edit-user-self-deactivation-blocked (1920x1080, edit modal on Admin row)
    const adminRow = page.locator('tr:has(span:text-is("You"))');
    await adminRow.locator('button:has-text("Edit")').click();
    await page.waitForSelector('[data-testid="edit-user-modal"]', { state: "visible" });
    await page.waitForSelector('[data-testid="self-deactivation-notice"]', { state: "visible" });
    await page.waitForTimeout(500);
    await capture(page, "user-management", "04-edit-user-self-deactivation-blocked", false);

    // Close edit modal
    await page.click('[data-testid="edit-user-cancel"]');
    await page.waitForSelector('[data-testid="edit-user-modal"]', { state: "hidden" });
    await page.waitForTimeout(400);

    // 05-reset-password-section (1920x1080, edit modal on non-admin user with success banner)
    const otherUserRow = page.locator('tr:has(span:text-is("David Lee"))');
    await otherUserRow.locator('button:has-text("Edit")').click();
    await page.waitForSelector('[data-testid="edit-user-modal"]', { state: "visible" });
    const resetInput = page.locator('[data-testid="reset-password-input"]');
    await resetInput.scrollIntoViewIfNeeded();
    await resetInput.fill("NewResetPass123!");
    await page.click('[data-testid="reset-password-button"]');
    await page.waitForSelector('[data-testid="reset-password-success"]', { state: "visible" });
    await page.waitForTimeout(500);
    await capture(page, "user-management", "05-reset-password-section", false);

    // Close modal
    await page.click('[data-testid="edit-user-cancel"]');
    await page.waitForSelector('[data-testid="edit-user-modal"]', { state: "hidden" });

    await context.close();
  }

  // Restore user state so all accounts work cleanly
  await resetUsers();

  // -------------------------------------------------------------------------
  // 5. REQUESTER (My Tickets, Create Ticket, Ticket Detail)
  // -------------------------------------------------------------------------
  console.log("\n📸 5. Capturing Requester Screenshots...");
  ensureDir(path.join(SCREENSHOTS_DIR, "requester"));
  {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: "http://localhost:5173",
    });
    const page = await context.newPage();

    await page.goto("/#/login");
    await page.fill("#email-input", "jennifer.a@toktickit.local");
    await page.fill("#password-input", "Password123!");
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForSelector('[data-testid="filter-bar"], [data-testid="tickets-table"]');

    // 01-my-tickets-desktop (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(600);
    await capture(page, "requester", "01-my-tickets-desktop");

    // 02-my-tickets-tablet (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await capture(page, "requester", "02-my-tickets-tablet");

    // 03-my-tickets-mobile-cards (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await capture(page, "requester", "03-my-tickets-mobile-cards");

    // 04-my-tickets-filters (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    await page.selectOption('[data-testid="status-filter"]', "OPEN");
    await page.waitForTimeout(300);
    await page.selectOption('[data-testid="priority-filter"]', "HIGH");
    await page.waitForTimeout(400);
    await capture(page, "requester", "04-my-tickets-filters");

    // Reset filters
    await page.click('[data-testid="clear-filters-btn"]');
    await page.waitForTimeout(300);

    // 05-create-ticket-desktop (1920x1080)
    await page.click('[data-testid="create-ticket-top-btn"]');
    await page.waitForSelector('[data-testid="submit-ticket-button"], #ticketCategory');
    await page.waitForTimeout(600);
    await capture(page, "requester", "05-create-ticket-desktop");

    // 06-ticket-detail-desktop (1920x1080)
    await page.goto("/#/my-tickets");
    await page.waitForSelector('[data-testid="filter-bar"], [data-testid="tickets-table"]');
    await page.waitForTimeout(600);
    const firstView = page.locator('button.zen-btn-view:has-text("View")').first();
    await firstView.click();
    await page.waitForSelector('[data-testid="ticket-detail-view"]');
    await page.waitForTimeout(600);
    await capture(page, "requester", "06-ticket-detail-desktop");

    await context.close();
  }

  await browser.close();

  // Reset all users state again
  await resetUsers();

  console.log("\n=================================================");
  console.log("  ALL SCREENSHOTS CAPTURED SUCCESSFULLY (FHD)    ");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR in screenshot generator:", err);
  process.exit(1);
});
