import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { checkSelfDeactivation, checkLastActiveAdminProtection } from "../utils/adminGuard.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 17: Administrator User Management API Router
// Endpoints:
// - GET /api/admin/users: List users with search & role filter
// - POST /api/admin/users: Create user with single role and initial password
// - PATCH /api/admin/users/:id: Edit user details / active status
// - POST /api/admin/users/:id/reset-password: Set new initial password
//
// Safety rules enforced:
// - Access restricted strictly to ADMINISTRATOR role (403 Forbidden for others)
// - Duplicate email rejection (409 Conflict)
// - Self-deactivation guard (400 Bad Request, SELF_DEACTIVATION_BLOCKED)
// - Last active admin guard (400 Bad Request, LAST_ADMIN_PROTECTED)
// ---------------------------------------------------------------------------

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(requireAuth, requirePasswordChanged, requireRole("ADMINISTRATOR"));

/**
 * GET /api/admin/users
 * Lists users matching optional search query and role filter.
 */
adminRouter.get("/", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { search, role } = req.query;

    const where: any = {};

    // Search by name or email (case-insensitive)
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role && typeof role === "string" && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return res.status(500).json({ error: "Failed to retrieve user accounts." });
  }
});

/**
 * POST /api/admin/users
 * Creates a new user with single role, hashed initial password, and mustChangePassword = true.
 */
adminRouter.post("/", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { name, email, role, department, isActive = true, initialPassword } = req.body;

    // Field validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name is required.", code: "VALIDATION_ERROR" });
    }
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ error: "Email is required.", code: "VALIDATION_ERROR" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email format.", code: "VALIDATION_ERROR" });
    }
    if (!role || !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      return res.status(400).json({ error: "Valid role (REQUESTER, IT_STAFF, ADMINISTRATOR) is required.", code: "VALIDATION_ERROR" });
    }
    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({ error: "Initial password is required.", code: "VALIDATION_ERROR" });
    }

    // Password policy check
    const passwordValidation = validatePasswordPolicy(initialPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "Initial password does not meet complexity requirements.",
        code: "VALIDATION_ERROR",
        details: passwordValidation.errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(409).json({
        error: "A user with this email address already exists.",
        code: "DUPLICATE_EMAIL",
      });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role as Role,
        department: department && typeof department === "string" ? department.trim() : null,
        isActive: Boolean(isActive),
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return res.status(500).json({ error: "Failed to create user account." });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Updates user name, email, department, role, or active status.
 * Enforces safety rules:
 * - Duplicate email (409 Conflict)
 * - Self-deactivation guard (400 Bad Request, SELF_DEACTIVATION_BLOCKED)
 * - Last active admin guard (400 Bad Request, LAST_ADMIN_PROTECTED)
 */
adminRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentAdmin = req.user!;
    const targetUserId = parseInt(req.params.id, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid user ID.", code: "INVALID_USER_ID" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
    }

    const { name, email, department, role, isActive } = req.body;

    // 1. Self-Deactivation Guard
    const selfDeactivationCheck = checkSelfDeactivation(currentAdmin.id, targetUserId, isActive);
    if (!selfDeactivationCheck.allowed) {
      return res.status(400).json({
        error: selfDeactivationCheck.error,
        code: selfDeactivationCheck.code,
      });
    }

    // 2. Last Active Admin Guard
    if (targetUser.role === "ADMINISTRATOR" && targetUser.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMINISTRATOR", isActive: true },
      });
      const lastAdminCheck = checkLastActiveAdminProtection(
        targetUser,
        { role, isActive },
        activeAdminCount
      );
      if (!lastAdminCheck.allowed) {
        return res.status(400).json({
          error: lastAdminCheck.error,
          code: lastAdminCheck.code,
        });
      }
    }

    // 3. Duplicate Email Check
    let normalizedEmail: string | undefined = undefined;
    if (email && typeof email === "string" && email.trim() !== "") {
      normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const duplicate = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            NOT: { id: targetUserId },
          },
        });
        if (duplicate) {
          return res.status(409).json({
            error: "A user with this email address already exists.",
            code: "DUPLICATE_EMAIL",
          });
        }
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined && typeof name === "string") updateData.name = name.trim();
    if (normalizedEmail !== undefined) updateData.email = normalizedEmail;
    if (department !== undefined) {
      updateData.department = typeof department === "string" && department.trim() !== "" ? department.trim() : null;
    }
    if (role !== undefined && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      updateData.role = role as Role;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      // If deactivating user, invalidate their active token sessions
      if (!Boolean(isActive)) {
        updateData.tokenVersion = { increment: 1 };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("PATCH /api/admin/users/:id error:", error);
    return res.status(500).json({ error: "Failed to update user account." });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Sets a new initial password, marks mustChangePassword = true, and increments tokenVersion.
 */
adminRouter.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const targetUserId = parseInt(req.params.id, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid user ID.", code: "INVALID_USER_ID" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
    }

    const { newInitialPassword } = req.body;

    if (!newInitialPassword || typeof newInitialPassword !== "string") {
      return res.status(400).json({
        error: "New initial password is required.",
        code: "VALIDATION_ERROR",
      });
    }

    const validation = validatePasswordPolicy(newInitialPassword);
    if (!validation.valid) {
      return res.status(400).json({
        error: "New initial password does not meet complexity requirements.",
        code: "INVALID_PASSWORD_COMPLEXITY",
        details: validation.errors,
      });
    }

    const passwordHash = await bcrypt.hash(newInitialPassword, 10);

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePassword: true,
        tokenVersion: { increment: 1 },
      },
    });

    return res.status(200).json({
      message: "Initial password reset successfully. User must change password at next login.",
      mustChangePassword: true,
    });
  } catch (error) {
    console.error("POST /api/admin/users/:id/reset-password error:", error);
    return res.status(500).json({ error: "Failed to reset password." });
  }
});
