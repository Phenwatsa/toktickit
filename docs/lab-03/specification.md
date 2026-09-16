# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver secure authentication, role-based authorization, operational IT Staff ticket management, and minimalist Administrator user management for TokTickIT without breaking the completed Lab 2 increment. The system transitions from a development requester simulator to a production-grade multi-role application supporting Requesters, IT Staff, and Administrators with strict server-side access control, separation of duties, mandatory first-login password changes, a shared IT Staff Ticket Queue, Ticket Detail with Public Comments and role-restricted Internal Notes, and Apple-style Zen Green UI presentation.

---

## 2. Stakeholder Request Interpretation & Separation of Concerns
The IT department requires replacing the temporary Development Requester selector with secure credentials-based login. The application enforces strict **Role-Based Access Control (RBAC)** adhering to the Principle of Least Privilege across three mutually exclusive roles:
1. **Requesters** who continue creating and tracking their own support requests, post public comments, and indicate when problems appear resolved.
2. **IT Staff** who require a centralized ticket queue to discover work, open ticket details, claim or reassign ticket ownership, adjust IT priority, transition tickets through permitted workflows, communicate publicly with requesters, and record private operational notes.
3. **Administrators** who manage user accounts (viewing, creating, basic editing, role assignment, activation/deactivation, and setting initial passwords). 

> [!IMPORTANT]
> **Strict Separation of Duties Policy (Handout §4.3)**:
> In Lab 3, Administrator and IT Staff responsibilities are conceptually and architecturally separate. **IT Staff manage Tickets. Administrators manage user accounts.** Administrators do not perform IT Staff ticketing operations (they cannot access the IT Staff Queue, claim/reassign tickets, alter IT priority, execute ticket status transitions, or view/post Internal Notes). Direct API or UI attempts by Administrators to perform IT Staff ticket operations are strictly denied with `HTTP 403 Forbidden`.

---

## 3. Scope

### Included
- **Secure Authentication & Session Management**: Email/password authentication, salted password hashing with bcrypt, stateless JWT Bearer tokens with server-side `tokenVersion` invalidation on logout, and current user profile retrieval.
- **Mandatory First-Login Password Change**: Users flagged with an initial password (`mustChangePassword = true`) must change it upon initial login before accessing normal application functions.
- **Role-Based Access Control (RBAC)**: Enforce three mutually exclusive roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) on both backend endpoints and frontend navigation, maintaining separation of concerns between IT Staff (ticketing) and Administrators (user management).
- **Requester Continuity & Enhancement**: Migration from simulated selector to authenticated identity; preserve all Lab 2 ticket creation, listing, detail, and attachment capabilities; add Public Comments and "Problem Appears Resolved" indication.
- **IT Staff Ticket Queue**: Searchable, filterable, sortable, and paginated ticket list for IT Staff only with Zen Green badges and desktop table / mobile card layouts.
- **IT Staff Ticket Detail Operations**: View full ticket metadata; claim ticket ownership; reassign ownership to another active IT staff; set IT Priority; execute permitted status transitions among 8 official statuses.
- **Public Comments & Internal Notes**: Append-only communication timeline with backend author and timestamp recording. Public Comments visible to Requester and IT Staff; Internal Notes strictly restricted to IT Staff.
- **Minimalist Administrator User Management**: Searchable and filterable user list; create user with one role and initial password; edit name, email, role, and active status; reset initial password; enforce self-deactivation protection and last-admin safety guard.
- **Database Evolution & Seed Data**: Safe Prisma migration preserving existing Lab 2 tickets/attachments, explicit migration script for initial password hashes and `mustChangePassword = true`, and idempotent seed script providing required active/inactive users and realistic ticket data.
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
- **FR-01 (Authentication)**: The system shall authenticate active users using a valid email address and password, returning an authenticated JWT token and user profile.
- **FR-02 (Mandatory Password Change)**: The system shall intercept any authenticated user flagged with `mustChangePassword = true` and confine them to a password change interface until a compliant new password is saved.
- **FR-03 (Session & Current User)**: The system shall provide an endpoint (`GET /api/auth/me`) to retrieve the current authenticated user's profile and validate active session status.
- **FR-04 (Logout Invalidation)**: The system shall provide a logout function (`POST /api/auth/logout`) that revokes authenticated access server-side by incrementing the user's `tokenVersion`.
- **FR-05 (Role-Based Navigation)**: The application navigation bar shall dynamically present only destinations permitted for the authenticated user's role.

