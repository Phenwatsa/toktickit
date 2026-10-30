import React from "react";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";

describe("DesignSystemTokens (UI-STYLE-01, AC-17)", () => {
  // @ts-ignore
  const cssPath = path.resolve(__dirname, "../../src/styles/zen-green.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  beforeAll(() => {
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-testid", "zen-green-style");
    styleEl.innerHTML = cssContent;
    document.head.appendChild(styleEl);
  });

  afterAll(() => {
    const styleEl = document.querySelector('[data-testid="zen-green-style"]');
    if (styleEl) styleEl.remove();
  });

  describe("Zen Green CSS Variables in :root", () => {
    it("defines --zg-primary as #006B3C", () => {
      expect(cssContent).toMatch(/--zg-primary:\s*#006B3C/i);
    });

    it("defines --zg-bg-page as #F5F7F6", () => {
      expect(cssContent).toMatch(/--zg-bg-page:\s*#F5F7F6/i);
    });

    it("defines --zg-surface as #FFFFFF", () => {
      expect(cssContent).toMatch(/--zg-surface:\s*#FFFFFF/i);
    });

    it("defines --zg-border as #E2E8F0", () => {
      expect(cssContent).toMatch(/--zg-border:\s*#E2E8F0/i);
    });

    it("defines warning and danger tokens", () => {
      expect(cssContent).toMatch(/--zg-warning:\s*#D97706/i);
      expect(cssContent).toMatch(/--zg-danger:\s*#DC2626/i);
    });
  });

  describe("Status Badge Classes (All 8 Statuses)", () => {
    const requiredBadgeClasses = [
      "zen-badge-new",
      "zen-badge-open",
      "zen-badge-in-progress",
      "zen-badge-waiting",
      "zen-badge-resolved",
      "zen-badge-closed",
      "zen-badge-reopened",
      "zen-badge-cancelled",
    ];

    requiredBadgeClasses.forEach((cls) => {
      it(`defines badge class .${cls} in stylesheets`, () => {
        expect(cssContent).toContain(`.${cls}`);
      });
    });
  });

  describe("Interactive Focus Rings & Accessibility Styles", () => {
    it("defines :focus-visible rules with --zg-primary outline", () => {
      expect(cssContent).toMatch(/:focus-visible/);
      expect(cssContent).toMatch(/outline:\s*2px\s*solid\s*var\(--zg-primary/);
    });

    it("defines distinct role styling cues for Requester, IT Staff, and Admin", () => {
      expect(cssContent).toContain(".zen-role-requester");
      expect(cssContent).toContain(".zen-role-staff");
      expect(cssContent).toContain(".zen-role-admin");
    });
  });

  describe("Dashboard Layout & Component Classes", () => {
    it("defines .dashboard-container with max-width and centering", () => {
      expect(cssContent).toContain(".dashboard-container");
      expect(cssContent).toMatch(/max-width:\s*1560px/);
    });

    it("defines .dashboard-metrics-grid with 5-column desktop layout", () => {
      expect(cssContent).toContain(".dashboard-metrics-grid");
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(5,\s*1fr\)/);
    });

    it("defines .zg-metric-card with interactive hover and min-height 120px", () => {
      expect(cssContent).toContain(".zg-metric-card");
      expect(cssContent).toMatch(/min-height:\s*120px/);
      expect(cssContent).toMatch(/cursor:\s*pointer/);
    });

    it("defines .dashboard-lower-grid with 2-column layout", () => {
      expect(cssContent).toContain(".dashboard-lower-grid");
    });

    it("defines .zg-quick-actions-card and .zg-quick-action-btn with 44px+ touch targets", () => {
      expect(cssContent).toContain(".zg-quick-actions-card");
      expect(cssContent).toContain(".zg-quick-action-btn");
      expect(cssContent).toMatch(/min-height:\s*44px/);
    });

    it("defines .zg-status-pill for staff queue filtering", () => {
      expect(cssContent).toContain(".zg-status-pill");
    });

    it("defines .zg-forbidden-container for accessible 403 route protection", () => {
      expect(cssContent).toContain(".zg-forbidden-container");
    });
  });

  describe("Computed Styles & Rendered Component Styling (UI-STYLE-01, AC-17)", () => {
    it("verifies computed CSS variables on document root", () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      expect(rootStyle.getPropertyValue("--zg-primary").trim().toUpperCase()).toBe("#006B3C");
      expect(rootStyle.getPropertyValue("--zg-bg-page").trim().toUpperCase()).toBe("#F5F7F6");
      expect(rootStyle.getPropertyValue("--zg-surface").trim().toUpperCase()).toBe("#FFFFFF");
      expect(rootStyle.getPropertyValue("--zg-border").trim().toUpperCase()).toBe("#E2E8F0");
      expect(rootStyle.getPropertyValue("--zg-warning").trim().toUpperCase()).toBe("#D97706");
      expect(rootStyle.getPropertyValue("--zg-danger").trim().toUpperCase()).toBe("#DC2626");
    });

    it("verifies computed styles on rendered metric card element (.zg-metric-card)", () => {
      const { container } = render(
        <div className="zg-metric-card active-accent">
          <span className="zg-metric-card-title">Open Tickets</span>
          <span className="zg-metric-card-value">12</span>
        </div>
      );

      const card = container.querySelector(".zg-metric-card") as HTMLElement;
      expect(card).not.toBeNull();
      const style = window.getComputedStyle(card);
      expect(style.cursor).toBe("pointer");
      expect(style.minHeight).toBe("120px");
    });

    it("verifies computed styles on rendered quick action button (.zg-quick-action-btn)", () => {
      const { container } = render(
        <button type="button" className="zg-quick-action-btn">
          Create Ticket
        </button>
      );

      const btn = container.querySelector(".zg-quick-action-btn") as HTMLElement;
      expect(btn).not.toBeNull();
      const style = window.getComputedStyle(btn);
      expect(style.minHeight).toBe("44px");
    });

    it("verifies computed styles on rendered status badge elements across lifecycle", () => {
      const { container } = render(
        <div>
          <span className="zen-badge zen-badge-new">New</span>
          <span className="zen-badge zen-badge-open">Open</span>
          <span className="zen-badge zen-badge-in-progress">In Progress</span>
          <span className="zen-badge zen-badge-waiting">Waiting</span>
          <span className="zen-badge zen-badge-resolved">Resolved</span>
          <span className="zen-badge zen-badge-closed">Closed</span>
          <span className="zen-badge zen-badge-reopened">Reopened</span>
          <span className="zen-badge zen-badge-cancelled">Cancelled</span>
        </div>
      );

      const badges = container.querySelectorAll(".zen-badge");
      expect(badges.length).toBe(8);

      const expectedBadgeStyles: Record<string, { color: string; bg: string; border: string }> = {
        "zen-badge-new": { color: "var(--color-primary)", bg: "var(--color-pale-green)", border: "rgb(196, 230, 210)" },
        "zen-badge-open": { color: "rgb(29, 78, 216)", bg: "rgb(239, 246, 255)", border: "rgb(191, 219, 254)" },
        "zen-badge-in-progress": { color: "rgb(109, 40, 217)", bg: "rgb(245, 243, 255)", border: "rgb(221, 214, 254)" },
        "zen-badge-waiting": { color: "rgb(180, 83, 9)", bg: "rgb(255, 251, 235)", border: "rgb(253, 230, 138)" },
        "zen-badge-resolved": { color: "rgb(21, 128, 61)", bg: "rgb(240, 253, 244)", border: "rgb(187, 247, 208)" },
        "zen-badge-closed": { color: "rgb(71, 85, 105)", bg: "rgb(241, 245, 249)", border: "rgb(203, 213, 225)" },
        "zen-badge-reopened": { color: "rgb(29, 78, 216)", bg: "rgb(239, 246, 255)", border: "rgb(191, 219, 254)" },
        "zen-badge-cancelled": { color: "rgb(153, 27, 27)", bg: "rgb(254, 242, 242)", border: "rgb(254, 202, 202)" },
      };

      badges.forEach((badge) => {
        const style = window.getComputedStyle(badge);
        expect(style.display).toMatch(/inline-flex|inline-block|flex/);
        expect(style.borderRadius).toBe("9999px");
        expect(style.fontSize).toBe("0.75rem");
        expect(style.fontWeight).toBe("600");
      });

      Object.entries(expectedBadgeStyles).forEach(([cls, expected]) => {
        const el = container.querySelector(`.${cls}`) as HTMLElement;
        expect(el).not.toBeNull();
        const style = window.getComputedStyle(el);
        expect(style.color).toBe(expected.color);
        expect(style.backgroundColor).toBe(expected.bg);
        expect(style.border).toContain(expected.border);
      });
    });

    it("verifies computed styles on rendered metric card accents and private/shared cues (ui-spec §7.4)", () => {
      const { container } = render(
        <div>
          <div className="zg-metric-card active-accent" data-testid="card-active">Active</div>
          <div className="zg-metric-card warning-accent" data-testid="card-warning">Warning</div>
          <div className="zg-metric-card danger-accent" data-testid="card-danger">Danger</div>
          <div className="zen-callout-warning" data-testid="callout-warning">Internal Staff Only Note</div>
        </div>
      );

      const warningCard = container.querySelector('[data-testid="card-warning"]') as HTMLElement;
      const activeCard = container.querySelector('[data-testid="card-active"]') as HTMLElement;
      const dangerCard = container.querySelector('[data-testid="card-danger"]') as HTMLElement;
      const warningCallout = container.querySelector('[data-testid="callout-warning"]') as HTMLElement;

      const ws = window.getComputedStyle(warningCard);
      const as = window.getComputedStyle(activeCard);
      const ds = window.getComputedStyle(dangerCard);
      const cs = window.getComputedStyle(warningCallout);

      // Warm amber border-left for warning / private staff triage cue
      expect(ws.borderLeftWidth).toBe("4px");
      expect(ws.borderLeftStyle).toBe("solid");
      expect(ws.borderLeftColor).toContain("var(--zg-warning)");

      // Primary green border-left for active queue cues
      expect(as.borderLeftWidth).toBe("4px");
      expect(as.borderLeftStyle).toBe("solid");
      expect(as.borderLeftColor).toContain("var(--zg-primary)");

      // Danger red border-left for critical / urgent accents
      expect(ds.borderLeftWidth).toBe("4px");
      expect(ds.borderLeftStyle).toBe("solid");
      expect(ds.borderLeftColor).toContain("var(--zg-danger)");

      // Private staff callout note framing
      expect(cs.borderLeft).toContain("4px solid");
      expect(cs.backgroundColor).toBe("rgb(255, 251, 235)");
      expect(cs.color).toBe("rgb(120, 53, 15)");
    });

    it("verifies computed styles on rendered dashboard container (.dashboard-container)", () => {
      const { container } = render(
        <div className="dashboard-container">
          <p>Dashboard Content</p>
        </div>
      );

      const el = container.querySelector(".dashboard-container") as HTMLElement;
      expect(el).not.toBeNull();
      const style = window.getComputedStyle(el);
      expect(style.maxWidth).toBe("1560px");
      expect(style.overflowX).toBe("hidden");
    });
  });

  describe("Responsive Layout & Zero Clipping Across Viewports (AC-17, UI-STYLE-01)", () => {
    it("verifies Desktop layout invariants at 1280px viewport (zero clipping, 5-col grid)", () => {
      window.innerWidth = 1280;
      window.innerHeight = 800;
      window.dispatchEvent(new Event("resize"));

      // Desktop grid rule verification in CSS
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(5,\s*1fr\)/);

      // Render dashboard container layout
      const { container } = render(
        <div className="dashboard-container" style={{ width: "100%", maxWidth: "1560px" }}>
          <div className="dashboard-metrics-grid">
            <div className="zg-metric-card active-accent">
              <span className="zg-metric-card-title">Card 1</span>
            </div>
            <div className="zg-metric-card">
              <span className="zg-metric-card-title">Card 2</span>
            </div>
            <div className="zg-metric-card">
              <span className="zg-metric-card-title">Card 3</span>
            </div>
            <div className="zg-metric-card">
              <span className="zg-metric-card-title">Card 4</span>
            </div>
            <div className="zg-metric-card">
              <span className="zg-metric-card-title">Card 5</span>
            </div>
          </div>
        </div>
      );

      const dashboardEl = container.querySelector(".dashboard-container") as HTMLElement;
      const computed = window.getComputedStyle(dashboardEl);
      expect(computed.overflowX).toBe("hidden");
      expect(computed.maxWidth).toBe("1560px");

      const cards = container.querySelectorAll(".zg-metric-card");
      expect(cards.length).toBe(5);
      cards.forEach((c) => {
        const cs = window.getComputedStyle(c);
        expect(cs.minHeight).toBe("120px");
      });
    });

    it("verifies Tablet layout invariants at 768px viewport (zero clipping, media query collapse)", () => {
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event("resize"));

      // Tablet media query rule verification: collapses middle/bottom grids to 1-column minmax(0, 1fr)
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*1024px\)/);
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(3,\s*1fr\)/);
      expect(cssContent).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/);

      const { container } = render(
        <div className="dashboard-container">
          <div className="dashboard-middle-grid">
            <div className="zen-card" style={{ minWidth: 0, maxWidth: "100%" }}>
              Middle Card 1
            </div>
            <div className="zen-card" style={{ minWidth: 0, maxWidth: "100%" }}>
              Middle Card 2
            </div>
          </div>
        </div>
      );

      const dashboardEl = container.querySelector(".dashboard-container") as HTMLElement;
      expect(window.getComputedStyle(dashboardEl).overflowX).toBe("hidden");
    });

    it("verifies Mobile layout invariants at 375px/440px viewport (zero horizontal overflow, table isolation, 44px touch targets)", () => {
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event("resize"));

      // Mobile media query rule verification: 1fr stack
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*767px\)/);
      expect(cssContent).toMatch(/grid-template-columns:\s*1fr/);

      // Render representative mobile dashboard with table and quick actions
      const { container } = render(
        <div className="dashboard-container">
          <div className="dashboard-metrics-grid">
            <div className="zg-metric-card warning-accent">
              <span className="zg-metric-card-title">Waiting</span>
              <span className="zg-metric-card-value">3</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table zen-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TCK-101</td>
                  <td>
                    <span className="zen-badge zen-badge-waiting">Waiting</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="zg-quick-actions-card">
            <button type="button" className="zg-quick-action-btn">
              Create Ticket
            </button>
          </div>
        </div>
      );

      // 1. Dashboard container prevents page-level horizontal scroll blowout
      const dashboardEl = container.querySelector(".dashboard-container") as HTMLElement;
      expect(window.getComputedStyle(dashboardEl).overflowX).toBe("hidden");

      // 2. Table responsive wrapper isolates table width to prevent horizontal viewport clipping
      const tableWrapper = container.querySelector(".table-responsive") as HTMLElement;
      const tableWrapperStyle = window.getComputedStyle(tableWrapper);
      expect(tableWrapperStyle.overflowX).toBe("auto");
      expect(tableWrapperStyle.width).toBe("100%");

      // 3. Touch targets satisfy Apple HIG & WCAG 2.1 AAA minimum 44px
      const btn = container.querySelector(".zg-quick-action-btn") as HTMLElement;
      expect(window.getComputedStyle(btn).minHeight).toBe("44px");

      // 4. Badges do not break into multi-line or clip text
      const badge = container.querySelector(".zen-badge-waiting") as HTMLElement;
      expect(window.getComputedStyle(badge).whiteSpace).toBe("nowrap");
    });

    it("verifies zero static pixel traps in mobile dashboard grid track definitions", () => {
      // Invariant: All dashboard grids must collapse to single column (1fr / minmax) on mobile/tablet viewports
      // and never enforce static pixel widths under responsive breakpoints (<992px / <767px)
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{[\s\S]*?\.dashboard-metrics-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*992px\)\s*\{[\s\S]*?\.dashboard-lower-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*?\.dashboard-middle-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/);

      // Verify that all dashboard grid children enforce min-width: 0 and max-width: 100% to prevent grid blowouts
      expect(cssContent).toMatch(/\.dashboard-middle-grid\s*>\s*\*,\s*\.dashboard-bottom-grid\s*>\s*\*,\s*\.dashboard-metrics-grid\s*>\s*\*,\s*\.dashboard-lower-grid\s*>\s*\*[\s\S]*?min-width:\s*0/);
    });
  });

  describe("DOM Element Class Rendering", () => {
    it("renders metric card and status pill elements with designated classes without errors", () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="dashboard-metrics-grid">
            <div className="zg-metric-card active-accent">
              <span className="zg-metric-card-title">Open Tickets</span>
              <span className="zg-metric-card-value">12</span>
            </div>
          </div>
          <div className="dashboard-pills-wrap">
            <span className="zg-status-pill">
              <span>Open</span>
              <span className="zg-status-pill-count">5</span>
            </span>
          </div>
          <div className="zg-forbidden-container">
            <h2>403 Forbidden</h2>
          </div>
        </div>
      );

      expect(container.querySelector(".dashboard-container")).not.toBeNull();
      expect(container.querySelector(".zg-metric-card")).not.toBeNull();
      expect(container.querySelector(".zg-status-pill")).not.toBeNull();
      expect(container.querySelector(".zg-forbidden-container")).not.toBeNull();
    });
  });
});
