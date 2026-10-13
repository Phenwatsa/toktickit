import { Router, Request, Response } from "express";
import { Prisma, TicketStatus, Priority } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { isValidStatusTransition, getInvalidTransitionMessage } from "../utils/statusTransition.js";
import { checkOptimisticConcurrency } from "../utils/concurrency.js";

export const staffRouter = Router();

// Base middleware for all staff operations
staffRouter.use(requireAuth, requireActive, requirePasswordChanged);

/**
 * GET /api/staff/members
 * Returns active IT staff members for assignment/filtering dropdowns.
 */
staffRouter.get("/members", requireRole("IT_STAFF", "ADMINISTRATOR"), async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const members = await prisma.user.findMany({
      where: {
        role: "IT_STAFF",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error("Failed to fetch staff members:", error);
    return res.status(500).json({ error: "Failed to fetch staff members" });
  }
});

/**
 * GET /api/staff/tickets
 * Retrieve paginated staff ticket queue with search, filters, and sorting.
 * Permitted: IT_STAFF, ADMINISTRATOR (API-10b supervisory oversight in Sprint 4).
 * Forbidden: REQUESTER (403 FORBIDDEN).
 */
staffRouter.get("/tickets", async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Requesters are strictly forbidden from staff queue
    if (user.role === "REQUESTER") {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      });
    }

    // In legacy Lab 3 test mode, Administrator was restricted
    if (user.role === "ADMINISTRATOR" && process.env.LAB3_TEST_MODE === "true") {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        code: "FORBIDDEN",
      });
    }

    const prisma = getPrisma();
    const whereConditions: Prisma.TicketWhereInput[] = [];

    // 1. Search keyword (ticketNumber or summary)
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const term = req.query.search.trim();
      whereConditions.push({
        OR: [
          { ticketNumber: { contains: term, mode: "insensitive" } },
          { summary: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    // 2. Status filter (single value or comma-separated list)
    if (
      typeof req.query.status === "string" &&
      req.query.status.trim() &&
      req.query.status.trim().toUpperCase() !== "ALL"
    ) {
      const validStatuses = Object.values(TicketStatus);
      const statuses = req.query.status
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => (validStatuses as string[]).includes(s)) as TicketStatus[];

      if (statuses.length === 1) {
        whereConditions.push({ currentStatus: statuses[0] });
      } else if (statuses.length > 1) {
        whereConditions.push({ currentStatus: { in: statuses } });
      }
    }

    // 3. Category filter
    if (req.query.categoryId) {
      const catId = Number(req.query.categoryId);
      if (!isNaN(catId) && catId > 0) {
        whereConditions.push({ categoryId: catId });
      }
    }

    // 4. Requested priority filter
    if (
      typeof req.query.requestedPriority === "string" &&
      req.query.requestedPriority.trim() &&
      req.query.requestedPriority.trim().toUpperCase() !== "ALL"
    ) {
      const p = req.query.requestedPriority.trim().toUpperCase() as Priority;
      if (Object.values(Priority).includes(p)) {
        whereConditions.push({ requestedPriority: p });
      }
    }

    // 5. IT priority filter
    if (
      typeof req.query.itPriority === "string" &&
      req.query.itPriority.trim() &&
      req.query.itPriority.trim().toUpperCase() !== "ALL"
    ) {
      const p = req.query.itPriority.trim().toUpperCase() as Priority;
      if (Object.values(Priority).includes(p)) {
        whereConditions.push({ itPriority: p });
      }
    }

    // 6. Owner filter (numeric staff ID or 'unassigned')
    if (
      typeof req.query.ownerId === "string" &&
      req.query.ownerId.trim() &&
      req.query.ownerId.trim().toLowerCase() !== "all"
    ) {
      const rawOwnerId = req.query.ownerId.trim();
      if (rawOwnerId.toLowerCase() === "unassigned") {
        whereConditions.push({ ticketOwnerId: null });
      } else {
        const ownerIdNum = Number(rawOwnerId);
        if (!isNaN(ownerIdNum) && ownerIdNum > 0) {
          whereConditions.push({ ticketOwnerId: ownerIdNum });
        }
      }
    }

    // 7. Sorting
    const allowedSortBy = ["createdAt", "updatedAt", "ticketNumber", "itPriority"];
    const sortBy =
      typeof req.query.sortBy === "string" && allowedSortBy.includes(req.query.sortBy)
        ? req.query.sortBy
        : "createdAt";
    const sortOrder =
      typeof req.query.sortOrder === "string" && req.query.sortOrder.toLowerCase() === "asc"
        ? "asc"
        : "desc";

    // 8. Pagination
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.TicketWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [totalRecords, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          category: {
            select: { id: true, name: true },
          },
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          requester: {
            select: { id: true, name: true, email: true },
          },
          ticketOwner: {
            select: { id: true, name: true, email: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    return res.status(200).json({
      data: tickets,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve staff ticket queue:", error);
    return res.status(500).json({ error: "Failed to retrieve staff ticket queue" });
  }
});

/**
 * GET /api/staff/tickets/:id
 * Retrieve single ticket detail with attachments, public comments, and internal notes.
 */
staffRouter.get("/tickets/:id", requireRole("IT_STAFF"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true, description: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        ticketOwner: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { isRemoved: false },
          orderBy: { id: "asc" },
        },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    const formattedAttachments = ticket.attachments.map((a) => ({
      id: a.id,
      fileName: a.originalName,
      originalName: a.originalName,
      fileSize: a.sizeBytes,
      sizeBytes: a.sizeBytes,
      mimeType: a.mimeType,
      url: `/uploads/${a.storedName}`,
      createdAt: a.createdAt,
    }));

    return res.status(200).json({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        summary: ticket.summary,
        description: ticket.description,
        category: ticket.category,
        relatedSystem: ticket.relatedSystem,
        requestedPriority: ticket.requestedPriority,
        itPriority: ticket.itPriority,
        currentStatus: ticket.currentStatus,
        problemAppearsResolved: ticket.problemAppearsResolved,
        requester: ticket.requester,
        ticketOwner: ticket.ticketOwner,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        attachments: formattedAttachments,
        publicComments: ticket.publicComments,
        internalNotes: ticket.internalNotes,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve staff ticket detail:", error);
    return res.status(500).json({ error: "Failed to retrieve staff ticket detail" });
  }
});

/**
 * PATCH /api/staff/tickets/:id/claim
 * Assign current authenticated IT Staff user as ticket owner.
 */
staffRouter.patch("/tickets/:id/claim", requireRole("IT_STAFF"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, currentStatus: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND" });
    }

    if (ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot claim a closed or cancelled ticket",
        code: "INVALID_STATE",
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ticketOwnerId: req.user!.id,
      },
      select: {
        ticketOwner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      message: "Ticket successfully claimed",
      ticketOwner: updated.ticketOwner,
    });
  } catch (error) {
    console.error("Failed to claim ticket:", error);
    return res.status(500).json({ error: "Failed to claim ticket" });
  }
});

/**
 * PATCH /api/staff/tickets/:id/assign
 * Reassign ticket owner to another active IT Staff user.
 * Authorized Roles: IT_STAFF strictly (BR-18, AC-25, API-15).
 * Rejects non-existent, inactive, or non-staff assignees (400 INVALID_OWNER).
 * Rejects reassignment on CLOSED or CANCELLED tickets (400 INVALID_STATE).
 */
staffRouter.patch("/tickets/:id/assign", requireRole("IT_STAFF"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId", code: "VALIDATION_ERROR", details: [] });
    }

    // 1. Fetch ticket first to evaluate existence and lifecycle gates
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, currentStatus: true, ticketOwnerId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    // 2. Closed / Cancelled Lifecycle Gates (BR-11, BR-18, AC-25, API-15)
    if (ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot reassign a closed or cancelled ticket",
        code: "INVALID_STATE",
        details: [],
      });
    }

    // 3. Validate newOwnerId input
    const { newOwnerId } = req.body || {};
    const targetUserId = Number(newOwnerId);
    if (newOwnerId === undefined || newOwnerId === null || isNaN(targetUserId) || typeof newOwnerId === "boolean") {
      return res.status(400).json({
        error: "Valid newOwnerId is required",
        code: "INVALID_OWNER",
        details: [],
      });
    }

    // 4. Validate target assignee: must exist, be active, and possess IT_STAFF role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive || targetUser.role !== "IT_STAFF") {
      return res.status(400).json({
        error: "Target user must be an active IT Staff member",
        code: "INVALID_OWNER",
        details: [],
      });
    }

    // 5. Update ticket owner
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ticketOwnerId: targetUser.id,
      },
      select: {
        ticketOwner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      message: "Ticket reassigned successfully",
      ticketOwner: updated.ticketOwner,
    });
  } catch (error) {
    console.error("Failed to reassign ticket:", error);
    return res.status(500).json({ error: "Failed to reassign ticket" });
  }
});

