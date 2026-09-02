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
    <header className="zen-header mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand & Nav */}
        <div className="d-flex align-items-center gap-4">
          <a
            href="#home"
            className="navbar-brand text-white fw-bold d-flex align-items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("my-tickets");
            }}
          >
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "1.1rem",
              }}
            >
              ⏱️
            </span>
            TokTickIT
          </a>

          <nav className="d-flex gap-2">
            <button
              type="button"
              className={`zen-nav-link btn btn-link ${currentView === "my-tickets" ? "active" : ""}`}
              onClick={() => onNavigate("my-tickets")}
            >
              📋 My Tickets
            </button>
            <button
              type="button"
              className={`zen-nav-link btn btn-link ${currentView === "create-ticket" ? "active" : ""}`}
              onClick={() => onNavigate("create-ticket")}
            >
              ➕ Create Ticket
            </button>
            <button
              type="button"
              className={`zen-nav-link btn btn-link text-white-50 ${currentView === "legacy-check" ? "active" : ""}`}
              style={{ fontSize: "0.8rem" }}
              onClick={() => onNavigate("legacy-check")}
            >
              Health Check (Lab 1)
            </button>
          </nav>
        </div>

        {/* User Identity & Switcher */}
        <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
          {currentRequester ? (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark px-3 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                <span style={{ fontSize: "1rem" }}>👤</span>
                <span className="fw-semibold">{currentRequester.name}</span>
                <span className="text-muted small">({currentRequester.department})</span>
              </span>
              <button
                type="button"
                className="btn btn-outline-light btn-sm fw-semibold"
                onClick={onChangeRequester}
                title="Switch to another development user"
              >
                Change Requester
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-light btn-sm fw-semibold"
              onClick={onChangeRequester}
            >
              Select Requester
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
