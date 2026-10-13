import { describe, it, expect } from "vitest";
import {
  checkOptimisticConcurrency,
  isValidIsoUtcDateString,
} from "../../../src/utils/concurrency.js";

// ---------------------------------------------------------------------------
// UNIT-03: Optimistic Concurrency Comparator Logic (BR-10 / AC-10 / AC-11)
// ---------------------------------------------------------------------------

describe("UNIT-03: Optimistic Concurrency Comparator Logic (BR-10 / AC-10 / AC-11)", () => {
  const currentUpdatedAt = new Date("2026-10-10T14:40:00.123Z");

  describe("Scenario 1: Missing expectedUpdatedAt (API-07 / AC-10)", () => {
    it("rejects undefined expectedUpdatedAt with 400 VALIDATION_ERROR", () => {
      const result = checkOptimisticConcurrency(undefined, currentUpdatedAt);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(400);
      expect(result.error?.body.code).toBe("VALIDATION_ERROR");
      expect(result.error?.body.details[0].field).toBe("expectedUpdatedAt");
      expect(result.error?.body.details[0].message).toContain("required for concurrency control");
    });

    it("rejects null expectedUpdatedAt with 400 VALIDATION_ERROR", () => {
      const result = checkOptimisticConcurrency(null, currentUpdatedAt);
      expect(result.isValid).toBe(false);
      expect(result.error?.status).toBe(400);
      expect(result.error?.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects empty string or whitespace expectedUpdatedAt with 400 VALIDATION_ERROR", () => {
      expect(checkOptimisticConcurrency("", currentUpdatedAt).error?.status).toBe(400);
      expect(checkOptimisticConcurrency("   ", currentUpdatedAt).error?.status).toBe(400);
    });
  });

  describe("Scenario 2: Malformed expectedUpdatedAt (API-07 / AC-10)", () => {
    it("rejects non-string values (numbers, objects, booleans)", () => {
      expect(checkOptimisticConcurrency(123456789 as unknown as string, currentUpdatedAt).error?.status).toBe(400);
      expect(checkOptimisticConcurrency({ date: "2026-10-10" } as unknown as string, currentUpdatedAt).error?.status).toBe(400);
      expect(checkOptimisticConcurrency(true as unknown as string, currentUpdatedAt).error?.status).toBe(400);
    });

    it("rejects invalid date strings with 400 VALIDATION_ERROR", () => {
      const invalidStrings = [
        "not-a-date",
        "2026-13-45T99:99:99Z",
        "2026/10/10 14:40:00",
        "2026-10-10",
        "2026-10-10T14:40:00+07:00", // Non-UTC offset; specification mandates UTC format ending in 'Z'
        "2026-10-10T14:40:00",       // Missing timezone suffix
      ];

      for (const val of invalidStrings) {
        const result = checkOptimisticConcurrency(val, currentUpdatedAt);
        expect(result.isValid).toBe(false);
        expect(result.error?.status).toBe(400);
        expect(result.error?.body.code).toBe("VALIDATION_ERROR");
        expect(result.error?.body.details[0].message).toContain("must be a valid ISO-8601 UTC date string");
      }
    });
  });

  describe("Scenario 3: Stale / Mismatched Timestamps (API-08 / AC-11)", () => {
    it("returns 409 STALE_UPDATE_CONFLICT when expectedUpdatedAt is older than currentUpdatedAt", () => {
      const staleTimestamp = "2026-10-10T14:39:59.000Z";
      const result = checkOptimisticConcurrency(staleTimestamp, currentUpdatedAt);

      expect(result.isValid).toBe(false);
      expect(result.error?.status).toBe(409);
      expect(result.error?.body.code).toBe("STALE_UPDATE_CONFLICT");
      expect(result.error?.body.error).toContain("Conflict: Ticket has been modified");
      expect(result.error?.body.details[0].field).toBe("expectedUpdatedAt");
      expect(result.error?.body.details[0].message).toContain("does not match current ticket updatedAt timestamp");
      expect(result.error?.body.currentUpdatedAt).toBe(currentUpdatedAt.toISOString());
    });

    it("returns 409 STALE_UPDATE_CONFLICT on a 1 millisecond mismatch", () => {
      const offByOneMillis = new Date(currentUpdatedAt.getTime() - 1).toISOString();
      const result = checkOptimisticConcurrency(offByOneMillis, currentUpdatedAt);

      expect(result.isValid).toBe(false);
      expect(result.error?.status).toBe(409);
      expect(result.error?.body.code).toBe("STALE_UPDATE_CONFLICT");
    });

    it("returns 409 STALE_UPDATE_CONFLICT when expectedUpdatedAt is in the future relative to server updatedAt", () => {
      const futureTimestamp = "2026-10-10T15:00:00.000Z";
      const result = checkOptimisticConcurrency(futureTimestamp, currentUpdatedAt);

      expect(result.isValid).toBe(false);
      expect(result.error?.status).toBe(409);
      expect(result.error?.body.code).toBe("STALE_UPDATE_CONFLICT");
    });
  });

  describe("Scenario 4: Matching Timestamp (Happy Path)", () => {
    it("returns isValid: true when expectedUpdatedAt exactly matches currentUpdatedAt at millisecond precision", () => {
      const matchingTimestamp = currentUpdatedAt.toISOString();
      const result = checkOptimisticConcurrency(matchingTimestamp, currentUpdatedAt);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts valid ISO-8601 UTC strings without millisecond fractions if server millis is zero", () => {
      const exactSecondsDate = new Date("2026-10-10T14:40:00.000Z");
      const isoWithoutFraction = "2026-10-10T14:40:00Z";

      const result = checkOptimisticConcurrency(isoWithoutFraction, exactSecondsDate);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Helper: isValidIsoUtcDateString", () => {
    it("validates correct ISO-8601 UTC date formats", () => {
      expect(isValidIsoUtcDateString("2026-10-10T12:00:00Z")).toBe(true);
      expect(isValidIsoUtcDateString("2026-10-10T12:00:00.000Z")).toBe(true);
      expect(isValidIsoUtcDateString("2026-10-10T12:00:00.123456Z")).toBe(true);
    });

    it("rejects non-UTC, malformed, or invalid strings", () => {
      expect(isValidIsoUtcDateString("")).toBe(false);
      expect(isValidIsoUtcDateString(null)).toBe(false);
      expect(isValidIsoUtcDateString("2026-10-10")).toBe(false);
      expect(isValidIsoUtcDateString("2026-10-10T12:00:00")).toBe(false);
      expect(isValidIsoUtcDateString("2026-10-10T12:00:00+02:00")).toBe(false);
      expect(isValidIsoUtcDateString("not-a-date")).toBe(false);
    });
  });
});