### Requester Capabilities
- **FR-06 (Authenticated Ticket & Attachment Management)**: The system shall bind all Requester ticket creation, listing, detail viewing, and attachment operations exclusively to the authenticated user's identity (`req.user.id`), enforcing cross-user ownership isolation.
- **FR-07 (Requester Public Comments)**: A requester shall be able to post and read Public Comments on tickets they own.
- **FR-08 (Problem Appears Resolved)**: A requester shall be able to submit an indication that their reported problem appears resolved without directly changing the official ticket status to Resolved or Closed.

### IT Staff Capabilities
- **FR-09 (Staff Ticket Queue)**: IT Staff shall be able to retrieve a paginated queue of all tickets in the system, with search (by ticket number or summary), filters (by status, category, requested priority, IT priority, owner), and sorting.
- **FR-10 (Ticket Ownership Assignment)**: IT Staff shall be able to claim unassigned tickets or reassign tickets to any active IT Staff member.
- **FR-11 (IT Priority Management)**: IT Staff shall be able to set or update the ticket's `IT Priority` independently from the Requester's `Requested Priority`.
- **FR-12 (Ticket Status Transition)**: IT Staff shall be able to advance tickets through permitted workflow statuses adhering to the official status transition matrix.
- **FR-13 (Internal Notes)**: IT Staff shall be able to create and view confidential Internal Notes on tickets (hidden from Requesters and Admins).

### Administrator Capabilities
- **FR-14 (User Management Overview)**: Administrators shall be able to view a list of all user accounts, search by name or email, and filter by role.
- **FR-15 (User Account Lifecycle)**: Administrators shall be able to create new user accounts with one permitted role and an initial password, update account details, toggle active/deactive status, and issue a new initial password requiring change on next login.

---

## 4.1 Central Authorization Matrix

The table below defines the baseline role-based access permissions across all system operations, strictly separating IT Staff ticketing from Administrator user management:

| Operation | Requester | IT Staff | Administrator | Enforcement & Security Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Authenticate (Login)** | ✅ | ✅ | ✅ | Active accounts with valid password only (BR-01) |
| **First-Login Password Change** | ✅ | ✅ | ✅ | Mandatory when `mustChangePassword = true` (BR-02) |
| **Retrieve Current User (`/me`)** | ✅ | ✅ | ✅ | Returns authenticated user profile and role (FR-03) |
| **Logout & Token Revocation** | ✅ | ✅ | ✅ | Increments `tokenVersion` server-side (FR-04) |
| **Create Support Ticket** | ✅ | ❌ (403) | ❌ (403) | Assigned to `req.user.id` as requester (BR-03) |
| **View Owned Tickets List** | ✅ | ❌ (403) | ❌ (403) | Returns only tickets matching `requesterId = req.user.id` |
| **View Owned Ticket Detail** | ✅ | ❌ (403) | ❌ (403) | Access blocked for other users' tickets (403 Forbidden) |
| **Manage Attachments (Upload/Soft-Delete)** | ✅ (Owned) | ✅ | ❌ (403) | Requesters manage owned ticket files; IT Staff manage ticket files in queue; Admin forbidden (BR-03) |
| **View IT Staff Ticket Queue** | ❌ (403) | ✅ | ❌ (403) | Full system queue; Admin forbidden (Handout §4.3) |
| **View Any Ticket Detail (Staff View)**| ❌ (403) | ✅ | ❌ (403) | Includes operational controls and internal notes |
| **Claim Ticket Ownership** | ❌ (403) | ✅ | ❌ (403) | Assigns current staff member as owner (BR-10) |
| **Reassign Ticket Ownership** | ❌ (403) | ✅ | ❌ (403) | Assigns to any active IT Staff user (BR-10) |
| **Update IT Priority** | ❌ (403) | ✅ | ❌ (403) | Modifies `itPriority`; preserves `requestedPriority` |
| **Execute Ticket Status Transition** | ❌ (403) | ✅ | ❌ (403) | Validated against permitted 8-status matrix (BR-12) |
| **Mark "Problem Appears Resolved"** | ✅ (Owned)| ❌ (403) | ❌ (403) | Sets informational flag; does not alter status (BR-13) |
| **View Public Comments** | ✅ (Owned)| ✅ | ❌ (403) | Visible to Requester owner and IT Staff only (BR-06) |
| **Post Public Comment** | ✅ (Owned)| ✅ | ❌ (403) | Append-only; author recorded from session (BR-08) |
| **View Internal Notes** | ❌ (403) | ✅ | ❌ (403) | **Confidential**: Staff-only; zero note leaked (BR-07) |
| **Post Internal Note** | ❌ (403) | ✅ | ❌ (403) | Restricted to IT Staff; append-only (BR-07, BR-08) |
| **View User Management List** | ❌ (403) | ❌ (403) | ✅ | Admin-only; non-admins receive 403 Forbidden |
| **Create User Account** | ❌ (403) | ❌ (403) | ✅ | Single role; initial password; checks email uniqueness |
| **Update User Profile / Active Status**| ❌ (403) | ❌ (403) | ✅ | Protected by self-deactivation & last admin guards |
| **Reset Initial Password** | ❌ (403) | ❌ (403) | ✅ | Sets `mustChangePassword = true` for target user |

