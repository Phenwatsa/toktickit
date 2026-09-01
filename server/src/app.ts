import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { generateUniqueTicketNumber } from "./services/ticketNumber.js";

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

export default app;
