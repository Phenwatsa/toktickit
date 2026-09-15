# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver secure authentication, role-based authorization, operational IT Staff ticket management, and minimalist Administrator user management for TokTickIT without breaking the completed Lab 2 increment. The system transitions from a development requester simulator to a production-grade multi-role application supporting Requesters, IT Staff, and Administrators with strict server-side access control, mandatory first-login password changes, a shared IT Staff Ticket Queue, Ticket Detail with Public Comments and role-restricted Internal Notes, and Apple-style Zen Green UI presentation.

---

## 2. Stakeholder Request Interpretation
The IT department requires replacing the temporary Development Requester selector with secure credentials-based login. The application must support three distinct roles:
1. **Requesters** who continue creating and tracking their own support requests, post public comments, and indicate when problems appear resolved.
2. **IT Staff** who require a centralized ticket queue to discover work, open ticket details, claim or reassign ticket ownership, adjust IT priority, transition tickets through permitted workflows, communicate publicly with requesters, and record private operational notes.
3. **Administrators** who manage user accounts (viewing, creating, basic editing, role assignment, activation/deactivation, and setting initial passwords) without accessing IT staff ticketing operations unless explicitly granted.

All endpoints and views must be protected by server-side role and ownership verification. The Zen Green design language established in Lab 2 must be extended with Apple-style elegance, accessibility, and responsive consistency across desktop, tablet, and mobile devices.

---

## 3. Scope

### Included
- **Secure Authentication & Session Management**: Email/password authentication, password hashing with bcrypt, session/token management, secure logout, and current user profile retrieval.
- **Mandatory First-Login Password Change**: Users flagged with an initial password must change it upon initial login before accessing normal application functions.
- **Role-Based Access Control (RBAC)**: Enforce three mutually exclusive roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) on both backend endpoints and frontend navigation.
- **Requester Continuity & Enhancement**: Migration from simulated selector to authenticated identity; preserve all Lab 2 ticket creation, listing, detail, and attachment capabilities; add Public Comments and "Problem Appears Resolved" indication.
- **IT Staff Ticket Queue**: Searchable, filterable, sortable, and paginated ticket list for IT Staff and Administrators with Zen Green badges and desktop table / mobile card layouts.
- **IT Staff Ticket Detail Operations**: View full ticket metadata; claim ticket ownership; reassign ownership to another active IT staff; set IT Priority; execute permitted status transitions among 8 official statuses.
- **Public Comments & Internal Notes**: Append-only communication timeline with backend author and timestamp recording. Public Comments visible to Requester, IT Staff, and Admin; Internal Notes strictly restricted to IT Staff and Admin.
- **Minimalist Administrator User Management**: Searchable and filterable user list; create user with one role and initial password; edit name, email, role, and active status; reset initial password; enforce self-deactivation protection and last-admin safety guard.
- **Database Evolution & Seed Data**: Safe Prisma migration preserving existing Lab 2 tickets/attachments, and idempotent seed script providing required active/inactive users and realistic ticket data.
- **Apple-Style Zen Green UI**: Refined tokens, smooth transitions, card layouts, clean single-row filter bars, and zero horizontal overflow on desktop, tablet, and mobile.

### Explicitly Excluded
- Email invitations, password-reset emails, multi-factor authentication (MFA), social login, and single sign-on (SSO).
- Self-registration and public account sign-up.
- "Actions Taken by IT Staff" (deferred to Lab 4).
- Formal SLA calculations, automated escalation rules, and notification services.
- Advanced dashboards or KPI analytics beyond simple queue counts.
- Multiple roles assigned to a single user (exactly one role per user).
- User deletion, bulk user operations, import/export, and account audit history.
- Departments, organizational structures, profile photos, and extended profile management.
- Multi-column sorting and multiple simultaneous complex filters on the user list.

---

## 4. Functional Requirements

