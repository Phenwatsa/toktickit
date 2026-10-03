import { describe, it, expect } from "vitest";
import {
  checkSelfDeactivation,
  checkLastActiveAdminProtection,
} from "../../../src/utils/adminGuard.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 17: Administrator Safety Guards Unit Tests
// Covers: UNIT-05 (Self-deactivation guard & Last active administrator guard)
// ---------------------------------------------------------------------------

describe("Administrator Safety Guards (admin-guard.unit.test.ts - UNIT-05)", () => {
  describe("checkSelfDeactivation", () => {
    it("rejects attempt by an administrator to deactivate their own account", () => {
      const result = checkSelfDeactivation(1, 1, false);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("SELF_DEACTIVATION_BLOCKED");
      expect(result.error).toBe("Administrators cannot deactivate their own account.");
    });

    it("allows an administrator to update their own account when isActive remains true or undefined", () => {
      expect(checkSelfDeactivation(1, 1, true).allowed).toBe(true);
      expect(checkSelfDeactivation(1, 1, undefined).allowed).toBe(true);
    });

    it("allows an administrator to deactivate another user's account", () => {
      const result = checkSelfDeactivation(1, 2, false);
      expect(result.allowed).toBe(true);
    });
  });

  describe("checkLastActiveAdminProtection", () => {
    it("blocks deactivation of the last remaining active administrator (activeAdminCount = 1)", () => {
      const targetAdmin = { role: "ADMINISTRATOR", isActive: true };
      const result = checkLastActiveAdminProtection(targetAdmin, { isActive: false }, 1);

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("LAST_ADMIN_PROTECTED");
      expect(result.error).toBe(
        "Cannot deactivate or demote the last remaining active administrator."
      );
    });

    it("blocks demoting the last remaining active administrator to another role (activeAdminCount = 1)", () => {
      const targetAdmin = { role: "ADMINISTRATOR", isActive: true };

      const demoteToStaff = checkLastActiveAdminProtection(targetAdmin, { role: "IT_STAFF" }, 1);
      expect(demoteToStaff.allowed).toBe(false);
      expect(demoteToStaff.code).toBe("LAST_ADMIN_PROTECTED");

      const demoteToRequester = checkLastActiveAdminProtection(
        targetAdmin,
        { role: "REQUESTER" },
        1
      );
      expect(demoteToRequester.allowed).toBe(false);
      expect(demoteToRequester.code).toBe("LAST_ADMIN_PROTECTED");
    });

    it("allows deactivating an administrator when multiple active administrators exist (activeAdminCount > 1)", () => {
      const targetAdmin = { role: "ADMINISTRATOR", isActive: true };
      const result = checkLastActiveAdminProtection(targetAdmin, { isActive: false }, 2);

      expect(result.allowed).toBe(true);
      expect(result.code).toBeUndefined();
    });

    it("allows demoting an administrator when multiple active administrators exist (activeAdminCount > 1)", () => {
      const targetAdmin = { role: "ADMINISTRATOR", isActive: true };
      const result = checkLastActiveAdminProtection(targetAdmin, { role: "IT_STAFF" }, 3);

      expect(result.allowed).toBe(true);
      expect(result.code).toBeUndefined();
    });

    it("allows updating other fields (name, email) without deactivation or demotion even if last admin", () => {
      const targetAdmin = { role: "ADMINISTRATOR", isActive: true };
      const result = checkLastActiveAdminProtection(
        targetAdmin,
        { role: "ADMINISTRATOR", isActive: true },
        1
      );

      expect(result.allowed).toBe(true);
    });

    it("does not block operations on users who are not active administrators (e.g. IT_STAFF or REQUESTER)", () => {
      const staffUser = { role: "IT_STAFF", isActive: true };
      expect(checkLastActiveAdminProtection(staffUser, { isActive: false }, 1).allowed).toBe(true);
      expect(checkLastActiveAdminProtection(staffUser, { role: "REQUESTER" }, 1).allowed).toBe(true);

      const inactiveAdmin = { role: "ADMINISTRATOR", isActive: false };
      expect(checkLastActiveAdminProtection(inactiveAdmin, { role: "REQUESTER" }, 1).allowed).toBe(
        true
      );
    });
  });
});
