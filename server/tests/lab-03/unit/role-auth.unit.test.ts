import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireRole } from "../../../src/middleware/auth.js";
import type { Role, User } from "@prisma/client";

// ---------------------------------------------------------------------------
// UNIT-03: Role-Based Authorization Middleware Unit Tests (AC-15)
// ---------------------------------------------------------------------------

describe("UNIT-03: Role-Based Authorization Middleware Unit Tests", () => {
  const createMockReqRes = (user?: Partial<User>) => {
    const req = {
      user: user as User | undefined,
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    return { req, res, next };
  };

  it("calls next() when user has the exact permitted role", () => {
    const middleware = requireRole("IT_STAFF");
    const { req, res, next } = createMockReqRes({ role: "IT_STAFF" as Role });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when user role matches one of multiple permitted roles", () => {
    const middleware = requireRole("IT_STAFF", "ADMINISTRATOR");
    const { req, res, next } = createMockReqRes({ role: "ADMINISTRATOR" as Role });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns HTTP 403 Forbidden when user role is not permitted", () => {
    const middleware = requireRole("IT_STAFF");
    const { req, res, next } = createMockReqRes({ role: "REQUESTER" as Role });

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      })
    );
  });

  it("returns HTTP 403 Forbidden when Administrator attempts staff-only operation", () => {
    const middleware = requireRole("IT_STAFF");
    const { req, res, next } = createMockReqRes({ role: "ADMINISTRATOR" as Role });

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "FORBIDDEN",
      })
    );
  });

  it("returns HTTP 401 Unauthorized when req.user is undefined", () => {
    const middleware = requireRole("IT_STAFF");
    const { req, res, next } = createMockReqRes(undefined);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "UNAUTHORIZED",
      })
    );
  });
});