### Authentication & Authorization
- **FR-01 (Authentication)**: The system shall authenticate active users using a valid email address and password, returning an authenticated session and user profile.
- **FR-02 (Mandatory Password Change)**: The system shall intercept any authenticated user flagged with `mustChangePassword = true` and confine them to a password change interface until a compliant new password is saved.
- **FR-03 (Session & Current User)**: The system shall provide an endpoint to retrieve the current authenticated user's profile and validate active session status.
- **FR-04 (Logout)**: The system shall provide a logout function that invalidates the session and removes authenticated access.
- **FR-05 (Role-Based Navigation)**: The application navigation bar shall dynamically present only destinations permitted for the authenticated user's role.

### Requester Capabilities
- **FR-06 (Authenticated Ticket Management)**: The system shall bind all Requester ticket creation, listing, detail viewing, and attachment operations to the authenticated user's identity (`req.user.id`).
- **FR-07 (Requester Public Comments)**: A requester shall be able to post and read Public Comments on tickets they own.
- **FR-08 (Problem Appears Resolved)**: A requester shall be able to submit an indication that their reported problem appears resolved without directly changing the official ticket status to Resolved or Closed.

### IT Staff Capabilities
- **FR-09 (Staff Ticket Queue)**: IT Staff and Administrators shall be able to retrieve a paginated queue of all tickets in the system, with search (by ticket number or summary), filters (by status, category, requested priority, IT priority, owner), and sorting.
- **FR-10 (Ticket Ownership Assignment)**: IT Staff and Administrators shall be able to claim unassigned tickets or reassign tickets to any active IT Staff member.
- **FR-11 (IT Priority Management)**: IT Staff and Administrators shall be able to set or update the ticket's `IT Priority` independently from the Requester's `Requested Priority`.
- **FR-12 (Ticket Status Transition)**: IT Staff and Administrators shall be able to advance tickets through permitted workflow statuses adhering to the official status transition matrix.
- **FR-13 (Internal Notes)**: IT Staff and Administrators shall be able to create and view confidential Internal Notes on tickets.

### Administrator Capabilities
- **FR-14 (User Management Overview)**: Administrators shall be able to view a list of all user accounts, search by name or email, and filter by role.
- **FR-15 (User Account Lifecycle)**: Administrators shall be able to create new user accounts with one permitted role and an initial password, update account details, toggle active/deactive status, and issue a new initial password requiring change on next login.

---

## 5. Business Rules

### Authentication & Security
- **BR-01 (Active User Credential Check)**: Only an active user (`isActive = true`) with valid matching credentials may authenticate. Deactivated accounts must be rejected with safe error feedback without disclosing whether the account exists or is disabled.
- **BR-02 (Mandatory First-Login Enforcement)**: A user marked with `mustChangePassword = true` cannot access normal application views or functional endpoints until a new password satisfying validation rules is saved.
- **BR-03 (Authenticated Requester Ownership)**: The authenticated session identity, not any client-supplied `requesterId`, strictly determines the ownership of Requester operations. Cross-user ticket inspection or tampering must be rejected with HTTP 403 Forbidden.
- **BR-04 (Cryptographic Password Storage)**: Passwords must never be stored, logged, or returned in plaintext. All passwords must be hashed using a salted cryptographic algorithm (bcrypt with $\ge 10$ rounds).
- **BR-05 (Password Complexity Rules)**: Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.

### Communication & Collaboration
- **BR-06 (Public Comments Visibility)**: Public Comments are visible to the ticket Requester, IT Staff, and Administrators.
- **BR-07 (Internal Notes Confidentiality)**: Internal Notes are strictly confidential and visible only to IT Staff and Administrators. Requests by Requesters to retrieve or post Internal Notes must return HTTP 403 Forbidden with zero note metadata leaked.
- **BR-08 (Append-Only Records)**: Public Comments and Internal Notes are append-only. No editing or deletion of comments or notes is permitted. Each entry must record the backend-derived author identity and creation timestamp.
- **BR-09 (Non-Empty Content Constraint)**: Comments and notes must contain non-whitespace text, with a minimum length of 2 characters and a maximum length of 2,000 characters.

