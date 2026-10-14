import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged } from "../middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 21: Actions Taken REST API Endpoints
// Endpoints:
// - GET   /api/tickets/:id/actions
// - POST  /api/tickets/:id/actions
// - PATCH /api/tickets/:id/actions/:actionId
// Invariants:
// - Deletion prohibited (No DELETE route; returns 404 / unhandled)
// - Performer attribution auto-set from req.user.id
// - Rejects CANCELLED tickets (400 TICKET_CANCELLED)
// - Scoping check: actionId must belong to ticket :id (404 NOT_FOUND)
// ---------------------------------------------------------------------------

export const actionsTakenRouter = Router({ mergeParams: true });

actionsTakenRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * Helper to validate ISO-8601 UTC date string format and parseability.
 * Matches YYYY-MM-DDTHH:mm:ss(.sss)?Z per RFC 3339 / ISO 8601 UTC contract.
 */
function isValidIsoUtcDateString(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
  if (!isoUtcPattern.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

/**
 * GET /api/tickets/:id/actions
 * Retrieve chronological list of Actions Taken for a ticket.
 * Permitted: Ticket Requester Owner, IT Staff, Administrator.
 * Forbidden: Non-owner Requesters (403 FORBIDDEN).
 */
actionsTakenRouter.get("/:id/actions", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId", code: "VALIDATION_ERROR", details: [] });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true, currentStatus: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    // Tenant Isolation check for Requesters
    if (user.role === "REQUESTER" && ticket.requesterId !== user.id) {
      return res.status(403).json({
        error: "You do not have permission to view actions on this ticket",
        code: "FORBIDDEN",
        details: [],
      });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: [{ actionDateTime: "asc" }, { id: "asc" }],
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json(actions);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR", details: [] });
  }
});

/**
 * POST /api/tickets/:id/actions
 * Create an Action Taken record.
 * Permitted: IT Staff, Administrator.
 * Forbidden: Requester (403 FORBIDDEN).
 */
actionsTakenRouter.post("/:id/actions", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);

    // Role verification: IT_STAFF and ADMINISTRATOR permitted (AC-01)
    if (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Only IT Staff and Administrators may record Actions Taken",
        code: "FORBIDDEN",
        details: [],
      });
    }

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId", code: "VALIDATION_ERROR", details: [] });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, currentStatus: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    // Terminal CANCELLED check (AC-23, API-14a)
    if (ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot add Actions Taken to a cancelled ticket",
        code: "TICKET_CANCELLED",
        details: [],
      });
    }

    const {
      actionDescription,
      result,
      actionDateTime,
      isFollowUpRequired,
      followUpNote,
      attachmentNotes,
    } = req.body;

    const details: { field: string; message: string }[] = [];

    if (isFollowUpRequired !== undefined && typeof isFollowUpRequired !== "boolean") {
      details.push({
        field: "isFollowUpRequired",
        message: "isFollowUpRequired must be a boolean",
      });
    }

    if (
      typeof actionDescription !== "string" ||
      actionDescription.trim().length < 5 ||
      actionDescription.trim().length > 2000
    ) {
      details.push({
        field: "actionDescription",
        message: "Action description must be between 5 and 2000 characters",
      });
    }

    if (typeof result !== "string" || result.trim().length < 3 || result.trim().length > 2000) {
      details.push({
        field: "result",
        message: "Result must be between 3 and 2000 characters",
      });
    }

    let parsedDateTime = new Date();
    if (actionDateTime !== undefined) {
      if (actionDateTime === null || !isValidIsoUtcDateString(actionDateTime)) {
        details.push({
          field: "actionDateTime",
          message: "Action date/time must be a valid ISO-8601 date string",
        });
      } else {
        parsedDateTime = new Date(actionDateTime);
      }
    }

    if (followUpNote !== undefined && followUpNote !== null) {
      if (typeof followUpNote !== "string") {
        details.push({
          field: "followUpNote",
          message: "Follow-up note must be a string or null",
        });
      } else if (followUpNote.trim().length > 2000) {
        details.push({
          field: "followUpNote",
          message: "Follow-up note cannot exceed 2000 characters",
        });
      }
    }

    const followUpRequiredBool = isFollowUpRequired === true;
    if (followUpRequiredBool) {
      if (typeof followUpNote !== "string" || followUpNote.trim().length < 3) {
        if (!details.some((d) => d.field === "followUpNote")) {
          details.push({
            field: "followUpNote",
            message: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed",
          });
        }
      }
    }

    if (attachmentNotes !== undefined && attachmentNotes !== null) {
      if (typeof attachmentNotes !== "string" || attachmentNotes.length > 500) {
        details.push({
          field: "attachmentNotes",
          message: "Attachment notes cannot exceed 500 characters",
        });
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      });
    }

    const newAction = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime: parsedDateTime,
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        performedById: user.id, // Auto-set from session
        isFollowUpRequired: followUpRequiredBool,
        followUpNote: followUpRequiredBool && typeof followUpNote === "string" ? followUpNote.trim() : null,
        attachmentNotes: typeof attachmentNotes === "string" && attachmentNotes.trim() ? attachmentNotes.trim() : null,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json(newAction);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR", details: [] });
  }
});

