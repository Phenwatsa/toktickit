import React, { useState } from "react";
import { useRequester } from "../context/RequesterContext";

export type AppView = "my-tickets" | "create-ticket" | "legacy-check" | "ticket-detail";

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onChangeRequester: () => void;
}

export function Header({ currentView, onNavigate, onChangeRequester }: HeaderProps) {
  const { currentRequester } = useRequester();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <header className="zen-header">
        <div className="zen-header-container">
          {/* Brand Bar */}
          <div className="zen-header-brand-bar">
            <a
              href="#/my-tickets"
              className="navbar-brand"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("my-tickets");
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "#FFFFFF" }}>TokTickIT</span>
            </a>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="zen-header-nav zen-desktop-only">
            <button
              type="button"
              className={`zen-nav-link ${currentView === "my-tickets" ? "active" : ""}`}
              onClick={() => onNavigate("my-tickets")}
            >
              <svg className="zen-nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>My Tickets</span>
            </button>
            <button
              type="button"
              className={`zen-nav-link ${currentView === "create-ticket" ? "active" : ""}`}
              onClick={() => onNavigate("create-ticket")}
            >
              <svg className="zen-nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Ticket</span>
            </button>
            <button
              type="button"
              className={`zen-nav-link ${currentView === "legacy-check" ? "active" : ""}`}
              style={{ fontSize: "0.825rem" }}
              onClick={() => onNavigate("legacy-check")}
            >
              <span>Health Check</span>
            </button>
          </nav>

          {/* Desktop User Section */}
          <div className="zen-header-user-section zen-desktop-only">
            {currentRequester ? (
              <div className="zen-header-user-wrapper">
                <div className="zen-header-user-pill">
                  <div className="zen-header-user-avatar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <strong className="zen-header-user-name">{currentRequester.name}</strong>
                  <span className="zen-header-user-dept">({currentRequester.department})</span>
                </div>

                <button
                  type="button"
                  onClick={onChangeRequester}
                  title="Switch development requester"
                  data-testid="change-requester-btn"
                  className="zen-header-change-btn"
                >
                  Change Requester
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onChangeRequester}
                style={{
                  fontSize: "0.825rem",
                  padding: "0.4rem 0.95rem",
                  borderRadius: "9999px",
                  backgroundColor: "#FFFFFF",
                  color: "var(--color-primary)",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Select Requester
              </button>
            )}
          </div>

          {/* Mobile Right Action Bar: Compact Switch + Hamburger Button */}
          <div className="zen-mobile-header-actions zen-mobile-only">
            {currentRequester && (
              <button
                type="button"
                onClick={onChangeRequester}
                title="Switch development requester"
                className="zen-header-change-btn"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              >
                Switch
              </button>
            )}

            <button
              type="button"
              className="zen-hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Menu"
              data-testid="hamburger-menu-btn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sidebar Overlay */}
      {isDrawerOpen && (
        <div
          className="zen-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
          data-testid="drawer-backdrop"
        >
          <div
            className="zen-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            data-testid="mobile-drawer"
          >
            {/* Drawer Header */}
            <div className="zen-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    backgroundColor: "var(--color-pale-green)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0F172A", letterSpacing: "-0.01em" }}>TokTickIT</span>
              </div>

              <button
                type="button"
                className="zen-drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close Navigation Menu"
              >
                ✕
              </button>
            </div>

            {/* Requester Profile Info in Drawer */}
            {currentRequester && (
              <div className="zen-drawer-user-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.65rem" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-pale-green)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      flexShrink: 0,
                    }}
                  >
                    {currentRequester.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentRequester.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      {currentRequester.department}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="zen-btn-secondary"
                  style={{ width: "100%", fontSize: "0.8rem", padding: "0.4rem 0.6rem", justifyContent: "center" }}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onChangeRequester();
                  }}
                >
                  Switch Development User
                </button>
              </div>
            )}

            {/* Navigation List in Drawer */}
            <div className="zen-drawer-nav">
              <button
                type="button"
                className={`zen-drawer-nav-item ${currentView === "my-tickets" ? "active" : ""}`}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigate("my-tickets");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>My Support Tickets</span>
              </button>

              <button
                type="button"
                className={`zen-drawer-nav-item ${currentView === "create-ticket" ? "active" : ""}`}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigate("create-ticket");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create New Ticket</span>
              </button>

              <button
                type="button"
                className={`zen-drawer-nav-item ${currentView === "legacy-check" ? "active" : ""}`}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigate("legacy-check");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Health Diagnostic (Lab 1)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
