import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import * as RequesterContextModule from "../../src/context/RequesterContext";
import { Ticket } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchTicketDetail: vi.fn(),
  markProblemAppearsResolved: vi.fn(),
  fetchPublicComments: vi.fn(),
  createPublicComment: vi.fn(),
  fetchInternalNotes: vi.fn(),
  createInternalNote: vi.fn(),
  removeAttachment: vi.fn(),
  uploadAttachment: vi.fn(),
}));

const mockRequesterTicket: Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Laptop battery drains quickly",
  description: "Battery diagnostic shows 62% wear.",
  requestedPriority: "MEDIUM",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  problemAppearsResolved: false,
  requesterId: 10,
  requester: {
    id: 10,
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    department: "Finance",
    isActive: true,
  },
  categoryId: 2,
  category: { id: 2, name: "Hardware" },
  relatedSystemId: 3,
  relatedSystem: { id: 3, name: "Corporate Laptop" },
  ticketOwner: "Michael Brown",
  createdAt: "2026-05-13T09:14:00Z",
  updatedAt: "2026-05-13T10:30:00Z",
  attachments: [],
};

describe("RequesterTicketDetail Component (RequesterTicketDetail.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 10,
        name: "Jennifer Anderson",
        email: "jennifer@toktickit.com",
        role: "REQUESTER",
        department: "Finance",
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

    vi.spyOn(RequesterContextModule, "useRequester").mockReturnValue({
      currentRequester: {
        id: 10,
        name: "Jennifer Anderson",
        email: "jennifer@toktickit.com",
        department: "Finance",
        isActive: true,
      },
      activeRequesters: [],
      selectRequester: vi.fn(),
      clearRequester: vi.fn(),
      isLoading: false,
      error: null,
      refreshRequesters: vi.fn().mockResolvedValue(undefined),
    });

    vi.mocked(api.fetchTicketDetail).mockResolvedValue(mockRequesterTicket);
    vi.mocked(api.fetchPublicComments).mockResolvedValue([
      {
        id: 1,
        content: "Replacement battery is being shipped.",
        createdAt: "2026-05-13T10:00:00Z",
        author: { id: 2, name: "Michael Brown", role: "IT_STAFF" },
      },
    ]);
  });

  // =========================================================================
  // UI-11: Requester Problem Resolution Indication (AC-21)
  // =========================================================================
  describe("UI-11: Requester Problem Resolution Indication (AC-21)", () => {
    it("renders 'Problem Appears Resolved' button and updates indicator upon click", async () => {
      const user = userEvent.setup();
      vi.mocked(api.markProblemAppearsResolved).mockResolvedValueOnce({
        message: "Problem indicated as resolved. IT Staff notified.",
        problemAppearsResolved: true,
      });

      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      const markBtn = await screen.findByTestId("mark-resolved-btn");
      expect(markBtn).toHaveTextContent("Problem Appears Resolved");

      // Verify official status is In Progress
      expect(screen.getByTestId("badge-status-in_progress")).toHaveTextContent("In Progress");

      // Click button
      await user.click(markBtn);

      await waitFor(() => {
        expect(api.markProblemAppearsResolved).toHaveBeenCalledWith(101);
        expect(screen.getByTestId("requester-resolved-indicator")).toBeInTheDocument();
        expect(screen.getByText(/You indicated this problem appears resolved/)).toBeInTheDocument();
        // Official status remains In Progress
        expect(screen.getByTestId("badge-status-in_progress")).toHaveTextContent("In Progress");
      });
    });

    it("displays resolved indicator banner directly when ticket already has problemAppearsResolved true", async () => {
      vi.mocked(api.fetchTicketDetail).mockResolvedValueOnce({
        ...mockRequesterTicket,
        problemAppearsResolved: true,
      });

      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      expect(await screen.findByTestId("requester-resolved-indicator")).toBeInTheDocument();
      expect(screen.queryByTestId("mark-resolved-btn")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // AC-10 & AC-04: Public Comments & Confidentiality for Requester
  // =========================================================================
  describe("Public Comments & Internal Notes Isolation for Requester", () => {
    it("renders Public Comments and allows Requester to post a comment", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createPublicComment).mockResolvedValueOnce({
        id: 2,
        content: "Thank you for the fast response!",
        createdAt: "2026-05-13T10:15:00Z",
        author: { id: 10, name: "Jennifer Anderson", role: "REQUESTER" },
      });

      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      expect(await screen.findByText("Replacement battery is being shipped.")).toBeInTheDocument();

      const input = screen.getByTestId("public-comment-input");
      await user.type(input, "Thank you for the fast response!");

      const submitBtn = screen.getByTestId("submit-public-comment-btn");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.createPublicComment).toHaveBeenCalledWith(101, "Thank you for the fast response!");
        expect(screen.getByText("Thank you for the fast response!")).toBeInTheDocument();
      });
    });

    it("strictly hides Internal Notes tabs and panel from Requester (AC-04)", async () => {
      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      await screen.findByTestId("ticket-header-card");

      // Internal notes tab and panel must NOT exist anywhere in Requester DOM
      expect(screen.queryByTestId("tab-internal-notes")).not.toBeInTheDocument();
      expect(screen.queryByTestId("internal-notes-panel")).not.toBeInTheDocument();
      expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
    });
  });
});
