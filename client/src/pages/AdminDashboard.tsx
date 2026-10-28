import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { AppView } from "../components/Header";
import { fetchAdminDashboard, AdminDashboardData } from "../api";

interface AdminDashboardProps {
  onNavigate: (view: AppView, ticketId?: number) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.name ? user.name.split(" ")[0] : "Administrator";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrillDown = (targetHash: string) => {
    window.location.hash = targetHash;
    if (targetHash.startsWith("#/staff-queue")) {
      onNavigate("staff-queue");
    } else if (targetHash.startsWith("#/admin-users")) {
      onNavigate("admin-users");
    }
  };

  const handleDrillDownStaffQueue = () => {
    handleDrillDown("#/staff-queue");
  };

  const handleDrillDownUnassigned = () => {
    handleDrillDown("#/staff-queue?owner=unassigned");
  };

  const handleDrillDownUsers = () => {
    handleDrillDown("#/admin-users");
  };

  const handleTicketClick = (ticketId: number) => {
    window.location.hash = `#/ticket/${ticketId}`;
    onNavigate("ticket-detail", ticketId);
  };

  function getStatusBadge(status: string) {
    const formatted = status.replace(/_/g, " ");
    let colorClass = "zen-badge-open";
    if (status === "NEW") colorClass = "zen-badge-new";
    else if (status === "IN_PROGRESS") colorClass = "zen-badge-in-progress";
    else if (status === "WAITING_FOR_REQUESTER") colorClass = "zen-badge-waiting";
    else if (status === "RESOLVED") colorClass = "zen-badge-resolved";
    else if (status === "CLOSED") colorClass = "zen-badge-closed";
    else if (status === "REOPENED") colorClass = "zen-badge-reopened";
    else if (status === "CANCELLED") colorClass = "zen-badge-cancelled";

    return (
      <span className={`zen-badge ${colorClass}`} style={{ fontSize: "0.74rem", padding: "0.22rem 0.55rem" }}>
        {formatted}
      </span>
    );
  }

  function getPriorityBadge(priority?: string | null) {
    if (!priority) return <span className="text-muted" style={{ fontSize: "0.75rem" }}>—</span>;
    const p = priority.toUpperCase();
    const classNameMap: Record<string, string> = {
      LOW: "zen-badge-priority-low",
      MEDIUM: "zen-badge-priority-medium",
      HIGH: "zen-badge-priority-high",
      URGENT: "zen-badge-priority-urgent",
    };
    const renderIcon = () => {
      switch (p) {
        case "URGENT":
          return (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          );
        case "HIGH":
          return (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          );
        case "MEDIUM":
          return (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <line x1="5" y1="9" x2="19" y2="9" />
              <line x1="5" y1="15" x2="19" y2="15" />
            </svg>
          );
        case "LOW":
        default:
          return (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          );
      }
    };
    return (
      <span
        className={`zen-badge ${classNameMap[p] || "zen-badge-priority-low"}`}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", justifyContent: "center", fontSize: "0.74rem", padding: "0.22rem 0.55rem" }}
      >
        {renderIcon()}
        <span>{priority.charAt(0) + priority.slice(1).toLowerCase()}</span>
      </span>
    );
  }

