// ---------------------------------------------------------------------------
// Password Policy Utility (BR-05 / UNIT-01)
// Rules:
// 1. Minimum 8 characters
// 2. At least one uppercase letter (A-Z)
// 3. At least one lowercase letter (a-z)
// 4. At least one numeric digit (0-9)
// ---------------------------------------------------------------------------

export const PASSWORD_VIOLATION_CODES = {
  TOO_SHORT: "ERR_TOO_SHORT",
  NO_UPPERCASE: "ERR_NO_UPPERCASE",
  NO_LOWERCASE: "ERR_NO_LOWERCASE",
  NO_NUMBER: "ERR_NO_NUMBER",
} as const;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
  codes: string[];
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  const codes: string[] = [];

  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
    codes.push(PASSWORD_VIOLATION_CODES.TOO_SHORT);
  }

  if (!/[A-Z]/.test(password || "")) {
    errors.push("Password must contain at least one uppercase letter.");
    codes.push(PASSWORD_VIOLATION_CODES.NO_UPPERCASE);
  }

  if (!/[a-z]/.test(password || "")) {
    errors.push("Password must contain at least one lowercase letter.");
    codes.push(PASSWORD_VIOLATION_CODES.NO_LOWERCASE);
  }

  if (!/[0-9]/.test(password || "")) {
    errors.push("Password must contain at least one number.");
    codes.push(PASSWORD_VIOLATION_CODES.NO_NUMBER);
  }

  return {
    valid: codes.length === 0,
    errors,
    codes,
  };
}

export function isPasswordValid(password: string): boolean {
  return validatePasswordPolicy(password).valid;
}
