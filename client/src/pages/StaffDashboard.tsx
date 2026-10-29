import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { AppView } from "../components/Header";
import { fetchStaffDashboard, StaffDashboardData } from "../api";

interface StaffDashboardProps {
  onNavigate: (view: AppView, ticketId?: number) => void;
}

export function StaffDashboard({ onNavigate }: StaffDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.name ? user.name.split(" ")[0] : "Staff Member";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchStaffDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load staff dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrillDownStatus = (status: string) => {
    window.location.hash = `#/staff-queue?status=${status}`;
    onNavigate("staff-queue");
  };

  const handleDrillDownOwner = (owner: string) => {
    window.location.hash = `#/staff-queue?owner=${owner}`;
    onNavigate("staff-queue");
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

  const primary = data?.metrics?.primary;
  const unassigned = data?.metrics?.unassignedTickets ?? 0;
  const byStatus = data?.metrics?.byStatus;
  const byPriority = data?.metrics?.byPriority;

  // Max value for bar chart normalization
  const maxPriorityCount = Math.max(
    byPriority?.urgent ?? 0,
    byPriority?.high ?? 0,
    byPriority?.medium ?? 0,
    byPriority?.low ?? 0,
    1
  );

  return (
    <div className="dashboard-container dashboard-compact-fit" data-testid="staff-dashboard">
      {/* 1. Header Banner */}
      <div className="dashboard-banner mb-3">
        <div>
          <h1 className="dashboard-banner-title">Welcome back, {firstName}!</h1>
          <p className="dashboard-banner-subtitle">
            IT Service Desk Operational Overview & Workload Queue.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={loadData}
            disabled={isLoading}
            data-testid="staff-dashboard-refresh-btn"
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

      {/* 2. Top Row: 5 Metric Cards with Prominent Front Icon (BR-14, BR-15, AC-13, AC-15b) */}
      <div className="dashboard-metrics-grid mb-4" role="region" aria-label="IT Staff primary metrics summary">
        {/* 1. New */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleDrillDownStatus("NEW")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownStatus("NEW");
            }
          }}
          data-testid="metric-card-new"
          title="Click to view new untriaged tickets"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">New</div>
              <div className="zg-metric-card-value">{primary?.newTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Needs triage</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 2. Open */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleDrillDownStatus("OPEN")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownStatus("OPEN");
            }
          }}
          data-testid="metric-card-open"
          title="Click to view open acknowledged tickets"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F0FDF4", color: "var(--zg-primary)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Open</div>
              <div className="zg-metric-card-value">{primary?.openTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Ready for work</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 3. In Progress */}
        <div
          className="zg-metric-card active-accent"
          role="button"
          tabIndex={0}
          onClick={() => handleDrillDownStatus("IN_PROGRESS")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownStatus("IN_PROGRESS");
            }
          }}
          data-testid="metric-card-in-progress"
          title="Click to view tickets actively in remediation"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "var(--zg-pale-green)", color: "var(--zg-primary)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">In Progress</div>
              <div className="zg-metric-card-value">{primary?.inProgressTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Active remediation</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 4. Waiting for Requester */}
        <div
          className="zg-metric-card warning-accent"
          role="button"
          tabIndex={0}
          onClick={() => handleDrillDownStatus("WAITING_FOR_REQUESTER")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownStatus("WAITING_FOR_REQUESTER");
            }
          }}
          data-testid="metric-card-waiting"
          title="Click to view tickets blocked on user input"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">Waiting for Requester</div>
              <div className="zg-metric-card-value">{primary?.waitingForRequesterTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Blocked on user</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 5. My Assigned */}
        <div
          className="zg-metric-card"
          role="button"
          tabIndex={0}
          onClick={() => handleDrillDownOwner("me")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDrillDownOwner("me");
            }
          }}
          data-testid="metric-card-my-assigned"
          title="Click to view tickets assigned directly to you"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="zg-metric-icon-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-grow-1 min-w-0">
              <div className="zg-metric-card-title">My Assigned</div>
              <div className="zg-metric-card-value">{primary?.myAssignedTickets ?? 0}</div>
            </div>
          </div>
          <div className="zg-metric-card-hint mt-2">
            <span>Assigned to me</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Priority Bar Chart & Unassigned Focus (Left) + Spacious Recent Queue Table (Right) */}
      <div className="dashboard-middle-grid mb-4">
        {/* Left: Priority & Workload Analytics Bar Chart with Zen Green Harmony */}
        <div className="zen-card p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%" }}>
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                  Active Queue Priority & Triage Health
                </h2>
                <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                  Real-time urgency distribution across active tickets
                </span>
              </div>
              {/* Unassigned Callout Badge inside card */}
              <div
                className="d-flex align-items-center gap-2 p-1 px-2 rounded border"
                role="button"
                tabIndex={0}
                onClick={() => handleDrillDownOwner("unassigned")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleDrillDownOwner("unassigned");
                  }
                }}
                data-testid="metric-card-unassigned"
                style={{
                  backgroundColor: unassigned > 0 ? "var(--zg-pale-green)" : "#F8FAFC",
                  borderColor: unassigned > 0 ? "var(--zg-primary)" : "#E2E8F0",
                  cursor: "pointer",
                }}
                title="Click to view unassigned tickets in queue"
              >
                <div style={{ color: "var(--zg-primary)", fontWeight: 700, fontSize: "1.2rem" }}>
                  {unassigned}
                </div>
                <div style={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
                  <span className="fw-bold d-block text-dark">Unassigned Queue</span>
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Needs triage &rarr;</span>
                </div>
              </div>
            </div>

            {/* Priority badges strip with clickable testids */}
            {byPriority && (
              <div className="d-flex flex-wrap align-items-center gap-2 py-2 mb-2 border-bottom" style={{ borderColor: "#F1F5F9" }} role="region" aria-label="Tickets by Priority">
                <span
                  className="zen-badge zen-badge-priority-urgent"
                  data-testid="priority-badge-urgent"
                  style={{ fontSize: "0.76rem", padding: "0.24rem 0.6rem", cursor: "pointer" }}
                  onClick={() => {
                    window.location.hash = "#/staff-queue?priority=URGENT";
                    onNavigate("staff-queue");
                  }}
                  title="Filter queue by Urgent priority"
                >
                  Urgent: <strong>{byPriority.urgent}</strong>
                </span>
                <span
                  className="zen-badge zen-badge-priority-high"
                  data-testid="priority-badge-high"
                  style={{ fontSize: "0.76rem", padding: "0.24rem 0.6rem", cursor: "pointer" }}
                  onClick={() => {
                    window.location.hash = "#/staff-queue?priority=HIGH";
                    onNavigate("staff-queue");
                  }}
                  title="Filter queue by High priority"
                >
                  High: <strong>{byPriority.high}</strong>
                </span>
                <span
                  className="zen-badge zen-badge-priority-medium"
                  data-testid="priority-badge-medium"
                  style={{ fontSize: "0.76rem", padding: "0.24rem 0.6rem", cursor: "pointer" }}
                  onClick={() => {
                    window.location.hash = "#/staff-queue?priority=MEDIUM";
                    onNavigate("staff-queue");
                  }}
                  title="Filter queue by Medium priority"
                >
                  Medium: <strong>{byPriority.medium}</strong>
                </span>
                <span
                  className="zen-badge zen-badge-priority-low"
                  data-testid="priority-badge-low"
                  style={{ fontSize: "0.76rem", padding: "0.24rem 0.6rem", cursor: "pointer" }}
                  onClick={() => {
                    window.location.hash = "#/staff-queue?priority=LOW";
                    onNavigate("staff-queue");
                  }}
                  title="Filter queue by Low priority"
                >
                  Low: <strong>{byPriority.low}</strong>
                </span>
              </div>
            )}
          </div>

          {/* SVG Priority Bar Visualization (Zen Green Cohesive Theme, No Clipping) */}
          <div style={{ position: "relative", width: "100%", height: "230px", marginTop: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <svg viewBox="0 0 500 160" preserveAspectRatio="none" style={{ width: "100%", height: "180px", overflow: "visible" }}>
              {/* Background Grid Lines */}
              <line x1="0" y1="35" x2="500" y2="35" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#E2E8F0" strokeWidth="1" />

              {/* Bar 1: Urgent - Refined Soft Crimson */}
              {(() => {
                const uCount = byPriority?.urgent ?? 0;
                const h = Math.max(12, Math.round((uCount / maxPriorityCount) * 100));
                return (
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      window.location.hash = "#/staff-queue?priority=URGENT";
                      onNavigate("staff-queue");
                    }}
                  >
                    <rect x="45" y={130 - h} width="50" height={h} rx="6" fill="#BE123C" opacity="0.88" />
                    <text x="70" y={120 - h} textAnchor="middle" fill="#9F1239" fontSize="12" fontWeight="700">
                      {uCount}
                    </text>
                  </g>
                );
              })()}

              {/* Bar 2: High - Refined Warm Amber */}
              {(() => {
                const hCount = byPriority?.high ?? 0;
                const h = Math.max(12, Math.round((hCount / maxPriorityCount) * 100));
                return (
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      window.location.hash = "#/staff-queue?priority=HIGH";
                      onNavigate("staff-queue");
                    }}
                  >
                    <rect x="170" y={130 - h} width="50" height={h} rx="6" fill="#D97706" opacity="0.88" />
                    <text x="195" y={120 - h} textAnchor="middle" fill="#B45309" fontSize="12" fontWeight="700">
                      {hCount}
                    </text>
                  </g>
                );
              })()}

              {/* Bar 3: Medium - Zen Emerald */}
              {(() => {
                const mCount = byPriority?.medium ?? 0;
                const h = Math.max(12, Math.round((mCount / maxPriorityCount) * 100));
                return (
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      window.location.hash = "#/staff-queue?priority=MEDIUM";
                      onNavigate("staff-queue");
                    }}
                  >
                    <rect x="295" y={130 - h} width="50" height={h} rx="6" fill="#059669" opacity="0.88" />
                    <text x="320" y={120 - h} textAnchor="middle" fill="#047857" fontSize="12" fontWeight="700">
                      {mCount}
                    </text>
                  </g>
                );
              })()}

              {/* Bar 4: Low - Zen Green Primary */}
              {(() => {
                const lCount = byPriority?.low ?? 0;
                const h = Math.max(12, Math.round((lCount / maxPriorityCount) * 100));
                return (
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      window.location.hash = "#/staff-queue?priority=LOW";
                      onNavigate("staff-queue");
                    }}
                  >
                    <rect x="420" y={130 - h} width="50" height={h} rx="6" fill="#006B3C" opacity="0.88" />
                    <text x="445" y={120 - h} textAnchor="middle" fill="#006B3C" fontSize="12" fontWeight="700">
                      {lCount}
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* X-Axis Labels comfortably spaced inside card */}
            <div className="d-flex justify-content-around text-muted pb-1 px-2" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              <span
                style={{ color: "#BE123C", cursor: "pointer" }}
                onClick={() => {
                  window.location.hash = "#/staff-queue?priority=URGENT";
                  onNavigate("staff-queue");
                }}
              >
                Urgent
              </span>
              <span
                style={{ color: "#D97706", cursor: "pointer" }}
                onClick={() => {
                  window.location.hash = "#/staff-queue?priority=HIGH";
                  onNavigate("staff-queue");
                }}
              >
                High
              </span>
              <span
                style={{ color: "#059669", cursor: "pointer" }}
                onClick={() => {
                  window.location.hash = "#/staff-queue?priority=MEDIUM";
                  onNavigate("staff-queue");
                }}
              >
                Medium
              </span>
              <span
                style={{ color: "#006B3C", cursor: "pointer" }}
                onClick={() => {
                  window.location.hash = "#/staff-queue?priority=LOW";
                  onNavigate("staff-queue");
                }}
              >
                Low
              </span>
            </div>
          </div>
        </div>

        {/* Right: Recent Queue Tickets (Spacious Table, All 5 Rows Fit Without Scrollbar) */}
        <div className="zen-card p-0 shadow-sm d-flex flex-column" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "380px", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
          <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom" style={{ borderColor: "#E2E8F0" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.98rem" }}>
                Recent Queue Tickets
              </h2>
              <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                Active triage tickets requiring service desk remediation
              </span>
            </div>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              onClick={() => {
                window.location.hash = "#/staff-queue";
                onNavigate("staff-queue");
              }}
              style={{ color: "var(--zg-primary)", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}
            >
              Open Full Queue &rarr;
            </button>
          </div>

          {/* List / Table Area */}
          <div style={{ flex: 1, padding: "0.25rem 0.5rem", minWidth: 0, maxWidth: "100%", overflowX: "auto" }}>
            {data && data.recentTickets && data.recentTickets.length > 0 ? (
              <div className="table-responsive" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table
                  className="zen-table mb-0 w-100"
                  data-testid="staff-recent-tickets-table"
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
                      <th scope="col" className="d-none d-sm-table-cell" style={{ padding: "0.65rem 0.75rem", fontSize: "0.78rem", whiteSpace: "nowrap", width: "135px" }}>Requester</th>
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
                            {formatUpdatedDate(ticket.updatedAt)} {ticket.ticketOwner ? `• ${ticket.ticketOwner.name}` : ""}
                            {ticket.requester ? (
                              <span className="d-sm-none"> • Req: {ticket.requester.name}</span>
                            ) : null}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.5rem", whiteSpace: "nowrap" }}>
                          {getPriorityBadge(ticket.itPriority)}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0.65rem 0.5rem", whiteSpace: "nowrap" }}>
                          {getStatusBadge(ticket.currentStatus)}
                        </td>
                        <td className="d-none d-sm-table-cell" style={{ verticalAlign: "middle", padding: "0.65rem 0.75rem" }}>
                          <span className="text-dark fw-medium text-truncate d-inline-block" style={{ fontSize: "0.82rem", maxWidth: "100%", whiteSpace: "nowrap" }}>
                            {ticket.requester?.name || "—"}
                          </span>
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
              <div className="zg-empty-state d-flex flex-column align-items-center justify-content-center h-100" data-testid="staff-queue-empty" style={{ padding: "2.5rem" }}>
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
                <h3 className="zg-empty-state-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Queue clear!</h3>
                <p className="zg-empty-state-text mb-0" style={{ fontSize: "0.82rem" }}>
                  No tickets currently requiring triage. Great job staying on top of the queue!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: 8-Status Distribution Pills + Staff Quick Actions Hub */}
      <div className="dashboard-bottom-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)", gap: "1.25rem" }}>
        {/* Left: 8 Lifecycle Status Distribution Pills (Guaranteed Single Row) */}
        <div className="dashboard-breakdown-section p-3 shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFFF", margin: 0, border: "1px solid #E2E8F0", borderRadius: "10px", minHeight: "120px" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted fw-bold" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Full Lifecycle Status Breakdown (Click to filter queue):
            </span>
            <span className="zen-badge" style={{ backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "0.72rem", padding: "0.18rem 0.5rem" }}>
              8 States
            </span>
          </div>

          {byStatus && (
            <div
              className="dashboard-pills-wrap"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
                gap: "0.35rem",
                width: "100%",
              }}
              role="region"
              aria-label="Status Breakdown Pills"
            >
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("NEW")}
                data-testid="status-pill-new"
                title="Filter by New tickets"
              >
                <span>New</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.new}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("OPEN")}
                data-testid="status-pill-open"
                title="Filter by Open tickets"
              >
                <span>Open</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.open}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("IN_PROGRESS")}
                data-testid="status-pill-in-progress"
                title="Filter by In Progress tickets"
              >
                <span>In Prog</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.inProgress}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("WAITING_FOR_REQUESTER")}
                data-testid="status-pill-waiting"
                title="Filter by Waiting for Requester tickets"
              >
                <span>Waiting</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.waitingForRequester}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("RESOLVED")}
                data-testid="status-pill-resolved"
                title="Filter by Resolved tickets"
              >
                <span>Resolved</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.resolved}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("CLOSED")}
                data-testid="status-pill-closed"
                title="Filter by Closed tickets"
              >
                <span>Closed</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.closed}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("REOPENED")}
                data-testid="status-pill-reopened"
                title="Filter by Reopened tickets"
              >
                <span>Reopened</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.reopened}</span>
              </button>
              <button
                type="button"
                className="zg-status-pill"
                style={{ padding: "0.28rem 0.2rem", fontSize: "0.72rem", width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
                onClick={() => handleDrillDownStatus("CANCELLED")}
                data-testid="status-pill-cancelled"
                title="Filter by Cancelled tickets"
              >
                <span>Cancelled</span>
                <span className="zg-status-pill-count" style={{ marginLeft: "0.25rem" }}>{byStatus.cancelled}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="zg-quick-actions-card p-3 shadow-sm d-flex align-items-center justify-content-between gap-2" data-testid="quick-actions-card" style={{ margin: 0, minHeight: "120px" }}>
          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={() => handleDrillDownOwner("me")}
            data-testid="quick-action-my-queue"
            title="View tickets assigned directly to you"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>My Queue ({primary?.myAssignedTickets ?? 0})</span>
          </button>

          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={() => {
              window.location.hash = "#/staff-queue";
              onNavigate("staff-queue");
            }}
            data-testid="quick-action-search-tickets"
            title="Search tickets across entire queue"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search Tickets</span>
          </button>

          <button
            type="button"
            className="zg-quick-action-btn flex-grow-1"
            style={{ minHeight: "44px", padding: "0.5rem 0.85rem", fontSize: "0.85rem", justifyContent: "center" }}
            onClick={() => {
              window.location.hash = "#/create-ticket";
              onNavigate("create-ticket");
            }}
            data-testid="quick-action-create-ticket"
            title="Create new support ticket"
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