### Ticket Ownership, Priority & Workflow
- **BR-10 (Ticket Ownership)**: A ticket may have zero or one primary Ticket Owner. Only an active user with `role = IT_STAFF` or `role = ADMINISTRATOR` may be assigned as Ticket Owner.
- **BR-11 (Priority Separation)**: `Requested Priority` is immutably preserved as submitted by the Requester. `IT Priority` initially defaults to the value of `Requested Priority` and may subsequently be modified only by IT Staff or Administrators.
- **BR-12 (Permitted Statuses & Transitions)**: The 8 official ticket statuses are `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
  - Allowed transitions:
    - `New` $\rightarrow$ `Open`, `In Progress`, `Cancelled`
    - `Open` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
    - `In Progress` $\rightarrow$ `Waiting for Requester`, `Resolved`, `Cancelled`
    - `Waiting for Requester` $\rightarrow$ `In Progress`, `Resolved`, `Cancelled`
    - `Resolved` $\rightarrow$ `Closed`, `Reopened`
    - `Closed` $\rightarrow$ (Terminal state; no further transitions allowed)
    - `Reopened` $\rightarrow$ `In Progress`, `Resolved`, `Cancelled`
    - `Cancelled` $\rightarrow$ (Terminal state)
- **BR-13 (Requester Resolution Limitation)**: A Requester cannot directly transition a ticket to `Resolved` or `Closed`. They may only set an informational flag `problemAppearsResolved = true` which notifies IT Staff.

### Administrator Safety Rules
- **BR-14 (Single Role Assignment)**: Each user must be assigned exactly one role from: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
- **BR-15 (Unique Email Constraint)**: Every user account must possess a unique email address. Duplicates must be rejected with HTTP 409 Conflict.
- **BR-16 (Self-Deactivation Prevention)**: An Administrator is strictly forbidden from deactivating their own currently authenticated account.
- **BR-17 (Last Active Admin Guard)**: The system must prevent deactivating or demoting the last remaining active Administrator in the system.
- **BR-18 (Deactivation Over Deletion)**: User accounts are never deleted from the database. Soft deactivation (`isActive = false`) is enforced to maintain historical integrity of tickets, comments, and notes.

---

## 6. UI Specification Summary
*(Refer to [`ui-spec.md`](./ui-spec.md) for full token details, responsive breakpoints, and visual checklist)*

- **Aesthetic**: Apple-Style Zen Green design language characterized by crisp typography, subtle translucent headers, gentle card elevation shadows, 8px–12px corner radii, and a clean palette:
  - Primary Green: `#006B3C`
  - Secondary Accent: `#0B7A46`
  - Pale Green Tint: `#EAF6EF`
  - Page Background: `#F5F7F6`
  - Private Note Amber Tint: `#FEF3C7` / Border `#F59E0B`
- **Application Shell & Navbar**:
  - Displays TokTickIT branding, role-specific navigation links, current user full name, role badge, and Logout button.
  - Development Requester Selector and Change Requester button are completely removed.
- **Login Screen**: Clean centered modal card with email, password, validation indicators, submit busy state, and safe error banner.
- **Change Password Screen**: Confining interstitial card displaying password requirements checklist and confirmation validation.
- **IT Staff Ticket Queue**: Responsive view with real-time keyword search, single-row dropdown filters, sorting headers, pagination controls, and status/priority badges.
- **IT Staff Ticket Detail**: Organized two-column operational layout with ownership card, priority/status controls, attachments section, and visually distinguished Public Comments vs Internal Notes panels.
- **Administrator User Management**: Minimalist user table with search and role filter, "Create User" slide-over drawer / modal, and "Edit User" modal with safety alerts preventing self-deactivation.

---

## 7. Data Changes (Prisma Models & Migration Strategy)

