import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { AppView } from "../components/Header";
import { fetchRequesterDashboard, RequesterDashboardData } from "../api";

interface RequesterDashboardProps {
  onNavigate: (view: AppView, ticketId?: number) => void;
}

export function RequesterDashboard({ onNavigate }: RequesterDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRequesterDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCardClick = (filterStatus: string) => {
    window.location.hash = `#/my-tickets?status=${filterStatus}`;
    onNavigate("my-tickets");
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

  const metrics = data?.metrics || data;
  const openTickets = metrics?.openTickets ?? 0;
  const inProgressTickets = metrics?.inProgressTickets ?? 0;
  const waitingForRequesterTickets = metrics?.waitingForRequesterTickets ?? 0;
  const resolvedTickets = metrics?.resolvedTickets ?? 0;
  const closedTickets = metrics?.closedTickets ?? 0;
  const totalTickets = openTickets + closedTickets;

  return (
    <div className="dashboard-container dashboard-compact-fit" data-testid="requester-dashboard">
      {/* 1. Header Banner */}
      <div className="dashboard-banner mb-3">
        <div>
          <h1 className="dashboard-banner-title">Welcome back, {firstName}!</h1>
          <p className="dashboard-banner-subtitle">
            Here's what's happening with your support requests.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={loadData}
            disabled={isLoading}
            data-testid="dashboard-refresh-btn"
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

      {/* 2. Top Row: 5 Metric Cards with Prominent Front Icon (BR-13, BR-15, AC-12, AC-15a) */}
      <div className="dashboard-metrics-grid mb-4" role="region" aria-label="Support ticket metrics summary">
        {/* 1. My Open Tickets */}
        <div
          className="zg-metric-card active-accent"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick("OPEN_GROUP")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick("OPEN_GROUP");
            }
          }}
          data-testid="metric-card-open"
          title="Click to view all active open tickets"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "var(--zg-pale-green)", color: "var(--zg-primary)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">My Open Tickets</div>
              <div className="zg-metric-card-value">{openTickets}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>View active tickets</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 2. In Progress */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick("IN_PROGRESS")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick("IN_PROGRESS");
            }
          }}
          data-testid="metric-card-in-progress"
          title="Click to view tickets actively being worked on by IT"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">In Progress</div>
              <div className="zg-metric-card-value">{inProgressTickets}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Being remediated</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 3. Waiting for Requester */}
        <div
          className="zg-metric-card warning-accent"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick("WAITING_FOR_REQUESTER")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick("WAITING_FOR_REQUESTER");
            }
          }}
          data-testid="metric-card-waiting-for-requester"
          title="Click to view tickets awaiting your response"
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
              <div className="zg-metric-card-title">Waiting for Requester</div>
              <div className="zg-metric-card-value">{waitingForRequesterTickets}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Needs your input</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 4. Resolved Tickets */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick("RESOLVED")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick("RESOLVED");
            }
          }}
          data-testid="metric-card-resolved"
          title="Click to view resolved tickets awaiting confirmation"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Resolved Tickets</div>
              <div className="zg-metric-card-value">{resolvedTickets}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Awaiting closure</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 5. Closed Tickets */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick("CLOSED")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick("CLOSED");
            }
          }}
          data-testid="metric-card-closed"
          title="Click to view archived closed tickets"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F8FAFC", color: "#64748B" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <polyline points="9 11 12 14 22 4" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Closed</div>
              <div className="zg-metric-card-value">{closedTickets}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Finalized archive</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Wave Chart (Service Activity Trend) + Spacious Recent Tickets Table */}
      <div className="dashboard-middle-grid mb-4">
        {/* Left: Wave Chart (Activity & Resolution Velocity) with comfortable spacing */}
        <div className="zen-card p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%" }}>
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                  Service Activity & Resolution Trend
                </h2>
                <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                  Resolution throughput and request activity over the active cycle
                </span>
              </div>
              <span className="zen-badge zen-badge-resolved" style={{ fontSize: "0.74rem", padding: "0.22rem 0.6rem", whiteSpace: "nowrap" }}>
                Service Desk: Active
              </span>
            </div>

            {/* Micro stats strip derived from authoritative API metrics */}
            <div className="d-flex flex-wrap align-items-center gap-2 gap-sm-3 py-2 mb-2 border-bottom" style={{ borderColor: "#F1F5F9", fontSize: "0.82rem" }}>
              <div>
                <span className="text-muted">Total Requests: </span>
                <strong className="text-dark">{totalTickets}</strong>
              </div>
              <div className="d-none d-sm-block" style={{ width: 1, height: 14, backgroundColor: "#E2E8F0" }} />
              <div>
                <span className="text-muted">Resolved & Closed: </span>
                <strong style={{ color: "var(--zg-primary)" }}>
                  {resolvedTickets + closedTickets}
                </strong>
              </div>
              <div className="d-none d-sm-block" style={{ width: 1, height: 14, backgroundColor: "#E2E8F0" }} />
              <div>
                <span className="text-muted">Active Requests: </span>
                <strong className="text-dark">{openTickets + inProgressTickets + waitingForRequesterTickets}</strong>
              </div>
            </div>
          </div>

          {/* SVG Wave Chart with ample bottom breathing room (No clipping) */}
          <div style={{ position: "relative", width: "100%", height: "230px", marginTop: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <svg viewBox="0 0 500 160" preserveAspectRatio="none" style={{ width: "100%", height: "180px", overflow: "visible" }}>
              <defs>
                <linearGradient id="reqWaveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006B3C" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#006B3C" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#006B3C" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Background Grid Lines */}
              <line x1="0" y1="35" x2="500" y2="35" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#E2E8F0" strokeWidth="1" />

              {/* Area Fill */}
              <path
                d="M 0,110 C 80,125 130,55 200,65 C 270,75 330,30 400,40 C 450,48 480,32 500,28 L 500,130 L 0,130 Z"
                fill="url(#reqWaveGradient)"
              />
              {/* Curved Line */}
              <path
                d="M 0,110 C 80,125 130,55 200,65 C 270,75 330,30 400,40 C 450,48 480,32 500,28"
                fill="none"
                stroke="#006B3C"
                strokeWidth="2.75"
                strokeLinecap="round"
              />

              {/* Data Anchor Points */}
              <circle cx="200" cy="65" r="4.5" fill="#FFFFFF" stroke="#006B3C" strokeWidth="2.5" />
              <circle cx="400" cy="40" r="4.5" fill="#FFFFFF" stroke="#006B3C" strokeWidth="2.5" />
              <circle cx="500" cy="28" r="4.5" fill="#FFFFFF" stroke="#006B3C" strokeWidth="2.5" />
            </svg>

            {/* X-Axis Labels placed comfortably inside with padding */}
            <div className="d-flex justify-content-between text-muted pb-1 px-2" style={{ fontSize: "0.78rem", fontWeight: 500 }}>
              <span>Cycle Start</span>
              <span>Mid Review</span>
              <span>Remediation</span>
              <span>Verification</span>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* Right: My Recent Tickets (Spacious Table with Room for 5 Full Tickets, No Scrollbar) */}
        <div className="zen-card p-0 shadow-sm d-flex flex-column" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
          <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom" style={{ borderColor: "#E2E8F0" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                My Recent Tickets
              </h2>
              <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                Latest requests logged under your account
              </span>
            </div>
            {data && data.recentTickets && data.recentTickets.length > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => {
                  window.location.hash = "#/my-tickets";
                  onNavigate("my-tickets");
                }}
                style={{ color: "var(--zg-primary)", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                View all ({totalTickets}) &rarr;
              </button>
            )}
          </div>

          {/* List / Table Area */}
          <div style={{ flex: 1, padding: "0.25rem 0.5rem", minWidth: 0, maxWidth: "100%", overflowX: "auto" }}>
            {data && data.recentTickets && data.recentTickets.length > 0 ? (
              <div className="table-responsive" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table
                  className="zen-table mb-0 w-100"
                  data-testid="recent-tickets-table"
                  style={{
                    width: "100%",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th scope="col" style={{ padding: "0.65rem 0.85rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "130px" }}>Ticket #</th>
                      <th scope="col" style={{ padding: "0.65rem 0.85rem", fontSize: "0.78rem" }}>Summary & Updated</th>
                      <th scope="col" style={{ textAlign: "center", padding: "0.65rem 0.6rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "100px" }}>Priority</th>
                      <th scope="col" style={{ textAlign: "center", padding: "0.65rem 0.6rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "115px" }}>Status</th>
                      <th scope="col" className="d-none d-sm-table-cell" style={{ textAlign: "center", padding: "0.65rem 0.5rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "75px" }}>Action</th>
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
                            title={ticket.summary || ticket.title || ticket.description}
                          >
                            {ticket.summary || ticket.title || ticket.description}
                          </div>
                          <span className="text-muted d-block" style={{ fontSize: "0.74rem" }}>
                            {formatUpdatedDate(ticket.updatedAt)}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.6rem", whiteSpace: "nowrap" }}>
                          {getPriorityBadge(ticket.requestedPriority)}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.6rem", whiteSpace: "nowrap" }}>
                          {getStatusBadge(ticket.currentStatus)}
                        </td>
                        <td className="d-none d-sm-table-cell" style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle", padding: "0.65rem 0.5rem" }}>
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
              <div className="zg-empty-state d-flex flex-column align-items-center justify-content-center h-100" data-testid="dashboard-empty-state" style={{ padding: "2.5rem" }}>
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
                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7" />
                    <path d="M22 13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
                    <path d="M2 13l3.5 4.5A2 2 0 0 0 7.1 19h9.8a2 2 0 0 0 1.6-1.5L22 13" />
                  </svg>
                </div>
                <h3 className="zg-empty-state-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>No support tickets yet</h3>
                <p className="zg-empty-state-text mb-3" style={{ fontSize: "0.82rem" }}>
                  Submit your first request and our support team will help you right away.
                </p>
                <button
                  type="button"
                  className="zen-btn-primary"
                  style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
                  onClick={() => {
                    window.location.hash = "#/create-ticket";
                    onNavigate("create-ticket");
                  }}
                  data-testid="empty-create-ticket-btn"
                >
                  + Create Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: IT Service Desk Support Card + Quick Actions Hub (50/50 Split) */}
      <div className="dashboard-bottom-grid">
        {/* Left: IT Service Desk Support Card */}
        <div className="zen-card p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "120px" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "var(--zg-pale-green)",
                  color: "var(--zg-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.92rem" }}>IT Service Desk Support</h3>
            </div>
            <span className="zen-badge zen-badge-resolved" style={{ fontSize: "0.74rem", padding: "0.22rem 0.55rem" }}>
              ● Support Agents Online
            </span>
          </div>

          <div style={{ fontSize: "0.82rem", color: "#64748B", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.75rem", alignItems: "center" }}>
            <div>
              <span className="text-muted d-block" style={{ fontSize: "0.74rem" }}>Working Hours</span>
              <span className="fw-semibold text-dark">Mon–Fri 08:30–17:30</span>
            </div>
            <div>
              <span className="text-muted d-block" style={{ fontSize: "0.74rem" }}>Response Target</span>
              <span className="fw-semibold text-success">&lt; 2 Hours</span>
            </div>
            <div>
              <span className="text-muted d-block" style={{ fontSize: "0.74rem" }}>Urgent Hotline</span>
              <span className="fw-semibold text-dark">Ext. 4357 (HELP)</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Status Filters Hub */}
        <div className="zg-quick-actions-card d-flex flex-column justify-content-between p-3" data-testid="quick-actions-card" style={{ margin: 0, minHeight: "120px" }}>
          {/* Quick Action Buttons */}
          <div className="d-flex align-items-center gap-2 mb-2">
            <button
              type="button"
              className="zg-quick-action-btn flex-grow-1"
              style={{ minHeight: "44px", padding: "0.5rem 0.95rem", justifyContent: "center" }}
              onClick={() => {
                window.location.hash = "#/create-ticket";
                onNavigate("create-ticket");
              }}
              data-testid="quick-action-create-ticket"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Ticket</span>
            </button>

            <button
              type="button"
              className="zg-quick-action-btn flex-grow-1"
              style={{ minHeight: "44px", padding: "0.5rem 0.95rem", justifyContent: "center" }}
              onClick={() => {
                window.location.hash = "#/my-tickets";
                onNavigate("my-tickets");
              }}
              data-testid="quick-action-view-tickets"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>View All ({totalTickets})</span>
            </button>
          </div>

          {/* Inline Quick Filter Status Pills */}
          <div className="d-flex align-items-center justify-content-between gap-1 flex-wrap" style={{ fontSize: "0.78rem" }}>
            <span className="text-muted fw-semibold" style={{ fontSize: "0.74rem" }}>Quick Filters:</span>
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem" }}
                onClick={() => handleCardClick("OPEN_GROUP")}
                title="Filter by all open tickets"
              >
                <span>Open</span>
                <span className="zg-status-pill-count">{openTickets}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem" }}
                onClick={() => handleCardClick("IN_PROGRESS")}
                title="Filter by in progress tickets"
              >
                <span>In Progress</span>
                <span className="zg-status-pill-count">{inProgressTickets}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem" }}
                onClick={() => handleCardClick("WAITING_FOR_REQUESTER")}
                title="Filter by tickets waiting for your input"
              >
                <span>Waiting</span>
                <span className="zg-status-pill-count">{waitingForRequesterTickets}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem" }}
                onClick={() => handleCardClick("RESOLVED")}
                title="Filter by resolved tickets"
              >
                <span>Resolved</span>
                <span className="zg-status-pill-count">{resolvedTickets}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem" }}
                onClick={() => handleCardClick("CLOSED")}
                title="Filter by closed tickets"
              >
                <span>Closed</span>
                <span className="zg-status-pill-count">{closedTickets}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