---

## 4.2 FR $\rightarrow$ BR $\rightarrow$ AC Traceability Mapping

Every functional requirement maps explicitly to corresponding business rules and testable acceptance criteria with zero gaps:

| FR ID | Functional Requirement Summary | Governing Business Rules | Mapped Acceptance Criteria | Covering Automated Tests |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | User Authentication with credentials | `BR-01`, `BR-04`, `BR-05` | `AC-01`, `AC-05` | `API-01`, `API-02`, `API-03`, `UI-01`, `UI-02`, `E2E-01` |
| **FR-02** | Mandatory First-Login Password Change | `BR-02`, `BR-05` | `AC-02` | `API-04`, `API-05`, `UI-03`, `E2E-02`, `UNIT-01` |
| **FR-03** | Current User Profile (`/me`) Retrieval | `BR-01`, `BR-03` | `AC-17` | `API-19` |
| **FR-04** | Logout & Token Revocation via `tokenVersion` | `BR-01`, `BR-04` | `AC-18` | `API-20`, `E2E-01`, `UNIT-06` |
| **FR-05** | Role-Based Navigation Presentation | `BR-03`, `BR-14` | `AC-19` | `UI-10`, `E2E-01`, `E2E-03`, `E2E-06` |
| **FR-06** | Authenticated Ticket & Attachment Management | `BR-03` | `AC-03`, `AC-20` | `API-06`, `API-21`, `E2E-07` |
| **FR-07** | Requester Public Comments Posting/Reading | `BR-06`, `BR-08`, `BR-09` | `AC-10` | `API-12`, `UI-07`, `E2E-04`, `E2E-05` |
| **FR-08** | Indicate Problem Appears Resolved | `BR-13` | `AC-21` | `API-22`, `UI-11`, `E2E-09` |
| **FR-09** | IT Staff Ticket Queue with Querying | `BR-10`, `BR-11`, `BR-12` | `AC-06`, `AC-15` | `API-07`, `API-08`, `UI-04`, `UI-05`, `E2E-03` |
| **FR-10** | Claim & Reassign Ticket Ownership | `BR-10` | `AC-07` | `API-09`, `UI-06`, `E2E-04` |
| **FR-11** | Manage IT Priority independently | `BR-11` | `AC-08` | `API-10`, `UI-06`, `E2E-04`, `UNIT-04` |
| **FR-12** | Permitted Ticket Status Transitions | `BR-12` | `AC-09` | `API-11`, `UI-06`, `E2E-04`, `UNIT-02` |
| **FR-13** | Confidential Internal Notes Creation/View | `BR-07`, `BR-08`, `BR-09` | `AC-04` | `API-13`, `UI-07`, `E2E-05` |
| **FR-14** | Admin User List Retrieval with Search/Filter | `BR-14`, `BR-18` | `AC-11`, `AC-15` | `API-14`, `API-18`, `UI-08`, `E2E-06`, `UNIT-03` |
| **FR-15** | Admin User Account Creation, Edit & Password Reset | `BR-14`, `BR-15`, `BR-16`, `BR-17`, `BR-18` | `AC-11`, `AC-12`, `AC-13`, `AC-14` | `API-14`, `API-15`, `API-16`, `API-17`, `UI-08`, `UI-09`, `E2E-06`, `UNIT-05` |
| *(Cross)* | Cross-Viewport Responsive & Zero Overflow | `BR-19` | `AC-16` | `E2E-08` |

