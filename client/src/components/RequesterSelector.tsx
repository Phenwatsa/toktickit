import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext";
import { RequesterUser } from "../types";

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
    <div className="container py-5" style={{ maxWidth: 560 }}>
      <div className="zen-card shadow-sm border">
        {/* Header Icon & Title */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 56,
              height: 56,
              backgroundColor: "var(--color-pale-green)",
              borderRadius: "50%",
              fontSize: "1.75rem",
            }}
          >
            👥
          </div>
          <h2 className="h4 fw-bold text-dark mb-2">Select Development Requester</h2>
          <p className="text-muted small mb-0">
            Choose a development requester to simulate the current requester context for Lab 2.
            <br />
            <strong>This is for testing only and is not a login screen.</strong>
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading requesters...</span>
            </div>
            <p className="text-muted mt-2 small">Loading active development requesters...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="alert alert-danger mb-4" role="alert">
            <h6 className="alert-heading fw-bold mb-1">Failed to load requesters</h6>
            <p className="small mb-2">{error}</p>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={refreshRequesters}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && activeRequesters.length === 0 && (
          <div className="alert alert-warning mb-4" role="alert">
            <p className="mb-0 small">
              No active development requesters found in the database. Please run the seed script:{" "}
              <code>npm run prisma:seed</code>.
            </p>
          </div>
        )}

        {/* Main Selection Form */}
        {!isLoading && !error && activeRequesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div className="mb-3">
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

            <div className="zen-callout-info mb-3 d-flex gap-2 align-items-center">
              <span>ℹ️</span>
              <span className="small">
                Only active development requesters are shown. Inactive accounts are excluded.
              </span>
            </div>

            <div className="p-3 bg-light rounded border mb-4">
              <div className="d-flex gap-2">
                <span>🛡️</span>
                <div>
                  <strong className="d-block text-dark small">Authentication coming in Lab 3</strong>
                  <p className="text-muted small mb-0">
                    In Lab 3, this selection will be replaced with secure authentication so you can
                    access the system with your own account.
                  </p>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
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
              >
                ➔ Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
