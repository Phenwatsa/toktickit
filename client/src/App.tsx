import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header } from "./components/Header";
import { RequesterSelector } from "./components/RequesterSelector";
import { checkSystem, Category } from "./api";
import "./styles/zen-green.css";

type View = "my-tickets" | "create-ticket" | "legacy-check";

function MainApp() {
  const { currentRequester } = useRequester();
  const [currentView, setCurrentView] = useState<View>("my-tickets");
  const [isChangingRequester, setIsChangingRequester] = useState<boolean>(false);

  // Legacy Lab 1 state
  const [legacyState, setLegacyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  // If no user is selected or changing user modal is triggered
  if (!currentRequester || isChangingRequester) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-light">
        <header className="zen-header py-3">
          <div className="container d-flex align-items-center">
            <span className="navbar-brand text-white fw-bold mb-0">⏱️ TokTickIT</span>
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
        onNavigate={(view) => setCurrentView(view)}
        onChangeRequester={() => setIsChangingRequester(true)}
      />

      {/* Main Content Area */}
      <main className="container-fluid px-md-5 flex-grow-1 py-3">
        {currentView === "my-tickets" && (
          <div className="zen-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="h4 fw-bold text-dark mb-1">My Tickets</h2>
                <p className="text-muted small mb-0">
                  Viewing tickets for <strong>{currentRequester.name}</strong> ({currentRequester.department})
                </p>
              </div>
              <button
                className="zen-btn-primary"
                onClick={() => setCurrentView("create-ticket")}
              >
                ➕ Create Ticket
              </button>
            </div>

            <div className="zen-callout-info">
              <strong>Issue 8 (My Tickets Screen)</strong> will implement the full ticket table,
              search, category/priority/status filters, and pagination here.
            </div>
          </div>
        )}

        {currentView === "create-ticket" && (
          <div className="zen-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 fw-bold text-dark mb-0">Create IT Support Ticket</h2>
              <button
                className="zen-btn-secondary btn-sm"
                onClick={() => setCurrentView("my-tickets")}
              >
                Back to My Tickets
              </button>
            </div>

            <div className="zen-callout-info">
              <strong>Issue 7 (Ticket Creation Screen)</strong> will implement the Zen Green form,
              dynamic reference data, and file attachments here.
            </div>
          </div>
        )}

        {currentView === "legacy-check" && (
          <div className="zen-card" style={{ maxWidth: 640 }}>
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