---

## 5. Business Rules

### Authentication & Security
- **BR-01 (Active User Credential Check)**: Only an active user (`isActive = true`) with valid matching credentials may authenticate. Deactivated accounts must be rejected with safe error feedback without disclosing whether the account exists or is disabled.
- **BR-02 (Mandatory First-Login Enforcement & API Blocking)**: A user marked with `mustChangePassword = true` cannot access normal application views or functional endpoints. All protected functional routes enforce this rule; any attempt by an authenticated user with `mustChangePassword === true` to invoke functional endpoints (tickets, comments, notes, admin users) is rejected with HTTP `403 Forbidden` (`{ "error": "Password change required before accessing application features.", "code": "PASSWORD_CHANGE_REQUIRED" }`). The only exempted routes are `POST /api/auth/change-password`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- **BR-03 (Authenticated Ownership & Access Control)**: The authenticated session identity, not any client-supplied `requesterId`, strictly determines the ownership of Requester operations. Requesters are strictly confined to tickets and attachments they own. IT Staff possess operational access across the system ticket queue including viewing and managing attachments. Cross-user ticket inspection, editing, or attachment manipulation by other unauthorized requesters or administrators must be rejected with HTTP 403 Forbidden.
- **BR-04 (Cryptographic Password Storage & Token Revocation)**: Passwords must never be stored, logged, or returned in plaintext. Passwords must be salted and hashed with bcrypt ($\ge 10$ rounds). Authentication uses JWT tokens signed with a server secret. Token revocation on logout is enforced via a numeric `tokenVersion` field on the `User` model; incrementing this version invalidates all outstanding tokens issued prior to logout.
- **BR-05 (Password Complexity Rules)**: Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.

### Communication & Collaboration
- **BR-06 (Public Comments Visibility)**: Public Comments are visible to the ticket Requester and IT Staff. Administrators do not participate in ticket communication.
- **BR-07 (Internal Notes Confidentiality)**: Internal Notes are strictly confidential and visible only to IT Staff. Requests by Requesters or Administrators to retrieve or post Internal Notes must return HTTP 403 Forbidden with zero note metadata leaked.
- **BR-08 (Append-Only Records)**: Public Comments and Internal Notes are append-only. No editing or deletion of comments or notes is permitted. Each entry must record the backend-derived author identity and creation timestamp.
- **BR-09 (Non-Empty Content Constraint)**: Comments and notes must contain non-whitespace text, with a minimum length of 2 characters and a maximum length of 2,000 characters.

### Ticket Ownership, Priority & Workflow
- **BR-10 (Ticket Ownership)**: A ticket may have zero or one primary Ticket Owner. Only an active user with `role = IT_STAFF` may be assigned as Ticket Owner.
- **BR-11 (Priority Separation & Initialization)**: `Requested Priority` is immutably preserved as submitted by the Requester. For every newly created ticket (via `POST /api/tickets`), the application service layer shall explicitly initialize `itPriority` to the exact value of `requestedPriority`. In the database, existing tickets are backfilled from `requestedPriority`, and the `itPriority` column is enforced as `NOT NULL`. After creation, `itPriority` may subsequently be modified independently only by IT Staff.
- **BR-12 (Permitted Statuses & Transitions)**: The system enforces 8 official ticket statuses. Below is the canonical mapping between the database ENUM, API values, and UI display badges:

