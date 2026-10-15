import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged } from "../middleware/auth.js";

export const requesterOpsRouter = Router();

// Requester operations require authentication, active account, and changed password
requesterOpsRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * PATCH /api/requester/tickets/:id/resolve-indication
 * Allows ticket requester to signal "Problem Appears Resolved" without modifying currentStatus (WF-02, AC-08, BR-09).
 * Access: Authenticated ticket requester owner only.
 * Forbidden: Non-owners, IT Staff, and Administrators (403 FORBIDDEN).
 * Terminal CANCELLED check: Rejects with 400 Bad Request (TICKET_CANCELLED, API-14b, AC-23).
 */
requesterOpsRouter.patch("/tickets/:id/resolve-indication", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId", code: "VALIDATION_ERROR", details: [] });
    }

    // Role check: REQUESTER only (BR-08, BR-09, WF-01, WF-02)
    if (user.role !== "REQUESTER") {
      return res.status(403).json({
        error: "Access denied. Only the ticket requester can indicate resolution",
        code: "FORBIDDEN",
        details: [],
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true, currentStatus: true, problemAppearsResolved: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    // Ownership check: must be ticket requester
    if (ticket.requesterId !== user.id) {
      return res.status(403).json({
        error: "Access denied. Only the ticket requester can indicate resolution",
        code: "FORBIDDEN",
        details: [],
      });
    }

    // Terminal CANCELLED check (BR-11, AC-23, API-14b)
    if (ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot submit resolution indication on a cancelled ticket",
        code: "TICKET_CANCELLED",
        details: [],
      });
    }

    // Update problemAppearsResolved flag while strictly preserving currentStatus (WF-02, AC-08, BR-09)
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        problemAppearsResolved: true,
      },
      select: {
        problemAppearsResolved: true,
        currentStatus: true,
      },
    });

    return res.status(200).json({
      message: "Problem indicated as resolved. IT Staff will review and formally resolve the ticket",
      problemAppearsResolved: updated.problemAppearsResolved,
      currentStatus: updated.currentStatus,
    });
  } catch (error) {
    console.error("Failed to mark problem appears resolved:", error);
    return res.status(500).json({ error: "Failed to update problem resolution indication" });
  }
});

/**
 * GET /api/requester/dashboard
 * Computes authoritative requester dashboard metrics and retrieves up to 5 recent tickets (BR-12, BR-13, AC-12, API-09).
 * Access: Authenticated REQUESTER only.
 * Forbidden: Non-requester users (IT Staff and Administrator receive 403 FORBIDDEN).
 */
requesterOpsRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== "REQUESTER") {
      return res.status(403).json({
        error: "Access denied. Only Requesters can access the Requester Dashboard",
        code: "FORBIDDEN",
        details: [],
      });
    }

    const prisma = getPrisma();

    const [
      openTickets,
      inProgressTickets,
      waitingForRequesterTickets,
      resolvedTickets,
      closedTickets,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterId: user.id,
          currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: user.id,
          currentStatus: "IN_PROGRESS",
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: user.id,
          currentStatus: "WAITING_FOR_REQUESTER",
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: user.id,
          currentStatus: "RESOLVED",
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: user.id,
          currentStatus: "CLOSED",
        },
      }),
      prisma.ticket.findMany({
        where: { requesterId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          currentStatus: true,
          requestedPriority: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedAt: true,
        },
      }),
    ]);

    return res.status(200).json({
      metrics: {
        openTickets,
        inProgressTickets,
        waitingForRequesterTickets,
        resolvedTickets,
        closedTickets,
      },
      recentTickets,
    });
  } catch (error) {
    console.error("Failed to compute requester dashboard metrics:", error);
    return res.status(500).json({ error: "Failed to fetch requester dashboard metrics" });
  }
});

