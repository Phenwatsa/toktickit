import React, { useState, useEffect, useCallback, useRef } from "react";
import { ActionTakenItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { fetchActionsTaken, createActionTaken, updateActionTaken } from "../api";
import { ActionTakenModal, ActionTakenFormData } from "./ActionTakenModal";

interface ActionsTakenSectionProps {
  ticketId: number;
  isStaff?: boolean;
  isCancelled?: boolean;
  onActionsUpdated?: () => void;
}

export function ActionsTakenSection({
  ticketId,
  isStaff: propIsStaff,
  isCancelled = false,
  onActionsUpdated,
}: ActionsTakenSectionProps) {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionTakenItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTakenItem | null>(null);
  const addActionBtnRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);

  // Determine whether current user has Staff/Admin edit authority
  const isStaffOrAdmin =
    propIsStaff !== undefined
      ? propIsStaff
      : user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActionsTaken(ticketId);
      setActions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load Actions Taken records");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  function handleOpenCreateModal(e?: React.MouseEvent<HTMLElement>) {
    activeTriggerRef.current = (e?.currentTarget as HTMLElement) || addActionBtnRef.current;
    setEditingAction(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(action: ActionTakenItem, e?: React.MouseEvent<HTMLElement>) {
    activeTriggerRef.current = (e?.currentTarget as HTMLElement) || null;
    setEditingAction(action);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingAction(null);
  }

  async function handleModalSubmit(formData: ActionTakenFormData) {
    if (editingAction) {
      // Update action
      const updated = await updateActionTaken(ticketId, editingAction.id, {
        actionDescription: formData.actionDescription,
        result: formData.result,
        isFollowUpRequired: formData.isFollowUpRequired,
        followUpNote: formData.followUpNote,
        attachmentNotes: formData.attachmentNotes,
      });

      setActions((prev) =>
        prev.map((act) => (act.id === updated.id ? { ...act, ...updated } : act))
      );
    } else {
      // Create action
      const created = await createActionTaken(ticketId, {
        actionDateTime: formData.actionDateTime,
        actionDescription: formData.actionDescription,
        result: formData.result,
        isFollowUpRequired: formData.isFollowUpRequired,
        followUpNote: formData.followUpNote,
        attachmentNotes: formData.attachmentNotes,
      });

      setActions((prev) => [...prev, created]);
    }

    // Trigger parent refresh if provided
    if (onActionsUpdated) {
      onActionsUpdated();
    }
  }

  function formatDateTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  }

  return (
    <div
      className="zen-card actions-taken-container"
      style={{
        marginBottom: "1.25rem",
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        padding: "1.25rem",
      }}
      data-testid="actions-taken-section"
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-primary)" }}
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="m9 14 2 2 4-4" />
              </svg>
              <span>Actions Taken</span>
            </h3>
            <span
              className="zen-badge"
              style={{
                backgroundColor: "var(--color-pale-green)",
                color: "var(--color-primary)",
                fontWeight: 700,
                fontSize: "0.75rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "12px",
              }}
              data-testid="actions-count-badge"
            >
              {actions.length}
            </span>
          </div>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            Operational record of diagnostic and remediation activities.
          </p>
        </div>

        {/* IT Staff & Administrator Add Action Button */}
        {isStaffOrAdmin && (
          <button
            ref={addActionBtnRef}
            type="button"
            className="zen-btn-primary"
            onClick={handleOpenCreateModal}
            disabled={isCancelled}
            data-testid="add-action-btn"
            style={{
              fontSize: "0.85rem",
              padding: "0.45rem 0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              minHeight: "38px",
            }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
            <span>Add Action Taken</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
          data-testid="actions-error-alert"
        >
          {error}
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div data-testid="actions-skeleton">
          <div className="zg-skeleton-card" style={{ height: "90px" }} />
          <div className="zg-skeleton-card" style={{ height: "90px" }} />
        </div>
      ) : actions.length === 0 ? (
        /* Empty State */
        <div
          className="zg-empty-state"
          data-testid="actions-empty-state"
          style={{ padding: "2rem 1.25rem" }}
        >
          <div className="zg-empty-state-icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="zg-empty-state-title" style={{ fontSize: "0.95rem" }}>
            No diagnostic actions recorded yet.
          </div>
          <div className="zg-empty-state-text" style={{ fontSize: "0.825rem" }}>
            No diagnostic actions recorded yet. IT Staff will log investigation and troubleshooting steps here.
          </div>
        </div>
      ) : (
        /* Actions List Display */
        <div>
          {/* Desktop Table View */}
          <div className="actions-taken-table-wrap">
            <table
              className="actions-taken-desktop-table"
              style={{
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
              data-testid="actions-desktop-table"
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-pale-green)",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-primary-dark)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, width: "18%" }}>
                    Date & Performer
                  </th>
                  <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, width: "32%" }}>
                    Description
                  </th>
                  <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, width: "26%" }}>
                    Result
                  </th>
                  <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, width: "16%" }}>
                    Follow-Up & Notes
                  </th>
                  {isStaffOrAdmin && (
                    <th
                      style={{
                        padding: "0.75rem 0.85rem",
                        fontWeight: 700,
                        width: "8%",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr
                    key={act.id}
                    data-action-id={act.id}
                    data-testid={`action-row-${act.id}`}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      verticalAlign: "top",
                    }}
                  >
                    <td style={{ padding: "0.85rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {formatDateTime(act.actionDateTime)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.775rem",
                          color: "var(--color-text-muted)",
                          marginTop: "0.2rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span className="zen-badge" style={{ backgroundColor: "#F1F5F9", color: "#334155" }}>
                          By {act.performedBy?.name || "IT Staff"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem", color: "var(--color-text-main)", lineHeight: 1.5 }}>
                      {act.actionDescription}
                    </td>
                    <td style={{ padding: "0.85rem", color: "var(--color-text-main)", lineHeight: 1.5 }}>
                      {act.result}
                    </td>
                    <td style={{ padding: "0.85rem" }}>
                      {act.isFollowUpRequired ? (
                        <div
                          style={{
                            backgroundColor: "#FEF3C7",
                            border: "1px solid #F59E0B",
                            borderRadius: "6px",
                            padding: "0.4rem 0.55rem",
                            fontSize: "0.775rem",
                            color: "#92400E",
                            marginBottom: act.attachmentNotes ? "0.35rem" : 0,
                          }}
                          data-testid={`followup-badge-${act.id}`}
                        >
                          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>Follow-Up Needed</span>
                          </div>
                          {act.followUpNote && (
                            <div style={{ marginTop: "0.2rem", lineHeight: 1.4 }}>
                              Follow-Up Required: {act.followUpNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          None
                        </span>
                      )}

                      {act.attachmentNotes && (
                        <div
                          style={{
                            fontSize: "0.775rem",
                            color: "#475569",
                            marginTop: "0.25rem",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.3rem",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-text-muted, #64748B)" }}>
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          <span>Referenced Attachments: {act.attachmentNotes}</span>
                        </div>
                      )}
                    </td>
                    {isStaffOrAdmin && (
                      <td style={{ padding: "0.85rem", textAlign: "center" }}>
                        <button
                          type="button"
                          className="zen-btn-secondary"
                          onClick={(e) => handleOpenEditModal(act, e)}
                          disabled={isCancelled}
                          data-testid="edit-action-btn"
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.775rem",
                            borderRadius: "6px",
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Stack View */}
          <div className="actions-taken-mobile-cards" data-testid="actions-mobile-cards">
            {actions.map((act) => (
              <div
                key={act.id}
                data-action-id={act.id}
                className="zen-card"
                data-testid={`action-card-${act.id}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "1rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  marginBottom: "0.85rem",
                }}
              >
                {/* Mobile Top Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                    paddingBottom: "0.6rem",
                    borderBottom: "1px solid #F1F5F9",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary-dark, #0F5132)" }}>
                      {formatDateTime(act.actionDateTime)}
                    </div>
                    <div style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span
                        className="zen-badge"
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#334155",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "6px",
                        }}
                      >
                        By {act.performedBy?.name || "IT Staff"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {act.isFollowUpRequired && (
                      <span
                        className="zen-badge"
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #F59E0B",
                          fontSize: "0.725rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Follow-Up</span>
                      </span>
                    )}
                    {isStaffOrAdmin && (
                      <button
                        type="button"
                        className="zen-btn-secondary"
                        onClick={(e) => handleOpenEditModal(act, e)}
                        disabled={isCancelled}
                        data-testid="edit-action-btn"
                        style={{
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          minHeight: "30px",
                          borderRadius: "6px",
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Content Body */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.75rem" }}>
                  {/* Action Description Block */}
                  <div
                    style={{
                      backgroundColor: "#F8FAF8",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "0.65rem 0.8rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--color-primary, #006B3C)",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      <span>Action Taken</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#1E293B", lineHeight: 1.55 }}>
                      {act.actionDescription}
                    </div>
                  </div>

                  {/* Result Block */}
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "0.65rem 0.8rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#475569",
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span>Result / Findings</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#1E293B", lineHeight: 1.55 }}>
                      {act.result}
                    </div>
                  </div>
                </div>

                {/* Mobile Follow-Up Highlight */}
                {act.isFollowUpRequired && act.followUpNote && (
                  <div
                    style={{
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #F59E0B",
                      borderRadius: "8px",
                      padding: "0.6rem 0.8rem",
                      fontSize: "0.8rem",
                      color: "#92400E",
                      marginBottom: "0.65rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>Follow-Up Required:</span>
                    </div>
                    <div style={{ lineHeight: 1.45, paddingLeft: "1.2rem" }}>
                      {act.followUpNote}
                    </div>
                  </div>
                )}

                {/* Mobile Attachment Reference */}
                {act.attachmentNotes && (
                  <div
                    style={{
                      fontSize: "0.775rem",
                      color: "#475569",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#F1F5F9",
                      border: "1px solid #E2E8F0",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: "#64748B" }}>
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span>Referenced Attachments: {act.attachmentNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <ActionTakenModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        initialData={editingAction}
        currentUserName={user?.name}
        triggerRef={activeTriggerRef}
      />
    </div>
  );
}
