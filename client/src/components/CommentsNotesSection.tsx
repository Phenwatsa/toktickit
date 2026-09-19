import React, { useState, useEffect, useCallback } from "react";
import { PublicComment, InternalNote } from "../types";
import {
  fetchPublicComments,
  createPublicComment,
  fetchInternalNotes,
  createInternalNote,
} from "../api";

interface CommentsNotesSectionProps {
  ticketId: number;
  isStaff: boolean;
  initialComments?: PublicComment[];
  initialNotes?: InternalNote[];
}

export function CommentsNotesSection({
  ticketId,
  isStaff,
  initialComments,
  initialNotes,
}: CommentsNotesSectionProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");

  // Public Comments state
  const [comments, setComments] = useState<PublicComment[]>(initialComments || []);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Internal Notes state (Only used when isStaff === true)
  const [notes, setNotes] = useState<InternalNote[]>(initialNotes || []);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchPublicComments(ticketId);
      setComments(data);
    } catch (err) {
      console.error("Failed to reload comments:", err);
    }
  }, [ticketId]);

  const loadNotes = useCallback(async () => {
    if (!isStaff) return;
    try {
      const data = await fetchInternalNotes(ticketId);
      setNotes(data);
    } catch (err) {
      console.error("Failed to reload internal notes:", err);
    }
  }, [ticketId, isStaff]);

  // Sync if initial props change, or fetch from API if not provided
  useEffect(() => {
    if (initialComments !== undefined) {
      setComments(initialComments);
    } else {
      loadComments();
    }
  }, [ticketId, initialComments, loadComments]);

  useEffect(() => {
    if (!isStaff) return;
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
    } else {
      loadNotes();
    }
  }, [ticketId, isStaff, initialNotes, loadNotes]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed || trimmed.length < 2) {
      setCommentError("Comment must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 2000) {
      setCommentError("Comment exceeds maximum length of 2000 characters.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const created = await createPublicComment(ticketId, trimmed);
      setComments((prev) => [...prev, created]);
      setNewCommentText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!isStaff) return;

    const trimmed = newNoteText.trim();
    if (!trimmed || trimmed.length < 2) {
      setNoteError("Note must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 2000) {
      setNoteError("Note exceeds maximum length of 2000 characters.");
      return;
    }

    setIsSubmittingNote(true);
    setNoteError(null);
    try {
      const created = await createInternalNote(ticketId, trimmed);
      setNotes((prev) => [...prev, created]);
      setNewNoteText("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to post internal note");
    } finally {
      setIsSubmittingNote(false);
    }
  }

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

  return (
    <div className="zen-card" data-testid="comments-notes-section" style={{ marginTop: "1.5rem" }}>
      {/* Tab Navigation (Only show tabs if user is Staff; Requester sees public comments directly) */}
      {isStaff ? (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid var(--color-border, #E2E8F0)",
            paddingBottom: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <button
            type="button"
            className={activeTab === "comments" ? "zen-btn-primary" : "zen-btn-secondary"}
            onClick={() => setActiveTab("comments")}
            data-testid="tab-public-comments"
            style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>Public Comments</span>
            <span
              style={{
                backgroundColor: activeTab === "comments" ? "rgba(255,255,255,0.3)" : "#E2E8F0",
                color: activeTab === "comments" ? "#FFFFFF" : "#475569",
                borderRadius: "10px",
                padding: "0.1rem 0.45rem",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {comments.length}
            </span>
          </button>

          <button
            type="button"
            className={activeTab === "notes" ? "zen-btn-secondary" : "zen-btn-secondary"}
            onClick={() => setActiveTab("notes")}
            data-testid="tab-internal-notes"
            style={{
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              backgroundColor: activeTab === "notes" ? "#FEF3C7" : undefined,
              borderColor: activeTab === "notes" ? "#F59E0B" : undefined,
              color: activeTab === "notes" ? "#92400E" : undefined,
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
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Internal Notes</span>
            <span
              style={{
                backgroundColor: activeTab === "notes" ? "#FDE68A" : "#E2E8F0",
                color: activeTab === "notes" ? "#92400E" : "#475569",
                borderRadius: "10px",
                padding: "0.1rem 0.45rem",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {notes.length}
            </span>
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem", borderBottom: "1px solid var(--color-border, #E2E8F0)", paddingBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary, #006B3C)" }}>
            Public Comments ({comments.length})
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748B" }}>
            Messages exchanged with TokTickIT Support
          </p>
        </div>
      )}

      {/* 1. PUBLIC COMMENTS PANEL */}
      {(activeTab === "comments" || !isStaff) && (
        <div data-testid="public-comments-panel">
          {comments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                backgroundColor: "#F8FAF8",
                borderRadius: "8px",
                border: "1px dashed #CBD5E1",
                marginBottom: "1.25rem",
              }}
              data-testid="no-comments-message"
            >
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748B" }}>
                No public comments yet. Post an update below.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  data-testid={`public-comment-${c.id}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid var(--color-primary, #006B3C)",
                    borderRadius: "6px",
                    padding: "0.85rem 1rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A" }}>
                        {c.author?.name || "Anonymous"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor: c.author?.role === "IT_STAFF" ? "#EAF6EF" : "#F1F5F9",
                          color: c.author?.role === "IT_STAFF" ? "var(--color-primary, #006B3C)" : "#475569",
                        }}
                      >
                        {c.author?.role === "IT_STAFF" ? "IT Staff" : "Requester"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{formatDate(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Public Comment Form */}
          <form onSubmit={handleAddComment} data-testid="add-public-comment-form">
            {commentError && (
              <div className="alert alert-danger py-2 px-3 mb-2" style={{ fontSize: "0.825rem" }}>
                {commentError}
              </div>
            )}
            <div style={{ marginBottom: "0.5rem" }}>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Write a public comment for the ticket..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                data-testid="public-comment-input"
                style={{ fontSize: "0.875rem", borderRadius: "8px", borderColor: "#CBD5E1" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  {newCommentText.trim().length} / 2000 characters (min 2)
                </span>
                <button
                  type="submit"
                  className="zen-btn-primary"
                  disabled={isSubmittingComment || newCommentText.trim().length < 2}
                  data-testid="submit-public-comment-btn"
                  style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 2. INTERNAL NOTES PANEL (CONFIDENTIAL - IT STAFF ONLY) */}
      {isStaff && activeTab === "notes" && (
        <div data-testid="internal-notes-panel">
          <div
            data-testid="confidential-notes-banner"
            style={{
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: "6px",
              padding: "0.6rem 0.85rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              color: "#92400E",
              fontSize: "0.825rem",
              fontWeight: 500,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D97706"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              <strong>Confidential Internal Notes:</strong> Restricted exclusively to IT Staff. These entries are never visible to Requesters or Administrators.
            </span>
          </div>

          {notes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                backgroundColor: "#FFFBEB",
                borderRadius: "8px",
                border: "1px dashed #FCD34D",
                marginBottom: "1.25rem",
              }}
              data-testid="no-notes-message"
            >
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#B45309" }}>
                No internal notes recorded yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
              {notes.map((n) => (
                <div
                  key={n.id}
                  data-testid={`internal-note-${n.id}`}
                  style={{
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderLeft: "4px solid #F59E0B",
                    borderRadius: "6px",
                    padding: "0.85rem 1rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#78350F" }}>
                        {n.author?.name || "IT Staff"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FCD34D",
                        }}
                      >
                        Internal Note
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#B45309" }}>{formatDate(n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "#78350F", whiteSpace: "pre-wrap" }}>
                    {n.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Internal Note Form */}
          <form onSubmit={handleAddNote} data-testid="add-internal-note-form">
            {noteError && (
              <div className="alert alert-danger py-2 px-3 mb-2" style={{ fontSize: "0.825rem" }}>
                {noteError}
              </div>
            )}
            <div style={{ marginBottom: "0.5rem" }}>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Record a confidential internal note (IT Staff only)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                data-testid="internal-note-input"
                style={{
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  borderColor: "#FCD34D",
                  backgroundColor: "#FFFDF5",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  {newNoteText.trim().length} / 2000 characters (min 2)
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingNote || newNoteText.trim().length < 2}
                  data-testid="submit-internal-note-btn"
                  style={{
                    backgroundColor: "#F59E0B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    padding: "0.4rem 1rem",
                    fontSize: "0.85rem",
                    cursor: newNoteText.trim().length < 2 ? "not-allowed" : "pointer",
                    opacity: newNoteText.trim().length < 2 ? 0.6 : 1,
                  }}
                >
                  {isSubmittingNote ? "Adding Note..." : "Add Internal Note"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
