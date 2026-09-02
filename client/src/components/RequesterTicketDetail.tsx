import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Priority, TicketStatus } from "../types";
import { useRequester } from "../context/RequesterContext";
import { fetchTicketDetail } from "../api";
import { AttachmentSection } from "./AttachmentSection";

interface RequesterTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export function RequesterTicketDetail({
  ticketId,
  onBack,
}: RequesterTicketDetailProps) {
  const { currentRequester } = useRequester();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicketDetail = useCallback(async () => {
    if (!currentRequester) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTicketDetail(ticketId, currentRequester.id);
      setTicket(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load ticket details from server."
      );
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, currentRequester]);

  useEffect(() => {
    loadTicketDetail();
  }, [loadTicketDetail]);

  function formatDate(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  function renderPriorityBadge(priority: Priority) {
    const config: Record<Priority, { label: string; className: string }> = {
      LOW: { label: "Low", className: "zen-badge-priority-low" },
      MEDIUM: { label: "Medium", className: "zen-badge-priority-medium" },
      HIGH: { label: "High", className: "zen-badge-priority-high" },
      URGENT: { label: "Urgent", className: "zen-badge-priority-urgent" },
    };
    const c = config[priority] || { label: priority, className: "" };
    return (
      <span
        className={`zen-badge ${c.className}`}
        data-testid={`badge-priority-${priority.toLowerCase()}`}
      >
        {c.label}
      </span>
    );
  }

  function renderStatusBadge(status: TicketStatus) {
    const config: Record<TicketStatus, { label: string; className: string }> = {
      NEW: { label: "New", className: "zen-badge-new" },
      OPEN: { label: "Open", className: "zen-badge-open" },
      IN_PROGRESS: { label: "In Progress", className: "zen-badge-in-progress" },
      PENDING: { label: "Pending", className: "zen-badge-pending" },
      RESOLVED: { label: "Resolved", className: "zen-badge-resolved" },
      CLOSED: { label: "Closed", className: "zen-badge-closed" },
      CANCELLED: { label: "Cancelled", className: "zen-badge-cancelled" },
    };
    const c = config[status] || { label: status, className: "" };
    return (
      <span
        className={`zen-badge ${c.className}`}
        data-testid={`badge-status-${status.toLowerCase()}`}
      >
        {c.label}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }} data-testid="detail-loading">
          <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid #CBD5E1", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: 0 }}>
            Loading ticket details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }} data-testid="detail-error">
          <div style={{ marginBottom: "0.75rem", color: "var(--color-error)" }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 style={{ color: "var(--color-error)", margin: "0 0 0.5rem" }}>Unable to Load Ticket</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {error || "Ticket not found or you do not have permission to view it."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button type="button" className="zen-btn-secondary" onClick={onBack} data-testid="detail-back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to My Tickets
            </button>
            <button type="button" className="zen-btn-primary" onClick={loadTicketDetail} data-testid="detail-retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }} data-testid="ticket-detail-view">
      {/* Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <button
          type="button"
          className="zen-btn-secondary"
          onClick={onBack}
          data-testid="back-to-list-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to My Tickets
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Ticket Detail Inspection (Read-Only)
        </span>
      </div>

      {/* Ticket Header Card */}
      <div className="zen-card" style={{ marginBottom: "1.25rem" }} data-testid="ticket-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
                data-testid="detail-ticket-number"
              >
                {ticket.ticketNumber}
              </span>
              {renderStatusBadge(ticket.currentStatus)}
              {renderPriorityBadge(ticket.requestedPriority)}
            </div>
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main)" }} data-testid="detail-summary">
              {ticket.summary}
            </h2>
          </div>

          <div style={{ textAlign: "right", fontSize: "0.8rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
            <div>Submitted: <strong style={{ color: "var(--color-text-main)" }}>{formatDate(ticket.createdAt)}</strong></div>
            <div style={{ marginTop: "2px" }}>Updated: <strong style={{ color: "var(--color-text-main)" }}>{formatDate(ticket.updatedAt)}</strong></div>
          </div>
        </div>
      </div>

      {/* Ticket Attributes Metadata Grid with Divided Sub-cards */}
      <div
        className="zen-card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1.25rem",
          backgroundColor: "#F8FAF8",
          border: "1px solid var(--color-border)",
          padding: "1rem",
        }}
        data-testid="ticket-meta-grid"
      >
        {/* Requester */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Requester
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0F172A" }}>
            {ticket.requester?.name || "Unknown"}
          </div>
          <div style={{ fontSize: "0.775rem", color: "#64748B", marginTop: "3px" }}>
            {ticket.requester?.department} • {ticket.requester?.email}
          </div>
        </div>

        {/* Category */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Category
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0F172A" }}>
            {ticket.category?.name || "Uncategorized"}
          </div>
        </div>

        {/* Related System */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Related System
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0F172A" }}>
            {ticket.relatedSystem?.name || "None Specified"}
          </div>
        </div>

        {/* Assigned IT Owner */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Assigned IT Owner
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: ticket.ticketOwner ? "#0F172A" : "#94A3B8" }}>
            {ticket.ticketOwner || "Unassigned"}
          </div>
        </div>
      </div>

      {/* Ticket Description Card */}
      <div className="zen-card" data-testid="ticket-description-card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "var(--color-primary-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Description
        </h3>
        <div
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-main)",
            whiteSpace: "pre-wrap",
            backgroundColor: "#F8FAF8",
            padding: "1rem",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
          }}
          data-testid="detail-description"
        >
          {ticket.description}
        </div>
      </div>

      {/* Attachment Section Component */}
      <AttachmentSection
        ticketId={ticket.id}
        attachments={ticket.attachments}
        onAttachmentChange={loadTicketDetail}
      />
    </div>
  );
}
