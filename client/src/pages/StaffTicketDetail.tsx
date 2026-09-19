import React, { useState, useEffect, useCallback } from "react";
import {
  StaffTicketDetailData,
  StaffTicketOwner,
  Priority,
  TicketStatus,
} from "../types";
import { useAuth } from "../context/AuthContext";
import {
  fetchStaffTicketDetail,
  fetchStaffMembers,
  claimStaffTicket,
  assignStaffTicket,
  updateStaffTicketPriority,
  updateStaffTicketStatus,
} from "../api";
import { CommentsNotesSection } from "../components/CommentsNotesSection";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const PERMITTED_STATUS_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: [],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

export function StaffTicketDetail({ ticketId, onBack }: StaffTicketDetailProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<StaffTicketDetailData | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffTicketOwner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Operational Action states
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | "">("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority | "">("");
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TicketStatus | "">("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);

  const loadTicketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketData, staffList] = await Promise.all([
        fetchStaffTicketDetail(ticketId),
        fetchStaffMembers().catch(() => []),
      ]);
      setTicket(ticketData);
      setStaffMembers(staffList);
      setSelectedPriority(ticketData.itPriority);
      if (ticketData.ticketOwner?.id) {
        setSelectedOwnerId(ticketData.ticketOwner.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket detail");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // Handle Claim
  async function handleClaim() {
    if (!ticket) return;
    setIsClaiming(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await claimStaffTicket(ticket.id);
      setTicket((prev) => (prev ? { ...prev, ticketOwner: res.ticketOwner } : null));
      setSelectedOwnerId(res.ticketOwner.id);
      setActionSuccess("Ticket successfully claimed by you.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to claim ticket");
    } finally {
      setIsClaiming(false);
    }
  }

  // Handle Assign
  async function handleAssign() {
    if (!ticket || !selectedOwnerId) return;
    setIsReassigning(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await assignStaffTicket(ticket.id, Number(selectedOwnerId));
      setTicket((prev) => (prev ? { ...prev, ticketOwner: res.ticketOwner } : null));
      setActionSuccess(`Ticket reassigned to ${res.ticketOwner.name}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reassign ticket");
    } finally {
      setIsReassigning(false);
    }
  }

  // Handle Priority Change
  async function handleUpdatePriority() {
    if (!ticket || !selectedPriority || selectedPriority === ticket.itPriority) return;
    setIsUpdatingPriority(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await updateStaffTicketPriority(ticket.id, selectedPriority as Priority);
      setTicket((prev) => (prev ? { ...prev, itPriority: res.itPriority } : null));
      setActionSuccess(`IT Priority updated to ${res.itPriority}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update IT Priority");
    } finally {
      setIsUpdatingPriority(false);
    }
  }

  // Handle Status Transition
  async function handleConfirmStatusTransition() {
    if (!ticket || !targetStatus) return;
    setIsUpdatingStatus(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await updateStaffTicketStatus(ticket.id, targetStatus as TicketStatus);
      setTicket((prev) => (prev ? { ...prev, currentStatus: res.currentStatus } : null));
      setActionSuccess(`Status transitioned to ${res.currentStatus}.`);
      setTargetStatus("");
      setIsConfirmingStatus(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to transition status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
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

  function renderStatusBadge(status: TicketStatus) {
    const config: Record<TicketStatus, { label: string; className: string }> = {
      NEW: { label: "New", className: "zen-badge-new" },
      OPEN: { label: "Open", className: "zen-badge-open" },
      IN_PROGRESS: { label: "In Progress", className: "zen-badge-in-progress" },
      WAITING_FOR_REQUESTER: { label: "Waiting for Requester", className: "zen-badge-pending" },
      PENDING: { label: "Pending", className: "zen-badge-pending" },
      RESOLVED: { label: "Resolved", className: "zen-badge-resolved" },
      CLOSED: { label: "Closed", className: "zen-badge-closed" },
      REOPENED: { label: "Reopened", className: "zen-badge-open" },
      CANCELLED: { label: "Cancelled", className: "zen-badge-cancelled" },
    };
    const c = config[status] || { label: status, className: "" };
    return (
      <span className={`zen-badge ${c.className}`} data-testid={`badge-status-${status.toLowerCase()}`}>
        {c.label}
      </span>
    );
  }

  function renderPriorityBadge(priority: Priority, prefix: string) {
    const config: Record<Priority, { label: string; className: string }> = {
      LOW: { label: "Low", className: "zen-badge-priority-low" },
      MEDIUM: { label: "Medium", className: "zen-badge-priority-medium" },
      HIGH: { label: "High", className: "zen-badge-priority-high" },
      URGENT: { label: "Urgent", className: "zen-badge-priority-urgent" },
    };
    const c = config[priority] || { label: priority, className: "" };
    return (
      <span className={`zen-badge ${c.className}`} data-testid={`badge-${prefix}-priority-${priority.toLowerCase()}`}>
        {c.label}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-card text-center p-5" data-testid="staff-detail-loading">
          <div
            className="spinner-border text-success mb-3"
            role="status"
            style={{ width: "2rem", height: "2rem" }}
          />
          <p className="text-muted mb-0">Loading ticket operational details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-card text-center p-5" data-testid="staff-detail-error">
          <h3 className="text-danger mb-2">Unable to Load Ticket</h3>
          <p className="text-muted mb-4">{error || "The requested ticket was not found."}</p>
          <div className="d-flex justify-content-center gap-2">
            <button type="button" className="zen-btn-secondary" onClick={onBack} data-testid="back-to-queue-btn">
              Back to Ticket Queue
            </button>
            <button type="button" className="zen-btn-primary" onClick={loadTicketData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isClosedOrCancelled = ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED";
  const isAssignedToCurrentUser = ticket.ticketOwner?.id === user?.id;
  const permittedNextStatuses = PERMITTED_STATUS_TRANSITIONS[ticket.currentStatus] || [];

  return (
    <div className="zen-container" style={{ paddingTop: "1.25rem", paddingBottom: "3rem" }} data-testid="staff-ticket-detail-view">
      {/* Top Navigation */}
      <div className="zen-detail-nav-bar mb-3">
        <button
          type="button"
          className="zen-btn-secondary zen-btn-back"
          onClick={onBack}
          data-testid="back-to-queue-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Ticket Queue</span>
        </button>
        <span className="zen-detail-nav-hint">
          IT Staff Ticket Operations
        </span>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert" data-testid="action-success-alert">
          {actionSuccess}
          <button type="button" className="btn-close" onClick={() => setActionSuccess(null)} aria-label="Close" />
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert" data-testid="action-error-alert">
          {actionError}
          <button type="button" className="btn-close" onClick={() => setActionError(null)} aria-label="Close" />
        </div>
      )}

      {/* Problem Appears Resolved Alert */}
      {ticket.problemAppearsResolved && (
        <div
          className="p-3 mb-3 d-flex align-items-center justify-content-between"
          style={{
            backgroundColor: "#ECFDF5",
            border: "1px solid #10B981",
            borderRadius: "8px",
            color: "#065F46",
          }}
          data-testid="resolved-indication-banner"
        >
          <div className="d-flex align-items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <strong>Requester marked problem as resolved!</strong>
              <div style={{ fontSize: "0.85rem", color: "#047857" }}>
                The requester signaled that this issue appears resolved. Review and transition ticket status to RESOLVED or CLOSED when confirmed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Header Card */}
      <div className="zen-card mb-3" data-testid="ticket-header-card">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
                data-testid="staff-detail-ticket-number"
              >
                {ticket.ticketNumber}
              </span>
              {renderStatusBadge(ticket.currentStatus)}
              <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Req Priority: {renderPriorityBadge(ticket.requestedPriority, "req")}
              </span>
              <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "#64748B" }}>
                IT Priority: {renderPriorityBadge(ticket.itPriority, "it")}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)" }} data-testid="staff-detail-summary">
              {ticket.summary}
            </h2>
          </div>

          <div style={{ textAlign: "right", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            <div>Submitted: <strong style={{ color: "var(--color-text-main)" }}>{formatDate(ticket.createdAt)}</strong></div>
            <div style={{ marginTop: "2px" }}>Updated: <strong style={{ color: "var(--color-text-main)" }}>{formatDate(ticket.updatedAt)}</strong></div>
          </div>
        </div>
      </div>

      {/* Operational Actions Card (Claim, Reassign, Priority, Status) */}
      <div
        className="zen-card mb-3"
        data-testid="staff-operations-bar"
        style={{
          backgroundColor: "#F8FAF8",
          border: "1px solid #CBD5E1",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-primary-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Operational Ticket Controls
        </h3>

        <div className="row g-3 align-items-end">
          {/* 1. Claim Action */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="zen-form-label" style={{ fontSize: "0.775rem", marginBottom: "0.35rem" }}>
              Ticket Ownership
            </label>
            <div>
              <button
                type="button"
                className="w-100"
                onClick={handleClaim}
                disabled={isClaiming || isClosedOrCancelled || isAssignedToCurrentUser}
                data-testid="claim-ticket-btn"
                style={{
                  height: "38px",
                  borderRadius: "8px",
                  border: isAssignedToCurrentUser ? "1px solid #10B981" : "1px solid var(--color-primary)",
                  backgroundColor: isAssignedToCurrentUser ? "#ECFDF5" : "var(--color-primary)",
                  color: isAssignedToCurrentUser ? "#065F46" : "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isClaiming || isClosedOrCancelled || isAssignedToCurrentUser ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {isAssignedToCurrentUser ? (
                  <span className="d-flex align-items-center justify-content-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Assigned to You
                  </span>
                ) : isClaiming ? "Claiming..." : "Claim Ownership"}
              </button>
            </div>
          </div>

          {/* 2. Reassign Action */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="zen-form-label" style={{ fontSize: "0.775rem", marginBottom: "0.35rem" }}>
              Reassign Owner
            </label>
            <div className="d-flex gap-1">
              <select
                className="form-select form-select-sm"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value ? Number(e.target.value) : "")}
                disabled={isReassigning || isClosedOrCancelled}
                data-testid="reassign-owner-select"
                style={{ height: "38px", borderRadius: "8px", fontSize: "0.825rem" }}
              >
                <option value="">Select IT Staff...</option>
                {staffMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === user?.id ? "(You)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={handleAssign}
                disabled={isReassigning || isClosedOrCancelled || !selectedOwnerId || selectedOwnerId === ticket.ticketOwner?.id}
                data-testid="reassign-owner-btn"
                style={{ height: "38px", padding: "0 0.75rem", fontSize: "0.825rem", whiteSpace: "nowrap" }}
              >
                {isReassigning ? "..." : "Reassign"}
              </button>
            </div>
          </div>

          {/* 3. IT Priority Selector */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="zen-form-label" style={{ fontSize: "0.775rem", marginBottom: "0.35rem" }}>
              IT Priority
            </label>
            <div className="d-flex gap-1">
              <select
                className="form-select form-select-sm"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                disabled={isUpdatingPriority || isClosedOrCancelled}
                data-testid="it-priority-select"
                style={{ height: "38px", borderRadius: "8px", fontSize: "0.825rem" }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={handleUpdatePriority}
                disabled={isUpdatingPriority || isClosedOrCancelled || !selectedPriority || selectedPriority === ticket.itPriority}
                data-testid="update-priority-btn"
                style={{ height: "38px", padding: "0 0.75rem", fontSize: "0.825rem", whiteSpace: "nowrap" }}
              >
                {isUpdatingPriority ? "..." : "Update"}
              </button>
            </div>
          </div>

          {/* 4. Status Transition Selector with Modal Confirmation */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="zen-form-label" style={{ fontSize: "0.775rem", marginBottom: "0.35rem" }}>
              Status Workflow
            </label>
            <div className="d-flex gap-1">
              <select
                className="form-select form-select-sm"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as TicketStatus)}
                disabled={isClosedOrCancelled || permittedNextStatuses.length === 0}
                data-testid="status-transition-select"
                style={{ height: "38px", borderRadius: "8px", fontSize: "0.825rem" }}
              >
                <option value="">Next status...</option>
                {permittedNextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="zen-btn-primary"
                onClick={() => setIsConfirmingStatus(true)}
                disabled={!targetStatus || isClosedOrCancelled}
                data-testid="transition-status-btn"
                style={{ height: "38px", padding: "0 0.75rem", fontSize: "0.825rem", whiteSpace: "nowrap" }}
              >
                Transition
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Transition Confirmation Modal */}
      {isConfirmingStatus && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          data-testid="status-confirm-modal"
        >
          <div
            className="zen-card"
            style={{
              maxWidth: "460px",
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>
              Confirm Status Transition
            </h4>
            <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Are you sure you want to transition this ticket from <strong>{ticket.currentStatus}</strong> to{" "}
              <strong style={{ color: "var(--color-primary)" }}>{targetStatus}</strong>?
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={() => setIsConfirmingStatus(false)}
                disabled={isUpdatingStatus}
                data-testid="cancel-status-transition-btn"
                style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="zen-btn-primary"
                onClick={handleConfirmStatusTransition}
                disabled={isUpdatingStatus}
                data-testid="confirm-status-transition-btn"
                style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
              >
                {isUpdatingStatus ? "Transitioning..." : "Confirm Transition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div
        className="zen-card mb-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.85rem",
          backgroundColor: "#F8FAF8",
          border: "1px solid var(--color-border)",
          padding: "1rem",
        }}
        data-testid="staff-detail-meta-grid"
      >
        {/* Requester */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem" }}>
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
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem" }}>
            Category
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0F172A" }}>
            {ticket.category?.name || "Uncategorized"}
          </div>
        </div>

        {/* Related System */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem" }}>
            Related System
          </div>
          <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0F172A" }}>
            {ticket.relatedSystem?.name || "None Specified"}
          </div>
        </div>

        {/* Assigned Owner */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.35rem" }}>
            Assigned IT Owner
          </div>
          <div
            style={{ fontSize: "0.925rem", fontWeight: 600, color: ticket.ticketOwner ? "#0F172A" : "#94A3B8" }}
            data-testid="staff-detail-owner-name"
          >
            {ticket.ticketOwner?.name || "Unassigned"}
          </div>
          {ticket.ticketOwner?.email && (
            <div style={{ fontSize: "0.775rem", color: "#64748B", marginTop: "3px" }}>
              {ticket.ticketOwner.email}
            </div>
          )}
        </div>
      </div>

      {/* Description Card */}
      <div className="zen-card mb-3" data-testid="staff-detail-description-card">
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "var(--color-primary-dark)" }}>
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
          data-testid="staff-detail-description"
        >
          {ticket.description}
        </div>
      </div>

      {/* Attachments Card */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="zen-card mb-3" data-testid="staff-detail-attachments-card">
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "var(--color-primary-dark)" }}>
            Attachments ({ticket.attachments.length})
          </h3>
          <div className="d-flex flex-column gap-2">
            {ticket.attachments.map((att) => (
              <div
                key={att.id}
                className="d-flex justify-content-between align-items-center p-2 border rounded"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{att.fileName || att.originalName}</span>
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                    ({Math.round((att.fileSize || att.sizeBytes || 0) / 1024)} KB)
                  </span>
                </div>
                <a
                  href={`/api/attachments/${att.id}/download`}
                  className="zen-btn-secondary"
                  style={{ fontSize: "0.775rem", padding: "0.25rem 0.65rem", textDecoration: "none" }}
                  download
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments & Notes Section (Dual-Panel for Staff) */}
      <CommentsNotesSection
        ticketId={ticket.id}
        isStaff={true}
        initialComments={ticket.publicComments}
        initialNotes={ticket.internalNotes}
      />
    </div>
  );
}
