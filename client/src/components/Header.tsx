import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export type AppView =
  | "my-tickets"
  | "create-ticket"
  | "legacy-check"
  | "ticket-detail"
  | "staff-queue"
  | "admin-users";

interface HeaderProps {
  currentView: AppView | string;
  onNavigate: (view: AppView) => void;
  onChangeRequester?: () => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  function getRoleBadge(role?: Role) {
    switch (role) {
      case "ADMINISTRATOR":
        return (
          <span
            className="zen-role-badge zen-role-admin"
            data-testid="user-role-badge"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "var(--zg-role-admin-bg, #EDE9FE)",
              color: "var(--zg-role-admin-text, #6D28D9)",
              border: "1px solid #C4B5FD",
              letterSpacing: "0.02em",
            }}
          >
            Administrator
          </span>
        );
      case "IT_STAFF":
        return (
          <span
            className="zen-role-badge zen-role-staff"
            data-testid="user-role-badge"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "var(--zg-role-staff-bg, #E0F2FE)",
              color: "var(--zg-role-staff-text, #0369A1)",
              border: "1px solid #7DD3FC",
              letterSpacing: "0.02em",
            }}
          >
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span
            className="zen-role-badge zen-role-requester"
            data-testid="user-role-badge"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "var(--zg-role-requester-bg, #F8FAFC)",
              color: "var(--zg-role-requester-text, #1E293B)",
              border: "1px solid #CBD5E1",
              letterSpacing: "0.02em",
            }}
          >
            Requester
          </span>
        );
    }
  }

  const isRequester = user?.role === "REQUESTER" || !user?.role;
  const isStaff = user?.role === "IT_STAFF";
  const isAdmin = user?.role === "ADMINISTRATOR";

  return (
    <>
      <header className="zen-header">
        <div className="zen-header-container">
          {/* Brand Bar */}
          <div className="zen-header-brand-bar">
            <a
              href="#/dashboard"
              className="navbar-brand"
              onClick={(e) => {
                e.preventDefault();
                if (isStaff) onNavigate("staff-queue");
                else if (isAdmin) onNavigate("admin-users");
                else onNavigate("my-tickets");
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "#FFFFFF" }}>
                TokTickIT
              </span>
            </a>
          </div>

          {/* Desktop Role-Based Navigation Tabs */}
          <nav className="zen-header-nav zen-desktop-only" data-testid="desktop-nav">
            {/* Requester Navigation Links */}
            {isRequester && (
              <>
                <button
                  type="button"
                  className={`zen-nav-link ${currentView === "my-tickets" ? "active" : ""}`}
                  onClick={() => onNavigate("my-tickets")}
                  data-testid="nav-my-tickets"
                >
                  <svg
                    className="zen-nav-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  data-testid="nav-create-ticket"
                >
                  <svg
                    className="zen-nav-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  data-testid="nav-health-check"
                >
                  <span>Health Check</span>
                </button>
              </>
            )}

            {/* IT Staff Navigation Links */}
            {isStaff && (
              <button
                type="button"
                className={`zen-nav-link ${currentView === "staff-queue" ? "active" : ""}`}
                onClick={() => onNavigate("staff-queue")}
                data-testid="nav-staff-queue"
              >
                <svg
                  className="zen-nav-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Ticket Queue</span>
              </button>
            )}

            {/* Administrator Navigation Links */}
            {isAdmin && (
              <button
                type="button"
                className={`zen-nav-link ${currentView === "admin-users" ? "active" : ""}`}
                onClick={() => onNavigate("admin-users")}
                data-testid="nav-admin-users"
              >
                <svg
                  className="zen-nav-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>User Management</span>
              </button>
            )}
          </nav>

          {/* Desktop User Section with Role Badge & Logout */}
          <div className="zen-header-user-section zen-desktop-only">
            {user ? (
              <div className="zen-header-user-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="zen-header-user-pill" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="zen-header-user-avatar">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <strong className="zen-header-user-name" data-testid="user-display-name">
                    {user.name}
                  </strong>
                  {getRoleBadge(user.role)}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out of TokTickIT"
                  data-testid="header-logout-btn"
                  className="zen-header-change-btn"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "6px",
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Right Action Bar: Hamburger Button */}
          <div className="zen-mobile-header-actions zen-mobile-only">
            <button
              type="button"
              className="zen-hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Menu"
              data-testid="hamburger-menu-btn"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0F172A", letterSpacing: "-0.01em" }}>
                  TokTickIT
                </span>
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

            {/* Profile Info in Drawer */}
            {user && (
              <div className="zen-drawer-user-card" data-testid="drawer-user-card">
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
                    {user.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.15rem" }}>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="zen-btn-secondary"
                  style={{ width: "100%", fontSize: "0.8rem", padding: "0.4rem 0.6rem", justifyContent: "center" }}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  data-testid="drawer-logout-btn"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Navigation List in Drawer */}
            <div className="zen-drawer-nav" data-testid="drawer-nav">
              {isRequester && (
                <>
                  <button
                    type="button"
                    className={`zen-drawer-nav-item ${currentView === "my-tickets" ? "active" : ""}`}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onNavigate("my-tickets");
                    }}
                    data-testid="drawer-nav-my-tickets"
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
                    data-testid="drawer-nav-create-ticket"
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
                    data-testid="drawer-nav-health-check"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <span>Health Diagnostic (Lab 1)</span>
                  </button>
                </>
              )}

              {isStaff && (
                <button
                  type="button"
                  className={`zen-drawer-nav-item ${currentView === "staff-queue" ? "active" : ""}`}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigate("staff-queue");
                  }}
                  data-testid="drawer-nav-staff-queue"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Ticket Queue</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className={`zen-drawer-nav-item ${currentView === "admin-users" ? "active" : ""}`}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigate("admin-users");
                  }}
                  data-testid="drawer-nav-admin-users"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>User Management</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
