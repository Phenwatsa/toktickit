import { describe, it, expect } from "vitest";
import {
  validatePasswordPolicy,
  isPasswordValid,
  PASSWORD_VIOLATION_CODES,
} from "../../../src/utils/passwordPolicy.js";

// ---------------------------------------------------------------------------
// UNIT-01: Password Policy Complexity Rule Validator (BR-05 / AC-02)
// ---------------------------------------------------------------------------

describe("UNIT-01: Password Policy Unit Tests", () => {
  it("passes compliant passwords satisfying all 4 rules", () => {
    const validPasswords = [
      "Password123!",
      "SuperSecret99",
      "KmitlCpe2026",
      "Aa1Bb2Cc3",
      "P@ssw0rdValid",
    ];

    for (const pwd of validPasswords) {
      const result = validatePasswordPolicy(pwd);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.codes).toHaveLength(0);
      expect(isPasswordValid(pwd)).toBe(true);
    }
  });

  it("fails if password length is less than 8 characters", () => {
    const shortPassword = "Pass1!";
    const result = validatePasswordPolicy(shortPassword);

    expect(result.valid).toBe(false);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.TOO_SHORT);
    expect(result.errors.some((e) => e.includes("8 characters"))).toBe(true);
    expect(isPasswordValid(shortPassword)).toBe(false);
  });

  it("fails if password lacks an uppercase letter", () => {
    const noUpper = "password123!";
    const result = validatePasswordPolicy(noUpper);

    expect(result.valid).toBe(false);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.NO_UPPERCASE);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("fails if password lacks a lowercase letter", () => {
    const noLower = "PASSWORD123!";
    const result = validatePasswordPolicy(noLower);

    expect(result.valid).toBe(false);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.NO_LOWERCASE);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("fails if password lacks a number", () => {
    const noNumber = "Password!";
    const result = validatePasswordPolicy(noNumber);

    expect(result.valid).toBe(false);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.NO_NUMBER);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("returns multiple violation codes when multiple rules fail simultaneously", () => {
    const multiFailure = "short"; // <8 chars, no uppercase, no number
    const result = validatePasswordPolicy(multiFailure);

    expect(result.valid).toBe(false);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.TOO_SHORT);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.NO_UPPERCASE);
    expect(result.codes).toContain(PASSWORD_VIOLATION_CODES.NO_NUMBER);
    expect(result.codes).not.toContain(PASSWORD_VIOLATION_CODES.NO_LOWERCASE);
  });

  it("handles empty or non-string inputs safely", () => {
    const emptyResult = validatePasswordPolicy("");
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.codes).toContain(PASSWORD_VIOLATION_CODES.TOO_SHORT);

    const nullResult = validatePasswordPolicy(null as unknown as string);
    expect(nullResult.valid).toBe(false);
    expect(nullResult.codes).toContain(PASSWORD_VIOLATION_CODES.TOO_SHORT);
  });
});
