/**
 * Helper to validate optimistic concurrency control for ticket status updates (BR-10, AC-10, AC-11, API-07, API-08, UNIT-03).
 */

export interface ConcurrencyCheckError {
  status: 400 | 409;
  body: {
    error: string;
    code: "VALIDATION_ERROR" | "STALE_UPDATE_CONFLICT";
    details: { field: string; message: string }[];
    currentUpdatedAt?: string;
  };
}

export interface ConcurrencyCheckResult {
  isValid: boolean;
  error?: ConcurrencyCheckError;
}

/**
 * Validates ISO-8601 UTC date string format per RFC 3339 / ISO 8601.
 * Must end in 'Z'.
 */
export function isValidIsoUtcDateString(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
  if (!isoUtcPattern.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

/**
 * Evaluates optimistic concurrency between client expectedUpdatedAt and database currentUpdatedAt.
 */
export function checkOptimisticConcurrency(
  expectedUpdatedAt: unknown,
  currentUpdatedAt: Date
): ConcurrencyCheckResult {
  // Scenario 1: Missing expectedUpdatedAt (API-07 / AC-10)
  if (
    expectedUpdatedAt === undefined ||
    expectedUpdatedAt === null ||
    (typeof expectedUpdatedAt === "string" && expectedUpdatedAt.trim() === "")
  ) {
    return {
      isValid: false,
      error: {
        status: 400,
        body: {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            {
              field: "expectedUpdatedAt",
              message: "expectedUpdatedAt timestamp is required for concurrency control",
            },
          ],
        },
      },
    };
  }

  // Scenario 2: Malformed ISO-8601 date string (API-07 / AC-10)
  if (!isValidIsoUtcDateString(expectedUpdatedAt)) {
    return {
      isValid: false,
      error: {
        status: 400,
        body: {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            {
              field: "expectedUpdatedAt",
              message: "expectedUpdatedAt must be a valid ISO-8601 UTC date string",
            },
          ],
        },
      },
    };
  }

  // Scenario 3: Stale / Mismatched timestamp (millisecond precision comparison) (API-08 / AC-11)
  const clientMillis = new Date(expectedUpdatedAt as string).getTime();
  const serverMillis = currentUpdatedAt.getTime();

  if (clientMillis !== serverMillis) {
    return {
      isValid: false,
      error: {
        status: 409,
        body: {
          error: "Conflict: Ticket has been modified by another user. Please refresh and try again",
          code: "STALE_UPDATE_CONFLICT",
          details: [
            {
              field: "expectedUpdatedAt",
              message: "Provided timestamp does not match current ticket updatedAt timestamp",
            },
          ],
          currentUpdatedAt: currentUpdatedAt.toISOString(),
        },
      },
    };
  }

  return { isValid: true };
}