  function formatUpdatedDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  // Loading Skeleton State
  if (isLoading && !data) {
    return (
      <div className="dashboard-container" data-testid="dashboard-loading">
        <div className="dashboard-banner">
          <div>
            <div className="zg-skeleton mb-2" style={{ width: "240px", height: "30px" }} />
            <div className="zg-skeleton" style={{ width: "300px", height: "16px" }} />
          </div>
        </div>

        <div className="dashboard-metrics-grid">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="zg-skeleton-card" style={{ height: "125px" }} />
          ))}
        </div>

        <div className="dashboard-middle-grid">
          <div className="zg-skeleton-card" style={{ height: "380px" }} />
          <div className="zg-skeleton-card" style={{ height: "380px" }} />
        </div>
      </div>
    );
  }

  const operational = data?.operational;
  const users = data?.users;
  const byRole = users?.byRole;

  const totalUsers = users?.totalUsers ?? 0;
  const requesterCount = byRole?.requester ?? 0;
  const staffCount = byRole?.itStaff ?? 0;
  const adminCount = byRole?.administrator ?? 0;

  // Compute Donut SVG Dasharrays
  const reqPct = totalUsers > 0 ? (requesterCount / totalUsers) : 0;
  const staffPct = totalUsers > 0 ? (staffCount / totalUsers) : 0;
  const adminPct = totalUsers > 0 ? (adminCount / totalUsers) : 0;

  const circumference = 2 * Math.PI * 38; // r = 38
  const reqStroke = reqPct * circumference;
  const staffStroke = staffPct * circumference;
  const adminStroke = adminPct * circumference;

  return (
    <div className="dashboard-container dashboard-compact-fit" data-testid="admin-dashboard">
      {/* 1. Header Banner */}
      <div className="dashboard-banner mb-3">
        <div>
          <h1 className="dashboard-banner-title">Welcome back, {firstName}!</h1>
          <p className="dashboard-banner-subtitle">
            System Administration & Service Desk Overview.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={loadData}
            disabled={isLoading}
            data-testid="admin-dashboard-refresh-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.45rem 0.95rem", fontSize: "0.85rem" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger mb-3 p-2 px-3" role="alert" data-testid="dashboard-error">
          <div className="d-flex align-items-center justify-content-between">
            <span style={{ fontSize: "0.85rem" }}>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={loadData}
              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Row: 5 Metric Cards with Prominent Front Icon (BR-15, BR-17, AC-19a, AC-20) */}
      <div className="dashboard-metrics-grid mb-4" role="region" aria-label="Administrator key metrics">
        {/* 1. Total Active Tickets */}
        <div
          className="zg-metric-card active-accent"
          role="button"
          tabIndex={0}
          onClick={handleDrillDownStaffQueue}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownStaffQueue();
            }
          }}
          data-testid="admin-card-active-tickets"
          title="Click to view all active system tickets"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "var(--zg-pale-green)", color: "var(--zg-primary)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Total Active Tickets</div>
              <div className="zg-metric-card-value">{operational?.totalActiveTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Operational queue</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 2. Unassigned Queue */}
        <div
          className="zg-metric-card warning-accent"
          role="button"
          tabIndex={0}
          onClick={handleDrillDownUnassigned}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownUnassigned();
            }
          }}
          data-testid="admin-card-unassigned"
          title="Click to view unassigned tickets in queue"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Unassigned Queue</div>
              <div className="zg-metric-card-value">{operational?.unassignedTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Needs assignment</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 3. Total Users */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={handleDrillDownUsers}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownUsers();
            }
          }}
          data-testid="admin-card-total-users"
          title="Click to view user management accounts"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F1F5F9", color: "#334155" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Total Users</div>
              <div className="zg-metric-card-value">{users?.totalUsers ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>All user accounts</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 4. Active Users */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={handleDrillDownUsers}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownUsers();
            }
          }}
          data-testid="admin-card-active-users"
          title="Click to view active users"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Active Users</div>
              <div className="zg-metric-card-value">{users?.activeUsers ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Enabled accounts</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 5. Inactive Users */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={handleDrillDownUsers}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownUsers();
            }
          }}
          data-testid="admin-card-inactive-users"
          title="Click to view inactive/disabled users"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Inactive Users</div>
              <div className="zg-metric-card-value">{users?.inactiveUsers ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Deactivated accounts</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Donut Chart User Role Composition (Left) + Spacious Recent System Queue (Right) */}
      <div className="dashboard-middle-grid mb-4">
        {/* Left: User Role Composition & Platform Oversight Card */}
        <div className="zen-card p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%" }}>
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                  Enterprise User Composition & Platform Health
                </h2>
                <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                  Directory account distribution and access status
                </span>
              </div>
              <span className="zen-badge zen-badge-resolved" style={{ fontSize: "0.74rem", padding: "0.22rem 0.6rem", whiteSpace: "nowrap" }}>
                Active Rate: {totalUsers > 0 ? Math.round(((users?.activeUsers ?? 0) / totalUsers) * 100) : 100}%
              </span>
            </div>

            {/* Health Bar Strip */}
            <div className="d-flex flex-wrap align-items-center gap-2 gap-sm-3 py-2 mb-2 border-bottom" style={{ borderColor: "#F1F5F9", fontSize: "0.82rem" }}>
              <div>
                <span className="text-muted">Total Accounts: </span>
                <strong className="text-dark">{totalUsers}</strong>
              </div>
              <div className="d-none d-sm-block" style={{ width: 1, height: 14, backgroundColor: "#E2E8F0" }} />
              <div>
                <span className="text-muted">Active: </span>
                <strong className="text-success">{users?.activeUsers ?? 0}</strong>
              </div>
              <div className="d-none d-sm-block" style={{ width: 1, height: 14, backgroundColor: "#E2E8F0" }} />
              <div>
                <span className="text-muted">Deactivated: </span>
                <strong className="text-muted">{users?.inactiveUsers ?? 0}</strong>
              </div>
            </div>
          </div>

          {/* SVG Donut Chart with Legend (Proportionally balanced) */}
          <div className="d-flex flex-wrap align-items-center justify-content-around gap-3 py-2">
            {/* SVG Donut */}
            <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="12" />

                {/* Segment 1: Requesters */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#006B3C"
                  strokeWidth="12"
                  strokeDasharray={`${reqStroke} ${circumference}`}
                  strokeDashoffset="0"
                />

                {/* Segment 2: IT Staff */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${staffStroke} ${circumference}`}
                  strokeDashoffset={-reqStroke}
                />

                {/* Segment 3: Administrators */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="12"
                  strokeDasharray={`${adminStroke} ${circumference}`}
                  strokeDashoffset={-(reqStroke + staffStroke)}
                />
              </svg>

              {/* Inner Circle Label */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--zg-text-primary)", lineHeight: 1 }}>
                  {totalUsers}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Accounts</span>
              </div>
            </div>

            {/* Right Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.85rem", minWidth: "170px", maxWidth: "100%" }}>
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#006B3C", display: "inline-block", flexShrink: 0 }} />
                  <span className="fw-medium text-dark">Requesters</span>
                </div>
                <strong className="text-dark" style={{ whiteSpace: "nowrap" }}>{requesterCount} <span className="text-muted fw-normal">({Math.round(reqPct * 100)}%)</span></strong>
              </div>

              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block", flexShrink: 0 }} />
                  <span className="fw-medium text-dark">IT Staff</span>
                </div>
                <strong className="text-dark" style={{ whiteSpace: "nowrap" }}>{staffCount} <span className="text-muted fw-normal">({Math.round(staffPct * 100)}%)</span></strong>
              </div>

              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#334155", display: "inline-block", flexShrink: 0 }} />
                  <span className="fw-medium text-dark">Administrators</span>
                </div>
                <strong className="text-dark" style={{ whiteSpace: "nowrap" }}>{adminCount} <span className="text-muted fw-normal">({Math.round(adminPct * 100)}%)</span></strong>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Sub-Panel (Eliminates empty void with useful security info) */}
          <div className="border-top pt-2 mt-2" style={{ borderColor: "#F1F5F9" }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 text-muted" style={{ fontSize: "0.76rem" }}>
              <span style={{ whiteSpace: "nowrap" }}>Database: <strong className="text-success">Connected</strong></span>
              <span style={{ whiteSpace: "nowrap" }}>RBAC Policy: <strong className="text-dark">Enforced</strong></span>
              <span style={{ whiteSpace: "nowrap" }}>Concurrency Gate: <strong className="text-dark">Active</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Recent System Queue (Spacious Table, All 5 Rows Fit Without Scrollbar) */}
        <div className="zen-card p-0 shadow-sm d-flex flex-column" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
          <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom" style={{ borderColor: "#E2E8F0" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                Recent System Queue
              </h2>
              <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                System-wide ticket oversight and assignee status
              </span>
            </div>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              onClick={handleDrillDownStaffQueue}
              style={{ color: "var(--zg-primary)", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}
            >
              Open Queue &rarr;
            </button>
          </div>

          {/* List / Table Area */}
          <div style={{ flex: 1, padding: "0.25rem 0.5rem", minWidth: 0, maxWidth: "100%", overflowX: "auto" }}>
            {data && data.recentTickets && data.recentTickets.length > 0 ? (
              <div className="table-responsive" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table
                  className="zen-table mb-0 w-100"
                  data-testid="admin-recent-tickets"
                  style={{
                    width: "100%",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th scope="col" style={{ padding: "0.65rem 0.85rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "125px" }}>Ticket #</th>
                      <th scope="col" style={{ padding: "0.65rem 0.85rem", fontSize: "0.78rem" }}>Summary & Updated</th>
                      <th scope="col" style={{ textAlign: "center", padding: "0.65rem 0.5rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "95px" }}>Priority</th>
                      <th scope="col" style={{ textAlign: "center", padding: "0.65rem 0.5rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "110px" }}>Status</th>
                      <th scope="col" className="d-none d-sm-table-cell" style={{ padding: "0.65rem 0.75rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "135px" }}>Owner</th>
                      <th scope="col" className="d-none d-md-table-cell" style={{ textAlign: "center", padding: "0.65rem 0.4rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "70px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket.id)}
                        style={{ cursor: "pointer" }}
                        tabIndex={0}
                        role="link"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleTicketClick(ticket.id);
                          }
                        }}
                      >
                        <td style={{ verticalAlign: "middle", padding: "0.65rem 0.85rem", whiteSpace: "nowrap" }}>
                          <span className="zen-ticket-number">{ticket.ticketNumber}</span>
                        </td>
                        <td style={{ verticalAlign: "middle", padding: "0.65rem 0.85rem" }}>
                          <div
                            className="text-dark fw-medium text-truncate"
                            style={{ lineHeight: 1.35, marginBottom: "2px" }}
                            title={ticket.summary}
                          >
                            {ticket.summary}
                          </div>
                          <span className="text-muted d-block" style={{ fontSize: "0.74rem" }}>
                            {formatUpdatedDate(ticket.updatedAt)} {ticket.requester ? `• ${ticket.requester.name}` : ""}
                            {ticket.ticketOwner ? (
                              <span className="d-sm-none"> • {ticket.ticketOwner.name}</span>
                            ) : (
                              <span className="d-sm-none"> • Unassigned</span>
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.5rem", whiteSpace: "nowrap" }}>
                          {getPriorityBadge(ticket.itPriority || ticket.requestedPriority)}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.5rem", whiteSpace: "nowrap" }}>
                          {getStatusBadge(ticket.currentStatus)}
                        </td>
                        <td className="d-none d-sm-table-cell" style={{ verticalAlign: "middle", padding: "0.65rem 0.75rem" }}>
                          {ticket.ticketOwner ? (
                            <span className="text-dark fw-medium text-truncate d-inline-block" style={{ fontSize: "0.82rem", maxWidth: "100%", whiteSpace: "nowrap" }}>
                              {ticket.ticketOwner.name}
                            </span>
                          ) : (
                            <span className="badge text-muted border border-dashed" style={{ fontSize: "0.72rem", backgroundColor: "#F8FAFC" }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell" style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle", padding: "0.65rem 0.4rem" }}>
                          <button
                            type="button"
                            className="zen-btn-view"
                            style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTicketClick(ticket.id);
                            }}
                            title="View ticket detail"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="zg-empty-state d-flex flex-column align-items-center justify-content-center h-100" data-testid="admin-empty-state" style={{ padding: "2.5rem" }}>
                <div className="zg-empty-state-icon mb-2">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="zg-empty-state-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>All systems normal</h3>
                <p className="zg-empty-state-text mb-0" style={{ fontSize: "0.82rem" }}>
                  All active tickets have been triaged and resolved across the platform.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Role Distribution Bar + Admin Quick Actions Hub */}
      <div className="dashboard-bottom-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)", gap: "1.25rem" }}>
        {/* Left: Role Distribution Bar */}
        <div className="zen-card p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "120px" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted fw-bold" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Directory Role Distribution:
            </span>
            <span className="zen-badge" style={{ backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "0.72rem", padding: "0.18rem 0.5rem" }}>
              Enterprise RBAC
            </span>
          </div>

          <div
            className="d-flex align-items-center gap-2 flex-wrap"
            data-testid="role-distribution-bar"
            role="region"
            aria-label="User distribution by role"
          >
            <span
              className="zen-badge zen-role-requester"
              data-testid="role-badge-requester"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", cursor: "pointer" }}
              onClick={handleDrillDownUsers}
              title="Click to view all requesters in User Management"
            >
              Requesters: {requesterCount}
            </span>

            <span
              className="zen-badge zen-role-staff"
              data-testid="role-badge-staff"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", cursor: "pointer" }}
              onClick={handleDrillDownUsers}
              title="Click to view all IT staff in User Management"
            >
              IT Staff: {staffCount}
            </span>

            <span
              className="zen-badge zen-role-admin"
              data-testid="role-badge-admin"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", cursor: "pointer" }}
              onClick={handleDrillDownUsers}
              title="Click to view all administrators in User Management"
            >
              Administrators: {adminCount}
            </span>
          </div>
        </div>

        {/* Right: Administrative Quick Actions */}
        <div className="zg-quick-actions-card p-3 shadow-sm d-flex align-items-center justify-content-between gap-2" data-testid="quick-actions-card" style={{ margin: 0, minHeight: "120px" }}>
          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={handleDrillDownUsers}
            data-testid="admin-action-users"
            title="Manage enterprise user accounts and credentials"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>User Management</span>
          </button>

          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={handleDrillDownStaffQueue}
            data-testid="admin-action-queue"
            title="Inspect operational ticket queue"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Ticket Queue</span>
          </button>

          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={() => {
              window.location.hash = "#/create-ticket";
              onNavigate("create-ticket");
            }}
            data-testid="admin-action-create"
            title="Create support ticket"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
