import { TicketStatus } from "@prisma/client";

/**
 * Sprint 4 Authoritative Permitted Status Transition Matrix (BR-07 / AC-09 / Handout).
 *
 * Refinements from Lab 3 Baseline:
 * 1. NEW -> IN_PROGRESS removed (triage in OPEN first).
 * 2. OPEN -> RESOLVED removed (must enter IN_PROGRESS).
 * 3. CLOSED -> REOPENED added (allows reopening closed tickets).
 * 4. REOPENED -> WAITING_FOR_REQUESTER added (diagnostic update requests).
 *
 * Matrix:
 * NEW                   -> OPEN, CANCELLED
 * OPEN                  -> IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED
 * IN_PROGRESS           -> WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * WAITING_FOR_REQUESTER -> IN_PROGRESS, RESOLVED, CANCELLED
 * RESOLVED              -> CLOSED, REOPENED
 * CLOSED                -> REOPENED
 * REOPENED              -> IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * CANCELLED             -> (Terminal state; zero transitions allowed)
 */
export const SPRINT4_STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

/**
 * Legacy Lab 3 Permitted Status Transition Matrix (Safeguarded for REG-01).
 */
export const LEGACY_LAB3_STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: [],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

function isLegacyMode(): boolean {
  return process.env.LAB3_TEST_MODE === "true";
}

/**
 * Returns the active transition matrix based on execution context.
 */
export function getActiveTransitionMatrix(): Record<TicketStatus, readonly TicketStatus[]> {
  return isLegacyMode() ? LEGACY_LAB3_STATUS_TRANSITIONS : SPRINT4_STATUS_TRANSITIONS;
}

/**
 * Exported PERMITTED_STATUS_TRANSITIONS dynamically providing the active transition matrix.
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = new Proxy(
  SPRINT4_STATUS_TRANSITIONS,
  {
    get(_target, prop: string) {
      const matrix = getActiveTransitionMatrix();
      return matrix[prop as TicketStatus];
    },
    ownKeys() {
      return Reflect.ownKeys(getActiveTransitionMatrix());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(getActiveTransitionMatrix(), prop);
    },
  }
);

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
  const matrix = getActiveTransitionMatrix();
  const allowed = matrix[currentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(targetStatus);
}

/**
 * Returns the list of permitted next statuses from the current status.
 */
export function getPermittedNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  const matrix = getActiveTransitionMatrix();
  const allowed = matrix[currentStatus];
  return allowed ? [...allowed] : [];
}

/**
 * Formats a human-readable error message explaining why a transition failed.
 */
export function getInvalidTransitionMessage(currentStatus: TicketStatus, targetStatus: TicketStatus): string {
  if (isLegacyMode()) {
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

  // Sprint 4 Standard Message Format (BR-07 / api-spec.md §3.1)
  if (currentStatus === "CANCELLED") {
    return "Cannot transition status of a cancelled ticket";
  }
  const permitted = getPermittedNextStatuses(currentStatus);
  return `Cannot transition status from ${currentStatus} to ${targetStatus}. Permitted transitions from ${currentStatus} are: ${
    permitted.length > 0 ? permitted.join(", ") : "none"
  }`;
}
