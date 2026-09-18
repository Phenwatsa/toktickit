import { describe, it, expect } from "vitest";
import { Priority } from "@prisma/client";
import { initializeTicketPriority } from "../../../src/utils/priorityInit.js";

// ---------------------------------------------------------------------------
// UNIT-04: Priority Assignment & Initialization Helper (BR-11 / AC-08)
// ---------------------------------------------------------------------------

describe("UNIT-04: Priority Initialization Unit Tests", () => {
  it("initializes itPriority to the exact requestedPriority for all priority levels", () => {
    const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    for (const p of priorities) {
      const itPriority = initializeTicketPriority(p);
      expect(itPriority).toBe(p);
    }
  });

  it("safely defaults to MEDIUM if requestedPriority is omitted or falsy", () => {
    const itPriority = initializeTicketPriority(null as unknown as Priority);
    expect(itPriority).toBe(Priority.MEDIUM);
  });
});
