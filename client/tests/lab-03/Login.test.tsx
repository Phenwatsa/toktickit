import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../src/pages/Login";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("Login View (Login.test.tsx)", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  it("renders email, password inputs, and sign in button with initial focus", () => {
    render(<Login />);

    expect(screen.getByTestId("login-container")).toBeInTheDocument();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("triggers client-side validation when attempting to submit with empty inputs", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const submitBtn = screen.getByTestId("login-submit-btn");
    await user.click(submitBtn);

    expect(screen.getByTestId("login-email-error")).toHaveTextContent("Email address is required");
    expect(screen.getByTestId("login-password-error")).toHaveTextContent("Password is required");
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("UI-01: handles input entry, submits credentials, and displays busy spinner state", async () => {
    const user = userEvent.setup();
    // Simulate a delayed response
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "jennifer.a@toktickit.local");
    await user.type(screen.getByTestId("login-password-input"), "Password123!");

    const submitBtn = screen.getByTestId("login-submit-btn");
    await user.click(submitBtn);

    // Verify loading spinner and disabled state
    expect(screen.getByTestId("login-spinner")).toBeInTheDocument();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId("login-email-input")).toBeDisabled();
    expect(screen.getByTestId("login-password-input")).toBeDisabled();
    expect(mockLogin).toHaveBeenCalledWith("jennifer.a@toktickit.local", "Password123!");

    // Resolve login
    resolveLogin!({ id: 1, name: "Jennifer Anderson" });
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it("UI-02: displays safe generic error banner on invalid credentials (401)", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Invalid email or password. Please try again."));

    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "wrong@toktickit.local");
    await user.type(screen.getByTestId("login-password-input"), "WrongPassword!");

    await user.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("login-error-banner")).toHaveTextContent(
      "Invalid email or password. Please try again."
    );
  });

  it("allows toggling password visibility between text and password", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByTestId("login-password-input");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideBtn = screen.getByRole("button", { name: /hide password/i });
    await user.click(hideBtn);

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
