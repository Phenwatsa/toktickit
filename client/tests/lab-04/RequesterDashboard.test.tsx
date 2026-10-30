import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RequesterDashboard } from "../../src/pages/RequesterDashboard";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchRequesterDashboard: vi.fn(),
}));

describe("RequesterDashboard Component (UI-05, UI-07a)", () => {
  const mockNavigate = vi.fn();

  const mockDashboardData: api.RequesterDashboardData = {
    openTickets: 5,
    inProgressTickets: 2,
    waitingForRequesterTickets: 1,
    resolvedTickets: 3,
    closedTickets: 8,
    recentTickets: [
      {
        id: 101,
        ticketNumber: "TCK-2026-0101",
        summary: "Laptop battery draining fast",
        description: "Battery drains within 45 minutes of use",
        currentStatus: "IN_PROGRESS",
        requestedPriority: "HIGH",
        createdAt: "2026-10-14T08:00:00.000Z",
        updatedAt: "2026-10-14T10:30:00.000Z",
        category: { id: 1, name: "Hardware" },
      },
      {
        id: 102,
        ticketNumber: "TCK-2026-0102",
        summary: "VPN credentials expired",
        description: "Cannot connect to internal network",
        currentStatus: "WAITING_FOR_REQUESTER",
        requestedPriority: "URGENT",
        createdAt: "2026-10-14T09:00:00.000Z",
        updatedAt: "2026-10-14T11:00:00.000Z",
        category: { id: 2, name: "Network" },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#/dashboard";

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 1,
        name: "Penwatsa Saengyenpan",
        email: "penwatsa@toktickit.com",
        role: "REQUESTER",
        department: "Engineering",
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
  // UI-05: Requester Dashboard metrics rendering and drill-downs (AC-12, AC-15a)
  // =========================================================================
  describe("UI-05: Metrics Rendering & Drill-Downs", () => {
    it("renders loading skeleton during initial fetch", async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.fetchRequesterDashboard).mockReturnValue(pendingPromise as any);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();

      resolvePromise!(mockDashboardData);
    });

    it("renders greeting banner and all 5 primary metric cards with authoritative counts", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText("Welcome back, Penwatsa!")).toBeInTheDocument();
      });

      // Verify all 5 cards render with accurate counts
      expect(screen.getByTestId("metric-card-open")).toHaveTextContent("5");
      expect(screen.getByTestId("metric-card-in-progress")).toHaveTextContent("2");
      expect(screen.getByTestId("metric-card-waiting-for-requester")).toHaveTextContent("1");
      expect(screen.getByTestId("metric-card-resolved")).toHaveTextContent("3");
      expect(screen.getByTestId("metric-card-closed")).toHaveTextContent("8");
    });

    it("drills down to #/my-tickets with correct filter preset when cards are clicked", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
      });

      // 1. My Open Tickets -> OPEN_GROUP
      fireEvent.click(screen.getByTestId("metric-card-open"));
      expect(window.location.hash).toBe("#/my-tickets?status=OPEN_GROUP");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");

      // 2. In Progress -> IN_PROGRESS
      fireEvent.click(screen.getByTestId("metric-card-in-progress"));
      expect(window.location.hash).toBe("#/my-tickets?status=IN_PROGRESS");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");

      // 3. Waiting for Requester -> WAITING_FOR_REQUESTER
      fireEvent.click(screen.getByTestId("metric-card-waiting-for-requester"));
      expect(window.location.hash).toBe("#/my-tickets?status=WAITING_FOR_REQUESTER");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");

      // 4. Resolved -> RESOLVED
      fireEvent.click(screen.getByTestId("metric-card-resolved"));
      expect(window.location.hash).toBe("#/my-tickets?status=RESOLVED");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");

      // 5. Closed -> CLOSED
      fireEvent.click(screen.getByTestId("metric-card-closed"));
      expect(window.location.hash).toBe("#/my-tickets?status=CLOSED");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");
    });

    it("renders recent tickets list and navigates to ticket detail on row click", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("recent-tickets-table")).toBeInTheDocument();
      });

      expect(screen.getByText("TCK-2026-0101")).toBeInTheDocument();
      expect(screen.getByText("Laptop battery draining fast")).toBeInTheDocument();
      expect(screen.getByText("TCK-2026-0102")).toBeInTheDocument();

      // Click row navigates to ticket detail
      fireEvent.click(screen.getByText("TCK-2026-0101"));
      expect(window.location.hash).toBe("#/ticket/101");
      expect(mockNavigate).toHaveBeenCalledWith("ticket-detail", 101);
    });

    it("renders friendly zero-state when recent tickets list is empty", async () => {
      const emptyDashboardData: api.RequesterDashboardData = {
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        recentTickets: [],
      };
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(emptyDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-empty-state")).toBeInTheDocument();
      });

      expect(screen.getByText("No support tickets yet")).toBeInTheDocument();
      expect(screen.getByTestId("empty-create-ticket-btn")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("empty-create-ticket-btn"));
      expect(window.location.hash).toBe("#/create-ticket");
      expect(mockNavigate).toHaveBeenCalledWith("create-ticket");
    });
  });

  // =========================================================================
  // UI-07a: Requester Dashboard Quick Actions navigation (AC-16)
  // =========================================================================
  describe("UI-07a: Quick Actions Navigation", () => {
    it("navigates to create ticket when Quick Action is clicked", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("quick-action-create-ticket")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("quick-action-create-ticket"));
      expect(window.location.hash).toBe("#/create-ticket");
      expect(mockNavigate).toHaveBeenCalledWith("create-ticket");
    });

    it("navigates to my tickets when View All My Tickets is clicked", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("quick-action-view-tickets")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("quick-action-view-tickets"));
      expect(window.location.hash).toBe("#/my-tickets");
      expect(mockNavigate).toHaveBeenCalledWith("my-tickets");
    });

    it("re-fetches dashboard metrics when refresh button is clicked", async () => {
      vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockDashboardData);

      render(<RequesterDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-refresh-btn")).toBeInTheDocument();
      });

      expect(api.fetchRequesterDashboard).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("dashboard-refresh-btn"));
      expect(api.fetchRequesterDashboard).toHaveBeenCalledTimes(2);
    });
  });
});
