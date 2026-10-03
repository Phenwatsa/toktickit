import { Priority } from "@prisma/client";

/**
 * Priority separation and initialization helper according to TokTickIT Specification (BR-11).
 *
 * For every newly created ticket (via POST /api/tickets), the application service layer
 * shall explicitly initialize `itPriority` to the exact value of `requestedPriority`.
 * After creation, `itPriority` may subsequently be modified independently only by IT Staff.
 */
export function initializeTicketPriority(requestedPriority: Priority): Priority {
  if (!requestedPriority) {
    return Priority.MEDIUM;
  }
  return requestedPriority;
}
