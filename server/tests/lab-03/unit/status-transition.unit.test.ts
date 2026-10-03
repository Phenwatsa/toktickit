import { describe, it, expect } from "vitest";
import { TicketStatus } from "@prisma/client";
import {
  isValidStatusTransition,
  getPermittedNextStatuses,
  getInvalidTransitionMessage,
  PERMITTED_STATUS_TRANSITIONS,
} from "../../../src/utils/statusTransition.js";

// ---------------------------------------------------------------------------
// UNIT-02: 8-Status Finite State Machine Transition Validator (BR-12 / AC-09)
// ---------------------------------------------------------------------------

describe("UNIT-02: Status Transition Finite State Machine Tests", () => {
  describe("Permitted Transitions", () => {
    it("permits transitions from NEW to OPEN, IN_PROGRESS, and CANCELLED", () => {
      expect(isValidStatusTransition("NEW", "OPEN")).toBe(true);
      expect(isValidStatusTransition("NEW", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("NEW", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("NEW")).toEqual(["OPEN", "IN_PROGRESS", "CANCELLED"]);
    });

    it("permits transitions from OPEN to IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("OPEN", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("OPEN", "WAITING_FOR_REQUESTER")).toBe(true);
      expect(isValidStatusTransition("OPEN", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("OPEN", "CANCELLED")).toBe(true);
    });

    it("permits transitions from IN_PROGRESS to WAITING_FOR_REQUESTER, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("IN_PROGRESS", "WAITING_FOR_REQUESTER")).toBe(true);
      expect(isValidStatusTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
    });

    it("permits transitions from WAITING_FOR_REQUESTER to IN_PROGRESS, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "CANCELLED")).toBe(true);
    });

    it("permits transitions from RESOLVED to CLOSED and REOPENED", () => {
      expect(isValidStatusTransition("RESOLVED", "CLOSED")).toBe(true);
      expect(isValidStatusTransition("RESOLVED", "REOPENED")).toBe(true);
      expect(getPermittedNextStatuses("RESOLVED")).toEqual(["CLOSED", "REOPENED"]);
    });

    it("permits transitions from REOPENED to IN_PROGRESS, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("REOPENED", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("REOPENED", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("REOPENED", "CANCELLED")).toBe(true);
    });
  });

  describe("Illegal Transitions & Terminal States", () => {
    it("rejects illegal direct transition from IN_PROGRESS to CLOSED (AC-09)", () => {
      expect(isValidStatusTransition("IN_PROGRESS", "CLOSED")).toBe(false);
      const msg = getInvalidTransitionMessage("IN_PROGRESS", "CLOSED");
      expect(msg).toContain("Invalid status transition from IN_PROGRESS to CLOSED. Ticket must be RESOLVED first.");
    });

    it("rejects illegal transitions from NEW directly to RESOLVED or CLOSED", () => {
      expect(isValidStatusTransition("NEW", "RESOLVED")).toBe(false);
      expect(isValidStatusTransition("NEW", "CLOSED")).toBe(false);
    });

    it("enforces CLOSED as immutable terminal state with zero outgoing transitions", () => {
      const allStatuses: TicketStatus[] = [
        "NEW",
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
        "CANCELLED",
      ];

      for (const target of allStatuses) {
        expect(isValidStatusTransition("CLOSED", target)).toBe(false);
      }
      expect(getPermittedNextStatuses("CLOSED")).toHaveLength(0);
      expect(getInvalidTransitionMessage("CLOSED", "REOPENED")).toContain("terminal status CLOSED");
    });

    it("enforces CANCELLED as immutable terminal state with zero outgoing transitions", () => {
      const allStatuses: TicketStatus[] = [
        "NEW",
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
        "CANCELLED",
      ];

      for (const target of allStatuses) {
        expect(isValidStatusTransition("CANCELLED", target)).toBe(false);
      }
      expect(getPermittedNextStatuses("CANCELLED")).toHaveLength(0);
      expect(getInvalidTransitionMessage("CANCELLED", "OPEN")).toContain("terminal status CANCELLED");
    });

    it("rejects transition to the same status", () => {
      expect(isValidStatusTransition("IN_PROGRESS", "IN_PROGRESS")).toBe(false);
      expect(isValidStatusTransition("NEW", "NEW")).toBe(false);
    });

    it("rejects undefined or invalid status inputs safely", () => {
      expect(isValidStatusTransition(null as unknown as TicketStatus, "OPEN")).toBe(false);
      expect(isValidStatusTransition("OPEN", null as unknown as TicketStatus)).toBe(false);
    });
  });
});
