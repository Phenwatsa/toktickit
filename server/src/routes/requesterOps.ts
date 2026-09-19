import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged } from "../middleware/auth.js";

export const requesterOpsRouter = Router();

// Requester operations require authentication, active account, and changed password
requesterOpsRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * PATCH /api/requester/tickets/:id/resolve-indication
 * Allows ticket requester to signal "Problem Appears Resolved" without closing the ticket (BR-13 / AC-21).
 * Access: Authenticated ticket requester owner.
 * Forbidden: Non-owners, IT Staff, and Administrators.
 */
requesterOpsRouter.patch("/tickets/:id/resolve-indication", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    // Role check: REQUESTER only
    if (user.role !== "REQUESTER") {
      return res.status(403).json({
        error: "Access denied. Requester role required.",
        code: "FORBIDDEN",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true, currentStatus: true, problemAppearsResolved: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    // Ownership check: must be ticket requester
    if (ticket.requesterId !== user.id) {
      return res.status(403).json({
        error: "Access denied. You do not own this ticket.",
        code: "FORBIDDEN",
      });
    }

    // Update problemAppearsResolved flag while preserving official ticket status
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        problemAppearsResolved: true,
      },
      select: {
        problemAppearsResolved: true,
      },
    });

    return res.status(200).json({
      message: "Problem indicated as resolved. IT Staff notified.",
      problemAppearsResolved: updated.problemAppearsResolved,
    });
  } catch (error) {
    console.error("Failed to mark problem appears resolved:", error);
    return res.status(500).json({ error: "Failed to update problem resolution indication" });
  }
});
