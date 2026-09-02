import React, { useState, useRef } from "react";
import { Attachment } from "../types";
import { useRequester } from "../context/RequesterContext";
import { uploadAttachment, downloadAttachment, softRemoveAttachment } from "../api";

interface AttachmentSectionProps {
  ticketId: number;
  attachments?: Attachment[];
  onAttachmentChange: () => void;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function AttachmentSection({
  ticketId,
  attachments = [],
  onAttachmentChange,
}: AttachmentSectionProps) {
  const { currentRequester } = useRequester();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Soft-remove modal state
  const [targetAttachment, setTargetAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Downloading state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const activeAttachments = attachments.filter((att) => !att.isRemoved);
  const removedAttachments = attachments.filter((att) => att.isRemoved);
  const isMaxReached = activeAttachments.length >= 5;

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function formatDate(dateStr?: string | null): string {
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

  function renderFileIcon(mimeType: string) {
    if (mimeType.includes("pdf")) {
      return (
        <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    }
    return (
      <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#F1F5F9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>
    );
  }

  // Handle file selection & upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentRequester) return;

    setUploadError(null);

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File exceeds maximum allowed size of 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate count
    if (isMaxReached) {
      setUploadError("Maximum 5 active attachments limit reached.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await uploadAttachment(ticketId, currentRequester.id, file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onAttachmentChange();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload attachment.");
    } finally {
      setIsUploading(false);
    }
  }

  // Handle Download
  async function handleDownload(att: Attachment) {
    if (!currentRequester) return;
    setDownloadingId(att.id);
    try {
      await downloadAttachment(att.id, currentRequester.id, att.originalName);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  }

  // Handle Soft-Remove Submit
  async function handleConfirmRemove(e: React.FormEvent) {
    e.preventDefault();
    if (!targetAttachment || !currentRequester) return;

    const trimmed = removalReason.trim();
    if (trimmed.length < 3) {
      setRemovalError("Please provide a reason for removal (at least 3 characters).");
      return;
    }

    setIsRemoving(true);
    setRemovalError(null);
    try {
      await softRemoveAttachment(ticketId, targetAttachment.id, currentRequester.id, trimmed);
      setTargetAttachment(null);
      setRemovalReason("");
      onAttachmentChange();
    } catch (err) {
      setRemovalError(err instanceof Error ? err.message : "Failed to remove attachment.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="zen-card" data-testid="attachments-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--color-primary-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attachments ({activeAttachments.length}/5 Active)
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Supported formats: JPG, PNG, WEBP, PDF (Max 5 MB each)
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            id="attachment-upload-input"
            disabled={isMaxReached || isUploading}
            data-testid="file-input"
          />
          <button
            type="button"
            className="zen-btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isMaxReached || isUploading}
            data-testid="upload-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>

      {/* Upload Error Alert */}
      {uploadError && (
        <div
          data-testid="upload-error"
          style={{
            padding: "0.6rem 0.85rem",
            backgroundColor: "var(--color-error-bg)",
            border: "1px solid #FECACA",
            borderRadius: "6px",
            color: "var(--color-error)",
            fontSize: "0.85rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Max Reached Alert */}
      {isMaxReached && (
        <div
          data-testid="max-attachments-alert"
          style={{
            padding: "0.6rem 0.85rem",
            backgroundColor: "var(--color-accent-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            color: "var(--color-text-muted)",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          Maximum 5 active attachments reached. Remove an existing attachment to upload a new one.
        </div>
      )}

      {/* Active Attachments List */}
      {activeAttachments.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} data-testid="active-attachments-list">
          {activeAttachments.map((att) => (
            <div
              key={att.id}
              data-testid={`attachment-item-${att.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                {renderFileIcon(att.mimeType)}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--color-text-main)",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    title={att.originalName}
                  >
                    {att.originalName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {formatBytes(att.sizeBytes)} • Uploaded {formatDate(att.createdAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => handleDownload(att)}
                  disabled={downloadingId === att.id}
                  data-testid={`download-btn-${att.id}`}
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  title="Download attachment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingId === att.id ? "Downloading..." : "Download"}
                </button>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => {
                    setTargetAttachment(att);
                    setRemovalReason("");
                    setRemovalError(null);
                  }}
                  data-testid={`remove-btn-${att.id}`}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.35rem 0.65rem",
                    color: "var(--color-error)",
                    borderColor: "#FECACA",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  title="Remove attachment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          data-testid="no-attachments-msg"
          style={{
            padding: "1.5rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.85rem",
            border: "1px dashed var(--color-border)",
            borderRadius: "8px",
          }}
        >
          No active attachments uploaded for this ticket.
        </div>
      )}

      {/* Soft-Removed Attachments Audit Log */}
      {removedAttachments.length > 0 && (
        <div style={{ marginTop: "1.5rem" }} data-testid="removed-attachments-section">
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            History of Removed Attachments ({removedAttachments.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {removedAttachments.map((att) => (
              <div
                key={att.id}
                data-testid={`removed-item-${att.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  opacity: 0.9,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ textDecoration: "line-through", fontSize: "0.85rem", color: "#6B7280" }}>
                      {att.originalName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        backgroundColor: "#E5E7EB",
                        color: "#4B5563",
                        fontWeight: 600,
                      }}
                    >
                      Removed
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "2px" }}>
                    Reason: <em>"{att.removalReason || "No reason specified"}"</em> • Removed {formatDate(att.removedAt)}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#9CA3AF",
                    fontStyle: "italic",
                    flexShrink: 0,
                  }}
                  data-testid={`download-disabled-${att.id}`}
                >
                  Download Disabled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soft-Remove Confirmation Modal */}
      {targetAttachment && (
        <div
          data-testid="removal-modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="zen-card"
            data-testid="removal-modal"
            style={{
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", color: "var(--color-primary-dark)", fontSize: "1.1rem" }}>
              Confirm Attachment Removal
            </h3>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--color-text-main)" }}>
              Are you sure you want to remove <strong>{targetAttachment.originalName}</strong>?
            </p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              In compliance with audit retention policies, the attachment metadata will be retained and marked as removed. File download will be permanently disabled.
            </p>

            <form onSubmit={handleConfirmRemove}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="removalReasonInput"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}
                >
                  Removal Reason <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <textarea
                  id="removalReasonInput"
                  className="zen-form-control"
                  rows={3}
                  placeholder="e.g. Uploaded document with outdated or incorrect information"
                  value={removalReason}
                  onChange={(e) => {
                    setRemovalReason(e.target.value);
                    if (removalError) setRemovalError(null);
                  }}
                  data-testid="removal-reason-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  required
                />
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  Minimum 3 characters ({removalReason.trim().length} entered)
                </div>
              </div>

              {removalError && (
                <div
                  data-testid="modal-error"
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "var(--color-error-bg)",
                    border: "1px solid #FECACA",
                    borderRadius: "6px",
                    color: "var(--color-error)",
                    fontSize: "0.8rem",
                    marginBottom: "1rem",
                  }}
                >
                  {removalError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => {
                    setTargetAttachment(null);
                    setRemovalReason("");
                    setRemovalError(null);
                  }}
                  disabled={isRemoving}
                  data-testid="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zen-btn-primary"
                  disabled={isRemoving || removalReason.trim().length < 3}
                  data-testid="modal-confirm-btn"
                  style={{ backgroundColor: "var(--color-error)", borderColor: "var(--color-error)" }}
                >
                  {isRemoving ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
