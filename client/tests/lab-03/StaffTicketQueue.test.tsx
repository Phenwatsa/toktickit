import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketQueue } from "../../src/pages/StaffTicketQueue";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import { StaffTicketItem, Category, StaffTicketOwner } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchStaffTickets: vi.fn(),
  fetchStaffMembers: vi.fn(),
  fetchActiveCategories: vi.fn(),
}));

const mockCategories: Category[] = [
  { id: 1, name: "Account and Access", isActive: true },
  { id: 2, name: "Hardware", isActive: true },
  { id: 3, name: "Software", isActive: true },
];

const mockStaffMembers: StaffTicketOwner[] = [
  { id: 2, name: "Michael Brown", email: "michael@toktickit.com" },
  { id: 3, name: "Sarah Johnson", email: "sarah@toktickit.com" },
];

const mockTickets: StaffTicketItem[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    summary: "Laptop battery drains quickly",
    requestedPriority: "MEDIUM",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    category: { id: 2, name: "Hardware" },
    requester: { id: 10, name: "Jennifer Anderson", email: "jennifer@toktickit.com" },
    ticketOwner: { id: 2, name: "Michael Brown", email: "michael@toktickit.com" },
    createdAt: "2026-05-13T09:14:00Z",
    updatedAt: "2026-05-13T10:30:00Z",
  },
  {
    id: 102,
    ticketNumber: "TKT-2026-000102",
    summary: "Cannot access VPN from home",
    requestedPriority: "URGENT",
    itPriority: null,
    currentStatus: "NEW",
    category: { id: 1, name: "Account and Access" },
    requester: { id: 11, name: "David Lee", email: "david@toktickit.com" },
    ticketOwner: null, // unassigned
    createdAt: "2026-05-14T11:00:00Z",
    updatedAt: "2026-05-14T11:00:00Z",
  },
];

