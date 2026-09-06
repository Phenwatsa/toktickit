import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail";
import * as api from "../../src/api";
import { RequesterUser, Ticket } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchActiveRequesters: vi.fn(),
  fetchTicketDetail: vi.fn(),
  uploadAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  softRemoveAttachment: vi.fn(),
}));

const mockRequester: RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.a@toktickit.local",
  department: "Human Resources",
  isActive: true,
};

const mockTicket: Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Laptop battery drains in 30 minutes",
  description: "When using without charger, laptop dies in 30 minutes even on power saving mode.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "OPEN",
  requesterId: 1,
  requester: mockRequester,
  categoryId: 2,
  category: { id: 2, name: "Hardware" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Corporate Laptop", description: "Standard issued laptops" },
  ticketOwner: "Wichai IT Specialist",
  createdAt: "2026-08-31T09:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  attachments: [
    {
      id: 1,
      ticketId: 101,
      originalName: "battery-diag.pdf",
      mimeType: "application/pdf",
      sizeBytes: 204800,
      isRemoved: false,
      createdAt: "2026-08-31T09:05:00.000Z",
    },
  ],
};

describe("RequesterTicketDetail Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));
    vi.mocked(api.fetchActiveRequesters).mockResolvedValue([mockRequester]);
    vi.mocked(api.fetchTicketDetail).mockResolvedValue(mockTicket);
  });

  it("renders ticket header, metadata grid, description, and badges in read-only mode", async () => {
    const onBack = vi.fn();

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={101} onBack={onBack} />
      </RequesterProvider>
    );

    // Initial loading
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();

    // Loaded details
    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("detail-ticket-number")).toHaveTextContent("TKT-2026-000101");
    expect(screen.getByTestId("detail-summary")).toHaveTextContent("Laptop battery drains in 30 minutes");
    expect(screen.getByTestId("detail-description")).toHaveTextContent("When using without charger, laptop dies in 30 minutes");

    // Badges
    expect(screen.getByTestId("badge-status-open")).toBeInTheDocument();
    expect(screen.getByTestId("badge-priority-high")).toBeInTheDocument();

    // Metadata Grid
    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    expect(screen.getByText("Wichai IT Specialist")).toBeInTheDocument();

    // Back button
    const backBtn = screen.getByTestId("back-to-list-btn");
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("displays error state when ticket is not found or API fails", async () => {
    vi.mocked(api.fetchTicketDetail).mockRejectedValueOnce(
      new Error("Ticket not found or forbidden")
    );

    const onBack = vi.fn();

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={999} onBack={onBack} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("detail-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/Ticket not found or forbidden/i)).toBeInTheDocument();

    // Back button from error view
    const backBtn = screen.getByTestId("detail-back-btn");
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