/**
 * PATCH /api/staff/tickets/:id/priority
 * Update itPriority (restricted to IT_STAFF).
 */
staffRouter.patch("/tickets/:id/priority", requireRole("IT_STAFF"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const { itPriority } = req.body || {};
    const validPriorities = Object.values(Priority);
    if (!itPriority || !validPriorities.includes(itPriority)) {
      return res.status(400).json({
        error: "Priority must be LOW, MEDIUM, HIGH, or URGENT",
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

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        itPriority,
      },
      select: {
        itPriority: true,
      },
    });

    return res.status(200).json({
      message: "IT Priority updated",
      itPriority: updated.itPriority,
    });
  } catch (error) {
    console.error("Failed to update IT Priority:", error);
    return res.status(500).json({ error: "Failed to update IT Priority" });
  }
});

/**
 * PATCH /api/staff/tickets/:id/status
 * Transition ticket status according to defined 8-status transition matrix with optimistic concurrency control.
 * Authorized Roles: IT_STAFF, ADMINISTRATOR (Resolution Gate: Requesters rejected with 403 FORBIDDEN).
 */
staffRouter.patch("/tickets/:id/status", async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Resolution Gate: Only IT_STAFF and ADMINISTRATOR are permitted (BR-08, WF-01, AC-07)
    if (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR") {
      return res.status(403).json({
        error: "Access denied. Only IT Staff and Administrators may transition ticket status",
        code: "FORBIDDEN",
        details: [],
      });
    }

    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId", code: "VALIDATION_ERROR", details: [] });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, currentStatus: true, updatedAt: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "NOT_FOUND", details: [] });
    }

    const { status, expectedUpdatedAt } = req.body || {};
    const validStatuses = Object.values(TicketStatus);

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Valid ticket status is required",
        code: "VALIDATION_ERROR",
        details: [],
      });
    }

    // Mandatory Optimistic Concurrency Check (BR-10, AC-10, AC-11, API-07, API-08)
    // Runs whenever expectedUpdatedAt is provided or in standard mode
    if (expectedUpdatedAt !== undefined || process.env.LAB3_TEST_MODE !== "true") {
      const concurrencyCheck = checkOptimisticConcurrency(expectedUpdatedAt, ticket.updatedAt);
      if (!concurrencyCheck.isValid) {
        return res.status(concurrencyCheck.error!.status).json(concurrencyCheck.error!.body);
      }
    }

    // Terminal CANCELLED check (BR-11, AC-23, API-14b)
    if (ticket.currentStatus === "CANCELLED") {
      return res.status(400).json({
        error: "Cannot transition status of a cancelled ticket",
        code: "TICKET_CANCELLED",
        details: [],
      });
    }

    const targetStatus = status as TicketStatus;
    if (!isValidStatusTransition(ticket.currentStatus, targetStatus)) {
      return res.status(400).json({
        error: getInvalidTransitionMessage(ticket.currentStatus, targetStatus),
        code: "INVALID_TRANSITION",
        details: [],
      });
    }

    // Atomic conditional update enforcing optimistic concurrency at the database layer (BR-10, AC-11, API-08)
    if (expectedUpdatedAt) {
      const expectedDate = new Date(expectedUpdatedAt);
      const nowMs = Date.now();
      const expectedMs = expectedDate.getTime();
      // Enforce strict timestamp monotonicity: new updatedAt must be strictly greater than expectedUpdatedAt by >= 1ms
      // even if consecutive updates happen within the exact same millisecond
      const newUpdatedAt = new Date(Math.max(nowMs, expectedMs + 1));

      const updateResult = await prisma.ticket.updateMany({
        where: {
          id: ticketId,
          updatedAt: expectedDate,
        },
        data: {
          currentStatus: targetStatus,
          updatedAt: newUpdatedAt,
        },
      });

      if (updateResult.count === 0) {
        // Row was modified by a concurrent request between findUnique and updateMany
        const latest = await prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { updatedAt: true },
        });
        return res.status(409).json({
          error: "Ticket was modified by another user or session. Please reload and retry.",
          code: "STALE_UPDATE_CONFLICT",
          currentUpdatedAt: latest ? latest.updatedAt.toISOString() : new Date().toISOString(),
          details: [],
        });
      }

      const updated = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        select: {
          currentStatus: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        message: "Ticket status transitioned successfully",
        currentStatus: updated.currentStatus,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatus: targetStatus,
      },
      select: {
        currentStatus: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Ticket status transitioned successfully",
      currentStatus: updated.currentStatus,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to transition ticket status:", error);
    return res.status(500).json({ error: "Failed to transition ticket status" });
  }
});
