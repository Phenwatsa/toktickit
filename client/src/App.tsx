import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header } from "./components/Header";
import { RequesterSelector } from "./components/RequesterSelector";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
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
      <main className="container-fluid px-md-5 flex-grow-1 py-3" style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {currentView === "my-tickets" && (
          <MyTickets
            onNavigateToCreate={() => setCurrentView("create-ticket")}
            onSelectTicket={(ticketId) => {
              console.log("View ticket details:", ticketId);
            }}
          />
        )}

        {currentView === "create-ticket" && (
          <CreateTicket
            onCancel={() => setCurrentView("my-tickets")}
            onSuccess={() => setCurrentView("my-tickets")}
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
