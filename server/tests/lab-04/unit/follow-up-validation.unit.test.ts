import { describe, it, expect } from "vitest";
import { validateFollowUpNote } from "../../../src/utils/followUpValidation.js";

// ---------------------------------------------------------------------------
// UNIT-01: Follow-Up Note Validator Logic (BR-04 / AC-02)
// ---------------------------------------------------------------------------

describe("UNIT-01: Follow-Up Note Validator Logic (BR-04 / AC-02)", () => {
  describe("When isFollowUpRequired === true", () => {
    it("fails on undefined or null followUpNote", () => {
      const resUndefined = validateFollowUpNote(true, undefined);
      expect(resUndefined.isValid).toBe(false);
      expect(resUndefined.message).toBe(
        "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
      );

      const resNull = validateFollowUpNote(true, null);
      expect(resNull.isValid).toBe(false);
      expect(resNull.message).toBe(
        "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
      );
    });

    it("fails on empty or whitespace-only strings (e.g., '', '   ')", () => {
      const resEmpty = validateFollowUpNote(true, "");
      expect(resEmpty.isValid).toBe(false);

      const resSpaces = validateFollowUpNote(true, "   ");
      expect(resSpaces.isValid).toBe(false);

      const resTabs = validateFollowUpNote(true, "\t  \n ");
      expect(resTabs.isValid).toBe(false);
    });

    it("fails on fewer than 3 non-whitespace characters (e.g., 'a', 'ab', '  ab  ')", () => {
      expect(validateFollowUpNote(true, "a").isValid).toBe(false);
      expect(validateFollowUpNote(true, "ab").isValid).toBe(false);
      expect(validateFollowUpNote(true, " a ").isValid).toBe(false);
      expect(validateFollowUpNote(true, "  ab  ").isValid).toBe(false);
      expect(validateFollowUpNote(true, " x ").isValid).toBe(false);
    });

    it("passes on exactly 3 non-whitespace characters (e.g., 'abc', '  abc  ')", () => {
      const resExact3 = validateFollowUpNote(true, "abc");
      expect(resExact3.isValid).toBe(true);
      expect(resExact3.message).toBeUndefined();

      const resPadded3 = validateFollowUpNote(true, "  abc  ");
      expect(resPadded3.isValid).toBe(true);
      expect(resPadded3.message).toBeUndefined();
    });

    it("passes on more than 3 non-whitespace characters", () => {
      const res = validateFollowUpNote(true, "Follow up with vendor tomorrow morning");
      expect(res.isValid).toBe(true);
      expect(res.message).toBeUndefined();
    });

    it("fails when followUpNote exceeds 2000 characters", () => {
      const oversized = "a".repeat(2001);
      const res = validateFollowUpNote(true, oversized);
      expect(res.isValid).toBe(false);
      expect(res.message).toBe("Follow-up note cannot exceed 2000 characters");
    });

    it("passes when followUpNote is exactly 2000 characters", () => {
      const maxLen = "a".repeat(2000);
      const res = validateFollowUpNote(true, maxLen);
      expect(res.isValid).toBe(true);
    });
  });

  describe("When isFollowUpRequired === false", () => {
    it("permits null or undefined followUpNote", () => {
      expect(validateFollowUpNote(false, undefined).isValid).toBe(true);
      expect(validateFollowUpNote(false, null).isValid).toBe(true);
    });

    it("permits empty string or optional note when follow-up is not required", () => {
      expect(validateFollowUpNote(false, "").isValid).toBe(true);
      expect(validateFollowUpNote(false, "Optional note even though not required").isValid).toBe(true);
    });

    it("fails if followUpNote is a non-string type (e.g. number or object)", () => {
      expect(validateFollowUpNote(false, 12345 as unknown as string).isValid).toBe(false);
      expect(validateFollowUpNote(false, { text: "note" } as unknown as string).isValid).toBe(false);
    });

    it("fails if provided followUpNote exceeds 2000 characters even when follow-up is false", () => {
      const oversized = "b".repeat(2001);
      const res = validateFollowUpNote(false, oversized);
      expect(res.isValid).toBe(false);
      expect(res.message).toBe("Follow-up note cannot exceed 2000 characters");
    });
  });
});
