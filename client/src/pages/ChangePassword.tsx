import React, { useState, useMemo, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function ChangePassword() {
  const { updatePassword, user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Policy Checks (Real-Time)
  const isMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const hasCurrentPassword = currentPassword.trim().length > 0;
  const isDifferentFromCurrent = !hasCurrentPassword || newPassword !== currentPassword;

  const isFormValid = useMemo(() => {
    return (
      hasCurrentPassword &&
      isMinLength &&
      hasUpperAndLower &&
      hasNumber &&
      passwordsMatch &&
      isDifferentFromCurrent
    );
  }, [
    hasCurrentPassword,
    isMinLength,
    hasUpperAndLower,
    hasNumber,
    passwordsMatch,
    isDifferentFromCurrent,
  ]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await updatePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setSuccessMessage("Password updated successfully! Continuing into TokTickIT...");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update password. Please check your inputs.");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      style={{ backgroundColor: "var(--zg-bg-page, #F5F7F6)" }}
    >
      <div
        className="zen-auth-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--zg-bg-card, #FFFFFF)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
          border: "1px solid var(--zg-border, #E2E8F0)",
          padding: "2rem",
        }}
        data-testid="change-password-container"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "var(--zg-primary, #006B3C)",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0, 107, 60, 0.25)",
              marginBottom: "1rem",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--zg-text-primary, #1A202C)",
              margin: 0,
            }}
          >
            Change Your Password
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--zg-text-muted, #64748B)",
              marginTop: "0.35rem",
              marginBottom: 0,
            }}
          >
            You must change your temporary password to continue accessing TokTickIT.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            className="zen-alert-success mb-4"
            role="alert"
            data-testid="change-password-success-banner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: "8px",
              color: "var(--zg-primary, #006B3C)",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="zen-alert-danger mb-4"
            role="alert"
            data-testid="change-password-error-banner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "var(--zg-danger, #DC2626)",
              fontSize: "0.875rem",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password */}
          <div className="mb-3">
            <label
              htmlFor="current-password-input"
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--zg-text-primary, #1A202C)",
                marginBottom: "0.35rem",
              }}
            >
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="current-password-input"
                type={showCurrentPassword ? "text" : "password"}
                className="zen-input"
                placeholder="Enter current / temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                data-testid="current-password-input"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 2.5rem 0 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--zg-border, #E2E8F0)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
                data-testid="toggle-current-password"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--zg-text-muted, #64748B)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showCurrentPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label
              htmlFor="new-password-input"
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--zg-text-primary, #1A202C)",
                marginBottom: "0.35rem",
              }}
            >
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="new-password-input"
                type={showNewPassword ? "text" : "password"}
                className="zen-input"
                placeholder="At least 8 characters with upper, lower, number"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                data-testid="new-password-input"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 2.5rem 0 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--zg-border, #E2E8F0)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
                data-testid="toggle-new-password"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--zg-text-muted, #64748B)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showNewPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label
              htmlFor="confirm-password-input"
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--zg-text-primary, #1A202C)",
                marginBottom: "0.35rem",
              }}
            >
              Confirm New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="confirm-password-input"
                type={showConfirmPassword ? "text" : "password"}
                className="zen-input"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                data-testid="confirm-password-input"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 2.5rem 0 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--zg-border, #E2E8F0)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                data-testid="toggle-confirm-password"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--zg-text-muted, #64748B)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Live Validation Checklist */}
          <div
            className="p-3 mb-4"
            style={{
              backgroundColor: "var(--zg-bg-page, #F5F7F6)",
              borderRadius: "8px",
              border: "1px solid var(--zg-border, #E2E8F0)",
            }}
            data-testid="password-checklist"
          >
            <span
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--zg-text-muted, #64748B)",
                marginBottom: "0.5rem",
              }}
            >
              Password Policy Requirements:
            </span>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: "0.825rem" }}>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                  color: isMinLength ? "var(--zg-primary, #006B3C)" : "var(--zg-text-muted, #64748B)",
                  fontWeight: isMinLength ? 600 : 400,
                }}
                data-testid="rule-min-length"
              >
                <span>{isMinLength ? "✓" : "○"}</span>
                <span>At least 8 characters</span>
              </li>

              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                  color: hasUpperAndLower ? "var(--zg-primary, #006B3C)" : "var(--zg-text-muted, #64748B)",
                  fontWeight: hasUpperAndLower ? 600 : 400,
                }}
                data-testid="rule-upper-lower"
              >
                <span>{hasUpperAndLower ? "✓" : "○"}</span>
                <span>Includes uppercase and lowercase letters</span>
              </li>

              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                  color: hasNumber ? "var(--zg-primary, #006B3C)" : "var(--zg-text-muted, #64748B)",
                  fontWeight: hasNumber ? 600 : 400,
                }}
                data-testid="rule-number"
              >
                <span>{hasNumber ? "✓" : "○"}</span>
                <span>Includes at least one number</span>
              </li>

              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                  color: passwordsMatch ? "var(--zg-primary, #006B3C)" : "var(--zg-text-muted, #64748B)",
                  fontWeight: passwordsMatch ? 600 : 400,
                }}
                data-testid="rule-match"
              >
                <span>{passwordsMatch ? "✓" : "○"}</span>
                <span>Passwords match</span>
              </li>
            </ul>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="zen-btn-primary"
            disabled={!isFormValid || isSubmitting}
            data-testid="change-password-submit-btn"
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: isFormValid && !isSubmitting ? "var(--zg-primary, #006B3C)" : "#CBD5E1",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              cursor: isFormValid && !isSubmitting ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "background-color 150ms ease",
            }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Save Password & Continue</span>
            )}
          </button>

          {/* Sign out link */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={logout}
              data-testid="change-password-logout-btn"
              style={{
                background: "none",
                border: "none",
                color: "var(--zg-text-muted, #64748B)",
                fontSize: "0.825rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign in with another account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
