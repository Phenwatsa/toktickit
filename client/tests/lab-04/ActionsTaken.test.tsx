import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import { ActionTakenItem } from "../../src/types";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchActionsTaken: vi.fn(),
  createActionTaken: vi.fn(),
  updateActionTaken: vi.fn(),
}));

const mockActions: ActionTakenItem[] = [
  {
    id: 1,
    ticketId: 101,
    actionDateTime: "2026-10-10T14:30:00.000Z",
    actionDescription: "Checked server logs and identified failing Redis cache node.",
    result: "Restarted Redis service and verified connection pool recovery.",
    performedById: 2,
    performedBy: {
      id: 2,
      name: "Alex Taylor",
      email: "alex.taylor@toktickit.com",
      role: "IT_STAFF",
    },
    isFollowUpRequired: true,
    followUpNote: "Monitor Redis memory threshold over the next 24 hours.",
    attachmentNotes: "redis-error-oct10.log",
    createdAt: "2026-10-10T14:32:00.000Z",
    updatedAt: "2026-10-10T14:32:00.000Z",
  },
  {
    id: 2,
    ticketId: 101,
    actionDateTime: "2026-10-11T09:15:00.000Z",
    actionDescription: "Verified SSL certificate validity and DNS configuration.",
    result: "Certificates are valid for 82 days.",
    performedById: 3,
    performedBy: {
      id: 3,
      name: "Sarah Johnson",
      email: "sarah.johnson@toktickit.com",
      role: "IT_STAFF",
    },
    isFollowUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-10-11T09:20:00.000Z",
    updatedAt: "2026-10-11T09:20:00.000Z",
  },
];

