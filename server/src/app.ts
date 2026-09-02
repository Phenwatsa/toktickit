import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPrisma } from "./prisma.js";
import { generateUniqueTicketNumber } from "./services/ticketNumber.js";

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for attachment upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${uniqueSuffix}-${basename}${ext}`);
  },
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_MEDIA_TYPE"));
    }
  },
});

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Issue 4 & Lab 2 — Category list
// GET /api/categories and GET /api/categories/active
// ---------------------------------------------------------------------------
const getCategoriesHandler = async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

app.get("/api/categories", getCategoriesHandler);
app.get("/api/categories/active", getCategoriesHandler);

// ---------------------------------------------------------------------------
// Lab 2 — Issue 6: Active Development Requesters
// GET /api/requesters/active
// ---------------------------------------------------------------------------
app.get("/api/requesters/active", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.requesterUser.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Failed to fetch active development requesters" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Active Related Systems
// GET /api/related-systems/active
// ---------------------------------------------------------------------------
app.get("/api/related-systems/active", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json(systems);
  } catch {
    res.status(500).json({ error: "Failed to fetch active related systems" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Create Ticket
// POST /api/tickets
// ---------------------------------------------------------------------------
app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const {
      requesterId,
      categoryId,
      relatedSystemId,
      requestedPriority,
      summary,
      description,
    } = req.body;

    const details: { field: string; issue: string }[] = [];

    // 1. Validate summary
    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      details.push({
        field: "summary",
        issue: "Summary is required and must be between 5 and 150 characters.",
      });
    }

    // 2. Validate description
    const trimmedDesc = typeof description === "string" ? description.trim() : "";
    if (!trimmedDesc || trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
      details.push({
        field: "description",
        issue: "Description is required and must be between 10 and 2000 characters.",
      });
    }

    // 3. Validate requestedPriority
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (!requestedPriority || !allowedPriorities.includes(requestedPriority)) {
      details.push({
        field: "requestedPriority",
        issue: "Requested priority must be one of: LOW, MEDIUM, HIGH, URGENT.",
      });
    }

    // 4. Validate IDs
    const parsedRequesterId = Number(requesterId);
    const parsedCategoryId = Number(categoryId);
    const parsedSystemId = Number(relatedSystemId);

    if (!parsedRequesterId || isNaN(parsedRequesterId)) {
      details.push({ field: "requesterId", issue: "Valid requesterId is required." });
    }
    if (!parsedCategoryId || isNaN(parsedCategoryId)) {
      details.push({ field: "categoryId", issue: "Valid categoryId is required." });
    }
    if (!parsedSystemId || isNaN(parsedSystemId)) {
      details.push({ field: "relatedSystemId", issue: "Valid relatedSystemId is required." });
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please correct the input errors below.",
        details,
      });
    }

    // Verify requester header matches body if provided
    const headerRequesterId = req.headers["x-requester-id"];
    if (headerRequesterId && Number(headerRequesterId) !== parsedRequesterId) {
      return res.status(400).json({
        error: "Requester mismatch",
        message: "The requester specified in the request does not match the active session.",
      });
    }

    // Check entity existence and active status
    const requester = await prisma.requesterUser.findUnique({
      where: { id: parsedRequesterId },
    });
    if (!requester || !requester.isActive) {
      return res.status(400).json({
        error: "Invalid requester",
        message: "The specified requester is inactive or does not exist.",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
    });
    if (!category || !category.isActive) {
      return res.status(400).json({
        error: "Invalid category",
        message: "The specified category is inactive or does not exist.",
      });
    }

    const system = await prisma.relatedSystem.findUnique({
      where: { id: parsedSystemId },
    });
    if (!system || !system.isActive) {
      return res.status(400).json({
        error: "Invalid related system",
        message: "The specified related system is inactive or does not exist.",
      });
    }

    // Generate unique official ticket number
    const ticketNumber = await generateUniqueTicketNumber();

    // Create ticket in DB
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        summary: trimmedSummary,
        description: trimmedDesc,
        requestedPriority,
        currentStatus: "NEW",
        requesterId: parsedRequesterId,
        categoryId: parsedCategoryId,
        relatedSystemId: parsedSystemId,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ error: "Failed to create support ticket." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 8: My Tickets List & Filtering
// GET /api/tickets
// ---------------------------------------------------------------------------
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const {
      requesterId,
      search,
      categoryId,
      priority,
      itPriority,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      pageSize = "10",
    } = req.query;

    const headerRequesterId = req.headers["x-requester-id"];
    const queryRequesterId = req.query.requesterId;

    // Strict session enforcement: x-requester-id header is mandatory
    if (!headerRequesterId || isNaN(Number(headerRequesterId))) {
      return res.status(400).json({
        error: "Missing requester session",
        message: "A valid x-requester-id session header is required to identify the current requester.",
      });
    }

    const sessionRequesterId = Number(headerRequesterId);

    // Security check: reject if query parameter attempts to query another requester's tickets
    if (queryRequesterId && Number(queryRequesterId) !== sessionRequesterId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot access tickets belonging to another requester.",
      });
    }

    // Check that the session requester exists and is active
    const requester = await prisma.requesterUser.findUnique({
      where: { id: sessionRequesterId },
    });
    if (!requester || !requester.isActive) {
      return res.status(400).json({
        error: "Invalid requester session",
        message: "The session requester is inactive or does not exist.",
      });
    }

    // Build Prisma where clause with strict tenant ownership derived from session
    const where: any = {
      requesterId: sessionRequesterId,
    };

    // Keyword search (case-insensitive across ticketNumber and summary)
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (categoryId) {
      const parsedCatId = Number(categoryId);
      if (!isNaN(parsedCatId)) {
        where.categoryId = parsedCatId;
      }
    }

    // Requested Priority filter
    if (priority && typeof priority === "string" && priority !== "ALL") {
      where.requestedPriority = priority;
    }

    // IT Priority filter
    if (itPriority && typeof itPriority === "string" && itPriority !== "ALL") {
      where.itPriority = itPriority;
    }

    // Status filter
    if (status && typeof status === "string" && status !== "ALL") {
      where.currentStatus = status;
    }

    // Pagination calculations
    const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
    const parsedPageSize = Math.min(50, Math.max(1, parseInt(String(pageSize), 10) || 10));
    const skip = (parsedPage - 1) * parsedPageSize;

    // Sorting
    const validSortFields = ["createdAt", "updatedAt", "ticketNumber"];
    const orderField = validSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const orderDirection = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    // Query total count and items concurrently
    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          ticketOwner: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true },
          },
          relatedSystem: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              attachments: {
                where: { isRemoved: false },
              },
            },
          },
        },
        orderBy: {
          [orderField]: orderDirection,
        },
        skip,
        take: parsedPageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / parsedPageSize) || 1;

    // Format response items to include attachmentsCount
    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      ticketOwner: t.ticketOwner,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      category: t.category,
      relatedSystem: t.relatedSystem,
      attachmentsCount: t._count.attachments,
    }));

    return res.status(200).json({
      data,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        totalItems,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      },
    });
  } catch (error) {
    console.error("Fetch my tickets error:", error);
    return res.status(500).json({ error: "Failed to fetch tickets." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Ticket Detail Inspection
// GET /api/tickets/:id
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    const headerRequesterId = req.headers["x-requester-id"];
    const queryRequesterId = req.query.requesterId;
    const rawRequesterId = headerRequesterId || queryRequesterId;

    if (!rawRequesterId || isNaN(Number(rawRequesterId))) {
      return res.status(400).json({
        error: "Missing requester session",
        message: "A valid x-requester-id session header is required.",
      });
    }

    const sessionRequesterId = Number(rawRequesterId);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticketId" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: {
          select: { id: true, name: true, email: true, department: true },
        },
        category: {
          select: { id: true, name: true },
        },
        relatedSystem: {
          select: { id: true, name: true, description: true },
        },
        attachments: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        message: "The requested ticket was not found.",
      });
    }

    // Strict multi-tenant ownership check
    if (ticket.requesterId !== sessionRequesterId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to view this ticket.",
      });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Fetch ticket detail error:", error);
    return res.status(500).json({ error: "Failed to fetch ticket details." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Attachment Binary Upload
// POST /api/tickets/:id/attachments
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/attachments", (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "Payload Too Large",
          message: "Attachment exceeds maximum allowed size of 5 MB.",
        });
      }
      if (err.message === "UNSUPPORTED_MEDIA_TYPE") {
        return res.status(415).json({
          error: "Unsupported Media Type",
          message: "Only JPG, PNG, WEBP, and PDF files are allowed.",
        });
      }
      return res.status(400).json({
        error: "Upload failed",
        message: err.message || "Failed to process uploaded file.",
      });
    }

    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);
      const headerRequesterId = req.headers["x-requester-id"];

      if (!headerRequesterId || isNaN(Number(headerRequesterId))) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "Missing requester session",
          message: "A valid x-requester-id session header is required.",
        });
      }

      const sessionRequesterId = Number(headerRequesterId);

      if (!ticketId || isNaN(ticketId)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid ticketId" });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Missing file",
          message: "No file attachment was provided.",
        });
      }

      // Check ticket existence
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          attachments: {
            where: { isRemoved: false },
          },
        },
      });

      if (!ticket) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          error: "Ticket not found",
          message: "The specified ticket does not exist.",
        });
      }

      // Strict ownership check
      if (ticket.requesterId !== sessionRequesterId) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to attach files to this ticket.",
        });
      }

      // Max 5 active attachments limit check
      if (ticket.attachments.length >= 5) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "Max attachments reached",
          message: "Maximum active attachments limit reached (5 files per ticket).",
        });
      }

      // Decode UTF-8 filename for non-ASCII and Thai characters from multer's latin1 header
      const safeOriginalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

      // Save attachment in database
      const newAttachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalName: safeOriginalName,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          isRemoved: false,
        },
      });

      return res.status(201).json(newAttachment);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Attachment upload error:", error);
      return res.status(500).json({ error: "Failed to upload attachment." });
    }
  });
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Attachment Download
// GET /api/attachments/:id/download
// ---------------------------------------------------------------------------
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = Number(req.params.id);
    const headerRequesterId = req.headers["x-requester-id"];
    const queryRequesterId = req.query.requesterId;
    const rawRequesterId = headerRequesterId || queryRequesterId;

    if (!rawRequesterId || isNaN(Number(rawRequesterId))) {
      return res.status(400).json({
        error: "Missing requester session",
        message: "A valid x-requester-id session header or requesterId query is required.",
      });
    }

    const sessionRequesterId = Number(rawRequesterId);

    if (!attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachmentId" });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            requesterId: true,
          },
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({
        error: "Attachment not found",
        message: "The requested attachment does not exist.",
      });
    }

    // Ownership check
    if (attachment.ticket.requesterId !== sessionRequesterId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to download this attachment.",
      });
    }

    // Soft-removal check (BR-10) -> HTTP 410 Gone
    if (attachment.isRemoved) {
      return res.status(410).json({
        error: "Gone",
        message: "This attachment has been removed and cannot be downloaded.",
        removalReason: attachment.removalReason,
        removedAt: attachment.removedAt,
      });
    }

    const filePath = path.join(uploadsDir, attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "File not found",
        message: "The physical file is not found on the server storage.",
      });
    }

    res.setHeader("Content-Type", attachment.mimeType);
    return res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error("Attachment download error:", error);
    return res.status(500).json({ error: "Failed to download attachment." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Soft-Remove Attachment
// DELETE /api/tickets/:id/attachments/:attachmentId
// ---------------------------------------------------------------------------
app.delete("/api/tickets/:id/attachments/:attachmentId", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const headerRequesterId = req.headers["x-requester-id"];
    const { removalReason } = req.body || {};

    if (!headerRequesterId || isNaN(Number(headerRequesterId))) {
      return res.status(400).json({
        error: "Missing requester session",
        message: "A valid x-requester-id session header is required.",
      });
    }

    const sessionRequesterId = Number(headerRequesterId);

    if (!ticketId || isNaN(ticketId) || !attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid ticket or attachment ID" });
    }

    const trimmedReason = typeof removalReason === "string" ? removalReason.trim() : "";
    if (!trimmedReason || trimmedReason.length < 3) {
      return res.status(400).json({
        error: "Invalid removal reason",
        message: "A removal reason of at least 3 characters is required to remove an attachment.",
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            id: true,
            requesterId: true,
          },
        },
      },
    });

    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({
        error: "Attachment not found",
        message: "The specified attachment does not exist on this ticket.",
      });
    }

    // Ownership check
    if (attachment.ticket.requesterId !== sessionRequesterId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to remove attachments from this ticket.",
      });
    }

    const updatedAttachment = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: trimmedReason,
      },
    });

    return res.status(200).json(updatedAttachment);
  } catch (error) {
    console.error("Soft-remove attachment error:", error);
    return res.status(500).json({ error: "Failed to remove attachment." });
  }
});

export default app;