| Canonical Enum (`TicketStatus`) | UI Display Label / Badge | Transition Category | Description |
| :--- | :--- | :--- | :--- |
| `NEW` | `New` | Initial | Initial status assigned automatically upon ticket submission |
| `OPEN` | `Open` | Active | Acknowledged ticket, queued for triage or assignment |
| `IN_PROGRESS` | `In Progress` | Active | Actively being investigated by assigned IT Staff |
| `WAITING_FOR_REQUESTER` | `Waiting for Requester` | Paused | Paused pending information from the ticket requester |
| `RESOLVED` | `Resolved` | Concluded | Work completed by IT Staff; awaiting final closure or reopen |
| `CLOSED` | `Closed` | Terminal | Formally verified and closed; no further transitions allowed |
| `REOPENED` | `Reopened` | Active | Reopened from Resolved status due to persisting issue |
| `CANCELLED` | `Cancelled` | Terminal | Cancelled by IT Staff; no further transitions allowed |

  - **Allowed State Transitions**:
    - `NEW` $\rightarrow$ `OPEN`, `IN_PROGRESS`, `CANCELLED`
    - `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
    - `CLOSED` $\rightarrow$ (Terminal state; immutable)
    - `REOPENED` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `CANCELLED` $\rightarrow$ (Terminal state; immutable)

- **BR-13 (Requester Resolution Limitation)**: A Requester cannot directly transition a ticket to `RESOLVED` or `CLOSED`. They may only set an informational flag `problemAppearsResolved = true` which alerts the assigned IT Staff.

### Administrator Safety Rules
- **BR-14 (Single Role Assignment)**: Each user must be assigned exactly one role from: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
- **BR-15 (Unique Email Constraint)**: Every user account must possess a unique email address. Duplicates must be rejected with HTTP 409 Conflict.
- **BR-16 (Self-Deactivation Prevention)**: An Administrator is strictly forbidden from deactivating their own currently authenticated account.
- **BR-17 (Last Active Admin Guard)**: The system must prevent deactivating or demoting the last remaining active Administrator in the system.
- **BR-18 (Deactivation Over Deletion)**: User accounts are never deleted from the database. Soft deactivation (`isActive = false`) is enforced to maintain historical integrity of tickets, comments, and notes.

### Layout & Responsive Rules
- **BR-19 (Zero Horizontal Overflow)**: All application views must adapt fluidly across viewports without horizontal scrollbars (`scrollWidth === clientWidth`).

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

## 7. Data Changes, Migration & Verification Strategy

### 7.1 Pre-Migration Safety & Backup
Prior to executing database migrations, create a complete physical database dump of the Lab 2 PostgreSQL instance:
```bash
pg_dump -U postgres -d toktickit > backup_lab2_pre_migration.sql
```

### 7.2 Explicit Migration Procedure & Password Hashing
The database migration evolves `RequesterUser` into `User` without data loss through the following explicit SQL / Prisma steps:

```sql
-- Step 1: Create Role Enum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- Step 2: Alter RequesterUser table or rename to User
ALTER TABLE "RequesterUser" RENAME TO "User";

-- Step 3: Add new columns with initial nullable/default states
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'REQUESTER';
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Populate passwordHash for all existing migrated Requesters
-- Precomputed bcrypt hash of default temporary development password: 'Password123!'
-- Hash generated with salt rounds = 10: $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
UPDATE "User"
SET "passwordHash" = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    "mustChangePassword" = true
WHERE "passwordHash" IS NULL;

-- Step 5: Enforce NOT NULL constraint on passwordHash
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Step 6: Add Ticket operational fields
ALTER TABLE "Ticket" ADD COLUMN "itPriority" "Priority";
ALTER TABLE "Ticket" ADD COLUMN "problemAppearsResolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ticket" ADD COLUMN "ticketOwnerId" INTEGER;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketOwnerId_fkey" FOREIGN KEY ("ticketOwnerId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Step 7: Backfill itPriority for all existing tickets from requestedPriority (BR-11)
UPDATE "Ticket" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;

