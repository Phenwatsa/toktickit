import React, { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    }
    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.message || "Invalid email or password. Please try again.";
      setErrorMessage(
        msg.includes("Invalid") || msg.includes("credentials") || msg.includes("401")
          ? "Invalid email or password. Please try again."
          : msg
      );
    } finally {
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
          maxWidth: "420px",
          backgroundColor: "var(--zg-bg-card, #FFFFFF)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
          border: "1px solid var(--zg-border, #E2E8F0)",
          padding: "2rem",
        }}
        data-testid="login-container"
      >
        {/* Branding Leaf Logo */}
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--zg-text-primary, #1A202C)",
              margin: 0,
            }}
          >
            TokTickIT
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--zg-text-muted, #64748B)",
              marginTop: "0.25rem",
              marginBottom: 0,
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className="zen-alert-danger mb-4"
            role="alert"
            data-testid="login-error-banner"
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label
              htmlFor="email-input"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--zg-text-primary, #1A202C)",
                marginBottom: "0.35rem",
              }}
            >
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              autoFocus
              className="zen-input"
              placeholder="e.g. name@toktickit.local"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              disabled={isSubmitting}
              data-testid="login-email-input"
              style={{
                width: "100%",
                height: "44px",
                padding: "0 0.75rem",
                borderRadius: "8px",
                border: validationErrors.email
                  ? "1px solid var(--zg-danger, #DC2626)"
                  : "1px solid var(--zg-border, #E2E8F0)",
                fontSize: "0.95rem",
                outline: "none",
                backgroundColor: isSubmitting ? "#F8FAFC" : "#FFFFFF",
              }}
            />
            {validationErrors.email && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--zg-danger, #DC2626)",
                  marginTop: "0.25rem",
                  display: "block",
                }}
                data-testid="login-email-error"
              >
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password-input"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--zg-text-primary, #1A202C)",
                marginBottom: "0.35rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                className="zen-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                disabled={isSubmitting}
                data-testid="login-password-input"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 2.5rem 0 0.75rem",
                  borderRadius: "8px",
                  border: validationErrors.password
                    ? "1px solid var(--zg-danger, #DC2626)"
                    : "1px solid var(--zg-border, #E2E8F0)",
                  fontSize: "0.95rem",
                  outline: "none",
                  backgroundColor: isSubmitting ? "#F8FAFC" : "#FFFFFF",
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
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
                {showPassword ? (
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
            {validationErrors.password && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--zg-danger, #DC2626)",
                  marginTop: "0.25rem",
                  display: "block",
                }}
                data-testid="login-password-error"
              >
                {validationErrors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="zen-btn-primary"
            disabled={isSubmitting}
            data-testid="login-submit-btn"
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: "var(--zg-primary, #006B3C)",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "background-color 150ms ease",
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                  data-testid="login-spinner"
                />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
