import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  Category,
  RelatedSystem,
  Priority,
  Ticket,
  fetchActiveCategories,
  fetchActiveRelatedSystems,
  createTicket,
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
      e.target.value = ""; // Reset file input
      return;
    }

    setFieldErrors((prev) => ({ ...prev, attachments: undefined }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ""; // Reset input so user can add more if < 5
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
      <div className="zen-card shadow-sm border p-4 my-2">
        <div className="text-center py-3">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "var(--color-pale-green)",
              borderRadius: "50%",
              fontSize: "2rem",
            }}
          >
            ✅
          </div>
          <h3 className="h4 fw-bold text-success mb-2">Ticket Created Successfully!</h3>
          <p className="text-muted mb-4">
            Your support ticket has been submitted with official Ticket Number:
          </p>

          <div
            className="d-inline-block px-4 py-2 mb-4 rounded-pill border"
            style={{
              backgroundColor: "var(--color-pale-green)",
              borderColor: "var(--color-secondary)",
            }}
          >
            <span className="h5 fw-bold mb-0 text-dark" data-testid="created-ticket-number">
              🎟️ {createdTicket.ticketNumber}
            </span>
          </div>

          <div className="p-3 bg-light rounded border mb-4 text-start" style={{ maxWidth: 500, margin: "0 auto" }}>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Summary:</span>
              <strong className="small text-dark">{createdTicket.summary}</strong>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Status:</span>
              <span className="zen-badge zen-badge-new">{createdTicket.currentStatus}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted small">Requested Priority:</span>
              <span className={`zen-badge zen-badge-priority-${createdTicket.requestedPriority.toLowerCase()}`}>
                {createdTicket.requestedPriority}
              </span>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3">
            {onCancel && (
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={onCancel}
              >
                📋 View in My Tickets
              </button>
            )}
            <button
              type="button"
              className="zen-btn-primary"
              onClick={handleResetForm}
            >
              ➕ Create Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-card shadow-sm border p-4 my-2">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1">Create IT Support Ticket</h2>
          <p className="text-muted small mb-0">
            Submit a new IT request for hardware, software, network, or account support.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="zen-btn-secondary btn-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Server Error Alert (Safe Error State) */}
      {serverError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <span>⚠️</span>
          <div>
            <strong>Submission Error:</strong> {serverError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Read-Only Header Section */}
        <div className="row g-3 p-3 mb-4 rounded border" style={{ backgroundColor: "var(--color-readonly-bg)" }}>
          <div className="col-md-6">
            <label className="zen-form-label mb-1 text-muted">
              Requester (Read-Only)
            </label>
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded border">
              <span>👤</span>
              <strong>{currentRequester ? currentRequester.name : "None"}</strong>
              <span className="text-muted small">
                ({currentRequester ? currentRequester.department : "No department"})
              </span>
            </div>
          </div>
          <div className="col-md-6">
            <label className="zen-form-label mb-1 text-muted">
              Ticket Date (Read-Only)
            </label>
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded border">
              <span>📅</span>
              <span className="text-dark">{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Classification Fields (3 Columns) */}
        <div className="row g-3 mb-3">
          {/* Category Dropdown */}
          <div className="col-md-4">
            <label htmlFor="ticketCategory" className="zen-form-label">
              Category <span className="zen-required">*</span>
            </label>
            <select
              id="ticketCategory"
              className={`zen-form-control ${fieldErrors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : "");
                if (fieldErrors.categoryId) {
                  setFieldErrors((prev) => ({ ...prev, categoryId: undefined }));
                }
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

          {/* Related System Dropdown */}
          <div className="col-md-4">
            <label htmlFor="ticketSystem" className="zen-form-label">
              Related System <span className="zen-required">*</span>
            </label>
            <select
              id="ticketSystem"
              className={`zen-form-control ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => {
                setRelatedSystemId(e.target.value ? Number(e.target.value) : "");
                if (fieldErrors.relatedSystemId) {
                  setFieldErrors((prev) => ({ ...prev, relatedSystemId: undefined }));
                }
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

          {/* Requested Priority Dropdown */}
          <div className="col-md-4">
            <label htmlFor="ticketPriority" className="zen-form-label">
              Requested Priority <span className="zen-required">*</span>
            </label>
            <select
              id="ticketPriority"
              className={`zen-form-control ${fieldErrors.requestedPriority ? "is-invalid" : ""}`}
              value={requestedPriority}
              onChange={(e) => {
                setRequestedPriority(e.target.value as Priority);
                if (fieldErrors.requestedPriority) {
                  setFieldErrors((prev) => ({ ...prev, requestedPriority: undefined }));
                }
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

        {/* Ticket Summary Input */}
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <label htmlFor="ticketSummary" className="zen-form-label">
              Ticket Summary <span className="zen-required">*</span>
            </label>
            <span className="text-muted small">
              {summary.length}/150
            </span>
          </div>
          <input
            id="ticketSummary"
            type="text"
            className={`zen-form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
            placeholder="Brief description of the problem (e.g. Laptop battery drains quickly)"
            maxLength={150}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              if (fieldErrors.summary) {
                setFieldErrors((prev) => ({ ...prev, summary: undefined }));
              }
            }}
            required
          />
          {fieldErrors.summary && (
            <div className="zen-invalid-feedback">{fieldErrors.summary}</div>
          )}
        </div>

        {/* Ticket Description Textarea */}
        <div className="mb-4">
          <div className="d-flex justify-content-between">
            <label htmlFor="ticketDescription" className="zen-form-label">
              Description <span className="zen-required">*</span>
            </label>
            <span className="text-muted small">
              {description.length}/2000
            </span>
          </div>
          <textarea
            id="ticketDescription"
            rows={4}
            className={`zen-form-control ${fieldErrors.description ? "is-invalid" : ""}`}
            placeholder="Detailed information regarding what happened, steps to reproduce, or any error messages..."
            maxLength={2000}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) {
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            style={{ resize: "vertical" }}
            required
          />
          {fieldErrors.description && (
            <div className="zen-invalid-feedback">{fieldErrors.description}</div>
          )}
        </div>

        {/* Attachments Dropzone / Selector */}
        <div className="mb-4 p-3 border rounded bg-light">
          <label htmlFor="ticketAttachments" className="zen-form-label d-flex justify-content-between">
            <span>📎 Supporting Attachments (Optional)</span>
            <span className="text-muted small">
              Max 5 files (JPG, PNG, WEBP, PDF up to 5 MB each)
            </span>
          </label>

          <input
            id="ticketAttachments"
            type="file"
            className="form-control"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={selectedFiles.length >= 5}
          />

          {fieldErrors.attachments && (
            <div className="text-danger small mt-2 d-flex align-items-center gap-1">
              <span>⚠️</span> {fieldErrors.attachments}
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-3">
              <strong className="d-block small mb-2 text-dark">
                Selected Attachments ({selectedFiles.length}/5):
              </strong>
              <div className="d-flex flex-column gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center justify-content-between p-2 bg-white rounded border small"
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <span>📄</span>
                      <span className="fw-semibold text-truncate">{file.name}</span>
                      <span className="text-muted">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-0 px-2"
                      onClick={() => handleRemoveFile(idx)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-3 pt-3 border-top">
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
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Submitting Ticket...</span>
              </>
            ) : (
              <span>➔ Submit Ticket</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