### Migration Strategy
1. Rename and evolve `RequesterUser` into the generalized `User` model.
2. Add fields `passwordHash`, `role`, `mustChangePassword`, and timestamps.
3. Migrate existing `requesterId` foreign keys on `Ticket` to reference `User.id`.
4. Add optional `ticketOwnerId` foreign key to `Ticket` referencing `User.id`.
5. Add `itPriority` (ENUM) and `problemAppearsResolved` (boolean) to `Ticket`.
6. Create `PublicComment` and `InternalNote` models with relations to `Ticket` and `User`.
7. Preserve all existing Lab 2 records (`Category`, `RelatedSystem`, `Ticket`, `Attachment`).

### Evolved Prisma Schema

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
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
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

model User {
  id                 Int              @id @default(autoincrement())
  name               String
  email              String           @unique
  passwordHash       String
  role               Role             @default(REQUESTER)
  department         String?
  mustChangePassword Boolean          @default(false)
  isActive           Boolean          @default(true)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  tickets            Ticket[]         @relation("RequesterTickets")
  assignedTickets    Ticket[]         @relation("AssignedTickets")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@index([email])
  @@index([role])
}

model Ticket {
  id                     Int             @id @default(autoincrement())
  ticketNumber           String          @unique
  summary                String
  description            String
  requestedPriority      Priority        @default(MEDIUM)
  itPriority             Priority?
  currentStatus          TicketStatus    @default(NEW)
  problemAppearsResolved Boolean         @default(false)
  requesterId            Int
  requester              User            @relation("RequesterTickets", fields: [requesterId], references: [id])
  ticketOwnerId          Int?
  ticketOwner            User?           @relation("AssignedTickets", fields: [ticketOwnerId], references: [id])
  categoryId             Int
  category               Category        @relation(fields: [categoryId], references: [id])
  relatedSystemId        Int
  relatedSystem          RelatedSystem   @relation(fields: [relatedSystemId], references: [id])
  createdAt              DateTime        @default(now())
  updatedAt              DateTime        @updatedAt
  attachments            Attachment[]
  publicComments         PublicComment[]
  internalNotes          InternalNote[]

  @@index([requesterId])
  @@index([ticketOwnerId])
  @@index([currentStatus])
  @@index([categoryId])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}
