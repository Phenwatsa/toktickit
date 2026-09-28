import React, { useEffect, useState } from "react";
import { fetchAttachmentBlob } from "../api";

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id: number;
    fileName?: string;
    originalName?: string;
    fileSize?: number;
    sizeBytes?: number;
    mimeType?: string;
  } | null;
}

export function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachment,
}: AttachmentPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = attachment?.fileName || attachment?.originalName || "Attachment";
  const fileSize = attachment?.fileSize || attachment?.sizeBytes || 0;
  const isImage =
    attachment?.mimeType?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName);
  const isPdf =
    attachment?.mimeType?.includes("pdf") || /\.pdf$/i.test(fileName);

  useEffect(() => {
    if (!isOpen || !attachment) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchAttachmentBlob(attachment.id)
      .then(({ blob }) => {
        if (!isMounted) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load document preview");
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, attachment?.id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  return (
    <div
      className="modal-backdrop-preview"
      onClick={onClose}
      data-testid="attachment-preview-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="modal-content-preview"
        onClick={(e) => e.stopPropagation()}
        data-testid="attachment-preview-modal"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
          width: "100%",
          maxWidth: isPdf ? "900px" : "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
            {isPdf ? (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            ) : (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "#E0F2FE",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                {Math.round(fileSize / 1024)} KB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              color: "#64748B",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F1F5F9",
            minHeight: "350px",
          }}
        >
          {loading && (
            <div style={{ textAlign: "center", color: "#64748B" }}>
              <div
                className="spinner-border text-success"
                role="status"
                style={{ width: "2rem", height: "2rem", marginBottom: "0.75rem" }}
              />
              <div style={{ fontSize: "0.85rem" }}>Loading preview...</div>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", color: "#EF4444", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Unable to preview document
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{error}</div>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isImage && (
                <img
                  src={blobUrl}
                  alt={fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                />
              )}
              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={fileName}
                  style={{
                    width: "100%",
                    height: "70vh",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              )}
              {!isImage && !isPdf && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748B" }}>
                  <p>Preview is not available for this file type.</p>
                  <a
                    href={blobUrl}
                    download={fileName}
                    className="zen-btn-primary"
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    Download File
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          {blobUrl && (
            <a
              href={blobUrl}
              download={fileName}
              className="zen-btn-secondary"
              style={{
                fontSize: "0.825rem",
                padding: "0.4rem 0.85rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </a>
          )}
          <button
            type="button"
            className="zen-btn-primary"
            onClick={onClose}
            style={{ fontSize: "0.825rem", padding: "0.4rem 1rem" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
