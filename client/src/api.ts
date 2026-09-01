import { Category, RelatedSystem, RequesterUser, Priority, Ticket } from "./types";
export type { Category, RelatedSystem, RequesterUser, Priority, Ticket };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — legacy system check
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categories: Category[] = await catRes.json();
  return { online: true, categories };
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 6: Fetch Active Development Requesters
// GET /api/requesters/active
// ---------------------------------------------------------------------------
export async function fetchActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters/active`);
  if (!res.ok) {
    throw new Error("Failed to fetch active development requesters from server");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Fetch Active Categories
// GET /api/categories/active
// ---------------------------------------------------------------------------
export async function fetchActiveCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories/active`);
  if (!res.ok) {
    throw new Error("Failed to fetch ticket categories from server");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Fetch Active Related Systems
// GET /api/related-systems/active
// ---------------------------------------------------------------------------
export async function fetchActiveRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems/active`);
  if (!res.ok) {
    throw new Error("Failed to fetch related systems from server");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 7: Create IT Support Ticket
// POST /api/tickets
// ---------------------------------------------------------------------------
export interface CreateTicketPayload {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  requestedPriority: Priority;
  summary: string;
  description: string;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(payload.requesterId),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to create support ticket");
  }
  return data;
}
