import { describe, it, expect } from "vitest";
import { compareTokenVersion } from "../../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// UNIT-06: JWT Payload tokenVersion Mismatch Validator Unit Tests (AC-18)
// ---------------------------------------------------------------------------

describe("UNIT-06: Token Version Comparison Unit Tests", () => {
  it("accepts valid token when tokenVersion matches active database version", () => {
    const jwtVersion = 1;
    const dbVersion = 1;

    expect(compareTokenVersion(jwtVersion, dbVersion)).toBe(true);
  });

  it("accepts higher matching versions after multiple password changes or logouts", () => {
    const jwtVersion = 5;
    const dbVersion = 5;

    expect(compareTokenVersion(jwtVersion, dbVersion)).toBe(true);
  });

  it("rejects stale token when active database version has been incremented (logout / revocation)", () => {
    const jwtVersion = 1;
    const dbVersion = 2; // Incremented by POST /api/auth/logout

    expect(compareTokenVersion(jwtVersion, dbVersion)).toBe(false);
  });

  it("rejects token when tokenVersion is greater than database version (tampered payload)", () => {
    const jwtVersion = 99;
    const dbVersion = 1;

    expect(compareTokenVersion(jwtVersion, dbVersion)).toBe(false);
  });

  it("rejects invalid or non-numeric inputs safely", () => {
    expect(compareTokenVersion(undefined as unknown as number, 1)).toBe(false);
    expect(compareTokenVersion(1, undefined as unknown as number)).toBe(false);
    expect(compareTokenVersion("1" as unknown as number, 1)).toBe(false);
    expect(compareTokenVersion(NaN, 1)).toBe(false);
  });
});