describe("ActionsTaken Component (ActionsTaken.test.tsx)", () => {
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

    vi.mocked(api.fetchActionsTaken).mockResolvedValue(mockActions);
  });

  // =========================================================================
  // UI-01a: Create Action Taken (Staff & Admin)
  // =========================================================================
  describe("UI-01a: Actions Taken List & Create Modal (Staff & Admin)", () => {
    it("renders ordered list of Actions Taken with dates, performers, and badges", async () => {
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);

      // Wait for table to load
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();
      expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");

      // Verify action details are rendered (present in desktop table and mobile cards)
      expect(
        screen.getAllByText("Checked server logs and identified failing Redis cache node.")[0]
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Restarted Redis service and verified connection pool recovery.")[0]
      ).toBeInTheDocument();
      expect(screen.getAllByText("By Alex Taylor")[0]).toBeInTheDocument();

      // Verify follow-up badge and note
      expect(screen.getByTestId("followup-badge-1")).toHaveTextContent("Follow-Up Needed");
      expect(
        screen.getAllByText(/Monitor Redis memory threshold over the next 24 hours/)[0]
      ).toBeInTheDocument();

      // Verify referenced attachments
      expect(
        screen.getAllByText("Referenced Attachments: redis-error-oct10.log")[0]
      ).toBeInTheDocument();
    });

    it("opens create modal with auto-populated performer and creates new Action Taken", async () => {
      const user = userEvent.setup();
      const newAction: ActionTakenItem = {
        id: 3,
        ticketId: 101,
        actionDateTime: "2026-10-12T10:00:00.000Z",
        actionDescription: "Replaced faulty patch cable in rack B3.",
        result: "Port link established at 10 Gbps with 0 packet drops.",
        performedById: 2,
        performedBy: {
          id: 2,
          name: "Alex Taylor",
          email: "alex.taylor@toktickit.com",
          role: "IT_STAFF",
        },
        isFollowUpRequired: false,
        followUpNote: null,
        attachmentNotes: null,
        createdAt: "2026-10-12T10:05:00.000Z",
        updatedAt: "2026-10-12T10:05:00.000Z",
      };

      vi.mocked(api.createActionTaken).mockResolvedValueOnce(newAction);

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      // Click Add Action Taken button
      const addBtn = screen.getByTestId("add-action-btn");
      await user.click(addBtn);

      // Verify modal opens
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
      expect(screen.getByTestId("action-modal-title")).toHaveTextContent("Add Action Taken");

      // Check auto-populated performed-by field
      const performedByInput = screen.getByTestId("action-performed-by-input");
      expect(performedByInput).toHaveValue("Alex Taylor (Auto-assigned)");
      expect(performedByInput).toHaveAttribute("readonly");

      // Fill in description and result
      const descInput = screen.getByTestId("action-description-input");
      fireEvent.change(descInput, {
        target: { value: "Replaced faulty patch cable in rack B3." },
      });

      const resultInput = screen.getByTestId("action-result-input");
      fireEvent.change(resultInput, {
        target: { value: "Port link established at 10 Gbps with 0 packet drops." },
      });

      // Submit form
      const submitBtn = screen.getByTestId("modal-submit-btn");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.createActionTaken).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            actionDescription: "Replaced faulty patch cable in rack B3.",
            result: "Port link established at 10 Gbps with 0 packet drops.",
            isFollowUpRequired: false,
          })
        );
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      // Verify new action is appended to the list
      await waitFor(() => {
        expect(
          screen.getAllByText("Replaced faulty patch cable in rack B3.")[0]
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // UI-01b: Edit Action Taken (Staff & Admin)
  // =========================================================================
  describe("UI-01b: Edit Action Taken Form & State Update", () => {
    it("opens edit modal with existing action data and updates action details", async () => {
      const user = userEvent.setup();
      const updatedAction: ActionTakenItem = {
        ...mockActions[0],
        actionDescription: "Checked server logs and identified failing Redis cache node (Secondary inspection).",
        result: "Cluster balanced and latency restored to under 5ms.",
      };

      vi.mocked(api.updateActionTaken).mockResolvedValueOnce(updatedAction);

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      // Click Edit button on the first action
      const editButtons = screen.getAllByTestId("edit-action-btn");
      await user.click(editButtons[0]);

      // Verify edit modal is open with existing data
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
      expect(screen.getByTestId("action-modal-title")).toHaveTextContent("Edit Action Taken");

      const descInput = screen.getByTestId("action-description-input");
      expect(descInput).toHaveValue(mockActions[0].actionDescription);

      const resultInput = screen.getByTestId("action-result-input");
      expect(resultInput).toHaveValue(mockActions[0].result);

      // Modify result
      fireEvent.change(resultInput, {
        target: { value: "Cluster balanced and latency restored to under 5ms." },
      });

      // Submit
      const submitBtn = screen.getByTestId("modal-submit-btn");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.updateActionTaken).toHaveBeenCalledWith(
          101,
          1,
          expect.objectContaining({
            result: "Cluster balanced and latency restored to under 5ms.",
          })
        );
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      // Verify updated content in list
      await waitFor(() => {
        expect(
          screen.getAllByText("Cluster balanced and latency restored to under 5ms.")[0]
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // UI-02: Follow-Up Note Inline Validation
  // =========================================================================
  describe("UI-02: Follow-Up Note UI Inline Validation (BR-04 / AC-02)", () => {
    it("blocks submission and displays required inline error on blank, whitespace, or < 3 chars", async () => {
      const user = userEvent.setup();
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      await user.click(screen.getByTestId("add-action-btn"));
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      // Fill valid description and result
      const descInput = screen.getByTestId("action-description-input");
      fireEvent.change(descInput, { target: { value: "Investigated network jitter." } });
      const resultInput = screen.getByTestId("action-result-input");
      fireEvent.change(resultInput, { target: { value: "Identified routing hop defect." } });

      // Toggle Follow-Up checkbox
      const followUpCheckbox = screen.getByTestId("action-followup-checkbox");
      await user.click(followUpCheckbox);
      expect(followUpCheckbox).toBeChecked();

      // Case 1: Empty note
      const followUpInput = screen.getByTestId("action-followup-note-input");
      const submitBtn = screen.getByTestId("modal-submit-btn");
      await user.click(submitBtn);

      expect(
        await screen.findByText(
          "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
        )
      ).toBeInTheDocument();
      expect(api.createActionTaken).not.toHaveBeenCalled();

      // Case 2: Whitespace-only note
      fireEvent.change(followUpInput, { target: { value: "     " } });
      await user.click(submitBtn);

      expect(
        screen.getByText(
          "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
        )
      ).toBeInTheDocument();
      expect(api.createActionTaken).not.toHaveBeenCalled();

      // Case 3: Less than 3 non-whitespace characters (e.g. "ab", "  x  ")
      fireEvent.change(followUpInput, { target: { value: "ab" } });
      await user.click(submitBtn);

      expect(
        screen.getByText(
          "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
        )
      ).toBeInTheDocument();
      expect(api.createActionTaken).not.toHaveBeenCalled();

      // Case 4: Valid note with >= 3 non-whitespace characters
      vi.mocked(api.createActionTaken).mockResolvedValueOnce({
        id: 4,
        ticketId: 101,
        actionDateTime: "2026-10-12T11:00:00.000Z",
        actionDescription: "Investigated network jitter.",
        result: "Identified routing hop defect.",
        performedById: 2,
        performedBy: { id: 2, name: "Alex Taylor", email: "alex@test.com", role: "IT_STAFF" },
        isFollowUpRequired: true,
        followUpNote: "Replace switch tomorrow morning.",
        attachmentNotes: null,
        createdAt: "2026-10-12T11:05:00.000Z",
        updatedAt: "2026-10-12T11:05:00.000Z",
      });

      fireEvent.change(followUpInput, { target: { value: "Replace switch tomorrow morning." } });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.createActionTaken).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            isFollowUpRequired: true,
            followUpNote: "Replace switch tomorrow morning.",
          })
        );
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // UI-03: Requester Mode Read-Only Presentation
  // =========================================================================
  describe("UI-03: Requester Actions Read-Only UI (AC-04)", () => {
    it("renders Actions Taken list for Requesters while completely omitting Add and Edit buttons", async () => {
      // Mock Requester user
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

      render(<ActionsTakenSection ticketId={101} isStaff={false} />);

      // List renders cleanly
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();
      expect(
        screen.getAllByText("Checked server logs and identified failing Redis cache node.")[0]
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Restarted Redis service and verified connection pool recovery.")[0]
      ).toBeInTheDocument();

      // Verify Add Action Taken button is completely omitted
      expect(screen.queryByTestId("add-action-btn")).not.toBeInTheDocument();

      // Verify Edit buttons are completely omitted
      expect(screen.queryByTestId("edit-action-btn")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Administrator Role Capabilities (P1 / AC-01, AC-06)
  // =========================================================================
  describe("Administrator Role Capabilities (P1 / AC-01, AC-06)", () => {
    beforeEach(() => {
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: {
          id: 99,
          name: "Root Administrator",
          email: "admin@toktickit.com",
          role: "ADMINISTRATOR",
          department: "Systems Architecture",
          mustChangePassword: false,
          isActive: true,
        },
        token: "admin-jwt-token",
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        updatePassword: vi.fn(),
      });
    });

    it("allows Administrator to see Add/Edit buttons and record Actions Taken", async () => {
      const user = userEvent.setup();
      const newAction: ActionTakenItem = {
        id: 301,
        ticketId: 101,
        actionDateTime: "2026-10-12T15:00:00.000Z",
        actionDescription: "Administrator upgraded hypervisor kernel packages across cluster.",
        result: "Cluster restarted and live migration validated successfully.",
        performedById: 99,
        performedBy: {
          id: 99,
          name: "Root Administrator",
          email: "admin@toktickit.com",
          role: "ADMINISTRATOR",
        },
        isFollowUpRequired: false,
        followUpNote: null,
        attachmentNotes: null,
        createdAt: "2026-10-12T15:05:00.000Z",
        updatedAt: "2026-10-12T15:05:00.000Z",
      };

      vi.mocked(api.createActionTaken).mockResolvedValueOnce(newAction);

      render(<ActionsTakenSection ticketId={101} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      // Both Add and Edit buttons are visible for Administrator
      const addBtn = screen.getByTestId("add-action-btn");
      expect(addBtn).toBeInTheDocument();
      expect(screen.getAllByTestId("edit-action-btn").length).toBeGreaterThan(0);

      // Administrator clicks Add
      await user.click(addBtn);
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
      expect(screen.getByTestId("action-performed-by-input")).toHaveValue(
        "Root Administrator (Auto-assigned)"
      );

      // Fill and submit
      fireEvent.change(screen.getByTestId("action-description-input"), {
        target: { value: "Administrator upgraded hypervisor kernel packages across cluster." },
      });
      fireEvent.change(screen.getByTestId("action-result-input"), {
        target: { value: "Cluster restarted and live migration validated successfully." },
      });
      await user.click(screen.getByTestId("modal-submit-btn"));

      await waitFor(() => {
        expect(api.createActionTaken).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            actionDescription: "Administrator upgraded hypervisor kernel packages across cluster.",
            result: "Cluster restarted and live migration validated successfully.",
          })
        );
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      // New action is rendered in the list
      await waitFor(() => {
        expect(
          screen.getAllByText("Administrator upgraded hypervisor kernel packages across cluster.")[0]
        ).toBeInTheDocument();
      });
    });

    it("allows Administrator to edit an existing Action Taken", async () => {
      const user = userEvent.setup();
      const updatedAction: ActionTakenItem = {
        ...mockActions[0],
        actionDescription: "Administrator modified diagnostic investigation details.",
        result: "Confirmed zero packet loss and optimal MTU settings.",
      };

      vi.mocked(api.updateActionTaken).mockResolvedValueOnce(updatedAction);

      render(<ActionsTakenSection ticketId={101} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      // Click Edit button on the first action
      const editBtns = screen.getAllByTestId("edit-action-btn");
      await user.click(editBtns[0]);

      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
      fireEvent.change(screen.getByTestId("action-result-input"), {
        target: { value: "Confirmed zero packet loss and optimal MTU settings." },
      });
      await user.click(screen.getByTestId("modal-submit-btn"));

      await waitFor(() => {
        expect(api.updateActionTaken).toHaveBeenCalledWith(
          101,
          1,
          expect.objectContaining({
            result: "Confirmed zero packet loss and optimal MTU settings.",
          })
        );
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Accessibility & Focus Restoration (P2)
  // =========================================================================
  describe("Accessibility & Modal Focus Restoration (P2)", () => {
    it("does not steal focus to the Add button upon initial mount when modal is closed", async () => {
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const addBtn = screen.getByTestId("add-action-btn");
      // Initial active element must NOT be forced onto the Add button
      expect(document.activeElement).not.toBe(addBtn);
    });

    it("restores focus to Add Action Taken button when create modal is dismissed via Escape key", async () => {
      const user = userEvent.setup();
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const addBtn = screen.getByTestId("add-action-btn");
      await user.click(addBtn);

      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      // Press Escape key
      fireEvent.keyDown(window, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(addBtn);
      });
    });

    it("restores focus to Add Action Taken button when create modal is dismissed via Cancel button", async () => {
      const user = userEvent.setup();
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const addBtn = screen.getByTestId("add-action-btn");
      await user.click(addBtn);

      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      const cancelBtn = screen.getByTestId("modal-cancel-btn");
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(addBtn);
      });
    });

    it("restores focus to the specific clicked Edit button when edit modal is dismissed via Escape key", async () => {
      const user = userEvent.setup();
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const editBtns = screen.getAllByTestId("edit-action-btn");
      const targetEditBtn = editBtns[1]; // Click second action's edit button

      await user.click(targetEditBtn);
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(targetEditBtn);
      });
    });

    it("restores focus to the specific clicked Edit button when edit modal is dismissed via Cancel button", async () => {
      const user = userEvent.setup();
      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const editBtns = screen.getAllByTestId("edit-action-btn");
      const targetEditBtn = editBtns[0];

      await user.click(targetEditBtn);
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      const cancelBtn = screen.getByTestId("modal-cancel-btn");
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(targetEditBtn);
      });
    });

    it("restores focus to the specific clicked Edit button after successfully saving an edit", async () => {
      const user = userEvent.setup();
      const updatedAction: ActionTakenItem = {
        ...mockActions[0],
        result: "Restored after focus verification test.",
      };
      vi.mocked(api.updateActionTaken).mockResolvedValueOnce(updatedAction);

      render(<ActionsTakenSection ticketId={101} isStaff={true} />);
      expect(await screen.findByTestId("actions-desktop-table")).toBeInTheDocument();

      const editBtns = screen.getAllByTestId("edit-action-btn");
      const targetEditBtn = editBtns[0];

      await user.click(targetEditBtn);
      expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();

      await user.click(screen.getByTestId("modal-submit-btn"));

      await waitFor(() => {
        expect(screen.queryByTestId("action-taken-modal")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(targetEditBtn);
      });
    });
  });
});