/**
 * PATCH /api/tickets/:id/actions/:actionId
 * Update details of an existing Action Taken record.
 * Permitted: IT Staff, Administrator.
 * Forbidden: Requester (403 FORBIDDEN).
 */
actionsTakenRouter.patch("/:id/actions/:actionId", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = req.user!;
    const ticketId = Number(req.params.id);
    const actionId = Number(req.params.actionId);

    // Role verification: IT_STAFF and ADMINISTRATOR permitted (AC-06)
    if (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Only IT Staff and Administrators may modify Actions Taken",
        code: "FORBIDDEN",
        details: [],
      });
    }

    if (!ticketId || isNaN(ticketId) || !actionId || isNaN(actionId)) {
      return res.status(400).json({ error: "Invalid path parameters", code: "VALIDATION_ERROR", details: [] });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, currentStatus: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    // Terminal CANCELLED check (AC-23, API-14a)
    if (ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot modify Actions Taken on a cancelled ticket",
        code: "TICKET_CANCELLED",
        details: [],
      });
    }

    const existingAction = await prisma.actionTaken.findUnique({
      where: { id: actionId },
    });

    // Scoping Invariant: Must belong to :id (AC-06, API-06)
    if (!existingAction || existingAction.ticketId !== ticketId) {
      return res.status(404).json({
        error: "Action Taken record not found under this ticket",
        code: "NOT_FOUND",
        details: [],
      });
    }

    const {
      actionDescription,
      result,
      actionDateTime,
      isFollowUpRequired,
      followUpNote,
      attachmentNotes,
    } = req.body;

    const details: { field: string; message: string }[] = [];
    const updateData: any = {};

    if (isFollowUpRequired !== undefined && typeof isFollowUpRequired !== "boolean") {
      details.push({
        field: "isFollowUpRequired",
        message: "isFollowUpRequired must be a boolean",
      });
    }

    if (actionDescription !== undefined) {
      if (
        typeof actionDescription !== "string" ||
        actionDescription.trim().length < 5 ||
        actionDescription.trim().length > 2000
      ) {
        details.push({
          field: "actionDescription",
          message: "Action description must be between 5 and 2000 characters",
        });
      } else {
        updateData.actionDescription = actionDescription.trim();
      }
    }

    if (result !== undefined) {
      if (typeof result !== "string" || result.trim().length < 3 || result.trim().length > 2000) {
        details.push({
          field: "result",
          message: "Result must be between 3 and 2000 characters",
        });
      } else {
        updateData.result = result.trim();
      }
    }

    if (actionDateTime !== undefined) {
      if (actionDateTime === null || !isValidIsoUtcDateString(actionDateTime)) {
        details.push({
          field: "actionDateTime",
          message: "Action date/time must be a valid ISO-8601 date string",
        });
      } else {
        updateData.actionDateTime = new Date(actionDateTime);
      }
    }

    if (followUpNote !== undefined && followUpNote !== null) {
      if (typeof followUpNote !== "string") {
        details.push({
          field: "followUpNote",
          message: "Follow-up note must be a string or null",
        });
      } else if (followUpNote.trim().length > 2000) {
        details.push({
          field: "followUpNote",
          message: "Follow-up note cannot exceed 2000 characters",
        });
      }
    }

    // Evaluate effective follow-up state
    const effectiveFollowUpRequired =
      typeof isFollowUpRequired === "boolean" ? isFollowUpRequired : existingAction.isFollowUpRequired;

    const effectiveFollowUpNote =
      followUpNote !== undefined ? followUpNote : existingAction.followUpNote;

    if (effectiveFollowUpRequired) {
      if (typeof effectiveFollowUpNote !== "string" || effectiveFollowUpNote.trim().length < 3) {
        if (!details.some((d) => d.field === "followUpNote")) {
          details.push({
            field: "followUpNote",
            message: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed",
          });
        }
      } else if (effectiveFollowUpNote.trim().length > 2000) {
        if (!details.some((d) => d.field === "followUpNote")) {
          details.push({
            field: "followUpNote",
            message: "Follow-up note cannot exceed 2000 characters",
          });
        }
      } else {
        updateData.isFollowUpRequired = true;
        updateData.followUpNote = effectiveFollowUpNote.trim();
      }
    } else {
      if (isFollowUpRequired !== undefined) {
        updateData.isFollowUpRequired = false;
        updateData.followUpNote = null;
      } else if (followUpNote !== undefined) {
        if (followUpNote === null) {
          updateData.followUpNote = null;
        } else if (typeof followUpNote === "string") {
          updateData.followUpNote = followUpNote.trim();
        }
      }
    }

    if (attachmentNotes !== undefined) {
      if (attachmentNotes !== null && (typeof attachmentNotes !== "string" || attachmentNotes.length > 500)) {
        details.push({
          field: "attachmentNotes",
          message: "Attachment notes cannot exceed 500 characters",
        });
      } else {
        updateData.attachmentNotes = attachmentNotes ? attachmentNotes.trim() : null;
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      });
    }

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: updateData,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR", details: [] });
  }
});
