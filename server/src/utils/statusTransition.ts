import { TicketStatus } from "@prisma/client";

/**
 * Permitted status transitions according to TokTickIT Specification (BR-12).
 *
 * NEW                  -> OPEN, IN_PROGRESS, CANCELLED
 * OPEN                 -> IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * IN_PROGRESS          -> WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * WAITING_FOR_REQUESTER-> IN_PROGRESS, RESOLVED, CANCELLED
 * RESOLVED             -> CLOSED, REOPENED
 * CLOSED               -> (Terminal state; no transitions allowed)
 * REOPENED             -> IN_PROGRESS, RESOLVED, CANCELLED
 * CANCELLED            -> (Terminal state; no transitions allowed)
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: [],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

/**
 * Validates whether transitioning from currentStatus to targetStatus is permitted.
 */
export function isValidStatusTransition(currentStatus: TicketStatus, targetStatus: TicketStatus): boolean {
  if (!currentStatus || !targetStatus) {
    return false;
  }
  // Transition to self is not considered a valid state advance
  if (currentStatus === targetStatus) {
    return false;
  }
  const allowed = PERMITTED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(targetStatus);
}

/**
 * Returns the list of permitted next statuses from the current status.
 */
export function getPermittedNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  const allowed = PERMITTED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? [...allowed] : [];
}

/**
 * Formats a human-readable error message explaining why a transition failed.
 */
export function getInvalidTransitionMessage(currentStatus: TicketStatus, targetStatus: TicketStatus): string {
  if (currentStatus === "CLOSED" || currentStatus === "CANCELLED") {
    return `Ticket is in terminal status ${currentStatus} and cannot be transitioned to ${targetStatus}.`;
  }
  if (currentStatus === "IN_PROGRESS" && targetStatus === "CLOSED") {
    return "Invalid status transition from IN_PROGRESS to CLOSED. Ticket must be RESOLVED first.";
  }
  const permitted = getPermittedNextStatuses(currentStatus);
  return `Invalid status transition from ${currentStatus} to ${targetStatus}. Permitted next statuses: ${
    permitted.length > 0 ? permitted.join(", ") : "none"
  }.`;
}
