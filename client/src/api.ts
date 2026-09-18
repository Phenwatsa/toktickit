import {
  Category,
  RelatedSystem,
  RequesterUser,
  Priority,
  TicketStatus,
  Ticket,
  TicketsResponse,
  TicketFilterParams,
  PaginationMeta,
  Attachment,
  Role,
  User,
  AuthResponse,
  ChangePasswordPayload,
  StaffTicketOwner,
  StaffTicketItem,
  StaffQueuePagination,
  StaffTicketQueueResponse,
  StaffTicketQueueParams,
  CommentAuthor,
  PublicComment,
  InternalNote,
  StaffTicketDetailAttachment,
  StaffTicketDetailData,
} from "./types";
export type {
  Category,
  RelatedSystem,
  RequesterUser,
  Priority,
  TicketStatus,
  Ticket,
  TicketsResponse,
  TicketFilterParams,
  PaginationMeta,
  Attachment,
  Role,
  User,
  AuthResponse,
  ChangePasswordPayload,
  StaffTicketOwner,
  StaffTicketItem,
  StaffQueuePagination,
  StaffTicketQueueResponse,
  StaffTicketQueueParams,
  CommentAuthor,
  PublicComment,
  InternalNote,
  StaffTicketDetailAttachment,
  StaffTicketDetailData,
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function getAuthToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("toktickit_auth_token") : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem("toktickit_auth_token", token);
    } else {
      localStorage.removeItem("toktickit_auth_token");
    }
  } catch {
    // Ignore storage errors in test / restricted environments
  }
}

function getAuthHeaders(requesterId?: number): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (requesterId !== undefined) {
    headers["x-requester-id"] = String(requesterId);
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Lab 3 — Auth API Handlers
// ---------------------------------------------------------------------------
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Invalid email or password");
  }
  return data;
}

export async function logout(token?: string): Promise<{ message: string }> {
  const authToken = token || getAuthToken();
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({ message: "Logged out" }));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to logout");
  }
  return data;
}

export async function fetchCurrentUser(token?: string): Promise<{ user: User }> {
  const authToken = token || getAuthToken();
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch user profile");
  }
  return data;
}

export async function changePassword(
  payload: ChangePasswordPayload,
  token?: string
): Promise<{ message: string; user: User }> {
  const authToken = token || getAuthToken();
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to change password");
  }
  return data;
}

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
      ...getAuthHeaders(payload.requesterId),
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
      ...getAuthHeaders(params.requesterId),
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
      ...getAuthHeaders(requesterId),
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
      ...getAuthHeaders(requesterId),
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
      ...getAuthHeaders(requesterId),
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
      ...getAuthHeaders(requesterId),
    },
    body: JSON.stringify({ removalReason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to remove attachment");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 15: Staff Ticket Queue API Handlers
// ---------------------------------------------------------------------------

export async function fetchStaffTickets(
  params: StaffTicketQueueParams = {}
): Promise<StaffTicketQueueResponse> {
  const query = new URLSearchParams();

  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.categoryId !== undefined && params.categoryId !== "") {
    query.set("categoryId", String(params.categoryId));
  }
  if (params.requestedPriority && params.requestedPriority !== "ALL") {
    query.set("requestedPriority", params.requestedPriority);
  }
  if (params.itPriority && params.itPriority !== "ALL") {
    query.set("itPriority", params.itPriority);
  }
  if (params.ownerId !== undefined && params.ownerId !== "" && params.ownerId !== "ALL") {
    query.set("ownerId", String(params.ownerId));
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

  const queryString = query.toString();
  const url = `${API_URL}/api/staff/tickets${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    signal: params.signal,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch staff tickets");
  }
  return data;
}

export async function fetchStaffMembers(): Promise<StaffTicketOwner[]> {
  const res = await fetch(`${API_URL}/api/staff/members`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch staff members");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: Staff Ticket Detail Operations API
// ---------------------------------------------------------------------------

export async function fetchStaffTicketDetail(ticketId: number): Promise<StaffTicketDetailData> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to load staff ticket detail");
  }
  return data.ticket;
}

export async function claimStaffTicket(ticketId: number): Promise<{ message: string; ticketOwner: StaffTicketOwner }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/claim`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to claim ticket");
  }
  return data;
}

export async function assignStaffTicket(
  ticketId: number,
  newOwnerId: number
): Promise<{ message: string; ticketOwner: StaffTicketOwner }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ newOwnerId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to reassign ticket");
  }
  return data;
}

export async function updateStaffTicketPriority(
  ticketId: number,
  itPriority: Priority
): Promise<{ message: string; itPriority: Priority }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ itPriority }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to update IT Priority");
  }
  return data;
}

export async function updateStaffTicketStatus(
  ticketId: number,
  status: TicketStatus
): Promise<{ message: string; currentStatus: TicketStatus }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to transition ticket status");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: Public Comments & Internal Notes API
// ---------------------------------------------------------------------------

export async function fetchPublicComments(ticketId: number): Promise<PublicComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch public comments");
  }
  return data;
}

export async function createPublicComment(ticketId: number, content: string): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to post comment");
  }
  return data;
}

export async function fetchInternalNotes(ticketId: number): Promise<InternalNote[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch internal notes");
  }
  return data;
}

export async function createInternalNote(ticketId: number, content: string): Promise<InternalNote> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to post internal note");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 16: Requester Resolution Indication API
// ---------------------------------------------------------------------------

export async function markProblemAppearsResolved(
  ticketId: number
): Promise<{ message: string; problemAppearsResolved: boolean }> {
  const res = await fetch(`${API_URL}/api/requester/tickets/${ticketId}/resolve-indication`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to mark problem as resolved");
  }
  return data;
}

