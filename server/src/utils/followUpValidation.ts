/**
 * Helper to validate followUpNote requirement and character boundaries (BR-04, AC-02, UNIT-01).
 *
 * Rules:
 * - If isFollowUpRequired === true:
 *   - followUpNote is mandatory (string)
 *   - Must contain at least 3 non-whitespace characters
 *   - Maximum length of 2000 characters
 * - If isFollowUpRequired === false:
 *   - followUpNote is optional or null
 *   - If provided as non-null string, must not exceed 2000 characters
 */
export interface FollowUpValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateFollowUpNote(
  isFollowUpRequired: boolean,
  followUpNote?: unknown
): FollowUpValidationResult {
  if (isFollowUpRequired) {
    if (typeof followUpNote !== "string") {
      return {
        isValid: false,
        message: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed",
      };
    }

    const trimmed = followUpNote.trim();
    if (trimmed.length < 3) {
      return {
        isValid: false,
        message: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed",
      };
    }

    if (followUpNote.length > 2000) {
      return {
        isValid: false,
        message: "Follow-up note cannot exceed 2000 characters",
      };
    }

    return { isValid: true };
  }

  // When isFollowUpRequired === false
  if (followUpNote !== undefined && followUpNote !== null) {
    if (typeof followUpNote !== "string") {
      return {
        isValid: false,
        message: "Follow-up note must be a string or null",
      };
    }
    if (followUpNote.length > 2000) {
      return {
        isValid: false,
        message: "Follow-up note cannot exceed 2000 characters",
      };
    }
  }

  return { isValid: true };
}
