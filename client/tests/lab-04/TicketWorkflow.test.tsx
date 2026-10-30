import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/pages/StaffTicketDetail";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import { StaffTicketDetailData, StaffTicketOwner } from "../../src/types";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchStaffTicketDetail: vi.fn(),
  fetchStaffMembers: vi.fn(),
  claimStaffTicket: vi.fn(),
  assignStaffTicket: vi.fn(),
  updateStaffTicketPriority: vi.fn(),
  updateStaffTicketStatus: vi.fn(),
  fetchActionsTaken: vi.fn(),
  createActionTaken: vi.fn(),
  updateActionTaken: vi.fn(),
  fetchPublicComments: vi.fn(),
  createPublicComment: vi.fn(),
  fetchInternalNotes: vi.fn(),
  createInternalNote: vi.fn(),
}));

const mockStaffMembers: StaffTicketOwner[] = [
  { id: 2, name: "Alex Taylor", email: "alex.taylor@toktickit.com" },
  { id: 3, name: "Sarah Johnson", email: "sarah.johnson@toktickit.com" },
];

const mockTicketData: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "VPN Connection drops frequently",
  description: "User reports VPN tunnel terminates every 15 minutes during peak hours.",
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 4, name: "Corporate VPN Gateway" },
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "OPEN",
  problemAppearsResolved: false,
  requester: {
    id: 10,
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    department: "Finance",
  },
  ticketOwner: { id: 2, name: "Alex Taylor", email: "alex.taylor@toktickit.com" },
  createdAt: "2026-10-10T08:00:00Z",
  updatedAt: "2026-10-10T09:00:00Z",
  attachments: [],
  publicComments: [],
  internalNotes: [],
};

