// ---------------------------------------------------------------------------
// Lab 3 — Issue 17: Administrator Safety Guards
// Pure validation logic for self-deactivation and last active admin protection.
// Covered by UNIT-05 (admin-guard.unit.test.ts).
// ---------------------------------------------------------------------------

export interface GuardResult {
  allowed: boolean;
  error?: string;
  code?: string;
}

/**
 * Checks whether an administrator is attempting to deactivate their own account.
 * An administrator can edit their own profile (name, email, department, role) while active,
 * but cannot set isActive = false on their own account.
 *
 * @param currentAdminId - ID of the authenticated administrator making the request
 * @param targetUserId - ID of the user account being modified
 * @param newIsActive - The desired active status in the update payload
 */
export function checkSelfDeactivation(
  currentAdminId: number,
  targetUserId: number,
  newIsActive: boolean | undefined
): GuardResult {
  if (currentAdminId === targetUserId && newIsActive === false) {
    return {
      allowed: false,
      error: "Administrators cannot deactivate their own account.",
      code: "SELF_DEACTIVATION_BLOCKED",
    };
  }

  return { allowed: true };
}

/**
 * Checks whether an update would deactivate or demote the last remaining active administrator.
 * If the target user is currently an active administrator and the update either:
 *   1) sets isActive to false, OR
 *   2) changes role to a non-ADMINISTRATOR role (e.g. REQUESTER, IT_STAFF),
 * and there is only 1 active administrator remaining in the entire system,
 * the operation is strictly forbidden to preserve system governance.
 *
 * @param targetUser - Current state of the user account in database
 * @param updateData - Desired changes from the update request
 * @param activeAdminCount - Total count of active administrators currently in the database
 */
export function checkLastActiveAdminProtection(
  targetUser: { role: string; isActive: boolean },
  updateData: { role?: string; isActive?: boolean },
  activeAdminCount: number
): GuardResult {
  // If target user is not currently an active administrator, this rule does not apply
  if (targetUser.role !== "ADMINISTRATOR" || !targetUser.isActive) {
    return { allowed: true };
  }

  const isBeingDeactivated = updateData.isActive === false;
  const isBeingDemoted = updateData.role !== undefined && updateData.role !== "ADMINISTRATOR";

  if ((isBeingDeactivated || isBeingDemoted) && activeAdminCount <= 1) {
    return {
      allowed: false,
      error: "Cannot deactivate or demote the last remaining active administrator.",
      code: "LAST_ADMIN_PROTECTED",
    };
  }

  return { allowed: true };
}
