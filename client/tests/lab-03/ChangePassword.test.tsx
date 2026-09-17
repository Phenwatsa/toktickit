import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePassword } from "../../src/pages/ChangePassword";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("ChangePassword View (ChangePassword.test.tsx)", () => {
  const mockUpdatePassword = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 10,
        name: "First Login Requester",
        email: "firstlogin.req@toktickit.local",
        role: "REQUESTER",
        mustChangePassword: true,
        isActive: true,
      },
      token: "mock-jwt-token",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      updatePassword: mockUpdatePassword,
    });
  });

  it("renders header, 3 password inputs, checklist, and initially disabled submit button", () => {
    render(<ChangePassword />);

    expect(screen.getByTestId("change-password-container")).toBeInTheDocument();
    expect(screen.getByTestId("current-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-checklist")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("change-password-submit-btn");
    expect(submitBtn).toBeDisabled();
  });

  it("UI-03: enforces password complexity checklist rules in real-time and enables button only when all criteria pass", async () => {
    const user = userEvent.setup();
    render(<ChangePassword />);

    const currentInput = screen.getByTestId("current-password-input");
    const newInput = screen.getByTestId("new-password-input");
    const confirmInput = screen.getByTestId("confirm-password-input");
    const submitBtn = screen.getByTestId("change-password-submit-btn");

    // Provide current password
    await user.type(currentInput, "Password123!");
    expect(submitBtn).toBeDisabled();

    // 1. Check length < 8
    await user.type(newInput, "short");
    expect(screen.getByTestId("rule-min-length")).toHaveTextContent("○At least 8 characters");
    expect(submitBtn).toBeDisabled();

    // 2. Length >= 8, but only lowercase
    await user.clear(newInput);
    await user.type(newInput, "lowercaseonly");
    expect(screen.getByTestId("rule-min-length")).toHaveTextContent("✓At least 8 characters");
    expect(screen.getByTestId("rule-upper-lower")).toHaveTextContent("○Includes uppercase and lowercase letters");
    expect(submitBtn).toBeDisabled();

    // 3. Add uppercase, but missing number
    await user.clear(newInput);
    await user.type(newInput, "UpperAndLower");
    expect(screen.getByTestId("rule-upper-lower")).toHaveTextContent("✓Includes uppercase and lowercase letters");
    expect(screen.getByTestId("rule-number")).toHaveTextContent("○Includes at least one number");
    expect(submitBtn).toBeDisabled();

    // 4. Add number, but confirmation does not match yet
    await user.clear(newInput);
    await user.type(newInput, "SecurePass2026!");
    expect(screen.getByTestId("rule-number")).toHaveTextContent("✓Includes at least one number");
    expect(screen.getByTestId("rule-match")).toHaveTextContent("○Passwords match");
    expect(submitBtn).toBeDisabled();

    // 5. Provide matching confirmation
    await user.type(confirmInput, "SecurePass2026!");
    expect(screen.getByTestId("rule-match")).toHaveTextContent("✓Passwords match");

    // All criteria now met -> button is enabled!
    expect(submitBtn).not.toBeDisabled();
  });

  it("submits valid password change, displays busy spinner, and shows success banner upon completion", async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue(undefined);

    render(<ChangePassword />);

    await user.type(screen.getByTestId("current-password-input"), "OldPassword1!");
    await user.type(screen.getByTestId("new-password-input"), "BrandNewPass2026!");
    await user.type(screen.getByTestId("confirm-password-input"), "BrandNewPass2026!");

    const submitBtn = screen.getByTestId("change-password-submit-btn");
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);

    expect(mockUpdatePassword).toHaveBeenCalledWith({
      currentPassword: "OldPassword1!",
      newPassword: "BrandNewPass2026!",
      confirmNewPassword: "BrandNewPass2026!",
    });

    await waitFor(() => {
      expect(screen.getByTestId("change-password-success-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("change-password-success-banner")).toHaveTextContent(
      "Password updated successfully!"
    );
  });

  it("displays error banner when password update API rejects", async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockRejectedValue(new Error("Current password verification failed"));

    render(<ChangePassword />);

    await user.type(screen.getByTestId("current-password-input"), "WrongCurrentPassword1!");
    await user.type(screen.getByTestId("new-password-input"), "ValidNewPass2026!");
    await user.type(screen.getByTestId("confirm-password-input"), "ValidNewPass2026!");

    await user.click(screen.getByTestId("change-password-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("change-password-error-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("change-password-error-banner")).toHaveTextContent(
      "Current password verification failed"
    );
  });

  it("allows user to log out and switch accounts from change password screen", async () => {
    const user = userEvent.setup();
    render(<ChangePassword />);

    const logoutBtn = screen.getByTestId("change-password-logout-btn");
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles password visibility between text and password for all 3 fields", async () => {
    const user = userEvent.setup();
    render(<ChangePassword />);

    const currentInput = screen.getByTestId("current-password-input");
    const newInput = screen.getByTestId("new-password-input");
    const confirmInput = screen.getByTestId("confirm-password-input");

    expect(currentInput).toHaveAttribute("type", "password");
    expect(newInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    // Toggle current password
    await user.click(screen.getByTestId("toggle-current-password"));
    expect(currentInput).toHaveAttribute("type", "text");
    await user.click(screen.getByTestId("toggle-current-password"));
    expect(currentInput).toHaveAttribute("type", "password");

    // Toggle new password
    await user.click(screen.getByTestId("toggle-new-password"));
    expect(newInput).toHaveAttribute("type", "text");
    await user.click(screen.getByTestId("toggle-new-password"));
    expect(newInput).toHaveAttribute("type", "password");

    // Toggle confirm password
    await user.click(screen.getByTestId("toggle-confirm-password"));
    expect(confirmInput).toHaveAttribute("type", "text");
    await user.click(screen.getByTestId("toggle-confirm-password"));
    expect(confirmInput).toHaveAttribute("type", "password");
  });
});
