import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/pages/StaffTicketDetail";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import { StaffTicketDetailData, StaffTicketOwner } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchStaffTicketDetail: vi.fn(),
  fetchStaffMembers: vi.fn(),
  claimStaffTicket: vi.fn(),
  assignStaffTicket: vi.fn(),
  updateStaffTicketPriority: vi.fn(),
  updateStaffTicketStatus: vi.fn(),
  fetchPublicComments: vi.fn(),
  createPublicComment: vi.fn(),
  fetchInternalNotes: vi.fn(),
  createInternalNote: vi.fn(),
}));

const mockStaffMembers: StaffTicketOwner[] = [
  { id: 2, name: "Michael Brown", email: "michael@toktickit.com" },
  { id: 3, name: "Sarah Johnson", email: "sarah@toktickit.com" },
];

const mockTicketData: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Laptop battery drains quickly",
  description: "Battery diagnostic shows 62% wear and drains in 45 minutes.",
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 3, name: "Corporate Laptop" },
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  currentStatus: "NEW",
  problemAppearsResolved: false,
  requester: {
    id: 10,
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    department: "Finance",
  },
  ticketOwner: null, // initially unassigned
  createdAt: "2026-05-13T09:14:00Z",
  updatedAt: "2026-05-13T10:30:00Z",
  attachments: [
    {
      id: 1,
      fileName: "battery_report.png",
      fileSize: 102400,
      mimeType: "image/png",
      url: "/uploads/battery_report.png",
    },
  ],
  publicComments: [
    {
      id: 1,
      content: "We ordered the replacement battery unit.",
      createdAt: "2026-05-13T09:30:00Z",
      author: { id: 2, name: "Michael Brown", role: "IT_STAFF" },
    },
  ],
  internalNotes: [
    {
      id: 1,
      content: "Internal battery diagnostic vendor ticket #9941.",
      createdAt: "2026-05-13T09:35:00Z",
      author: { id: 2, name: "Michael Brown", role: "IT_STAFF" },
    },
  ],
};