describe("TicketWorkflow Component & Concurrency Resilience (TicketWorkflow.test.tsx)", () => {
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

    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(mockTicketData);
    vi.mocked(api.fetchStaffMembers).mockResolvedValue(mockStaffMembers);
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);
    vi.mocked(api.fetchPublicComments).mockResolvedValue([]);
    vi.mocked(api.fetchInternalNotes).mockResolvedValue([]);
  });

  // =========================================================================
  // 1. Permitted Status Transitions (Resolution Gate Enforcement)
  // =========================================================================
  describe("Permitted Status Transitions & Resolution Gate", () => {
    it("enforces Resolution Gate: OPEN tickets do NOT list RESOLVED in status dropdown", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      expect(await screen.findByTestId("staff-ticket-detail-view")).toBeInTheDocument();

      const select = screen.getByTestId("status-transition-select") as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      // OPEN ticket permits IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED
      expect(options).toContain("IN_PROGRESS");
      expect(options).toContain("WAITING_FOR_REQUESTER");
      expect(options).toContain("CANCELLED");

      // Strictly prohibited from transitioning directly to RESOLVED or CLOSED
      expect(options).not.toContain("RESOLVED");
      expect(options).not.toContain("CLOSED");
    });

    it("displays permitted transitions for IN_PROGRESS ticket including RESOLVED", async () => {
      vi.mocked(api.fetchStaffTicketDetail).mockResolvedValueOnce({
        ...mockTicketData,
        currentStatus: "IN_PROGRESS",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      expect(await screen.findByTestId("staff-ticket-detail-view")).toBeInTheDocument();

      const select = screen.getByTestId("status-transition-select") as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      expect(options).toContain("WAITING_FOR_REQUESTER");
      expect(options).toContain("RESOLVED");
      expect(options).toContain("CANCELLED");
      expect(options).not.toContain("CLOSED");
    });
  });

  // =========================================================================
  // 2. UI-04 & UI-04b: 409 Conflict Detection & Form State Preservation
  // =========================================================================
  describe("UI-04 & UI-04b: Optimistic Concurrency Conflict (409) & Form Preservation", () => {
    it("displays 409 Conflict banner with Refresh button on stale update, preserving uncommitted input", async () => {
      const user = userEvent.setup();

      // Mock 409 conflict error from API
      const conflictError: any = new Error("Stale update detected. Another user modified the ticket.");
      conflictError.status = 409;
      conflictError.code = "STALE_UPDATE_CONFLICT";
      vi.mocked(api.updateStaffTicketStatus).mockRejectedValueOnce(conflictError);

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      expect(await screen.findByTestId("staff-ticket-detail-view")).toBeInTheDocument();

      // Select IN_PROGRESS status
      const select = screen.getByTestId("status-transition-select");
      fireEvent.change(select, { target: { value: "IN_PROGRESS" } });
      expect(select).toHaveValue("IN_PROGRESS");

      // Click Transition button to open confirm modal
      const transitionBtn = screen.getByTestId("transition-status-btn");
      await user.click(transitionBtn);

      // Confirm modal opens
      expect(await screen.findByTestId("status-confirm-modal")).toBeInTheDocument();

      // Click Confirm Transition
      const confirmBtn = screen.getByTestId("confirm-status-transition-btn");
      await user.click(confirmBtn);

      // Verify updateStaffTicketStatus was called with updatedAt timestamp
      await waitFor(() => {
        expect(api.updateStaffTicketStatus).toHaveBeenCalledWith(
          101,
          "IN_PROGRESS",
          "2026-10-10T09:00:00Z"
        );
      });

      // Verify 409 Conflict Alert banner is rendered
      const conflictBanner = await screen.findByTestId("conflict-alert");
      expect(conflictBanner).toBeInTheDocument();
      expect(conflictBanner).toHaveTextContent(
        "Conflict: This ticket was updated by another team member while you were viewing it. Please review the updated status."
      );

      // Verify Refresh Ticket State button is rendered
      const refreshBtn = screen.getByTestId("refresh-ticket-state-btn");
      expect(refreshBtn).toBeInTheDocument();

      // UI-04b / AC-28 Form State Preservation Contract:
      // Uncommitted selection must NOT be lost!
      expect(screen.getByTestId("status-transition-select")).toHaveValue("IN_PROGRESS");
    });

    it("refreshes ticket state and clears conflict banner when Refresh button is clicked", async () => {
      const user = userEvent.setup();

      const conflictError: any = new Error("Stale update detected");
      conflictError.status = 409;
      conflictError.code = "STALE_UPDATE_CONFLICT";
      vi.mocked(api.updateStaffTicketStatus).mockRejectedValueOnce(conflictError);

      // Subsequent fetch after refresh
      const refreshedTicketData: StaffTicketDetailData = {
        ...mockTicketData,
        currentStatus: "IN_PROGRESS",
        updatedAt: "2026-10-10T09:30:00Z",
      };

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      expect(await screen.findByTestId("staff-ticket-detail-view")).toBeInTheDocument();

      // Trigger 409
      const select = screen.getByTestId("status-transition-select");
      fireEvent.change(select, { target: { value: "IN_PROGRESS" } });
      await user.click(screen.getByTestId("transition-status-btn"));
      await user.click(screen.getByTestId("confirm-status-transition-btn"));

      expect(await screen.findByTestId("conflict-alert")).toBeInTheDocument();

      // Setup refreshed response
      vi.mocked(api.fetchStaffTicketDetail).mockResolvedValueOnce(refreshedTicketData);

      // Click Refresh Ticket State
      const refreshBtn = screen.getByTestId("refresh-ticket-state-btn");
      await user.click(refreshBtn);

      // Verify fetchStaffTicketDetail was called
      await waitFor(() => {
        expect(api.fetchStaffTicketDetail).toHaveBeenCalledTimes(2);
      });

      // Conflict alert should be dismissed
      expect(screen.queryByTestId("conflict-alert")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Advisory Requester Resolution Indicator
  // =========================================================================
  describe("Advisory Requester Resolution Indicator", () => {
    it("displays advisory resolved indication banner without mutating ticket status", async () => {
      vi.mocked(api.fetchStaffTicketDetail).mockResolvedValueOnce({
        ...mockTicketData,
        currentStatus: "IN_PROGRESS",
        problemAppearsResolved: true,
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      expect(await screen.findByTestId("staff-ticket-detail-view")).toBeInTheDocument();

      // Advisory banner is rendered
      expect(screen.getByTestId("resolved-indication-banner")).toBeInTheDocument();

      // Status badge remains IN_PROGRESS
      expect(screen.getByTestId("badge-status-in_progress")).toBeInTheDocument();
    });
  });
});
