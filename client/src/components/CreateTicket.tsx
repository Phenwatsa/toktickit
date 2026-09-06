import React, { useState, useEffect, useRef } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  Category,
  RelatedSystem,
  Priority,
  Ticket,
  fetchActiveCategories,
  fetchActiveRelatedSystems,
  createTicket,
  uploadAttachment,
} from "../api";

interface CreateTicketProps {
  onSuccess?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

interface FieldErrors {
  categoryId?: string;
  relatedSystemId?: string;
  requestedPriority?: string;
  summary?: string;
  description?: string;
  attachments?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export function CreateTicket({ onSuccess, onCancel }: CreateTicketProps) {
  const { currentRequester } = useRequester();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [relatedSystemId, setRelatedSystemId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<Priority | "">("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Reference Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [isLoadingRefData, setIsLoadingRefData] = useState<boolean>(true);

  // Status & Feedback State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Load Categories and Related Systems
  useEffect(() => {
    async function loadRefData() {
      setIsLoadingRefData(true);
      try {
        const [cats, systems] = await Promise.all([
          fetchActiveCategories(),
          fetchActiveRelatedSystems(),
        ]);
        setCategories(cats);
        setRelatedSystems(systems);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to load reference options."
        );
      } finally {
        setIsLoadingRefData(false);
      }
    }
    loadRefData();
  }, []);

  // Client-Side Validation
  function validateForm(): boolean {
    const errors: FieldErrors = {};
    const trimmedSummary = summary.trim();
    const trimmedDesc = description.trim();

    if (!categoryId) {
      errors.categoryId = "Please select a ticket category.";
    }
    if (!relatedSystemId) {
      errors.relatedSystemId = "Please select an affected system.";
    }
    if (!requestedPriority) {
      errors.requestedPriority = "Please select a priority level.";
    }
    if (!trimmedSummary) {
      errors.summary = "Ticket summary is required.";
    } else if (trimmedSummary.length < 5) {
      errors.summary = "Summary must be at least 5 characters.";
    } else if (trimmedSummary.length > 150) {
      errors.summary = "Summary cannot exceed 150 characters.";
    }

    if (!trimmedDesc) {
      errors.description = "Description is required.";
    } else if (trimmedDesc.length < 10) {
      errors.description = "Description must be at least 10 characters.";
    } else if (trimmedDesc.length > 2000) {
      errors.description = "Description cannot exceed 2000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Handle File Selection & Validation
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    let errorMessage: string | null = null;

    // Check count constraint
    if (selectedFiles.length + newFiles.length > 5) {
      errorMessage = "Maximum 5 attachments allowed per ticket.";
    }

    // Check type and size constraints for each file
    for (const file of newFiles) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isValidType =
        ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

      if (!isValidType) {
        errorMessage = `File "${file.name}" has unsupported type. Allowed: JPG, PNG, WEBP, PDF.`;
        break;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errorMessage = `File "${file.name}" exceeds maximum allowed size of 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
        break;
      }
    }

    if (errorMessage) {
      setFieldErrors((prev) => ({ ...prev, attachments: errorMessage! }));
      e.target.value = "";
      return;
    }

    setFieldErrors((prev) => ({ ...prev, attachments: undefined }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function handleRemoveFile(indexToRemove: number) {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFieldErrors((prev) => ({ ...prev, attachments: undefined }));
  }

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (!currentRequester) {
      setServerError("No active development requester selected. Please select a requester first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = await createTicket({
        requesterId: currentRequester.id,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        requestedPriority: requestedPriority as Priority,
        summary: summary.trim(),
        description: description.trim(),
      });

      // Persist any attached files to the newly created ticket
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await uploadAttachment(newTicket.id, currentRequester.id, file);
          } catch (uploadErr) {
            console.error("Failed to upload attachment during ticket creation:", uploadErr);
          }
        }
      }

      setCreatedTicket(newTicket);
      if (onSuccess) {
        onSuccess(newTicket);
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create support ticket. Please retry."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetForm() {
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("");
    setSummary("");
    setDescription("");
    setSelectedFiles([]);
    setFieldErrors({});
    setServerError(null);
    setCreatedTicket(null);
  }

  // Success State View
  if (createdTicket) {
    return (
      <div className="zen-card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--color-pale-green)",
            color: "var(--color-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "var(--color-text-main)" }}>
          Ticket Created Successfully!
        </h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Your support request has been submitted with official Ticket Number:
        </p>

        <div
          style={{
            display: "inline-block",
            padding: "0.45rem 1.25rem",
            backgroundColor: "var(--color-pale-green)",
            border: "1px solid #C4E6D2",
            borderRadius: "9999px",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
            data-testid="created-ticket-number"
          >
            {createdTicket.ticketNumber}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
          {onCancel && (
            <button
              type="button"
              className="zen-btn-secondary"
              onClick={onCancel}
            >
              View in My Tickets
            </button>
          )}
          <button
            type="button"
            className="zen-btn-primary"
            onClick={handleResetForm}
          >
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
          Create IT Support Ticket
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Submit a technical issue or service request to the IT team.
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div style={{ padding: "0.85rem 1rem", backgroundColor: "var(--color-error-bg)", border: "1px solid #FECACA", borderRadius: "8px", color: "var(--color-error)", fontSize: "0.875rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Submission Error:</strong> {serverError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate id="create-ticket-form">
        {/* Section 1: Requester & Classification */}
        <div className="zen-form-section">
          <div className="zen-form-section-title">
            <span className="zen-form-section-number">1</span>
            Classification & Context
          </div>

          {/* Read-Only Context Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "#F8FAF8", border: "1px solid #E2E8F0", borderRadius: "8px", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.2rem" }}>
                Requester (Read-Only)
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>
                {currentRequester ? currentRequester.name : "None"}
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 400, marginLeft: "0.4rem" }}>
                  ({currentRequester ? currentRequester.department : ""})
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.725rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.2rem" }}>
                Date Submitted
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>
                {todayFormatted}
              </div>
            </div>
          </div>

          {/* Classification Dropdowns Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {/* Category */}
            <div>
              <label htmlFor="ticketCategory" className="zen-form-label">
                Category <span className="zen-required">*</span>
              </label>
              <select
                id="ticketCategory"
                className={`zen-form-control ${fieldErrors.categoryId ? "is-invalid" : ""}`}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value ? Number(e.target.value) : "");
                  if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: undefined }));
                }}
                disabled={isLoadingRefData}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <div className="zen-invalid-feedback">{fieldErrors.categoryId}</div>
              )}
            </div>

            {/* Related System */}
            <div>
              <label htmlFor="ticketSystem" className="zen-form-label">
                Related System <span className="zen-required">*</span>
              </label>
              <select
                id="ticketSystem"
                className={`zen-form-control ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
                value={relatedSystemId}
                onChange={(e) => {
                  setRelatedSystemId(e.target.value ? Number(e.target.value) : "");
                  if (fieldErrors.relatedSystemId) setFieldErrors((p) => ({ ...p, relatedSystemId: undefined }));
                }}
                disabled={isLoadingRefData}
                required
              >
                <option value="">-- Select Related System --</option>
                {relatedSystems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
              {fieldErrors.relatedSystemId && (
                <div className="zen-invalid-feedback">{fieldErrors.relatedSystemId}</div>
              )}
            </div>

            {/* Requested Priority */}
            <div>
              <label htmlFor="ticketPriority" className="zen-form-label">
                Requested Priority <span className="zen-required">*</span>
              </label>
              <select
                id="ticketPriority"
                className={`zen-form-control ${fieldErrors.requestedPriority ? "is-invalid" : ""}`}
                value={requestedPriority}
                onChange={(e) => {
                  setRequestedPriority(e.target.value as Priority);
                  if (fieldErrors.requestedPriority) setFieldErrors((p) => ({ ...p, requestedPriority: undefined }));
                }}
                required
              >
                <option value="">-- Select Priority --</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              {fieldErrors.requestedPriority && (
                <div className="zen-invalid-feedback">{fieldErrors.requestedPriority}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Issue Details */}
        <div className="zen-form-section">
          <div className="zen-form-section-title">
            <span className="zen-form-section-number">2</span>
            Issue Details
          </div>

          {/* Summary Input */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label htmlFor="ticketSummary" className="zen-form-label" style={{ margin: 0 }}>
                Ticket Summary <span className="zen-required">*</span>
              </label>
              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                {summary.length}/150
              </span>
            </div>
            <input
              id="ticketSummary"
              type="text"
              className={`zen-form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
              placeholder="e.g. Laptop battery drains rapidly under normal load"
              maxLength={150}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (fieldErrors.summary) setFieldErrors((p) => ({ ...p, summary: undefined }));
              }}
              required
            />
            {fieldErrors.summary && (
              <div className="zen-invalid-feedback">{fieldErrors.summary}</div>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label htmlFor="ticketDescription" className="zen-form-label" style={{ margin: 0 }}>
                Description <span className="zen-required">*</span>
              </label>
              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="ticketDescription"
              rows={4}
              className={`zen-form-control ${fieldErrors.description ? "is-invalid" : ""}`}
              placeholder="Describe the issue in detail, error messages, and reproduction steps..."
              maxLength={2000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: undefined }));
              }}
              style={{ resize: "vertical" }}
              required
            />
            {fieldErrors.description && (
              <div className="zen-invalid-feedback">{fieldErrors.description}</div>
            )}
          </div>
        </div>

        {/* Section 3: Supporting Attachments */}
        <div className="zen-form-section">
          <div className="zen-form-section-title">
            <span className="zen-form-section-number">3</span>
            Supporting Attachments (Optional)
          </div>

          <input
            ref={fileInputRef}
            id="ticketAttachments"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={selectedFiles.length >= 5}
            style={{ display: "none" }}
          />

          {/* Apple-Style Modern Dashed Dropzone */}
          <div
            className={`zen-dropzone ${selectedFiles.length >= 5 ? "disabled" : ""}`}
            onClick={() => {
              if (selectedFiles.length < 5) fileInputRef.current?.click();
            }}
            data-testid="attachment-input-trigger"
          >
            <div className="zen-dropzone-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0F172A", marginBottom: "0.25rem" }}>
              {selectedFiles.length >= 5 ? "Maximum 5 attachments reached" : "Click or Drag files to attach"}
            </div>
            <div style={{ fontSize: "0.775rem", color: "#64748B" }}>
              JPG, PNG, WEBP, or PDF • Up to 5 MB per file (Max 5 files)
            </div>
          </div>

          {fieldErrors.attachments && (
            <div className="zen-invalid-feedback" style={{ marginTop: "0.5rem" }}>
              {fieldErrors.attachments}
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                Selected Files ({selectedFiles.length}/5):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "#F8FAF8",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ fontWeight: 600, color: "#0F172A", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-error)",
                        cursor: "pointer",
                        padding: "0.2rem 0.4rem",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Remove file"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
          {onCancel && (
            <button
              type="button"
              className="zen-btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="zen-btn-primary"
            disabled={isSubmitting}
            data-testid="submit-ticket-button"
          >
            {isSubmitting ? (
              <>
                <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span>Submitting Ticket...</span>
              </>
            ) : (
              <span>Submit Ticket</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
