import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { generateToken, requireAuth } from "../middleware/auth.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

export const authRouter = Router();

// ---------------------------------------------------------------------------
// 2.1 Login
// POST /api/auth/login
// ---------------------------------------------------------------------------
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const details: { field: string; message: string }[] = [];

    if (!email || typeof email !== "string" || !email.trim()) {
      details.push({ field: "email", message: "Email is required" });
    }
    if (!password || typeof password !== "string") {
      details.push({ field: "password", message: "Password is required" });
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details,
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const prisma = getPrisma();

    // Look up user by email
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: trimmedEmail, mode: "insensitive" },
      },
    });

    // Safe 401 response: generic error prevents account discovery (AC-05)
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Failed to process login request",
      code: "INTERNAL_ERROR",
    });
  }
});

// ---------------------------------------------------------------------------
// 2.2 Logout
// POST /api/auth/logout
// ---------------------------------------------------------------------------
authRouter.post("/logout", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { tokenVersion: { increment: 1 } },
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      error: "Failed to process logout request",
      code: "INTERNAL_ERROR",
    });
  }
});

// ---------------------------------------------------------------------------
// 2.3 Current User Profile
// GET /api/auth/me
// ---------------------------------------------------------------------------
authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  return res.status(200).json({
    user: {
      id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
      department: req.user!.department,
      mustChangePassword: req.user!.mustChangePassword,
      isActive: req.user!.isActive,
    },
  });
});

// ---------------------------------------------------------------------------
// 2.4 Change Password
// POST /api/auth/change-password
// ---------------------------------------------------------------------------
authRouter.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New password and confirm password do not match",
        code: "PASSWORD_POLICY_ERROR",
      });
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: "New password does not meet security requirements",
        code: "PASSWORD_POLICY_ERROR",
        details: policy.errors,
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, req.user!.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const prisma = getPrisma();

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
      mustChangePassword: false,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      error: "Failed to change password",
      code: "INTERNAL_ERROR",
    });
  }
});
