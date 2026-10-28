import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequesterProvider } from "./context/RequesterContext";
import { Header, AppView } from "./components/Header";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { StaffTicketQueue } from "./pages/StaffTicketQueue";
import { StaffTicketDetail } from "./pages/StaffTicketDetail";
import { UserManagement } from "./pages/UserManagement";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail";
import { RequesterDashboard } from "./pages/RequesterDashboard";
import { StaffDashboard } from "./pages/StaffDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { checkSystem, Category } from "./api";
import { Role } from "./types";
import "./styles/zen-green.css";

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>("dashboard");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  // Legacy Lab 1 state
  const [legacyState, setLegacyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Role-based route guard helpers
  const getDefaultViewForRole = useCallback((_role?: Role): AppView => {
    return "dashboard";
  }, []);

  const getDefaultHashForRole = useCallback((_role?: Role): string => {
    return "#/dashboard";
  }, []);

  const isViewPermittedForRole = useCallback((view: AppView, role?: Role): boolean => {
    if (view === "legacy-check") return true;
    if (view === "dashboard") return true;
    if (role === "ADMINISTRATOR") {
      return (
        view === "admin-users" ||
        view === "staff-queue" ||
        view === "ticket-detail" ||
        view === "create-ticket"
      );
    }
    if (role === "IT_STAFF") {
      return (
        view === "staff-queue" ||
        view === "ticket-detail" ||
        view === "create-ticket"
      );
    }
    // REQUESTER
    return (
      view === "my-tickets" ||
      view === "ticket-detail" ||
      view === "create-ticket"
    );
  }, []);

  // Sync initial view based on role
  useEffect(() => {
    if (user) {
      const defaultHash = getDefaultHashForRole(user.role);
      const defaultView = getDefaultViewForRole(user.role);
      const hash = window.location.hash || "";
      if (hash === "#/login" || hash === "" || !isViewPermittedForRole(currentView, user.role)) {
        setCurrentView(defaultView);
        window.history.replaceState(null, "", defaultHash);
      }
    }
  }, [user?.role, currentView, getDefaultHashForRole, getDefaultViewForRole, isViewPermittedForRole]);

  // Hash-based Browser Back/Forward Navigation Handler with Route Guards
  const syncViewFromHash = useCallback(() => {
    const hash = window.location.hash || "";
    let requestedView: AppView = "dashboard";
    let ticketId: number | null = null;
    let forbidden = false;

    if (hash.startsWith("#/ticket/")) {
      const idStr = hash.replace("#/ticket/", "");
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        ticketId = id;
        requestedView = "ticket-detail";
      }
    } else if (hash === "#/dashboard" || hash.startsWith("#/dashboard")) {
      requestedView = "dashboard";
    } else if (hash.startsWith("#/staff-dashboard")) {
      if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
        requestedView = "dashboard";
      } else {
        forbidden = true;
      }
    } else if (hash.startsWith("#/admin-dashboard")) {
      if (user?.role === "ADMINISTRATOR") {
        requestedView = "dashboard";
      } else {
        forbidden = true;
      }
    } else if (hash.startsWith("#/requester-dashboard")) {
      if (user?.role === "REQUESTER" || !user?.role) {
        requestedView = "dashboard";
      } else {
        forbidden = true;
      }
    } else if (hash.startsWith("#/create-ticket")) {
      requestedView = "create-ticket";
    } else if (hash.startsWith("#/legacy-check")) {
      requestedView = "legacy-check";
    } else if (hash.startsWith("#/staff-queue")) {
      if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
        requestedView = "staff-queue";
      } else {
        forbidden = true;
      }
    } else if (hash.startsWith("#/admin-users")) {
      if (user?.role === "ADMINISTRATOR") {
        requestedView = "admin-users";
      } else {
        forbidden = true;
      }
    } else if (hash.startsWith("#/my-tickets")) {
      if (user?.role === "REQUESTER" || !user?.role) {
        requestedView = "my-tickets";
      } else {
        forbidden = true;
      }
    } else if (hash === "") {
      requestedView = "dashboard";
    } else {
      requestedView = "dashboard";
    }

    if (forbidden) {
      setIsForbidden(true);
      return;
    }

    setIsForbidden(false);
    if (ticketId !== null) {
      setSelectedTicketId(ticketId);
    }
    setCurrentView(requestedView);
  }, [user?.role]);

  useEffect(() => {
    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, [syncViewFromHash]);

  function navigateTo(view: AppView, ticketId?: number) {
    setIsForbidden(false);
    if (!isViewPermittedForRole(view, user?.role)) {
      const fallback = getDefaultViewForRole(user?.role);
      setCurrentView(fallback);
      window.location.hash = getDefaultHashForRole(user?.role);
      return;
    }

    setCurrentView(view);
    if (view === "ticket-detail" && ticketId) {
      setSelectedTicketId(ticketId);
      window.location.hash = `#/ticket/${ticketId}`;
    } else if (view === "create-ticket") {
      window.location.hash = "#/create-ticket";
    } else if (view === "legacy-check") {
      window.location.hash = "#/legacy-check";
    } else if (view === "staff-queue") {
      if (!window.location.hash.startsWith("#/staff-queue")) {
        window.location.hash = "#/staff-queue";
      }
    } else if (view === "admin-users") {
      if (!window.location.hash.startsWith("#/admin-users")) {
        window.location.hash = "#/admin-users";
      }
    } else if (view === "my-tickets") {
      if (!window.location.hash.startsWith("#/my-tickets")) {
        window.location.hash = "#/my-tickets";
      }
    } else {
      if (!window.location.hash.startsWith("#/dashboard")) {
        window.location.hash = "#/dashboard";
      }
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

  // 1. Initial Loading State
  if (isLoading) {
    return (
      <div
        className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light"
        data-testid="app-loading"
      >
        <div
          className="spinner-border text-success mb-3"
          role="status"
          style={{ width: "2.5rem", height: "2.5rem", color: "var(--zg-primary, #006B3C)" }}
        />
        <span style={{ color: "var(--zg-text-muted, #64748B)", fontWeight: 500 }}>
          Loading TokTickIT...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login View
  if (!isAuthenticated) {
    return <Login />;
  }

  // 3. Mandatory Password Change Intercept -> Show ChangePassword View
  if (user?.mustChangePassword) {
    return <ChangePassword />;
  }

  // 4. Authenticated Application Shell
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "var(--color-bg-page, #F5F7F6)" }}>
      {/* Zen Green Navigation Header */}
      <Header currentView={currentView} onNavigate={(view) => navigateTo(view)} />

      {/* Main Content Area */}
      <main className="container-fluid px-3 px-lg-4 flex-grow-1 py-3" style={{ maxWidth: 1560, margin: "0 auto", width: "100%" }}>
        {/* 403 Forbidden State (ui-spec.md §6.3) */}
        {isForbidden && (
          <div className="zg-forbidden-container" role="alert" data-testid="forbidden-banner">
            <div style={{ color: "var(--zg-danger, #DC2626)", marginBottom: "1rem" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h2 className="h4 fw-bold mb-2">403 Forbidden</h2>
            <p className="text-muted mb-4">
              You do not have permission to access this page.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={() => navigateTo("dashboard")}
              data-testid="return-to-dashboard-btn"
            >
              Return to My Dashboard
            </button>
          </div>
        )}

        {/* Role-Appropriate Dashboards (Guarded) */}
        {!isForbidden && currentView === "dashboard" && (
          <>
            {(user?.role === "REQUESTER" || !user?.role) && (
              <RequesterDashboard onNavigate={navigateTo} />
            )}
            {user?.role === "IT_STAFF" && (
              <StaffDashboard onNavigate={navigateTo} />
            )}
            {user?.role === "ADMINISTRATOR" && (
              <AdminDashboard onNavigate={navigateTo} />
            )}
          </>
        )}

        {/* Requester Views (Guarded) */}
        {!isForbidden && (user?.role === "REQUESTER" || !user?.role) && currentView === "my-tickets" && (
          <MyTickets
            onNavigateToCreate={() => navigateTo("create-ticket")}
            onSelectTicket={(ticketId) => navigateTo("ticket-detail", ticketId)}
          />
        )}

        {!isForbidden && (user?.role === "REQUESTER" || !user?.role) && currentView === "ticket-detail" && selectedTicketId !== null && (
          <RequesterTicketDetail
            ticketId={selectedTicketId}
            onBack={() => navigateTo("my-tickets")}
          />
        )}

        {!isForbidden && currentView === "create-ticket" && (
          <CreateTicket onCancel={() => navigateTo("dashboard")} />
        )}

        {/* IT Staff & Admin Shared Queue Views (Guarded) */}
        {!isForbidden && (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") && currentView === "staff-queue" && (
          <StaffTicketQueue
            onSelectTicket={(ticketId) => navigateTo("ticket-detail", ticketId)}
          />
        )}

        {!isForbidden && (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") && currentView === "ticket-detail" && selectedTicketId !== null && (
          <StaffTicketDetail
            ticketId={selectedTicketId}
            onBack={() => navigateTo("staff-queue")}
          />
        )}

        {/* Administrator Views (Guarded) */}
        {!isForbidden && user?.role === "ADMINISTRATOR" && currentView === "admin-users" && (
          <UserManagement />
        )}

        {/* Legacy Lab 1 Health Check */}
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
    <AuthProvider>
      <RequesterProvider>
        <MainApp />
      </RequesterProvider>
    </AuthProvider>
  );
}
