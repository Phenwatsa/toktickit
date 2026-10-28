import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { StaffDashboard } from "../../src/pages/StaffDashboard";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchStaffDashboard: vi.fn(),
}));

describe("StaffDashboard Component (UI-06, UI-07b)", () => {
  const mockNavigate = vi.fn();

  const mockStaffData: api.StaffDashboardData = {
    metrics: {
      primary: {
        newTickets: 3,
        openTickets: 4,
        inProgressTickets: 5,
        waitingForRequesterTickets: 2,
        myAssignedTickets: 6,
      },
      unassignedTickets: 4,
      byStatus: {
        new: 3,
        open: 4,
        inProgress: 5,
        waitingForRequester: 2,
        resolved: 7,
        closed: 12,
        reopened: 1,
        cancelled: 0,
      },
      byPriority: {
        low: 2,
        medium: 5,
        high: 4,
        urgent: 3,
      },
    },
    recentTickets: [
      {
        id: 201,
        ticketNumber: "TCK-2026-0201",
        summary: "Database query latency spike",
        currentStatus: "IN_PROGRESS",
        itPriority: "URGENT",
        ticketOwner: { id: 2, name: "Alex Taylor" },
        requester: { id: 10, name: "Sarah Connor" },
        updatedAt: "2026-10-14T11:45:00.000Z",
      },
      {
        id: 202,
        ticketNumber: "TCK-2026-0202",
        summary: "Email sync configuration issue",
        currentStatus: "OPEN",
        itPriority: "MEDIUM",
        ticketOwner: null,
        requester: { id: 11, name: "John Doe" },
        updatedAt: "2026-10-14T10:15:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#/dashboard";

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
  // UI-06: IT Staff Dashboard cards rendering & drill-downs (AC-13, AC-15b)
  // =========================================================================
  describe("UI-06: Cards Rendering & Drill-Downs", () => {
    it("renders loading skeleton during initial fetch", async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.fetchStaffDashboard).mockReturnValue(pendingPromise as any);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();

      resolvePromise!(mockStaffData);
    });

    it("renders greeting banner and all 5 primary cards with accurate metrics", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText("Welcome back, Alex!")).toBeInTheDocument();
      });

      // Verify all 5 primary cards
      expect(screen.getByTestId("metric-card-new")).toHaveTextContent("3");
      expect(screen.getByTestId("metric-card-open")).toHaveTextContent("4");
      expect(screen.getByTestId("metric-card-in-progress")).toHaveTextContent("5");
      expect(screen.getByTestId("metric-card-waiting")).toHaveTextContent("2");
      expect(screen.getByTestId("metric-card-my-assigned")).toHaveTextContent("6");
    });

    it("drills down to #/staff-queue with correct filter presets when cards are clicked", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("metric-card-new")).toBeInTheDocument();
      });

      // 1. New -> status=NEW
      fireEvent.click(screen.getByTestId("metric-card-new"));
      expect(window.location.hash).toBe("#/staff-queue?status=NEW");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 2. Open -> status=OPEN
      fireEvent.click(screen.getByTestId("metric-card-open"));
      expect(window.location.hash).toBe("#/staff-queue?status=OPEN");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 3. In Progress -> status=IN_PROGRESS
      fireEvent.click(screen.getByTestId("metric-card-in-progress"));
      expect(window.location.hash).toBe("#/staff-queue?status=IN_PROGRESS");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 4. Waiting for Requester -> status=WAITING_FOR_REQUESTER
      fireEvent.click(screen.getByTestId("metric-card-waiting"));
      expect(window.location.hash).toBe("#/staff-queue?status=WAITING_FOR_REQUESTER");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 5. My Assigned -> owner=me
      fireEvent.click(screen.getByTestId("metric-card-my-assigned"));
      expect(window.location.hash).toBe("#/staff-queue?owner=me");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");
    });

    it("renders unassigned queue callout and drills down to owner=unassigned", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("metric-card-unassigned")).toBeInTheDocument();
      });

      expect(screen.getByTestId("metric-card-unassigned")).toHaveTextContent("4");
      expect(screen.getByTestId("metric-card-unassigned")).toHaveTextContent("Unassigned Queue");

      fireEvent.click(screen.getByTestId("metric-card-unassigned"));
      expect(window.location.hash).toBe("#/staff-queue?owner=unassigned");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");
    });

    it("renders all 8 status pills and drills down to specific status on pill click", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("status-pill-reopened")).toBeInTheDocument();
      });

      expect(screen.getByTestId("status-pill-new")).toHaveTextContent("3");
      expect(screen.getByTestId("status-pill-open")).toHaveTextContent("4");
      expect(screen.getByTestId("status-pill-in-progress")).toHaveTextContent("5");
      expect(screen.getByTestId("status-pill-waiting")).toHaveTextContent("2");
      expect(screen.getByTestId("status-pill-resolved")).toHaveTextContent("7");
      expect(screen.getByTestId("status-pill-closed")).toHaveTextContent("12");
      expect(screen.getByTestId("status-pill-reopened")).toHaveTextContent("1");
      expect(screen.getByTestId("status-pill-cancelled")).toHaveTextContent("0");

      fireEvent.click(screen.getByTestId("status-pill-reopened"));
      expect(window.location.hash).toBe("#/staff-queue?status=REOPENED");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");
    });

    it("renders 4-level priority breakdown badges", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("priority-badge-urgent")).toBeInTheDocument();
      });

      expect(screen.getByTestId("priority-badge-urgent")).toHaveTextContent("Urgent: 3");
      expect(screen.getByTestId("priority-badge-high")).toHaveTextContent("High: 4");
      expect(screen.getByTestId("priority-badge-medium")).toHaveTextContent("Medium: 5");
      expect(screen.getByTestId("priority-badge-low")).toHaveTextContent("Low: 2");
    });

    it("renders recent queue tickets table and navigates to ticket detail on row click", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("staff-recent-tickets-table")).toBeInTheDocument();
      });

      expect(screen.getByText("TCK-2026-0201")).toBeInTheDocument();
      expect(screen.getByText("Database query latency spike")).toBeInTheDocument();
      expect(screen.getByText("TCK-2026-0202")).toBeInTheDocument();

      fireEvent.click(screen.getByText("TCK-2026-0201"));
      expect(window.location.hash).toBe("#/ticket/201");
      expect(mockNavigate).toHaveBeenCalledWith("ticket-detail", 201);
    });

    it("renders queue clear zero-state when recent tickets list is empty", async () => {
      const emptyStaffData: api.StaffDashboardData = {
        metrics: {
          primary: {
            newTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            waitingForRequesterTickets: 0,
            myAssignedTickets: 0,
          },
          unassignedTickets: 0,
          byStatus: {
            new: 0,
            open: 0,
            inProgress: 0,
            waitingForRequester: 0,
            resolved: 0,
            closed: 0,
            reopened: 0,
            cancelled: 0,
          },
          byPriority: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0,
          },
        },
        recentTickets: [],
      };
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(emptyStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("staff-queue-empty")).toBeInTheDocument();
      });

      expect(screen.getByText("Queue clear!")).toBeInTheDocument();
      expect(screen.getByText(/No tickets currently requiring triage/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // UI-07b: Staff Dashboard Quick Actions navigation (AC-16)
  // =========================================================================
  describe("UI-07b: Quick Actions Navigation", () => {
    it("navigates to create ticket when Create Ticket quick action is clicked", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("quick-action-create-ticket")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("quick-action-create-ticket"));
      expect(window.location.hash).toBe("#/create-ticket");
      expect(mockNavigate).toHaveBeenCalledWith("create-ticket");
    });

    it("navigates to staff queue when Search Tickets quick action is clicked", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("quick-action-search-tickets")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("quick-action-search-tickets"));
      expect(window.location.hash).toBe("#/staff-queue");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");
    });

    it("navigates to staff queue assigned to me when My Assigned Queue is clicked", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("quick-action-my-queue")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("quick-action-my-queue"));
      expect(window.location.hash).toBe("#/staff-queue?owner=me");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");
    });

    it("re-fetches dashboard metrics when refresh button is clicked", async () => {
      vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffData);

      render(<StaffDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("staff-dashboard-refresh-btn")).toBeInTheDocument();
      });

      expect(api.fetchStaffDashboard).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("staff-dashboard-refresh-btn"));
      expect(api.fetchStaffDashboard).toHaveBeenCalledTimes(2);
    });
  });
});
