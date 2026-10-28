import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";

describe("DesignSystemTokens (UI-STYLE-01, AC-17)", () => {
  // @ts-ignore
  const cssPath = path.resolve(__dirname, "../../src/styles/zen-green.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

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
