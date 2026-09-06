# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the Requester-facing MVP for the TokTickIT support ticketing system with a consistent Zen Green UI foundation. Requesters can select their development identity, submit IT support requests with attachments, receive a system-generated unique ticket number, view and filter their own tickets in a paginated list, inspect ticket details in read-only mode, and safely manage attachments through upload, download, and reason-backed soft removal.

## 2. Stakeholder Request Interpretation
The IT department needs a professional, responsive, end-user ticketing interface. Requesters must be able to submit detailed issue reports with supporting attachments, track their submitted tickets, and manage attachments. Because full authentication will be implemented in Lab 3, Lab 2 introduces a temporary Development Requester Selector to simulate multi-user ownership and enforce strict tenant-like data isolation so one Requester cannot view or modify another Requester's tickets.

## 3. Scope

### Included
- **Development Requester Selector**: Simulated login context allowing switching among seeded active Requesters, with global context updates and display in the application shell.
- **Ticket Creation (Create Mode)**: Form capturing category, related system, requested priority, ticket summary, multiline description, and initial attachments with client/server validation and safe error recovery.
- **Official Ticket Number Generation**: Unique sequential/timestamp-based identifier (e.g., `TKT-2025-001234`) generated exclusively by the backend.
- **My Tickets (List Mode)**: Requester-owned paginated table/card list with search, category/priority/status filters, multi-column sorting, and distinct loading, empty, and no-results states.
- **Ticket Detail (View Mode)**: Read-only view of ticket details with ownership protection (rejecting access by other requesters).
- **Attachment Lifecycle**: Validation (JPG, PNG, WEBP, PDF up to 5 MB each, max 5 active attachments), secure storage metadata, direct download for active files, and soft removal requiring a documented reason while retaining metadata.
- **Zen Green Design Foundation**: Cohesive color tokens, accessible form controls, badges, and responsive layouts across Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), and Mobile ($< 768\text{px}$).

### Excluded
- Real authentication, passwords, password hashing, JWT/session management, and registration (deferred to Lab 3).
- IT Staff workflow (staff queue, ticket claiming, reassigning, changing IT priority, internal notes).
- Ticket collaboration features (Public Comments, Internal Notes, Actions Taken).
- Post-creation ticket lifecycle transitions (status changes beyond initial `New` status, resolving, closing, reopening).
- Administrative functions (managing categories, systems, users, or system configuration).

## 4. Functional Requirements
- **FR-01 (Requester Context)**: The system shall provide a Development Requester Selector listing all active seeded requesters and maintaining the active user context across the application.
- **FR-02 (Requester Switching)**: The system shall allow changing the active requester from the application header, immediately updating all ticket views to match the newly selected user.
- **FR-03 (Reference Data Loading)**: The system shall dynamically load active Categories and Related Systems from the database for selection in ticket forms.
- **FR-04 (Ticket Creation)**: The system shall allow a selected requester to create a support ticket with Summary, Description, Category, Related System, Requested Priority, and optional attachments.
- **FR-05 (System Generated Values)**: The backend shall automatically assign a unique Ticket Number, creation timestamp, and initial Current Status of `New`.
- **FR-06 (Ticket Listing)**: The system shall display a paginated list of tickets owned exclusively by the currently selected requester.
- **FR-07 (Ticket Search & Filtering)**: The system shall filter the ticket list by search query (Ticket Number or Summary), Category, Requested Priority, IT Priority, and Current Status.
- **FR-08 (Ticket Sorting & Pagination)**: The system shall support sorting tickets by Ticket Number, Created Date, or Last Updated date with configurable page sizes.
- **FR-09 (Ticket Detail Inspection)**: The system shall display full ticket metadata and attachments in read-only mode for the ticket owner.
- **FR-10 (Attachment Upload)**: The system shall support uploading allowed file formats (JPG, PNG, WEBP, PDF) up to 5 MB per file, capping active attachments at 5 per ticket.
- **FR-11 (Attachment Download)**: The system shall allow downloading active attachments while blocking download for soft-removed files.
- **FR-12 (Attachment Soft Removal)**: The system shall allow the ticket owner to soft-remove an attachment by providing a required reason, preserving metadata but preventing future downloads.

