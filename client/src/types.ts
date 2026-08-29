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
