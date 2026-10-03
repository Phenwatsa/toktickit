import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged } from "../middleware/auth.js";

export const commentsNotesRouter = Router({ mergeParams: true });

// All comment and note operations require authentication, active account, and changed password
commentsNotesRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * Helper to validate comment/note content (BR-09: min 2, max 2000 non-whitespace chars).
 */
function validateTextContent(content: unknown): { valid: boolean; trimmed: string; error?: string } {
  if (typeof content !== "string") {
    return { valid: false, trimmed: "", error: "Content must be a string." };
  }
  const trimmed = content.trim();
  if (!trimmed || trimmed.length < 2) {
    return { valid: false, trimmed: "", error: "Content cannot be empty and must be at least 2 characters." };
  }
  if (trimmed.length > 2000) {
    return { valid: false, trimmed: "", error: "Content exceeds maximum length of 2000 characters." };
  }
  return { valid: true, trimmed };
}

/**
 * GET /api/tickets/:id/comments
 * Retrieve Public Comments for a ticket.
 * Permitted: Ticket Requester Owner and IT Staff.
 * Forbidden: Administrators and non-owner Requesters.
 */
commentsNotesRouter.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    // Role check: Admin receives 403 Forbidden
    if (user.role === "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Administrators cannot view ticket comments.",
        code: "FORBIDDEN",
      });
    }

    // Ownership check: Requester must be ticket owner
    if (user.role === "REQUESTER" && ticket.requesterId !== user.id) {
      return res.status(403).json({
        error: "Access denied. You do not have permission to view comments on this ticket.",
        code: "FORBIDDEN",
      });
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json(comments);
  } catch (error) {
    console.error("Failed to retrieve comments:", error);
    return res.status(500).json({ error: "Failed to retrieve public comments" });
  }
});

/**
 * POST /api/tickets/:id/comments
 * Append a Public Comment to a ticket.
 * Permitted: Ticket Requester Owner and IT Staff.
 */
commentsNotesRouter.post("/:id/comments", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const validation = validateTextContent(req.body?.content);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || "Comment content cannot be empty",
        code: "VALIDATION_ERROR",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    // Role check: Administrator cannot post comments
    if (user.role === "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Administrators cannot post comments.",
        code: "FORBIDDEN",
      });
    }

    // Ownership check: Requester must be ticket owner
    if (user.role === "REQUESTER" && ticket.requesterId !== user.id) {
      return res.status(403).json({
        error: "Access denied. You do not have permission to comment on this ticket.",
        code: "FORBIDDEN",
      });
    }

    const newComment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: user.id,
        content: validation.trimmed,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("Failed to post public comment:", error);
    return res.status(500).json({ error: "Failed to post public comment" });
  }
});

/**
 * GET /api/tickets/:id/notes
 * Retrieve Internal Notes for a ticket.
 * Permitted: IT_STAFF ONLY.
 * Forbidden: REQUESTER and ADMINISTRATOR (zero note data leaked).
 */
commentsNotesRouter.get("/:id/notes", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    // Strict role check: IT_STAFF only
    if (user.role !== "IT_STAFF") {
      return res.status(403).json({
        error: "Access denied. Internal notes are restricted to IT staff.",
        code: "FORBIDDEN",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json(notes);
  } catch (error) {
    console.error("Failed to retrieve internal notes:", error);
    return res.status(500).json({ error: "Failed to retrieve internal notes" });
  }
});

/**
 * POST /api/tickets/:id/notes
 * Append an Internal Note to a ticket.
 * Permitted: IT_STAFF ONLY.
 */
commentsNotesRouter.post("/:id/notes", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    // Strict role check: IT_STAFF only
    if (user.role !== "IT_STAFF") {
      return res.status(403).json({
        error: "Access denied. Internal notes are restricted to IT staff.",
        code: "FORBIDDEN",
      });
    }

    const validation = validateTextContent(req.body?.content);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || "Note content cannot be empty",
        code: "VALIDATION_ERROR",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    const newNote = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: user.id,
        content: validation.trimmed,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json(newNote);
  } catch (error) {
    console.error("Failed to post internal note:", error);
    return res.status(500).json({ error: "Failed to post internal note" });
  }
});