describe("StaffTicketDetail Component (StaffTicketDetail.test.tsx)", () => {
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

    vi.mocked(api.fetchStaffMembers).mockResolvedValue(mockStaffMembers);
    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(mockTicketData);
  });

  // =========================================================================
  // UI-06: Operational controls (Claim, Reassign, IT Priority, Status)
  // =========================================================================
  describe("UI-06: Ticket Operational Controls", () => {
    it("renders ticket header, metadata, and operational controls", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      expect(await screen.findByTestId("staff-detail-ticket-number")).toHaveTextContent("TKT-2026-000101");
      expect(screen.getByTestId("staff-detail-summary")).toHaveTextContent("Laptop battery drains quickly");
      expect(screen.getByTestId("staff-detail-description")).toHaveTextContent("Battery diagnostic shows 62% wear");
      expect(screen.getByTestId("staff-detail-owner-name")).toHaveTextContent("Unassigned");

      // Operational buttons
      expect(screen.getByTestId("claim-ticket-btn")).toBeInTheDocument();
      expect(screen.getByTestId("reassign-owner-select")).toBeInTheDocument();
      expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
      expect(screen.getByTestId("status-transition-select")).toBeInTheDocument();
    });

    it("claims ticket ownership when clicking Claim Ownership button", async () => {
      const user = userEvent.setup();
      vi.mocked(api.claimStaffTicket).mockResolvedValueOnce({
        message: "Ticket successfully claimed",
        ticketOwner: { id: 2, name: "Michael Brown", email: "michael@toktickit.com" },
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      const claimBtn = screen.getByTestId("claim-ticket-btn");
      await user.click(claimBtn);

      await waitFor(() => {
        expect(api.claimStaffTicket).toHaveBeenCalledWith(101);
        expect(screen.getByTestId("action-success-alert")).toHaveTextContent("Ticket successfully claimed by you.");
      });
    });

    it("reassigns ticket to another IT Staff member", async () => {
      const user = userEvent.setup();
      vi.mocked(api.assignStaffTicket).mockResolvedValueOnce({
        message: "Ticket reassigned successfully",
        ticketOwner: { id: 3, name: "Sarah Johnson", email: "sarah@toktickit.com" },
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      const select = screen.getByTestId("reassign-owner-select");
      await user.selectOptions(select, "3");

      const reassignBtn = screen.getByTestId("reassign-owner-btn");
      await user.click(reassignBtn);

      await waitFor(() => {
        expect(api.assignStaffTicket).toHaveBeenCalledWith(101, 3);
        expect(screen.getByTestId("action-success-alert")).toHaveTextContent("Ticket reassigned to Sarah Johnson.");
      });
    });

    it("updates IT Priority to URGENT", async () => {
      const user = userEvent.setup();
      vi.mocked(api.updateStaffTicketPriority).mockResolvedValueOnce({
        message: "IT Priority updated",
        itPriority: "URGENT",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      const prioritySelect = screen.getByTestId("it-priority-select");
      await user.selectOptions(prioritySelect, "URGENT");

      const updateBtn = screen.getByTestId("update-priority-btn");
      await user.click(updateBtn);

      await waitFor(() => {
        expect(api.updateStaffTicketPriority).toHaveBeenCalledWith(101, "URGENT");
        expect(screen.getByTestId("action-success-alert")).toHaveTextContent("IT Priority updated to URGENT.");
      });
    });

    it("transitions status with confirmation dialog", async () => {
      const user = userEvent.setup();
      vi.mocked(api.updateStaffTicketStatus).mockResolvedValueOnce({
        message: "Ticket status transitioned",
        currentStatus: "IN_PROGRESS",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      const statusSelect = screen.getByTestId("status-transition-select");
      await user.selectOptions(statusSelect, "IN_PROGRESS");

      const transitionBtn = screen.getByTestId("transition-status-btn");
      await user.click(transitionBtn);

      // Confirm modal opens
      expect(await screen.findByTestId("status-confirm-modal")).toBeInTheDocument();
      expect(screen.getByText("Confirm Status Transition")).toBeInTheDocument();

      const confirmBtn = screen.getByTestId("confirm-status-transition-btn");
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(api.updateStaffTicketStatus).toHaveBeenCalledWith(101, "IN_PROGRESS");
        expect(screen.queryByTestId("status-confirm-modal")).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // UI-07: Public Comments & Internal Notes
  // =========================================================================
  describe("UI-07: Public Comments & Internal Notes for Staff", () => {
    it("renders both Public Comments and Internal Notes tabs for IT Staff", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      expect(screen.getByTestId("tab-public-comments")).toBeInTheDocument();
      expect(screen.getByTestId("tab-internal-notes")).toBeInTheDocument();

      // Check public comment content
      expect(screen.getByText("We ordered the replacement battery unit.")).toBeInTheDocument();
    });

    it("switches to Internal Notes tab and displays confidential notes", async () => {
      const user = userEvent.setup();
      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      const notesTab = screen.getByTestId("tab-internal-notes");
      await user.click(notesTab);

      expect(await screen.findByTestId("internal-notes-panel")).toBeInTheDocument();
      expect(screen.getByText(/Confidential Internal Notes:/)).toBeInTheDocument();
      expect(screen.getByText("Internal battery diagnostic vendor ticket #9941.")).toBeInTheDocument();
    });

    it("posts a new internal note successfully", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createInternalNote).mockResolvedValueOnce({
        id: 2,
        content: "Parts arrived at warehouse.",
        createdAt: "2026-05-13T11:00:00Z",
        author: { id: 2, name: "Michael Brown", role: "IT_STAFF" },
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);
      await screen.findByTestId("staff-detail-ticket-number");

      await user.click(screen.getByTestId("tab-internal-notes"));

      const noteInput = screen.getByTestId("internal-note-input");
      await user.type(noteInput, "Parts arrived at warehouse.");

      const submitBtn = screen.getByTestId("submit-internal-note-btn");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.createInternalNote).toHaveBeenCalledWith(101, "Parts arrived at warehouse.");
        expect(screen.getByText("Parts arrived at warehouse.")).toBeInTheDocument();
      });
    });
  });
});