-- Step 8: Enforce NOT NULL constraint on itPriority
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET NOT NULL;
```

### 7.3 Entity Mapping: `RequesterUser` $\rightarrow$ `User`

| Old Field (`RequesterUser`) | New Field (`User`) | Type | Migration Rule / Assigned Value |
| :--- | :--- | :--- | :--- |
| `id` | `id` | `Int` (PK) | Preserved 1:1 to maintain Ticket foreign key integrity |
| `name` | `name` | `String` | Preserved 1:1 |
| `email` | `email` | `String` (Unique)| Preserved 1:1; duplicates blocked |
| `department` | `department` | `String?` | Preserved 1:1 (nullable) |
| `isActive` | `isActive` | `Boolean` | Preserved 1:1 (`default: true`) |
| `createdAt` | `createdAt` | `DateTime` | Preserved 1:1 |
| *(New)* | `passwordHash` | `String` | Migrated users get bcrypt hash of `Password123!` |
| *(New)* | `role` | `Role` (ENUM) | Assigned `REQUESTER` for all existing Lab 2 records |
| *(New)* | `mustChangePassword` | `Boolean` | Explicitly set to `true` (forces first-login password change) |
| *(New)* | `tokenVersion` | `Int` | Set to `1` (incremented upon logout for token invalidation) |
| *(New)* | `updatedAt` | `DateTime` | Set to migration timestamp |

### 7.4 Post-Migration Verification Checklist
Run an automated verification query script after migration:
1. **Row Count Match**: Prior to executing the migration script, record the pre-migration count via `SELECT COUNT(*) FROM "RequesterUser"`. Post-migration, verify that `SELECT COUNT(*) FROM "User"` equals the recorded pre-migration count plus any newly seeded staff/admin users.
2. **Foreign Key Integrity**: `SELECT COUNT(*) FROM "Ticket" WHERE "requesterId" NOT IN (SELECT id FROM "User")` must equal `0`.
3. **Attachment Integrity**: Count of attachments linked to tickets must match pre-migration count.
4. **Password Compliance**: `SELECT COUNT(*) FROM "User" WHERE "passwordHash" IS NULL` must equal `0`.
5. **Rollback Strategy**: If migration fails or integrity checks fail, drop newly altered tables and restore from `backup_lab2_pre_migration.sql`.

### 7.5 Evolved Prisma Schema

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
  tokenVersion       Int              @default(1)
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
  itPriority             Priority
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
*(Refer to [`api-spec.md`](./api-spec.md) for full payload schemas, standardized error objects, and status codes)*

- **Auth APIs**:
  - `POST /api/auth/login`: Authenticate email/password $\rightarrow$ `{ token, user }`.
  - `POST /api/auth/logout`: Invalidate session by incrementing user's `tokenVersion`.
  - `GET /api/auth/me`: Current user profile.
  - `POST /api/auth/change-password`: Update password and clear `mustChangePassword` flag.
- **IT Staff Queue API**:
  - `GET /api/staff/tickets`: Paginated ticket query with search, filters, and sorting (Restricted to `IT_STAFF`; Requester and Administrator get 403 Forbidden).
- **IT Staff Detail & Operations APIs**:
  - `GET /api/staff/tickets/:id`: Detailed ticket view with comments, notes, attachments (`IT_STAFF` only).
  - `PATCH /api/staff/tickets/:id/claim`: Assign current staff user as owner.
  - `PATCH /api/staff/tickets/:id/assign`: Reassign ticket owner to another active IT Staff.
  - `PATCH /api/staff/tickets/:id/priority`: Update `itPriority`.
  - `PATCH /api/staff/tickets/:id/status`: Transition `currentStatus`.
- **Comments & Notes APIs**:
  - `GET /api/tickets/:id/comments` & `POST /api/tickets/:id/comments`: Public comments (Requester owner and IT Staff).
  - `GET /api/tickets/:id/notes` & `POST /api/tickets/:id/notes`: Internal notes (`IT_STAFF` only; Requester and Admin get 403 Forbidden).
  - `PATCH /api/requester/tickets/:id/resolve-indication`: Requester mark problem resolved.
- **Admin User Management APIs**:
  - `GET /api/admin/users`: Query user list (`ADMINISTRATOR` only).
  - `POST /api/admin/users`: Create user with 1 role and initial password.
  - `PATCH /api/admin/users/:id`: Edit user details / active status.
  - `POST /api/admin/users/:id/reset-password`: Set new initial password.

---

## 9. Acceptance Criteria

- **AC-01 (Valid Authentication)**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity, role, and valid JWT token.
- **AC-02 (Mandatory Password Change)**: Given a user who must change the initial password (`mustChangePassword = true`), when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03 (Requester Ticket Ownership Isolation)**: Given an authenticated Requester, when querying tickets, then the backend strictly applies `req.user.id` and returns only owned tickets, rejecting requests to inspect other users' tickets with HTTP 403 Forbidden.
- **AC-04 (Internal Note Confidentiality)**: Given a Requester or Administrator account, when an Internal Note endpoint is requested, then the operation is rejected with HTTP 403 Forbidden without exposing note content or metadata.
- **AC-05 (Invalid Credentials & Inactive Safety)**: Given invalid credentials or a deactivated user account, when attempting to log in, then the request fails with HTTP 401 and displays a generic safe error message.
- **AC-06 (Staff Ticket Queue Retrieval)**: Given an authenticated IT Staff user, when accessing the queue, then all system tickets are returned with accurate search, filter, and pagination metadata.
- **AC-07 (Ticket Ownership Claim & Reassign)**: Given an open ticket, when an active IT Staff claims or reassigns the ticket, then the ticket's owner is updated to that staff member and reflected in the UI.
- **AC-08 (IT Priority Update)**: Given a ticket, when an IT Staff updates the IT Priority, then the value updates while preserving the original Requested Priority.
- **AC-09 (Status Transition Enforcement)**: Given a ticket in `IN_PROGRESS` status, when attempting an invalid transition (e.g. directly to `CLOSED`), then the backend rejects the change with HTTP 400 Bad Request according to permitted status transitions.
- **AC-10 (Public Comments Communication)**: Given a ticket, when either the Requester or IT Staff posts a Public Comment, then the comment appears in the ticket timeline for both users.
- **AC-11 (Admin User Creation)**: Given an Administrator, when creating a new user with email, name, single role, and initial password, then the user is stored with `mustChangePassword = true` and can authenticate.
- **AC-12 (Duplicate Email Rejection)**: Given an attempt to create or update a user with an existing email address, then the request fails with HTTP 409 Conflict and clear field validation feedback.
- **AC-13 (Admin Self-Deactivation Guard)**: Given an Administrator, when attempting to deactivate their own account, then the request is blocked by backend safety validation.
- **AC-14 (Last Admin Protection Guard)**: Given only one active Administrator remains in the system, when attempting to deactivate or demote that user, then the system rejects the operation.
- **AC-15 (Non-Admin User Management Blockage & Non-Staff Queue Blockage)**: Given an authenticated user with an unauthorized role (Requester or Staff on Admin routes, or Requester or Admin on Staff Queue), access is denied with HTTP 403 Forbidden.
- **AC-16 (Cross-Viewport Responsive & Zero Overflow)**: Given any screen across Desktop ($1280\times800$), Tablet ($768\times1024$), and Mobile ($375\times667$), when rendered, then layouts transform smoothly (table to cards) and enforce `scrollWidth === clientWidth` with zero horizontal overflow.
- **AC-17 (Current User Profile Retrieval)**: Given an authenticated session, when `GET /api/auth/me` is requested, then the user's profile and assigned role are returned; when unauthenticated, HTTP 401 is returned.
- **AC-18 (Token Revocation on Logout)**: Given an authenticated user who logs out via `POST /api/auth/logout`, when subsequent requests are made using the prior JWT token, then the server rejects the token with HTTP 401 Unauthorized due to `tokenVersion` mismatch.
- **AC-19 (Role-Based Navigation Rendering)**: Given an authenticated user, when viewing the application shell, then only links permitted for the user's role are visible in the navigation bar.
- **AC-20 (Requester Attachment Ownership Isolation)**: Given an attachment on a ticket owned by Requester A, when Requester B attempts to upload, download, or soft-remove it, then the request is rejected with HTTP 403 Forbidden.
- **AC-21 (Requester Resolution Indication)**: Given an authenticated Requester who owns a ticket, when they submit an indication that the problem appears resolved (`PATCH /api/requester/tickets/:id/resolve-indication`), then `problemAppearsResolved` is set to `true` while the official ticket status remains unchanged; when a non-owner Requester, IT Staff, or Administrator attempts this action, the request is rejected with HTTP 403 Forbidden.

---

## 10. Definition of Done (DoD)

### 10.1 Issue 12 (#34) Documentation Gate Definition of Done (PR #42 Gate)
- [ ] Specification document (`specification.md`) completed covering all 11 sections, 15 FRs, 19 BRs, 21 ACs, central Authorization Matrix (with strict separation of duties), and explicit FR $\rightarrow$ BR $\rightarrow$ AC traceability.
- [ ] REST API specification (`api-spec.md`) defines concrete endpoints, JWT Bearer + `tokenVersion` logout mechanism, and standardized safe error schemas (400, 401, 403, 404, 409).
- [ ] UI specification (`ui-spec.md`) specifies Apple-style Zen Green design tokens, responsive breakpoints, screen mock structures, and visual inspection checklist.
- [ ] Test plan (`tests.md`) maps all 21 Acceptance Criteria (including AC-16 to AC-21) to the test matrix without gaps.
- [ ] AI collaboration agreement (`ai-collaboration-guide.md`) documents 10 engineering rules, including Git manual execution and past-issue immutability.
- [ ] Pull Request #42 opened from `docs/lab3-spec-and-test-plan` to `lab3-staging` and approved by peer reviewer.

> [!NOTE]
> **Living Documents Lifecycle**: `docs/lab-03/ai-use.md` and `docs/lab-03/reviewer.md` are initialized in Issue 12 (#34) as living project artifacts containing baseline structural metadata. They are continuously maintained in real-time throughout the sprint and finalized during Issue 19 (#41) (Sprint Review, Documentation & Release Integration). Their placeholder status in PR #42 is intended.

### 10.2 Sprint 3 Product Definition of Done (Final Sprint Completion Gate)
- [ ] All 8 sprint GitHub Issues (Issue 12 (#34) through Issue 19 (#41)) are implemented on dedicated feature branches and merged into `lab3-staging` via peer-reviewed Pull Requests.
- [ ] All Acceptance Criteria (AC-01 through AC-21) have corresponding automated test coverage and pass 100%.
- [ ] Database migration safely migrates `RequesterUser` to `User` (applying password hashes and `mustChangePassword = true`), establishes `PublicComment`, `InternalNote`, and updates `Ticket` without data loss.
- [ ] Idempotent seed data loads $\ge 4$ active Requesters, $\ge 1$ inactive Requester, $\ge 3$ active IT Staff, $\ge 1$ inactive IT Staff, $\ge 1$ active Admin, and realistic ticket history.
- [ ] Zero TypeScript diagnostic errors and zero build errors across `client` and `server`.
- [ ] Responsive design verified across Desktop ($1280\times800$), Tablet ($768\times1024$), and Mobile ($375\times667$) with zero horizontal overflow.
- [ ] All documentation deliverables completed in `docs/lab-03/`: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`.
- [ ] Final release PR merged from `lab3-staging` into `main` with all CI checks green.

---

## 11. Assumptions and Decisions
- **Authentication & Invalidation**: We select **stateless Bearer JWT tokens with a numeric `tokenVersion` stored on the `User` record**. Upon login, the token is issued with `tokenVersion`. Upon `POST /api/auth/logout`, the server increments `user.tokenVersion`, instantly invalidating any token issued prior to logout.
- **Separation of Duties**: In accordance with Handout §4.3, Administrator accounts are strictly limited to user management and cannot perform IT ticketing operations (Staff Queue, Claim/Assign, Priority, Status, Internal Notes).
- **Canonical Enums vs Display Values**: The system uses UPPERCASE snake_case enums (`IN_PROGRESS`, `WAITING_FOR_REQUESTER`, etc.) in Prisma and API JSON payloads, mapped to Title Case display labels (`In Progress`, `Waiting for Requester`, etc.) in the Zen Green UI.
- **Development Credentials**: Initial passwords for seeded accounts are set to a standard documented format (`Password123!`) with `mustChangePassword = true` for new/initial accounts.
- **Append-Only Communication**: No edit or delete routes are provided for Public Comments or Internal Notes to enforce auditable service records.
