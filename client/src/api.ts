import {
  Category,
  RelatedSystem,
  RequesterUser,
  Priority,
  Ticket,
  TicketsResponse,
  TicketFilterParams,
  PaginationMeta,
  Attachment,
} from "./types";
export type {
  Category,
  RelatedSystem,
  RequesterUser,
  Priority,
  Ticket,
  TicketsResponse,
  TicketFilterParams,
  PaginationMeta,
  Attachment,
};

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

// ---------------------------------------------------------------------------
// Lab 2 — Issue 8: Fetch My Tickets (Paginated & Filtered)
// GET /api/tickets
// ---------------------------------------------------------------------------
export async function fetchMyTickets(params: TicketFilterParams): Promise<TicketsResponse> {
  const query = new URLSearchParams();
  query.set("requesterId", String(params.requesterId));

  if (params.search && params.search.trim() !== "") {
    query.set("search", params.search.trim());
  }
  if (params.categoryId) {
    query.set("categoryId", String(params.categoryId));
  }
  if (params.priority && params.priority !== "ALL") {
    query.set("priority", params.priority);
  }
  if (params.itPriority && params.itPriority !== "ALL") {
    query.set("itPriority", params.itPriority);
  }
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers: {
      "x-requester-id": String(params.requesterId),
    },
    signal: params.signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Failed to fetch tickets from server");
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Fetch Ticket Detail
// GET /api/tickets/:id
// ---------------------------------------------------------------------------
export async function fetchTicketDetail(ticketId: number, requesterId: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch ticket details from server");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Upload Attachment
// POST /api/tickets/:id/attachments
// ---------------------------------------------------------------------------
export async function uploadAttachment(
  ticketId: number,
  requesterId: number,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to upload attachment");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Download Attachment
// GET /api/attachments/:id/download
// ---------------------------------------------------------------------------
export async function downloadAttachment(
  attachmentId: number,
  requesterId: number,
  filename: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Failed to download attachment");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Soft-Remove Attachment
// DELETE /api/tickets/:id/attachments/:attachmentId
// ---------------------------------------------------------------------------
export async function softRemoveAttachment(
  ticketId: number,
  attachmentId: number,
  requesterId: number,
  removalReason: string
): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(requesterId),
    },
    body: JSON.stringify({ removalReason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to remove attachment");
  }
  return data;
}
