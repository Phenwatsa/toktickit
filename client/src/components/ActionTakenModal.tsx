import React, { useState, useEffect, useRef, useCallback } from "react";
import { ActionTakenItem } from "../types";

export interface ActionTakenFormData {
  actionDateTime: string;
  actionDescription: string;
  result: string;
  isFollowUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
}

interface ActionTakenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActionTakenFormData) => Promise<void>;
  initialData?: ActionTakenItem | null;
  currentUserName?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

function toLocalDatetimeString(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function ActionTakenModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentUserName,
  triggerRef,
}: ActionTakenModalProps) {
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [actionDescription, setActionDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isFollowUpRequired, setIsFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const wasOpenRef = useRef<boolean>(false);

  // Initialize or reset form values when opening or changing initialData
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousActiveElement.current = document.activeElement;
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);

      if (initialData) {
        setActionDateTime(toLocalDatetimeString(initialData.actionDateTime));
        setActionDescription(initialData.actionDescription || "");
        setResult(initialData.result || "");
        setIsFollowUpRequired(Boolean(initialData.isFollowUpRequired));
        setFollowUpNote(initialData.followUpNote || "");
        setAttachmentNotes(initialData.attachmentNotes || "");
      } else {
        setActionDateTime(toLocalDatetimeString(new Date()));
        setActionDescription("");
        setResult("");
        setIsFollowUpRequired(false);
        setFollowUpNote("");
        setAttachmentNotes("");
      }

      // Automatically focus first input upon open
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (wasOpenRef.current) {
      // Focus restoration upon modal dismissal ONLY when modal was previously open
      wasOpenRef.current = false;
      let targetEl: HTMLElement | null =
        (triggerRef?.current && triggerRef.current.isConnected
          ? triggerRef.current
          : null) ||
        (previousActiveElement.current instanceof HTMLElement &&
        previousActiveElement.current.isConnected
          ? previousActiveElement.current
          : null);

      if (!targetEl && initialData?.id) {
        targetEl = document.querySelector<HTMLElement>(
          `[data-action-id="${initialData.id}"] [data-testid="edit-action-btn"]`
        );
      }
      if (!targetEl && triggerRef?.current) {
        targetEl = triggerRef.current;
      }

      if (targetEl) {
        const restoreTimer = setTimeout(() => {
          targetEl?.focus();
        }, 0);
        return () => clearTimeout(restoreTimer);
      }
    }
  }, [isOpen, initialData, triggerRef]);

  // Global Escape key listener when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Focus trap and Escape key listener on modal container
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const isEditMode = Boolean(initialData);
  const modalTitle = isEditMode ? "Edit Action Taken" : "Add Action Taken";

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!actionDescription || actionDescription.trim().length < 5) {
      errors.actionDescription = "Action description must be at least 5 characters.";
    }

    if (!result || result.trim().length < 3) {
      errors.result = "Result must be at least 3 characters.";
    }

    if (isFollowUpRequired) {
      const nonWhitespace = followUpNote.replace(/\s/g, "");
      if (!nonWhitespace || nonWhitespace.length < 3) {
        errors.followUpNote =
          "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const parsedDate = actionDateTime ? new Date(actionDateTime) : new Date();
      const isoUtcDateTime = isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      const payload: ActionTakenFormData = {
        actionDateTime: isoUtcDateTime,
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        isFollowUpRequired,
        followUpNote: isFollowUpRequired ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setSubmitError(
        err.message ||
          (err.details && err.details[0]?.message) ||
          "Failed to save Action Taken record."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop-custom"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        onKeyDown={handleKeyDown}
        className="zen-card"
        style={{
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          padding: "1.5rem",
          border: "1px solid var(--color-border)",
        }}
        data-testid="action-taken-modal"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            <h2
              id="action-modal-title"
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
              }}
              data-testid="action-modal-title"
            >
              {modalTitle}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
              Operational log of diagnostic and remediation activities.
            </div>
          </div>
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              padding: "0.35rem 0.65rem",
              fontSize: "0.85rem",
              borderRadius: "6px",
            }}
            data-testid="modal-close-icon-btn"
          >
            ✕
          </button>
        </div>

        {/* Global Submit Error Banner */}
        {submitError && (
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
            data-testid="action-modal-error-alert"
          >
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Action Date/Time */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-datetime-input"
              className="zen-form-label"
              style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.85rem" }}
            >
              Action Date / Time <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="action-datetime-input"
              ref={firstInputRef}
              type="datetime-local"
              className="form-control form-control-sm"
              value={actionDateTime}
              onChange={(e) => setActionDateTime(e.target.value)}
              data-testid="action-datetime-input"
              style={{ width: "100%", borderRadius: "8px" }}
              required
            />
          </div>

          {/* Action Description */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-description-input"
              className="zen-form-label"
              style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.85rem" }}
            >
              Action Description <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <textarea
              id="action-description-input"
              rows={3}
              className="form-control"
              placeholder="Describe the specific activity taken..."
              value={actionDescription}
              onChange={(e) => {
                setActionDescription(e.target.value);
                if (fieldErrors.actionDescription) {
                  setFieldErrors((prev) => ({ ...prev, actionDescription: "" }));
                }
              }}
              data-testid="action-description-input"
              style={{
                width: "100%",
                borderRadius: "8px",
                borderColor: fieldErrors.actionDescription ? "var(--color-error)" : undefined,
              }}
              required
            />
            {fieldErrors.actionDescription && (
              <div
                role="alert"
                style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem" }}
                data-testid="error-action-description"
              >
                {fieldErrors.actionDescription}
              </div>
            )}
          </div>

          {/* Result */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-result-input"
              className="zen-form-label"
              style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.85rem" }}
            >
              Result <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <textarea
              id="action-result-input"
              rows={2}
              className="form-control"
              placeholder="Describe the outcome or findings..."
              value={result}
              onChange={(e) => {
                setResult(e.target.value);
                if (fieldErrors.result) {
                  setFieldErrors((prev) => ({ ...prev, result: "" }));
                }
              }}
              data-testid="action-result-input"
              style={{
                width: "100%",
                borderRadius: "8px",
                borderColor: fieldErrors.result ? "var(--color-error)" : undefined,
              }}
              required
            />
            {fieldErrors.result && (
              <div
                role="alert"
                style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem" }}
                data-testid="error-action-result"
              >
                {fieldErrors.result}
              </div>
            )}
          </div>

          {/* Performed By (Read-Only) */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-performed-by-input"
              className="zen-form-label"
              style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.85rem" }}
            >
              Performed By (Auto-assigned)
            </label>
            <input
              id="action-performed-by-input"
              type="text"
              readOnly
              className="form-control form-control-sm"
              value={
                initialData?.performedBy?.name
                  ? `${initialData.performedBy.name} (Recorded)`
                  : currentUserName
                  ? `${currentUserName} (Auto-assigned)`
                  : "Logged-in Staff Member (Auto-assigned)"
              }
              data-testid="action-performed-by-input"
              style={{
                width: "100%",
                borderRadius: "8px",
                backgroundColor: "var(--color-readonly-bg, #F8FAF8)",
                color: "var(--color-text-muted)",
              }}
            />
          </div>

          {/* Follow-Up Checkbox & Note */}
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.85rem",
              backgroundColor: isFollowUpRequired ? "#FEF3C7" : "#F8FAF8",
              border: isFollowUpRequired ? "1px solid #F59E0B" : "1px solid var(--color-border)",
              borderRadius: "8px",
              transition: "background-color 0.2s, border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="action-followup-checkbox"
                type="checkbox"
                checked={isFollowUpRequired}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsFollowUpRequired(checked);
                  if (!checked) {
                    setFieldErrors((prev) => ({ ...prev, followUpNote: "" }));
                  }
                }}
                aria-controls="followup-note-container"
                aria-expanded={isFollowUpRequired}
                data-testid="action-followup-checkbox"
                style={{ width: "16px", height: "16px", accentColor: "var(--zg-primary, #006B3C)" }}
              />
              <label
                htmlFor="action-followup-checkbox"
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: isFollowUpRequired ? "#92400E" : "var(--color-text-primary)",
                  cursor: "pointer",
                }}
              >
                Follow-Up Required?
              </label>
            </div>

            {isFollowUpRequired && (
              <div id="followup-note-container" style={{ marginTop: "0.75rem" }}>
                <label
                  htmlFor="action-followup-note-input"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "0.3rem",
                    color: "#92400E",
                  }}
                >
                  Follow-Up Note <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <textarea
                  id="action-followup-note-input"
                  rows={2}
                  className="form-control"
                  placeholder="Provide details on required follow-up action (minimum 3 non-whitespace characters)..."
                  value={followUpNote}
                  onChange={(e) => {
                    setFollowUpNote(e.target.value);
                    if (fieldErrors.followUpNote) {
                      setFieldErrors((prev) => ({ ...prev, followUpNote: "" }));
                    }
                  }}
                  data-testid="action-followup-note-input"
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    borderColor: fieldErrors.followUpNote ? "var(--color-error)" : "#F59E0B",
                  }}
                  required
                />
                {fieldErrors.followUpNote && (
                  <div
                    role="alert"
                    aria-live="polite"
                    style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem", fontWeight: 500 }}
                    data-testid="error-followup-note"
                  >
                    {fieldErrors.followUpNote}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachment Notes */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="action-attachment-notes-input"
              className="zen-form-label"
              style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.85rem" }}
            >
              Referenced Attachments / Notes (Optional)
            </label>
            <input
              id="action-attachment-notes-input"
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. error-screenshot.png, memory-dump-oct12.log"
              value={attachmentNotes}
              onChange={(e) => setAttachmentNotes(e.target.value)}
              data-testid="action-attachment-notes-input"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              type="button"
              className="zen-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="modal-cancel-btn"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="zen-btn-primary"
              disabled={isSubmitting}
              data-testid="modal-submit-btn"
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", minWidth: "130px" }}
            >
              {isSubmitting ? "Saving..." : isEditMode ? "Update Action" : "Save Action Taken"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
