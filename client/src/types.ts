// ---------------------------------------------------------------------------
// Lab 2 — TokTickIT Core TypeScript Interfaces
// ---------------------------------------------------------------------------

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface RelatedSystem {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export interface Attachment {
  id: number;
  ticketId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority?: Priority | null;
  currentStatus: TicketStatus;
  requesterId: number;
  requester?: RequesterUser;
  categoryId: number;
  category?: Category;
  relatedSystemId: number;
  relatedSystem?: RelatedSystem;
  ticketOwner?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  attachmentsCount?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TicketsResponse {
  data: Ticket[];
  pagination: PaginationMeta;
}

export interface TicketFilterParams {
  requesterId: number;
  search?: string;
  categoryId?: number | "";
  priority?: string;
  itPriority?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