## 5. Business Rules
- **BR-01 (Unique Ticket Number)**: The official Ticket Number is generated by the backend upon creation and must be globally unique across all tickets (Format: `TKT-YYYY-XXXXXX`).
- **BR-02 (Initial Status)**: A newly created ticket always starts with `Current Status = New` and `IT Priority = Unassigned` (or default triage priority).
- **BR-03 (Dev Requester Scope)**: Lab 2 uses a Development Requester selector instead of authentication. The selected identity is for local testing only.
- **BR-04 (Requester Filtering)**: Only Requesters with `isActive = true` appear in the Development Requester Selector. Inactive requesters must not be selectable.
- **BR-05 (Strict Ownership Isolation)**: A requester can only view, list, or modify attachments of tickets where `requesterId` matches their current identity. Direct API or URL access to tickets belonging to other requesters must return HTTP 403 Forbidden or HTTP 404 Not Found.
- **BR-06 (Field Validation Constraints)**:
  - `Summary`: Required, string, length between 5 and 150 characters, trimmed of leading/trailing whitespace.
  - `Description`: Required, string, length between 10 and 2000 characters, trimmed.
  - `Category`: Required, must correspond to a valid active Category in the database.
  - `Related System`: Required, must correspond to a valid active Related System in the database.
  - `Requested Priority`: Required, must be one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **BR-07 (Duplicate Submission Prevention)**: The frontend must disable the submit button and display a loading/busy indicator during submission. The backend must enforce request validation to prevent duplicate submissions.
- **BR-08 (Safe Error State)**: If ticket creation or attachment upload fails, the frontend must preserve all user-entered form data and display actionable error messages near the affected fields.
- **BR-09 (Attachment File Constraints)**:
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Maximum size: 5,242,880 bytes (5 MB) per file.
  - Maximum active attachments: 5 files per ticket.
- **BR-10 (Soft Removal Rule)**: When an attachment is removed:
  - `isRemoved` flag is set to `true`.
  - `removedAt` timestamp and `removalReason` (required non-empty string, min 3 characters) are stored.
  - File metadata (filename, size, removal reason, removal date) remains visible in Ticket Detail.
  - Download endpoint returns HTTP 410 Gone (or 404 Not Found) for removed files.
- **BR-11 (Empty & No-Results States)**:
  - When a requester has zero tickets, an empty state with a call-to-action to "Create Your First Ticket" is shown.
  - When search/filters yield zero results, a distinct no-results state with a "Clear Filters" action is shown.

## 6. UI Specification Summary
- **Design Language**: Zen Green Theme using designated tokens (`#006B3C` primary header/actions, `#0B7A46` accents/hover, `#EAF6EF` light tint, `#F5F7F6` background).
- **Navigation / Shell**: Top navbar with TokTickIT branding, "My Tickets" link, "Create Ticket" button, and active Requester dropdown with "Change Requester" action.
- **Create Ticket Screen**: Card layout with distinct read-only header fields (Requester name), two-column dropdowns (Category, Related System, Requested Priority), full-width Summary input, multiline Description textarea, dropzone/file picker for attachments, and primary Submit button.
- **My Tickets Screen**: Responsive table (desktop) and card layout (mobile) featuring Ticket No, Created Date, Summary, Category, Requested Priority badge, Current Status badge, Last Updated date, search bar, filter dropdowns, and pagination controls.
- **Ticket Detail Screen**: Read-only overview card, status badges, and an Attachments section displaying active attachments (with download and delete buttons) and soft-removed attachments (with reason badge and disabled download).

## 7. Data Changes (Prisma Models)

```prisma
model RequesterUser {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  department String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model RelatedSystem {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  tickets     Ticket[]
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  PENDING
  RESOLVED
  CLOSED
  CANCELLED
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  summary           String
  description       String
  requestedPriority Priority      @default(MEDIUM)
  itPriority        Priority?
  currentStatus     TicketStatus  @default(NEW)
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  ticketOwner       String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  attachments       Attachment[]

  @@index([requesterId])
  @@index([currentStatus])
  @@index([categoryId])
}

model Attachment {
  id            Int       @id @default(autoincrement())
  ticketId      Int
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  originalName  String
  storedName    String
  mimeType      String
  sizeBytes     Int
  isRemoved     Boolean   @default(false)
  removedAt     DateTime?
  removalReason String?
  createdAt     DateTime  @default(now())

  @@index([ticketId])
}
```

