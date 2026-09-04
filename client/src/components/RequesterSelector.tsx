import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext";

interface RequesterSelectorProps {
  onContinue: () => void;
  onCancel?: () => void;
}

export function RequesterSelector({ onContinue, onCancel }: RequesterSelectorProps) {
  const { currentRequester, activeRequesters, isLoading, error, selectRequester, refreshRequesters } =
    useRequester();

  const [selectedId, setSelectedId] = useState<number | "">("");

  useEffect(() => {
    if (currentRequester) {
      setSelectedId(currentRequester.id);
    } else if (activeRequesters.length > 0) {
      setSelectedId(activeRequesters[0].id);
    }
  }, [currentRequester, activeRequesters]);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    const chosen = activeRequesters.find((r) => r.id === Number(selectedId));
    if (chosen) {
      selectRequester(chosen);
      onContinue();
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: "2rem auto", padding: "0 1rem" }}>
      <div className="zen-card" style={{ padding: "2rem" }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary)",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              boxShadow: "0 2px 6px rgba(0, 107, 60, 0.15)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.35rem" }}>
            Select Development Requester
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.45 }}>
            Choose a development requester to simulate the current user context.
            <br />
            <span style={{ fontSize: "0.785rem", color: "#64748B" }}>This is for testing only and is not a login screen.</span>
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid #CBD5E1", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", fontSize: "0.85rem" }}>
              Loading active requesters...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div style={{ padding: "0.85rem 1rem", backgroundColor: "var(--color-error-bg)", border: "1px solid #FECACA", borderRadius: "8px", color: "var(--color-error)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Failed to load requesters</div>
            <p style={{ margin: "0 0 0.5rem" }}>{error}</p>
            <button
              type="button"
              className="zen-btn-secondary"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              onClick={refreshRequesters}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && activeRequesters.length === 0 && (
          <div style={{ padding: "0.85rem 1rem", backgroundColor: "var(--color-warning-bg)", border: "1px solid #FDE68A", borderRadius: "8px", color: "#92400E", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            No active development requesters found in the database. Please run the seed script: <code>npm run prisma:seed</code>.
          </div>
        )}

        {/* Main Selection Form */}
        {!isLoading && !error && activeRequesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="requesterSelect" className="zen-form-label">
                Development Requester <span className="zen-required">*</span>
              </label>
              <select
                id="requesterSelect"
                className="zen-form-control"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="" disabled>
                  -- Select an Active Requester --
                </option>
                {activeRequesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.name} — {req.department} ({req.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ padding: "0.65rem 0.85rem", backgroundColor: "#F8FAF8", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "0.8rem", color: "#475569", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Showing active development accounts only. Inactive profiles are excluded.</span>
            </div>

            <div style={{ padding: "0.65rem 0.85rem", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "0.8rem", color: "#475569", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-secondary)", flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <strong style={{ color: "#0F172A" }}>Authentication coming in Lab 3</strong> &mdash; Simulated context for development testing.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              {onCancel && (
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="zen-btn-primary"
                disabled={!selectedId}
                data-testid="continue-requester-btn"
              >
                <span>Continue</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
