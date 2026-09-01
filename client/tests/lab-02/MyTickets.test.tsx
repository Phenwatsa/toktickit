import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { MyTickets } from "../../src/components/MyTickets";
import * as api from "../../src/api";
import { Category, RequesterUser, Ticket, TicketsResponse } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchActiveRequesters: vi.fn(),
  fetchActiveCategories: vi.fn(),
  fetchActiveRelatedSystems: vi.fn(),
  createTicket: vi.fn(),
  fetchMyTickets: vi.fn(),
  checkSystem: vi.fn(),
}));

const mockRequester: RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.a@toktickit.local",
  department: "Human Resources",
  isActive: true,
};

const mockCategories: Category[] = [
  { id: 1, name: "Account and Access", isActive: true },
  { id: 2, name: "Hardware", isActive: true },
  { id: 3, name: "Software", isActive: true },
];

const mockTickets: Ticket[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000001",
    summary: "Laptop battery drains quickly",
    description: "Battery discharges in 30 minutes.",
    requestedPriority: "HIGH",
    itPriority: null,
    currentStatus: "NEW",
    requesterId: 1,
    categoryId: 2,
    category: { id: 2, name: "Hardware" },
    relatedSystemId: 1,
    relatedSystem: { id: 1, name: "Corporate Laptop" },
    createdAt: "2026-08-31T10:00:00.000Z",
    updatedAt: "2026-08-31T10:00:00.000Z",
    attachmentsCount: 1,
  },
  {
    id: 102,
    ticketNumber: "TKT-2026-000002",
    summary: "VPN Client Connection Failure",
    description: "Cannot connect to office VPN.",
    requestedPriority: "URGENT",
    itPriority: null,
    currentStatus: "OPEN",
    requesterId: 1,
    categoryId: 1,
    category: { id: 1, name: "Account and Access" },
    relatedSystemId: 2,
    relatedSystem: { id: 2, name: "VPN" },
    createdAt: "2026-08-31T11:00:00.000Z",
    updatedAt: "2026-08-31T11:00:00.000Z",
    attachmentsCount: 0,
  },
];

const mockTicketsResponse: TicketsResponse = {
  data: mockTickets,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe("MyTickets Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));
    vi.mocked(api.fetchActiveRequesters).mockResolvedValue([mockRequester]);
    vi.mocked(api.fetchActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.fetchMyTickets).mockResolvedValue(mockTicketsResponse);
  });

  it("renders ticket table with summary, category, priority badge, and status badge", async () => {
    render(
      <RequesterProvider>
        <MyTickets onNavigateToCreate={() => {}} />
      </RequesterProvider>
    );

    expect(screen.getByText("My Support Tickets")).toBeInTheDocument();
    expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByTestId("tickets-table-card")).toBeInTheDocument();
    });

    expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000002")).toBeInTheDocument();
    expect(screen.getByText("VPN Client Connection Failure")).toBeInTheDocument();

    // Verify badges
    expect(screen.getByTestId("badge-priority-high")).toBeInTheDocument();
    expect(screen.getByTestId("badge-status-new")).toBeInTheDocument();
    expect(screen.getByTestId("badge-priority-urgent")).toBeInTheDocument();
    expect(screen.getByTestId("badge-status-open")).toBeInTheDocument();
  });

  it("triggers search and category filtering via API query", async () => {
    render(
      <RequesterProvider>
        <MyTickets onNavigateToCreate={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("tickets-table-card")).toBeInTheDocument();
    });

    // Enter search keyword
    const searchInput = screen.getByPlaceholderText(/Search ticket # or summary/i);
    fireEvent.change(searchInput, { target: { value: "battery" } });

    await waitFor(() => {
      expect(api.fetchMyTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "battery",
        })
      );
    });

    // Select category filter
    const categorySelect = screen.getByLabelText(/Filter by Category/i);
    fireEvent.change(categorySelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(api.fetchMyTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 2,
        })
      );
    });
  });

  it("renders distinct Empty State when requester has zero tickets and no active filters", async () => {
    vi.mocked(api.fetchMyTickets).mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    const onNavigateToCreate = vi.fn();

    render(
      <RequesterProvider>
        <MyTickets onNavigateToCreate={onNavigateToCreate} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText(/You haven't submitted any tickets yet/i)).toBeInTheDocument();

    const ctaBtn = screen.getByTestId("empty-state-create-btn");
    fireEvent.click(ctaBtn);
    expect(onNavigateToCreate).toHaveBeenCalledTimes(1);
  });

  it("renders distinct No-Results State when filter yields zero results, and clears filters on click", async () => {
    // Initial fetch returns items
    render(
      <RequesterProvider>
        <MyTickets onNavigateToCreate={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("tickets-table-card")).toBeInTheDocument();
    });

    // Apply a search that returns 0 items
    vi.mocked(api.fetchMyTickets).mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    const searchInput = screen.getByPlaceholderText(/Search ticket # or summary/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentKeywordXYZ" } });

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
    });

    expect(screen.getByText(/No matching tickets found/i)).toBeInTheDocument();

    // Click Clear All Filters in no-results card
    const clearBtn = screen.getByTestId("no-results-clear-btn");
    fireEvent.click(clearBtn);

    expect((screen.getByPlaceholderText(/Search ticket # or summary/i) as HTMLInputElement).value).toBe("");
  });

  it("supports pagination controls and displays accurate pagination metadata", async () => {
    vi.mocked(api.fetchMyTickets).mockResolvedValueOnce({
      data: mockTickets,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    });

    render(
      <RequesterProvider>
        <MyTickets onNavigateToCreate={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("pagination-info")).toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    const nextBtn = screen.getByTestId("pagination-next-btn");
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.fetchMyTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });
});
