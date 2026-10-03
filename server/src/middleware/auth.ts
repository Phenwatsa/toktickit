import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { User, Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";

export const JWT_SECRET = process.env.JWT_SECRET || "toktickit-jwt-secret-key-development";

export interface JwtTokenPayload {
  userId: number;
  email: string;
  role: Role;
  tokenVersion: number;
  mustChangePassword: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Signs a new JWT token for an authenticated user.
 */
export function generateToken(user: Pick<User, "id" | "email" | "role" | "tokenVersion" | "mustChangePassword">): string {
  const payload: JwtTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    mustChangePassword: user.mustChangePassword,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Compares tokenVersion in JWT payload against active user record in database.
 * Returns true if valid, false if revoked/stale.
 * Covered by UNIT-06.
 */
export function compareTokenVersion(tokenVersionInJwt: number, activeTokenVersionInDb: number): boolean {
  return typeof tokenVersionInJwt === "number" &&
         typeof activeTokenVersionInDb === "number" &&
         tokenVersionInJwt === activeTokenVersionInDb;
}

/**
 * Middleware: requireAuth
 * Verifies Bearer JWT, validates account active state, and checks live tokenVersion.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const token = authHeader.substring("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    let decoded: JwtTokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
    } catch {
      return res.status(401).json({
        error: "Session expired or invalid",
        code: "UNAUTHORIZED",
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Session expired or invalid",
        code: "UNAUTHORIZED",
      });
    }

    if (!compareTokenVersion(decoded.tokenVersion, user.tokenVersion)) {
      return res.status(401).json({
        error: "Session expired or invalid",
        code: "UNAUTHORIZED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(500).json({
      error: "Internal authentication error",
      code: "INTERNAL_ERROR",
    });
  }
}

/**
 * Middleware: requireActive
 * Ensures the authenticated user account is active.
 */
export function requireActive(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isActive) {
    return res.status(401).json({
      error: "Account is inactive",
      code: "INACTIVE_ACCOUNT",
    });
  }
  next();
}

/**
 * Middleware factory: requireRole
 * Enforces server-side authorization based on user role.
 * Covered by UNIT-03.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      });
    }

    next();
  };
}

/**
 * Middleware: requirePasswordChanged
 * Blocks access to operational endpoints if mustChangePassword is true.
 */
export function requirePasswordChanged(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      error: "Password change required before accessing application features.",
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  }
  next();
}
