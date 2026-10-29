import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminDashboard } from "../../src/pages/AdminDashboard";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchAdminDashboard: vi.fn(),
}));

describe("AdminDashboard Component (UI-08)", () => {
  const mockNavigate = vi.fn();

  const mockAdminData: api.AdminDashboardData = {
    operational: {
      unassignedTickets: 3,
      totalActiveTickets: 15,
    },
    users: {
      totalUsers: 24,
      activeUsers: 21,
      inactiveUsers: 3,
      byRole: {
        requester: 16,
        itStaff: 6,
        administrator: 2,
      },
    },
    recentTickets: [
      {
        id: 301,
        ticketNumber: "TCK-2026-0301",
        summary: "Core switch firmware upgrade",
        currentStatus: "OPEN",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        ticketOwner: null,
        requester: { id: 5, name: "Manager Bob" },
        updatedAt: "2026-10-14T12:00:00.000Z",
      },
      {
        id: 302,
        ticketNumber: "TCK-2026-0302",
        summary: "Backup storage capacity warning",
        currentStatus: "IN_PROGRESS",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        ticketOwner: { id: 2, name: "Alex Taylor" },
        requester: { id: 6, name: "Alice Security" },
        updatedAt: "2026-10-14T11:30:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#/dashboard";

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 3,
        name: "Admin Root",
        email: "admin@toktickit.com",
        role: "ADMINISTRATOR",
        department: "IT Administration",
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

  describe("UI-08: Admin Overview, Statistics & Drill-Downs", () => {
    it("renders loading skeleton during initial fetch", async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.fetchAdminDashboard).mockReturnValue(pendingPromise as any);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();

      resolvePromise!(mockAdminData);
    });

    it("renders greeting banner and all 5 upper metric cards with accurate values", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText("Welcome back, Admin!")).toBeInTheDocument();
      });

      expect(screen.getByTestId("admin-card-active-tickets")).toHaveTextContent("15");
      expect(screen.getByTestId("admin-card-unassigned")).toHaveTextContent("3");
      expect(screen.getByTestId("admin-card-total-users")).toHaveTextContent("24");
      expect(screen.getByTestId("admin-card-active-users")).toHaveTextContent("21");
      expect(screen.getByTestId("admin-card-inactive-users")).toHaveTextContent("3");
    });

    it("drills down to correct targets across all 5 metric cards", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("admin-card-active-tickets")).toBeInTheDocument();
      });

      // 1. Total Active Tickets -> #/staff-queue
      fireEvent.click(screen.getByTestId("admin-card-active-tickets"));
      expect(window.location.hash).toBe("#/staff-queue");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 2. Unassigned Queue -> #/staff-queue?owner=unassigned
      fireEvent.click(screen.getByTestId("admin-card-unassigned"));
      expect(window.location.hash).toBe("#/staff-queue?owner=unassigned");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 3. Total Users -> #/admin-users
      fireEvent.click(screen.getByTestId("admin-card-total-users"));
      expect(window.location.hash).toBe("#/admin-users");
      expect(mockNavigate).toHaveBeenCalledWith("admin-users");

      // 4. Active Users -> #/admin-users
      fireEvent.click(screen.getByTestId("admin-card-active-users"));
      expect(window.location.hash).toBe("#/admin-users");
      expect(mockNavigate).toHaveBeenCalledWith("admin-users");

      // 5. Inactive Users -> #/admin-users
      fireEvent.click(screen.getByTestId("admin-card-inactive-users"));
      expect(window.location.hash).toBe("#/admin-users");
      expect(mockNavigate).toHaveBeenCalledWith("admin-users");
    });

    it("renders user role distribution badges with live counts", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("role-badge-requester")).toBeInTheDocument();
      });

      expect(screen.getByTestId("role-badge-requester")).toHaveTextContent("Requesters: 16");
      expect(screen.getByTestId("role-badge-staff")).toHaveTextContent("IT Staff: 6");
      expect(screen.getByTestId("role-badge-admin")).toHaveTextContent("Administrators: 2");
    });

    it("renders recent system queue and navigates to ticket detail on row click", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("admin-recent-tickets")).toBeInTheDocument();
      });

      expect(screen.getByText("TCK-2026-0301")).toBeInTheDocument();
      expect(screen.getByText("Core switch firmware upgrade")).toBeInTheDocument();
      expect(screen.getByText("TCK-2026-0302")).toBeInTheDocument();

      fireEvent.click(screen.getByText("TCK-2026-0301"));
      expect(window.location.hash).toBe("#/ticket/301");
      expect(mockNavigate).toHaveBeenCalledWith("ticket-detail", 301);
    });

    it("renders friendly zero-state when system queue is completely clear", async () => {
      const emptyAdminData: api.AdminDashboardData = {
        operational: { unassignedTickets: 0, totalActiveTickets: 0 },
        users: {
          totalUsers: 5,
          activeUsers: 5,
          inactiveUsers: 0,
          byRole: { requester: 3, itStaff: 1, administrator: 1 },
        },
        recentTickets: [],
      };
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(emptyAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("admin-empty-state")).toBeInTheDocument();
      });

      expect(screen.getByText("All systems normal")).toBeInTheDocument();
    });

    it("navigates correctly for all three Administrative Quick Actions", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("admin-action-users")).toBeInTheDocument();
      });

      // 1. User Management
      fireEvent.click(screen.getByTestId("admin-action-users"));
      expect(window.location.hash).toBe("#/admin-users");
      expect(mockNavigate).toHaveBeenCalledWith("admin-users");

      // 2. Ticket Queue
      fireEvent.click(screen.getByTestId("admin-action-queue"));
      expect(window.location.hash).toBe("#/staff-queue");
      expect(mockNavigate).toHaveBeenCalledWith("staff-queue");

      // 3. Create Ticket
      fireEvent.click(screen.getByTestId("admin-action-create"));
      expect(window.location.hash).toBe("#/create-ticket");
      expect(mockNavigate).toHaveBeenCalledWith("create-ticket");
    });

    it("re-fetches dashboard metrics when refresh button is clicked", async () => {
      vi.mocked(api.fetchAdminDashboard).mockResolvedValue(mockAdminData);

      render(<AdminDashboard onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId("admin-dashboard-refresh-btn")).toBeInTheDocument();
      });

      expect(api.fetchAdminDashboard).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("admin-dashboard-refresh-btn"));
      expect(api.fetchAdminDashboard).toHaveBeenCalledTimes(2);
    });
  });
});
