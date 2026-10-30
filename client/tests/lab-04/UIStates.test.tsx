import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchActionsTaken: vi.fn(),
  createActionTaken: vi.fn(),
  updateActionTaken: vi.fn(),
}));

describe("UIStates Component - Actions Taken (UIStates.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 2,
        name: "Alex Taylor",
        email: "alex.taylor@toktickit.com",
        role: "IT_STAFF",
        department: "IT Operations",
        mustChangePassword: false,
        isActive: true,
      },
      token: "mock-jwt-token",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  // =========================================================================
  // UI-EMPTY-01: Loading Skeleton & Zero State (AC-24)
  // =========================================================================
  describe("UI-EMPTY-01: Loading Skeleton & Zero State (AC-24)", () => {
    it("renders pulsing skeleton loader during active data fetch", async () => {
      // Create a pending promise to keep the component in loading state
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      vi.mocked(api.fetchActionsTaken).mockReturnValue(fetchPromise as any);

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);

      // Skeleton loader is immediately rendered
      expect(screen.getByTestId("actions-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("actions-desktop-table")).not.toBeInTheDocument();
      expect(screen.queryByTestId("actions-empty-state")).not.toBeInTheDocument();

      // Resolve the fetch with empty array
      resolveFetch!([]);

      // Skeleton should be replaced by empty state
      expect(await screen.findByTestId("actions-empty-state")).toBeInTheDocument();
      expect(screen.queryByTestId("actions-skeleton")).not.toBeInTheDocument();
    });

    it("renders friendly zero-state message when ticket has 0 actions taken", async () => {
      vi.mocked(api.fetchActionsTaken).mockResolvedValueOnce([]);

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);

      // Wait for empty state container
      const emptyState = await screen.findByTestId("actions-empty-state");
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent("No diagnostic actions recorded yet.");
      expect(emptyState).toHaveTextContent(
        "IT Staff will log investigation and troubleshooting steps here."
      );

      // Verify count badge shows 0
      expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("0");

      // Verify table is not in the DOM
      expect(screen.queryByTestId("actions-desktop-table")).not.toBeInTheDocument();
    });

    it("displays error alert when fetchActionsTaken rejects", async () => {
      vi.mocked(api.fetchActionsTaken).mockRejectedValueOnce(
        new Error("Network connection dropped while fetching actions")
      );

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);

      const errorAlert = await screen.findByTestId("actions-error-alert");
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(
        "Network connection dropped while fetching actions"
      );
    });

    it("disables + Add Action Taken button when ticket is CANCELLED", async () => {
      vi.mocked(api.fetchActionsTaken).mockResolvedValueOnce([]);

      render(
        <ActionsTakenSection ticketId={101} isStaff={true} isCancelled={true} />
      );

      expect(await screen.findByTestId("actions-empty-state")).toBeInTheDocument();

      const addBtn = screen.getByTestId("add-action-btn");
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toBeDisabled();
    });
  });
});
