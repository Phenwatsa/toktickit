import { Router, Request, Response } from "express";
import { Prisma, TicketStatus, Priority } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireActive, requirePasswordChanged, requireRole } from "../middleware/auth.js";

export const staffRouter = Router();

// Strict security: all staff routes require authentication, active account, changed password, and IT_STAFF role.
staffRouter.use(requireAuth, requireActive, requirePasswordChanged, requireRole("IT_STAFF"));

/**
 * GET /api/staff/members
 * Returns active IT staff members for assignment/filtering dropdowns.
 */
staffRouter.get("/members", async (_req: Request, res: Response) => {
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
 */
staffRouter.get("/tickets", async (req: Request, res: Response) => {
  try {
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
