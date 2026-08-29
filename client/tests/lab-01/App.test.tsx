import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("App (Lab 1 Legacy Compatibility)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a mocked selected development requester to bypass the selector screen
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.a@toktickit.local",
        department: "Human Resources",
        isActive: true,
      })
    );
    // Mock active requesters call
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([
      {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.a@toktickit.local",
        department: "Human Resources",
        isActive: true,
      },
    ]);
  });

  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  it("displays loading state while waiting for the API response", async () => {
    let resolvePromise: (value: api.SystemStatus) => void;
    const promise = new Promise<api.SystemStatus>((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(api, "checkSystem").mockReturnValue(promise);

    render(<App />);

    // Switch to Health Check tab
    fireEvent.click(screen.getByRole("button", { name: /Health Check/i }));

    const button = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /Loading…/i })).toBeDisabled();

    resolvePromise!({
      online: true,
      categories: [{ id: 1, name: "Account and Access" }],
    });

    await waitFor(() => {
      expect(screen.getByText(/System Status: Online/i)).toBeInTheDocument();
    });
  });

  it("shows Online and the seeded categories on success", async () => {
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    render(<App />);

    // Switch to Health Check tab
    fireEvent.click(screen.getByRole("button", { name: /Health Check/i }));

    fireEvent.click(screen.getByRole("button", { name: /Check System/i }));

    await waitFor(() => {
      expect(screen.getByText(/System Status: Online/i)).toBeInTheDocument();
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Software")).toBeInTheDocument();
      expect(screen.getByText("Network")).toBeInTheDocument();
    });
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(
      new Error("Unable to connect to TokTickIT API")
    );

    render(<App />);

    // Switch to Health Check tab
    fireEvent.click(screen.getByRole("button", { name: /Health Check/i }));

    fireEvent.click(screen.getByRole("button", { name: /Check System/i }));

    await waitFor(() => {
      expect(screen.getByText(/System Status: Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to TokTickIT API/i)).toBeInTheDocument();
    });
  });
});
