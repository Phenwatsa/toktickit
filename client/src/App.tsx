import React, { useState, useEffect, useCallback } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header, AppView } from "./components/Header";
import { RequesterSelector } from "./components/RequesterSelector";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail";
import { checkSystem, Category } from "./api";
import "./styles/zen-green.css";

function MainApp() {
  const { currentRequester } = useRequester();
  const [currentView, setCurrentView] = useState<AppView>("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isChangingRequester, setIsChangingRequester] = useState<boolean>(false);
  const [showConfirmChangeModal, setShowConfirmChangeModal] = useState<boolean>(false);

  // Legacy Lab 1 state
  const [legacyState, setLegacyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Hash-based Browser Back/Forward Navigation Handler
  const syncViewFromHash = useCallback(() => {
    const hash = window.location.hash || "#/my-tickets";
    if (hash.startsWith("#/ticket/")) {
      const idStr = hash.replace("#/ticket/", "");
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        setSelectedTicketId(id);
        setCurrentView("ticket-detail");
        return;
      }
    }
    if (hash === "#/create-ticket") {
      setCurrentView("create-ticket");
      return;
    }
    if (hash === "#/legacy-check") {
      setCurrentView("legacy-check");
      return;
    }
    setCurrentView("my-tickets");
  }, []);

  useEffect(() => {
    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, [syncViewFromHash]);

  function navigateTo(view: AppView, ticketId?: number) {
    setCurrentView(view);
    if (view === "ticket-detail" && ticketId) {
      setSelectedTicketId(ticketId);
      window.location.hash = `#/ticket/${ticketId}`;
    } else if (view === "create-ticket") {
      window.location.hash = "#/create-ticket";
    } else if (view === "legacy-check") {
      window.location.hash = "#/legacy-check";
    } else {
      window.location.hash = "#/my-tickets";
    }
  }

  async function handleCheckLegacy() {
    setLegacyState("loading");
    setErrorMessage("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setLegacyState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to connect to TokTickIT API");
      setLegacyState("error");
    }
  }

  // If no user is selected or changing user screen is active
  if (!currentRequester || isChangingRequester) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-light">
        <header className="zen-header" style={{ padding: "0.75rem 1.5rem" }}>
          <div className="zen-container d-flex align-items-center">
            <div className="navbar-brand d-flex align-items-center gap-2">
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
            </div>
          </div>
        </header>
        <main className="flex-grow-1 d-flex align-items-center justify-content-center">
          <RequesterSelector
            onContinue={() => setIsChangingRequester(false)}
            onCancel={currentRequester ? () => setIsChangingRequester(false) : undefined}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "var(--color-bg-page)" }}>
      {/* Zen Green Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        onChangeRequester={() => setShowConfirmChangeModal(true)}
      />

      {/* Confirmation Modal for Changing Requester */}
      {showConfirmChangeModal && (
        <div className="zen-modal-backdrop" data-testid="confirm-change-requester-modal">
          <div className="zen-modal-content" style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-warning-bg)",
                  color: "var(--color-warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                Switch Development Requester?
              </h3>
            </div>

            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to switch to another requester account? Any unsaved form entries will be lost.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={() => setShowConfirmChangeModal(false)}
                data-testid="cancel-change-requester-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                className="zen-btn-primary"
                onClick={() => {
                  setShowConfirmChangeModal(false);
                  setIsChangingRequester(true);
                }}
                data-testid="confirm-change-requester-btn"
              >
                Yes, Switch Requester
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Wide & Responsive */}
      <main className="container-fluid px-3 px-lg-4 flex-grow-1 py-3" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {currentView === "my-tickets" && (
          <MyTickets
            onNavigateToCreate={() => navigateTo("create-ticket")}
            onSelectTicket={(ticketId) => navigateTo("ticket-detail", ticketId)}
          />
        )}

        {currentView === "ticket-detail" && selectedTicketId !== null && (
          <RequesterTicketDetail
            ticketId={selectedTicketId}
            onBack={() => navigateTo("my-tickets")}
          />
        )}

        {currentView === "create-ticket" && (
          <CreateTicket
            onCancel={() => navigateTo("my-tickets")}
          />
        )}

        {currentView === "legacy-check" && (
          <div className="zen-card" style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 className="h5 fw-bold mb-3">Lab 1 Health Check Diagnostic</h2>
            <button
              className="zen-btn-primary mb-3"
              onClick={handleCheckLegacy}
              disabled={legacyState === "loading"}
            >
              {legacyState === "loading" ? "Loading…" : "Check System"}
            </button>

            {legacyState === "success" && (
              <div className="mt-3">
                <p className="fw-bold text-success mb-2">System Status: Online</p>
                {categories.length > 0 && (
                  <div>
                    <p className="fw-semibold mb-1">Supported Request Categories:</p>
                    <ul className="list-group">
                      {categories.map((cat) => (
                        <li key={cat.id} className="list-group-item">
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {legacyState === "error" && (
              <div className="mt-3 alert alert-danger">
                <p className="fw-bold mb-1">System Status: Offline</p>
                <p className="mb-0">{errorMessage || "Unable to connect to TokTickIT API"}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainApp />
    </RequesterProvider>
  );
}