```

---

## 8. API Contract Summary
*(Refer to [`api-spec.md`](./api-spec.md) for full payload schemas and status codes)*

- **Auth APIs**:
  - `POST /api/auth/login`: Authenticate email/password $\rightarrow$ `{ token, user }`.
  - `POST /api/auth/logout`: Invalidate session.
  - `GET /api/auth/me`: Current user profile.
  - `POST /api/auth/change-password`: Update password and clear `mustChangePassword` flag.
- **IT Staff Queue API**:
  - `GET /api/staff/tickets`: Paginated ticket query with search, filters, and sorting (IT Staff & Admin only).
- **IT Staff Detail & Operations APIs**:
  - `GET /api/staff/tickets/:id`: Detailed ticket view with comments, notes, attachments.
  - `PATCH /api/staff/tickets/:id/claim`: Assign current user as owner.
  - `PATCH /api/staff/tickets/:id/assign`: Reassign ticket owner.
  - `PATCH /api/staff/tickets/:id/priority`: Update `itPriority`.
  - `PATCH /api/staff/tickets/:id/status`: Transition `currentStatus`.
- **Comments & Notes APIs**:
  - `GET /api/tickets/:id/comments` & `POST /api/tickets/:id/comments`: Public comments.
  - `GET /api/tickets/:id/notes` & `POST /api/tickets/:id/notes`: Internal notes (Staff/Admin only; Requester gets 403 Forbidden).
  - `PATCH /api/requester/tickets/:id/resolve-indication`: Requester mark problem resolved.
- **Admin User Management APIs**:
  - `GET /api/admin/users`: Query user list.
  - `POST /api/admin/users`: Create user with 1 role and initial password.
  - `PATCH /api/admin/users/:id`: Edit user details / active status.
  - `POST /api/admin/users/:id/reset-password`: Set new initial password.

---

## 9. Acceptance Criteria

- **AC-01 (Valid Authentication)**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02 (Mandatory Password Change)**: Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03 (Requester Identity Enforcement)**: Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester’s data.
- **AC-04 (Internal Note Confidentiality)**: Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected with HTTP 403 Forbidden without exposing note content.
- **AC-05 (Invalid Credentials Safety)**: Given invalid credentials or a deactivated user account, when attempting to log in, then the request fails with HTTP 401 and displays a generic safe error message.
- **AC-06 (Staff Ticket Queue Retrieval)**: Given an authenticated IT Staff user, when accessing the queue, then all system tickets are returned with accurate search, filter, and pagination metadata.
- **AC-07 (Ticket Ownership Claim & Reassign)**: Given an open ticket, when an active IT Staff claims the ticket, then the ticket's owner is updated to that staff member and reflected in the UI.
- **AC-08 (IT Priority Update)**: Given a ticket, when an IT Staff updates the IT Priority, then the value updates while preserving the original Requested Priority.
- **AC-09 (Status Transition Enforcement)**: Given a ticket in `In Progress` status, when attempting an invalid transition (e.g. directly to `Closed`), then the backend rejects the change with HTTP 400 Bad Request.
- **AC-10 (Public Comments Communication)**: Given a ticket, when either the Requester or IT Staff posts a Public Comment, then the comment appears in the ticket timeline for both users.
- **AC-11 (Admin User Creation)**: Given an Administrator, when creating a new user with email, name, single role, and initial password, then the user is stored with `mustChangePassword = true` and can authenticate.
- **AC-12 (Duplicate Email Rejection)**: Given an attempt to create or update a user with an existing email address, then the request fails with HTTP 409 Conflict and clear field validation feedback.
- **AC-13 (Admin Self-Deactivation Guard)**: Given an Administrator, when attempting to deactivate their own account, then the request is blocked by backend safety validation.
- **AC-14 (Last Admin Protection Guard)**: Given only one active Administrator remains in the system, when attempting to deactivate or demote that user, then the system rejects the operation.
- **AC-15 (Non-Admin User Management Blockage)**: Given an authenticated Requester or IT Staff user, when attempting to access Admin User Management endpoints or views, then access is denied with HTTP 403 Forbidden.

---

## 10. Product Definition of Done (DoD)
- [ ] All 8 sprint GitHub Issues (#12 to #19) are implemented on dedicated feature branches and merged into `lab3-staging` via peer-reviewed Pull Requests.
- [ ] All Acceptance Criteria (AC-01 through AC-15) have corresponding automated test coverage and pass 100%.
- [ ] Database migration safely migrates `RequesterUser` to `User`, establishes `PublicComment`, `InternalNote`, and updates `Ticket` without data loss.
- [ ] Idempotent seed data loads $\ge 4$ active Requesters, $\ge 1$ inactive Requester, $\ge 3$ active IT Staff, $\ge 1$ inactive IT Staff, $\ge 1$ active Admin, and realistic ticket history.
- [ ] Zero TypeScript diagnostic errors and zero build errors across `client` and `server`.
- [ ] Responsive design verified across Desktop ($1280\times800$), Tablet ($768\times1024$), and Mobile ($375\times667$) with zero horizontal overflow.
- [ ] All documentation deliverables completed in `docs/lab-03/`: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`.
- [ ] Final release PR merged from `lab3-staging` into `main` with all CI checks green.

---

## 11. Assumptions and Decisions
- **Session Architecture**: Use JSON Web Tokens (JWT) or secure HttpOnly cookies containing user ID and role, verified via Express middleware on all protected routes.
- **Development Credentials**: Initial passwords for seeded accounts are set to a standard documented format (e.g. `Password123!`) with `mustChangePassword = true` for new/initial accounts.
- **Append-Only Communication**: No edit or delete routes are provided for Public Comments or Internal Notes to enforce auditable service records.
