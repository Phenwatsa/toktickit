import { describe, it, expect } from "vitest";
import {
  calculateRequesterMetrics,
  calculateStaffMetrics,
  calculateAdminMetrics,
  TicketSummaryInput,
  UserSummaryInput,
} from "../../../src/utils/dashboardCalculator.js";

// ---------------------------------------------------------------------------
// UNIT-04: Dashboard Calculator Logic (BR-12, BR-13, BR-14, BR-17, AC-12, AC-13, AC-19a)
// ---------------------------------------------------------------------------

describe("UNIT-04: Dashboard Metrics Calculator Logic", () => {
  describe("Requester Metrics (BR-13 / AC-12)", () => {
    it("returns zero metrics for an empty tickets list", () => {
      const metrics = calculateRequesterMetrics([]);
      expect(metrics).toEqual({
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
      });
    });

    it("correctly counts openTickets across OPEN_GROUP statuses (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED)", () => {
      const tickets = [
        { currentStatus: "NEW" },
        { currentStatus: "OPEN" },
        { currentStatus: "IN_PROGRESS" },
        { currentStatus: "WAITING_FOR_REQUESTER" },
        { currentStatus: "REOPENED" },
        { currentStatus: "RESOLVED" },
        { currentStatus: "CLOSED" },
        { currentStatus: "CANCELLED" },
      ];

      const metrics = calculateRequesterMetrics(tickets);

      expect(metrics.openTickets).toBe(5);
      expect(metrics.inProgressTickets).toBe(1);
      expect(metrics.waitingForRequesterTickets).toBe(1);
      expect(metrics.resolvedTickets).toBe(1);
      expect(metrics.closedTickets).toBe(1);
    });

    it("verifies resolvedTickets includes all resolved tickets without date filtering", () => {
      const tickets = [
        { currentStatus: "RESOLVED" },
        { currentStatus: "RESOLVED" },
        { currentStatus: "RESOLVED" },
        { currentStatus: "CLOSED" },
      ];

      const metrics = calculateRequesterMetrics(tickets);
      expect(metrics.resolvedTickets).toBe(3);
      expect(metrics.closedTickets).toBe(1);
      expect(metrics.openTickets).toBe(0);
    });

    it("verifies CANCELLED tickets do not contribute to any active requester metrics", () => {
      const tickets = [
        { currentStatus: "CANCELLED" },
        { currentStatus: "CANCELLED" },
      ];

      const metrics = calculateRequesterMetrics(tickets);
      expect(metrics).toEqual({
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
      });
    });
  });

  describe("IT Staff Metrics (BR-14 / AC-13)", () => {
    const staffId = 42;

    it("returns zero metrics for an empty ticket list", () => {
      const metrics = calculateStaffMetrics([], staffId);
      expect(metrics.primary).toEqual({
        newTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        myAssignedTickets: 0,
      });
      expect(metrics.unassignedTickets).toBe(0);
      expect(metrics.byStatus).toEqual({
        new: 0,
        open: 0,
        inProgress: 0,
        waitingForRequester: 0,
        resolved: 0,
        closed: 0,
        reopened: 0,
        cancelled: 0,
      });
      expect(metrics.byPriority).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      });
    });

    it("correctly computes 5 primary cards and scopes myAssignedTickets strictly to current staff user", () => {
      const tickets: TicketSummaryInput[] = [
        { currentStatus: "NEW", ticketOwnerId: null },
        { currentStatus: "NEW", ticketOwnerId: staffId },
        { currentStatus: "OPEN", ticketOwnerId: staffId },
        { currentStatus: "IN_PROGRESS", ticketOwnerId: 99 }, // Assigned to another staff
        { currentStatus: "IN_PROGRESS", ticketOwnerId: staffId },
        { currentStatus: "WAITING_FOR_REQUESTER", ticketOwnerId: null },
        { currentStatus: "CLOSED", ticketOwnerId: staffId }, // Closed, should NOT count towards myAssignedTickets
        { currentStatus: "CANCELLED", ticketOwnerId: staffId }, // Cancelled, should NOT count towards myAssignedTickets
      ];

      const metrics = calculateStaffMetrics(tickets, staffId);

      expect(metrics.primary.newTickets).toBe(2);
      expect(metrics.primary.openTickets).toBe(1);
      expect(metrics.primary.inProgressTickets).toBe(2);
      expect(metrics.primary.waitingForRequesterTickets).toBe(1);
      // staffId active tickets: NEW(1) + OPEN(1) + IN_PROGRESS(1) = 3
      expect(metrics.primary.myAssignedTickets).toBe(3);
      // unassigned active tickets: NEW(1) + WAITING_FOR_REQUESTER(1) = 2
      expect(metrics.unassignedTickets).toBe(2);
    });

    it("correctly computes byStatus across all 8 lifecycle statuses", () => {
      const tickets: TicketSummaryInput[] = [
        { currentStatus: "NEW" },
        { currentStatus: "OPEN" },
        { currentStatus: "IN_PROGRESS" },
        { currentStatus: "WAITING_FOR_REQUESTER" },
        { currentStatus: "RESOLVED" },
        { currentStatus: "CLOSED" },
        { currentStatus: "REOPENED" },
        { currentStatus: "CANCELLED" },
        { currentStatus: "RESOLVED" },
      ];

      const metrics = calculateStaffMetrics(tickets, staffId);

      expect(metrics.byStatus).toEqual({
        new: 1,
        open: 1,
        inProgress: 1,
        waitingForRequester: 1,
        resolved: 2,
        closed: 1,
        reopened: 1,
        cancelled: 1,
      });
    });

    it("correctly computes byPriority for active tickets using effective priority", () => {
      const tickets: TicketSummaryInput[] = [
        { currentStatus: "NEW", itPriority: "LOW" },
        { currentStatus: "OPEN", itPriority: "MEDIUM" },
        { currentStatus: "IN_PROGRESS", itPriority: "HIGH" },
        { currentStatus: "WAITING_FOR_REQUESTER", itPriority: "URGENT" },
        { currentStatus: "OPEN", itPriority: null, requestedPriority: "HIGH" }, // Fallback to requestedPriority
        { currentStatus: "CLOSED", itPriority: "URGENT" }, // Inactive, excluded from byPriority
        { currentStatus: "CANCELLED", itPriority: "HIGH" }, // Inactive, excluded from byPriority
      ];

      const metrics = calculateStaffMetrics(tickets, staffId);

      expect(metrics.byPriority).toEqual({
        low: 1,
        medium: 1,
        high: 2, // 1 explicit HIGH + 1 fallback HIGH
        urgent: 1, // 1 WAITING_FOR_REQUESTER (CLOSED is excluded)
      });
    });
  });

  describe("Administrator Metrics (BR-17 / AC-19a)", () => {
    it("computes operational active queue and user distribution counts correctly", () => {
      const tickets: TicketSummaryInput[] = [
        { currentStatus: "NEW", ticketOwnerId: null },
        { currentStatus: "OPEN", ticketOwnerId: 2 },
        { currentStatus: "IN_PROGRESS", ticketOwnerId: null },
        { currentStatus: "RESOLVED", ticketOwnerId: 3 },
        { currentStatus: "CLOSED", ticketOwnerId: null }, // Inactive
        { currentStatus: "CANCELLED", ticketOwnerId: null }, // Inactive
      ];

      const users: UserSummaryInput[] = [
        { isActive: true, role: "REQUESTER" },
        { isActive: true, role: "REQUESTER" },
        { isActive: false, role: "REQUESTER" }, // Inactive requester
        { isActive: true, role: "IT_STAFF" },
        { isActive: true, role: "ADMINISTRATOR" },
      ];

      const metrics = calculateAdminMetrics(tickets, users);

      // Total active tickets: NEW(1) + OPEN(1) + IN_PROGRESS(1) + RESOLVED(1) = 4
      expect(metrics.operational.totalActiveTickets).toBe(4);
      // Unassigned active tickets: NEW(1) + IN_PROGRESS(1) = 2
      expect(metrics.operational.unassignedTickets).toBe(2);

      // User metrics
      expect(metrics.users.totalUsers).toBe(5);
      expect(metrics.users.activeUsers).toBe(4);
      expect(metrics.users.inactiveUsers).toBe(1);
      expect(metrics.users.byRole).toEqual({
        requester: 3,
        itStaff: 1,
        administrator: 1,
      });
    });
  });
});