describe("StaffTicketQueue Component (StaffTicketQueue.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 2,
        name: "Michael Brown",
        email: "michael@toktickit.com",
        role: "IT_STAFF",
        department: "IT Support",
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

    vi.mocked(api.fetchActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.fetchStaffMembers).mockResolvedValue(mockStaffMembers);
    vi.mocked(api.fetchStaffTickets).mockResolvedValue({
      data: mockTickets,
      pagination: {
        page: 1,
        pageSize: 10,
        totalRecords: 2,
        totalPages: 1,
      },
    });
  });

  // =========================================================================
  // UI-04: Staff Ticket Queue table renders tickets, badges, and owner names
  // =========================================================================
  describe("UI-04: Queue Table & Badge Rendering", () => {
    it("renders ticket list with correct data columns, badges, and owner names", async () => {
      render(<StaffTicketQueue />);

      // Wait for table to load
      const row101 = await screen.findByTestId("ticket-row-101");
      expect(row101).toBeInTheDocument();

      // Verify Ticket 1 desktop row details
      expect(within(row101).getByText("TKT-2026-000101")).toBeInTheDocument();
      expect(within(row101).getByText("Laptop battery drains quickly")).toBeInTheDocument();
      expect(within(row101).getByText("Hardware")).toBeInTheDocument();
      expect(within(row101).getByTestId("badge-requested-priority-medium")).toBeInTheDocument();
      expect(within(row101).getByTestId("badge-it-priority-high")).toBeInTheDocument();
      expect(within(row101).getByTestId("badge-status-in-progress")).toBeInTheDocument();
      expect(within(row101).getByTestId("ticket-owner-101")).toHaveTextContent("Michael Brown");

      // Verify Ticket 2 desktop row details (Unassigned)
      const row102 = screen.getByTestId("ticket-row-102");
      expect(within(row102).getByText("TKT-2026-000102")).toBeInTheDocument();
      expect(within(row102).getByText("Cannot access VPN from home")).toBeInTheDocument();
      expect(within(row102).getByText("Account and Access")).toBeInTheDocument();
      expect(within(row102).getByTestId("badge-requested-priority-urgent")).toBeInTheDocument();
      expect(within(row102).getByTestId("badge-status-new")).toBeInTheDocument();
      expect(within(row102).getByTestId("ticket-owner-unassigned-102")).toHaveTextContent("Unassigned");

      // Verify Total Count Badge & Pagination Info
      expect(screen.getByTestId("total-records-badge")).toHaveTextContent("Total Tickets: 2");
      expect(screen.getByTestId("pagination-info")).toHaveTextContent("Showing 1 to 2 of 2 tickets");
    });

    it("triggers onSelectTicket callback when clicking ticket row or View button", async () => {
      const user = userEvent.setup();
      const mockSelectTicket = vi.fn();

      render(<StaffTicketQueue onSelectTicket={mockSelectTicket} />);

      await screen.findByTestId("ticket-row-101");

      const viewBtn = screen.getByTestId("view-ticket-101");
      await user.click(viewBtn);

      expect(mockSelectTicket).toHaveBeenCalledWith(101);

      // Clicking row directly
      const row = screen.getByTestId("ticket-row-102");
      await user.click(row);

      expect(mockSelectTicket).toHaveBeenCalledWith(102);
    });

    it("toggles sorting when clicking column headers", async () => {
      const user = userEvent.setup();
      render(<StaffTicketQueue />);

      await screen.findByTestId("ticket-row-101");

      const sortTicketNumber = screen.getByTestId("sort-ticketNumber");
      await user.click(sortTicketNumber);

      await waitFor(() => {
        expect(api.fetchStaffTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: "ticketNumber",
            sortOrder: "asc",
          })
        );
      });

      // Click sort by Updated Date
      const sortUpdatedAt = screen.getByTestId("sort-updatedAt");
      await user.click(sortUpdatedAt);

      await waitFor(() => {
        expect(api.fetchStaffTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: "updatedAt",
            sortOrder: "asc",
          })
        );
      });

      // Click again to toggle desc
      await user.click(sortUpdatedAt);

      await waitFor(() => {
        expect(api.fetchStaffTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: "updatedAt",
            sortOrder: "desc",
          })
        );
      });
    });

    it("renders mobile card layout for small screens", async () => {
      render(<StaffTicketQueue />);

      const card101 = await screen.findByTestId("ticket-card-101");
      const card102 = screen.getByTestId("ticket-card-102");

      expect(card101).toBeInTheDocument();
      expect(within(card101).getByText("TKT-2026-000101")).toBeInTheDocument();
      expect(within(card101).getByText("Laptop battery drains quickly")).toBeInTheDocument();

      expect(card102).toBeInTheDocument();
      expect(within(card102).getByText("TKT-2026-000102")).toBeInTheDocument();
      expect(within(card102).getByText("Cannot access VPN from home")).toBeInTheDocument();
    });

    it("filters tickets by Requested Priority on desktop filter bar", async () => {
      const user = userEvent.setup();
      render(<StaffTicketQueue />);

      await screen.findByTestId("ticket-row-101");

      const reqPrioritySelect = screen.getByTestId("staff-queue-req-priority-filter");
      expect(reqPrioritySelect).toBeInTheDocument();

      await user.selectOptions(reqPrioritySelect, "HIGH");

      await waitFor(() => {
        expect(api.fetchStaffTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            requestedPriority: "HIGH",
          })
        );
      });
    });

    it("opens and closes mobile filter popup modal and triggers filtering", async () => {
      const user = userEvent.setup();
      render(<StaffTicketQueue />);

      await screen.findByTestId("ticket-row-101");

      const mobileFilterBtn = screen.getByTestId("staff-queue-mobile-filter-trigger-btn");
      expect(mobileFilterBtn).toBeInTheDocument();

      // Open modal
      await user.click(mobileFilterBtn);

      const modal = await screen.findByTestId("staff-queue-mobile-filter-modal");
      expect(modal).toBeInTheDocument();
      expect(screen.getByText("Filter & Sort Staff Queue")).toBeInTheDocument();

      // Select status inside modal
      const mobileStatus = screen.getByTestId("staff-queue-mobile-status-filter");
      await user.selectOptions(mobileStatus, "IN_PROGRESS");

      // Select requested priority inside modal
      const mobileReqPriority = screen.getByTestId("staff-queue-mobile-req-priority-filter");
      await user.selectOptions(mobileReqPriority, "URGENT");

      // Apply filters
      const applyBtn = screen.getByRole("button", { name: "Apply Filters" });
      await user.click(applyBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("staff-queue-mobile-filter-modal")).not.toBeInTheDocument();
        expect(api.fetchStaffTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "IN_PROGRESS",
            requestedPriority: "URGENT",
          })
        );
      });
    });
  });

  // =========================================================================
  // UI-05: Staff Ticket Queue handles empty state and no-results search filter
  // =========================================================================
  describe("UI-05: Empty & No-Results States", () => {
    it("displays empty queue state when system has zero tickets overall", async () => {
      vi.mocked(api.fetchStaffTickets).mockResolvedValueOnce({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 0,
        },
      });

      render(<StaffTicketQueue />);

      expect(await screen.findByTestId("staff-queue-empty")).toBeInTheDocument();
      expect(screen.getByText("No tickets found in the queue")).toBeInTheDocument();
      expect(screen.queryByTestId("staff-queue-no-results")).not.toBeInTheDocument();
    });

    it("displays no-results state with 'Reset Filters' button when filter returns zero results", async () => {
      const user = userEvent.setup();

      render(<StaffTicketQueue />);
      await screen.findByTestId("ticket-row-101");

      // Simulate filter returning empty
      vi.mocked(api.fetchStaffTickets).mockResolvedValueOnce({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 0,
        },
      });

      const searchInput = screen.getByTestId("staff-queue-search-input");
      await user.type(searchInput, "nonexistent-query");

      expect(await screen.findByTestId("staff-queue-no-results")).toBeInTheDocument();
      expect(screen.getByText("No tickets match your filter criteria")).toBeInTheDocument();

      const resetBtn = screen.getByTestId("no-results-reset-btn");
      expect(resetBtn).toBeInTheDocument();

      // Click Reset Filters
      vi.mocked(api.fetchStaffTickets).mockResolvedValueOnce({
        data: mockTickets,
        pagination: {
          page: 1,
          pageSize: 10,
          totalRecords: 2,
          totalPages: 1,
        },
      });

      await user.click(resetBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("staff-queue-no-results")).not.toBeInTheDocument();
        expect(screen.getByTestId("ticket-row-101")).toBeInTheDocument();
      });
    });

    it("displays error state with retry button when API fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchStaffTickets).mockRejectedValueOnce(new Error("Network timeout"));

      render(<StaffTicketQueue />);

      expect(await screen.findByTestId("staff-queue-error")).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();

      // Retry
      vi.mocked(api.fetchStaffTickets).mockResolvedValueOnce({
        data: mockTickets,
        pagination: {
          page: 1,
          pageSize: 10,
          totalRecords: 2,
          totalPages: 1,
        },
      });

      const retryBtn = screen.getByTestId("staff-queue-retry-btn");
      await user.click(retryBtn);

      expect(await screen.findByTestId("ticket-row-101")).toBeInTheDocument();
      expect(screen.queryByTestId("staff-queue-error")).not.toBeInTheDocument();
    });
  });
});
