import { describe, it, expect } from "vitest";
import { TicketStatus } from "@prisma/client";
import {
  isValidStatusTransition,
  getPermittedNextStatuses,
  getInvalidTransitionMessage,
  SPRINT4_STATUS_TRANSITIONS,
} from "../../../src/utils/statusTransition.js";

// ---------------------------------------------------------------------------
// UNIT-02: 8-Status Transition Matrix Validator (BR-07 / AC-09)
// ---------------------------------------------------------------------------

describe("UNIT-02: 8-Status Transition Matrix Validator (BR-07 / AC-09)", () => {
  describe("Permitted Transitions (Sprint 4 Matrix)", () => {
    it("permits transitions from NEW to OPEN and CANCELLED (NEW -> IN_PROGRESS removed)", () => {
      expect(isValidStatusTransition("NEW", "OPEN")).toBe(true);
      expect(isValidStatusTransition("NEW", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("NEW")).toEqual(["OPEN", "CANCELLED"]);
    });

    it("permits transitions from OPEN to IN_PROGRESS, WAITING_FOR_REQUESTER, and CANCELLED (OPEN -> RESOLVED removed)", () => {
      expect(isValidStatusTransition("OPEN", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("OPEN", "WAITING_FOR_REQUESTER")).toBe(true);
      expect(isValidStatusTransition("OPEN", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("OPEN")).toEqual([
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "CANCELLED",
      ]);
    });

    it("permits transitions from IN_PROGRESS to WAITING_FOR_REQUESTER, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("IN_PROGRESS", "WAITING_FOR_REQUESTER")).toBe(true);
      expect(isValidStatusTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("IN_PROGRESS")).toEqual([
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CANCELLED",
      ]);
    });

    it("permits transitions from WAITING_FOR_REQUESTER to IN_PROGRESS, RESOLVED, and CANCELLED", () => {
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("WAITING_FOR_REQUESTER", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("WAITING_FOR_REQUESTER")).toEqual([
        "IN_PROGRESS",
        "RESOLVED",
        "CANCELLED",
      ]);
    });

    it("permits transitions from RESOLVED to CLOSED and REOPENED", () => {
      expect(isValidStatusTransition("RESOLVED", "CLOSED")).toBe(true);
      expect(isValidStatusTransition("RESOLVED", "REOPENED")).toBe(true);
      expect(getPermittedNextStatuses("RESOLVED")).toEqual(["CLOSED", "REOPENED"]);
    });

    it("permits transition from CLOSED to REOPENED (Sprint 4 Addition)", () => {
      expect(isValidStatusTransition("CLOSED", "REOPENED")).toBe(true);
      expect(getPermittedNextStatuses("CLOSED")).toEqual(["REOPENED"]);
    });

    it("permits transitions from REOPENED to IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, and CANCELLED (Sprint 4 Refinement)", () => {
      expect(isValidStatusTransition("REOPENED", "IN_PROGRESS")).toBe(true);
      expect(isValidStatusTransition("REOPENED", "WAITING_FOR_REQUESTER")).toBe(true);
      expect(isValidStatusTransition("REOPENED", "RESOLVED")).toBe(true);
      expect(isValidStatusTransition("REOPENED", "CANCELLED")).toBe(true);
      expect(getPermittedNextStatuses("REOPENED")).toEqual([
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CANCELLED",
      ]);
    });
  });

  describe("Sprint 4 Delta Enforcements & Forbidden Transitions", () => {
    it("strictly rejects NEW -> IN_PROGRESS (Sprint 4 Refinement 1: must triage in OPEN first)", () => {
      expect(isValidStatusTransition("NEW", "IN_PROGRESS")).toBe(false);
      const msg = getInvalidTransitionMessage("NEW", "IN_PROGRESS");
      expect(msg).toContain("Cannot transition status from NEW to IN_PROGRESS");
      expect(msg).toContain("Permitted transitions from NEW are: OPEN, CANCELLED");
    });

    it("strictly rejects OPEN -> RESOLVED (Sprint 4 Refinement 2: must enter IN_PROGRESS first)", () => {
      expect(isValidStatusTransition("OPEN", "RESOLVED")).toBe(false);
      const msg = getInvalidTransitionMessage("OPEN", "RESOLVED");
      expect(msg).toContain("Cannot transition status from OPEN to RESOLVED");
      expect(msg).toContain("Permitted transitions from OPEN are: IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED");
    });

    it("rejects illegal direct transition from NEW to RESOLVED or CLOSED", () => {
      expect(isValidStatusTransition("NEW", "RESOLVED")).toBe(false);
      expect(isValidStatusTransition("NEW", "CLOSED")).toBe(false);
    });

    it("rejects illegal direct transition from IN_PROGRESS to CLOSED (must resolve first)", () => {
      expect(isValidStatusTransition("IN_PROGRESS", "CLOSED")).toBe(false);
    });

    it("rejects illegal transitions from CLOSED to non-REOPENED statuses", () => {
      const nonReopenedStatuses: TicketStatus[] = [
        "NEW",
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CLOSED",
        "CANCELLED",
      ];
      for (const target of nonReopenedStatuses) {
        expect(isValidStatusTransition("CLOSED", target)).toBe(false);
      }
    });

    it("strictly enforces CANCELLED as terminal state with zero outgoing transitions (BR-11 / AC-23)", () => {
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
      expect(getInvalidTransitionMessage("CANCELLED", "OPEN")).toBe(
        "Cannot transition status of a cancelled ticket"
      );
    });

    it("rejects transitions to the exact same status", () => {
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
      for (const status of allStatuses) {
        expect(isValidStatusTransition(status, status)).toBe(false);
      }
    });

    it("safely rejects null, undefined, or unknown status inputs", () => {
      expect(isValidStatusTransition(null as unknown as TicketStatus, "OPEN")).toBe(false);
      expect(isValidStatusTransition("OPEN", null as unknown as TicketStatus)).toBe(false);
      expect(isValidStatusTransition(undefined as unknown as TicketStatus, "OPEN")).toBe(false);
      expect(isValidStatusTransition("UNKNOWN" as TicketStatus, "OPEN")).toBe(false);
    });

    it("matches the authoritative SPRINT4_STATUS_TRANSITIONS matrix structure", () => {
      expect(SPRINT4_STATUS_TRANSITIONS.NEW).toEqual(["OPEN", "CANCELLED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.OPEN).toEqual(["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.IN_PROGRESS).toEqual(["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.WAITING_FOR_REQUESTER).toEqual(["IN_PROGRESS", "RESOLVED", "CANCELLED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.RESOLVED).toEqual(["CLOSED", "REOPENED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.CLOSED).toEqual(["REOPENED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.REOPENED).toEqual(["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]);
      expect(SPRINT4_STATUS_TRANSITIONS.CANCELLED).toEqual([]);
    });
  });
});
