import React from "react";
import { useRequester } from "../context/RequesterContext";

export type AppView = "my-tickets" | "create-ticket" | "legacy-check" | "ticket-detail";

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onChangeRequester: () => void;
}

export function Header({ currentView, onNavigate, onChangeRequester }: HeaderProps) {
  const { currentRequester } = useRequester();

  return (
    <header className="zen-header">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand & Navigation */}
        <div className="d-flex align-items-center gap-4">
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "#FFFFFF" }}>TokTickIT</span>
          </a>

          <nav className="d-flex align-items-center gap-1">
            <button
              type="button"
              className={`zen-nav-link ${currentView === "my-tickets" ? "active" : ""}`}
              onClick={() => onNavigate("my-tickets")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              My Tickets
            </button>
            <button
              type="button"
              className={`zen-nav-link ${currentView === "create-ticket" ? "active" : ""}`}
              onClick={() => onNavigate("create-ticket")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Ticket
            </button>
            <button
              type="button"
              className={`zen-nav-link ${currentView === "legacy-check" ? "active" : ""}`}
              style={{ fontSize: "0.825rem" }}
              onClick={() => onNavigate("legacy-check")}
            >
              Health Check (Lab 1)
            </button>
          </nav>
        </div>

        {/* User Identity & Minimalist Switcher */}
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          {currentRequester ? (
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "9999px",
                  fontSize: "0.825rem",
                  color: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <strong style={{ color: "#FFFFFF" }}>{currentRequester.name}</strong>
                <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.75rem" }}>({currentRequester.department})</span>
              </div>

              <button
                type="button"
                onClick={onChangeRequester}
                title="Switch to another development user"
                data-testid="change-requester-btn"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.45)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
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
      </div>
    </header>
  );
}