## 8. API Contract Summary
- `GET /api/requesters/active`: Returns array of active `RequesterUser` items.
- `GET /api/categories/active`: Returns array of active `Category` items.
- `GET /api/related-systems/active`: Returns array of active `RelatedSystem` items.
- `POST /api/tickets`: Validates input, generates ticket number, creates ticket, and links attachments. Returns 201 Created.
- `GET /api/tickets`: Returns paginated tickets for the specified `requesterId` supporting `search`, `categoryId`, `priority`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize`.
- `GET /api/tickets/:id`: Returns detailed ticket data for an owned ticket (validating requester ownership).
- `POST /api/tickets/:id/attachments`: Uploads one or more attachments to an existing owned ticket (enforcing 5 MB and max 5 active attachments limit).
- `GET /api/attachments/:id/download`: Streams active attachment file. Returns 410 Gone / 404 Not Found if `isRemoved = true`.
- `DELETE /api/tickets/:id/attachments/:attachmentId`: Soft-removes attachment with required `removalReason`.

## 9. Acceptance Criteria

- **AC-01 (Ticket Creation)**: Given a selected Requester and valid form inputs (Summary, Description, Category, Related System, Requested Priority), when the form is submitted, then a new Ticket is saved in the database with a unique `ticketNumber`, initial status `NEW`, and HTTP 201 is returned.
- **AC-02 (Form Validation Failure)**: Given empty or invalid inputs (e.g. Summary < 5 chars), when the user attempts to submit, then the form submission is blocked, field-level error messages are displayed, and no API call is made.
- **AC-03 (Attachment Constraints)**: Given an attachment exceeding 5 MB or having an unsupported MIME type (e.g. `.exe`), when selected, then the file is rejected with an inline error message and excluded from submission.
- **AC-04 (Dev Requester Selection)**: Given no selected Development Requester, when navigating to `/tickets` or `/create-ticket`, then the user is redirected or prompted to select an active Requester.
- **AC-05 (Ownership Protection - List)**: Given Requester A is selected, when viewing My Tickets, then only tickets where `requesterId = A.id` are returned. Switching to Requester B immediately replaces the list with Requester B's tickets.
- **AC-06 (Ownership Protection - Detail)**: Given a ticket belonging to Requester A, when Requester B attempts to access `GET /api/tickets/:id` or view the detail screen, then the system returns HTTP 403 / 404 and displays an unauthorized access error.
- **AC-07 (Search & Filter)**: Given a requester's ticket list, when filtering by Category or searching by keyword, then only matching tickets owned by that requester are displayed.
- **AC-08 (Attachment Soft Removal)**: Given an owned ticket with active attachments, when the user provides a valid removal reason and confirms removal, then the attachment is marked as `isRemoved = true`, the reason is displayed in the metadata, and the download link is disabled/blocked.
- **AC-09 (Duplicate Submission Prevention)**: Given the user clicks Submit on the Create Ticket form, when the request is in flight, then the Submit button becomes disabled and shows a spinner/busy state.
- **AC-10 (Safe Error State)**: Given the backend server is offline or returns HTTP 500 during ticket creation, when submission fails, then an error banner is displayed and all previously entered form values are preserved.

## 10. Definition of Done
- [ ] All 7 sprint GitHub Issues are implemented on feature branches and merged into `lab2-staging` via peer-reviewed Pull Requests.
- [ ] All Acceptance Criteria (AC-01 through AC-10) have automated test coverage and pass 100%.
- [ ] Database schema is defined via Prisma migrations and seeded with idempotent data (4 categories, 7 related systems, 4 active + 1 inactive requesters).
- [ ] Full automated test suite passes (Unit, Supertest API tests, Vitest UI component tests, Playwright E2E tests).
- [ ] Responsive design verified on Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), and Mobile ($< 768\text{px}$) with zero horizontal scrolling.
- [ ] Documentation completed: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`.
- [ ] Final release PR merged from `lab2-staging` into `main` with all checks green.

## 11. Assumptions and Decisions
- **Ticket Number Format**: `TKT-YYYY-NNNNNN` where `YYYY` is the current year and `NNNNNN` is a 6-digit zero-padded sequential or unique database sequence.
- **Attachment Storage**: Stored in a dedicated local server directory (`server/uploads/`) with hashed unique filenames (`<uuid>-<originalName>`) while preserving the original name in database metadata.
- **State Management**: Frontend uses React Context + `localStorage` to persist the selected Development Requester across page refreshes during development testing.
