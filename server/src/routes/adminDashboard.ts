import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged } from "../middleware/auth.js";

export const adminDashboardRouter = Router();

// Base middleware for administrator dashboard endpoint
adminDashboardRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * GET /api/admin/dashboard
 * Computes authoritative administrator dashboard operational summaries, user statistics,
 * and recent system tickets (BR-12, BR-17, AC-19a, API-12).
 * Access: Authenticated ADMINISTRATOR only.
 * Forbidden: Requesters and IT Staff receive 403 FORBIDDEN (AC-19b, API-13).
 */
adminDashboardRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Only Administrators can access the Administrator Dashboard",
        code: "FORBIDDEN",
        details: [],
      });
    }

    const prisma = getPrisma();

    const [
      unassignedTickets,
      totalActiveTickets,
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleCounts,
      recentTickets,
    ] = await Promise.all([
      // Unassigned active tickets (currentStatus NOT IN ('CLOSED', 'CANCELLED') AND ticketOwnerId IS NULL)
      prisma.ticket.count({
        where: {
          ticketOwnerId: null,
          currentStatus: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      // Total active tickets (currentStatus NOT IN ('CLOSED', 'CANCELLED'))
      prisma.ticket.count({
        where: {
          currentStatus: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      // Total registered users
      prisma.user.count(),
      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),
      // Inactive users
      prisma.user.count({
        where: { isActive: false },
      }),
      // User counts by role
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      // Up to 5 most recently updated active queue tickets across the system
      prisma.ticket.findMany({
        where: {
          currentStatus: { notIn: ["CLOSED", "CANCELLED"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          currentStatus: true,
          requestedPriority: true,
          itPriority: true,
          ticketOwner: {
            select: {
              id: true,
              name: true,
            },
          },
          requester: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedAt: true,
        },
      }),
    ]);

    const roleMap: Record<string, number> = {};
    for (const item of roleCounts) {
      roleMap[item.role] = item._count.id;
    }

    return res.status(200).json({
      operational: {
        unassignedTickets,
        totalActiveTickets,
      },
      users: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        byRole: {
          requester: roleMap["REQUESTER"] || 0,
          itStaff: roleMap["IT_STAFF"] || 0,
          administrator: roleMap["ADMINISTRATOR"] || 0,
        },
      },
      recentTickets,
    });
  } catch (error) {
    console.error("Failed to compute admin dashboard metrics:", error);
    return res.status(500).json({ error: "Failed to fetch administrator dashboard metrics" });
  }
});
