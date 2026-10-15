/**
 * TokTickIT Sprint 4 — Dashboard Metrics Calculator Logic
 * Pure calculation functions for Requester, IT Staff, and Administrator dashboard metrics.
 * 
 * Satisfies:
 * - BR-12 (Server-side authoritative computation)
 * - BR-13 (Requester Metric Definitions)
 * - BR-14 (IT Staff Metric Definitions)
 * - BR-17 (Administrator Dashboard Calculation Rules)
 * - UNIT-04 (Dashboard Calculator Unit Tests)
 * - AC-12, AC-13, AC-19a
 */

export interface RequesterMetrics {
  openTickets: number;
  inProgressTickets: number;
  waitingForRequesterTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

export interface StaffPrimaryMetrics {
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingForRequesterTickets: number;
  myAssignedTickets: number;
}

export interface StaffStatusBreakdown {
  new: number;
  open: number;
  inProgress: number;
  waitingForRequester: number;
  resolved: number;
  closed: number;
  reopened: number;
  cancelled: number;
}

export interface StaffPriorityBreakdown {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface StaffMetrics {
  primary: StaffPrimaryMetrics;
  unassignedTickets: number;
  byStatus: StaffStatusBreakdown;
  byPriority: StaffPriorityBreakdown;
}

export interface AdminOperationalMetrics {
  unassignedTickets: number;
  totalActiveTickets: number;
}

export interface AdminUsersMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: {
    requester: number;
    itStaff: number;
    administrator: number;
  };
}

export interface AdminMetrics {
  operational: AdminOperationalMetrics;
  users: AdminUsersMetrics;
}

export interface TicketSummaryInput {
  currentStatus: string;
  ticketOwnerId?: number | null;
  requestedPriority?: string | null;
  itPriority?: string | null;
}

export interface UserSummaryInput {
  isActive: boolean;
  role: string;
}

/**
 * Active statuses are those not yet finalized (not CLOSED and not CANCELLED).
 */
export const ACTIVE_STATUSES = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
  "REOPENED",
] as const;

export const OPEN_GROUP_STATUSES = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "REOPENED",
] as const;

/**
 * Computes Requester Dashboard metrics according to BR-13 & AC-12.
 */
export function calculateRequesterMetrics(
  tickets: Array<{ currentStatus: string }>
): RequesterMetrics {
  let openTickets = 0;
  let inProgressTickets = 0;
  let waitingForRequesterTickets = 0;
  let resolvedTickets = 0;
  let closedTickets = 0;

  for (const ticket of tickets) {
    const status = ticket.currentStatus;
    if (OPEN_GROUP_STATUSES.includes(status as any)) {
      openTickets++;
    }
    if (status === "IN_PROGRESS") {
      inProgressTickets++;
    } else if (status === "WAITING_FOR_REQUESTER") {
      waitingForRequesterTickets++;
    } else if (status === "RESOLVED") {
      resolvedTickets++;
    } else if (status === "CLOSED") {
      closedTickets++;
    }
  }

  return {
    openTickets,
    inProgressTickets,
    waitingForRequesterTickets,
    resolvedTickets,
    closedTickets,
  };
}

/**
 * Computes IT Staff Dashboard metrics according to BR-14 & AC-13.
 */
export function calculateStaffMetrics(
  tickets: TicketSummaryInput[],
  staffUserId: number
): StaffMetrics {
  let newTickets = 0;
  let openTickets = 0;
  let inProgressTickets = 0;
  let waitingForRequesterTickets = 0;
  let myAssignedTickets = 0;
  let unassignedTickets = 0;

  const byStatus: StaffStatusBreakdown = {
    new: 0,
    open: 0,
    inProgress: 0,
    waitingForRequester: 0,
    resolved: 0,
    closed: 0,
    reopened: 0,
    cancelled: 0,
  };

  const byPriority: StaffPriorityBreakdown = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const ticket of tickets) {
    const status = ticket.currentStatus;
    const isActive = status !== "CLOSED" && status !== "CANCELLED";

    // 1. byStatus distribution across all 8 lifecycle statuses
    switch (status) {
      case "NEW":
        byStatus.new++;
        break;
      case "OPEN":
        byStatus.open++;
        break;
      case "IN_PROGRESS":
        byStatus.inProgress++;
        break;
      case "WAITING_FOR_REQUESTER":
        byStatus.waitingForRequester++;
        break;
      case "RESOLVED":
        byStatus.resolved++;
        break;
      case "CLOSED":
        byStatus.closed++;
        break;
      case "REOPENED":
        byStatus.reopened++;
        break;
      case "CANCELLED":
        byStatus.cancelled++;
        break;
    }

    // 2. Active status metrics
    if (isActive) {
      if (status === "NEW") newTickets++;
      if (status === "OPEN") openTickets++;
      if (status === "IN_PROGRESS") inProgressTickets++;
      if (status === "WAITING_FOR_REQUESTER") waitingForRequesterTickets++;

      // Assigned to current IT staff user
      if (ticket.ticketOwnerId === staffUserId) {
        myAssignedTickets++;
      }

      // Unassigned queue
      if (ticket.ticketOwnerId === null || ticket.ticketOwnerId === undefined) {
        unassignedTickets++;
      }

      // byPriority across active tickets (effective priority: itPriority ?? requestedPriority)
      const effectivePriority = (ticket.itPriority || ticket.requestedPriority || "MEDIUM").toUpperCase();
      switch (effectivePriority) {
        case "LOW":
          byPriority.low++;
          break;
        case "MEDIUM":
          byPriority.medium++;
          break;
        case "HIGH":
          byPriority.high++;
          break;
        case "URGENT":
          byPriority.urgent++;
          break;
      }
    }
  }

  return {
    primary: {
      newTickets,
      openTickets,
      inProgressTickets,
      waitingForRequesterTickets,
      myAssignedTickets,
    },
    unassignedTickets,
    byStatus,
    byPriority,
  };
}

/**
 * Computes Administrator Dashboard operational and user metrics according to BR-17 & AC-19a.
 */
export function calculateAdminMetrics(
  tickets: TicketSummaryInput[],
  users: UserSummaryInput[]
): AdminMetrics {
  let unassignedTickets = 0;
  let totalActiveTickets = 0;

  for (const ticket of tickets) {
    const status = ticket.currentStatus;
    const isActive = status !== "CLOSED" && status !== "CANCELLED";
    if (isActive) {
      totalActiveTickets++;
      if (ticket.ticketOwnerId === null || ticket.ticketOwnerId === undefined) {
        unassignedTickets++;
      }
    }
  }

  let activeUsers = 0;
  let inactiveUsers = 0;
  let requesterCount = 0;
  let itStaffCount = 0;
  let adminCount = 0;

  for (const user of users) {
    if (user.isActive) {
      activeUsers++;
    } else {
      inactiveUsers++;
    }

    switch (user.role) {
      case "REQUESTER":
        requesterCount++;
        break;
      case "IT_STAFF":
        itStaffCount++;
        break;
      case "ADMINISTRATOR":
        adminCount++;
        break;
    }
  }

  return {
    operational: {
      unassignedTickets,
      totalActiveTickets,
    },
    users: {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      byRole: {
        requester: requesterCount,
        itStaff: itStaffCount,
        administrator: adminCount,
      },
    },
  };
}
