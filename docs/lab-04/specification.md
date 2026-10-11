# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal
Complete the core TokTickIT service-desk system by implementing the parent-child Actions Taken work-tracking structure, enforcing authoritative backend Ticket resolution rules and stale-update conflict protection, delivering role-appropriate operational dashboards with accessible drill-down capabilities for Requesters, IT Staff, and Administrators, and performing comprehensive full-stack hardening and regression verification across all features delivered in Labs 1 through 3 under the Zen Green design system.

---

## 2. Stakeholder Request Interpretation & Separation of Concerns
The service desk has established reliable communication between Requesters and IT Staff via public comments and internal notes, but operations lack a structured, reliable mechanism to plan, execute, and audit concrete IT activities on tickets. 
The stakeholder requires:
1. **Actions Taken Under Each Ticket**: An append-friendly log recording concrete work activities performed by IT Staff members and Administrators. Each entry must track Action Date/Time, Action Description, Result, Performed by (auto-populated from authenticated session), Follow-Up Required flag, Follow-Up Note (strictly mandatory when follow-up is needed), and Attachment Notes referencing external diagnostic evidence or screenshots.
2. **Clear Coordination vs. Execution Responsibility**: A Ticket has a single designated Ticket Owner responsible for overall coordination, but distinct IT Staff members or Administrators may execute individual actions and record them under Actions Taken.
3. **Resolution Gate Enforcement**: While Requesters may indicate that a reported issue appears resolved, this indication remains purely advisory. Only authorized IT Staff and Administrators can formally review work and transition a ticket to `RESOLVED` or `CLOSED`.
4. **Role-Appropriate Operational Dashboards**: Concise, actionable dashboards summarizing authoritative metrics for Requesters (owned tickets, pending feedback, recent resolutions), IT Staff (unassigned queue, personal assignments, status/priority breakdown), and Administrators (operational health and user distribution), equipped with direct drill-down links into filtered queues without replacing detailed list views.
5. **System Hardening & Zen Green Continuity**: Polishing responsiveness, keyboard accessibility, safe failure feedback, and guaranteeing zero regressions across authentication, ticket operations, comments, internal notes, attachments, and user administration.

---

## 3. Scope

### Included
- **Actions Taken Foundation & Operations**:
  - Relational `ActionTaken` model linked directly to `Ticket` ($1:N$) and `User` (actor).
  - Backend endpoints for listing, creating, and updating Actions Taken.
  - Automatic attribution of `performedById` from the authenticated session.
  - Mandatory conditional validation enforcing non-empty `followUpNote` when `isFollowUpRequired === true`.
  - Role-based access control: Requesters view Actions Taken on owned tickets in read-only mode; IT Staff and Administrators create and edit actions.
- **Ticket Workflow Hardening & Resolution Gate**:
  - Authoritative backend enforcement of the 8-state transition matrix (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
  - Strict restriction: only `IT_STAFF` and `ADMINISTRATOR` can transition tickets to `RESOLVED` or `CLOSED`.
  - Requester "Problem Appears Resolved" flag remains purely advisory without mutating `currentStatus`.
  - Optimistic concurrency / stale-update detection via `updatedAt` validation returning `HTTP 409 Conflict`.
- **Role-Appropriate Dashboards**:
  - Requester Dashboard API & UI: My Open Tickets, Waiting for Requester, Resolved Tickets, Recent Tickets list, Quick Actions, and drill-down navigation to pre-filtered `MyTickets`.
  - IT Staff Dashboard API & UI: Unassigned Tickets, My Assigned Tickets, Status breakdown, IT Priority breakdown, Recent Queue Tickets, Quick Actions, and drill-down navigation to pre-filtered `StaffTicketQueue`.
  - Administrator Dashboard: Operational queue reuse plus concise user account distribution metrics.
- **Database Evolution & Seed Data**:
  - Non-destructive Prisma migration adding `ActionTaken` while preserving all legacy records.
  - Idempotent seed script populating tickets with 0, 1, and multiple Actions Taken, varied performers, and non-zero/zero dashboard metric sets.
- **Final Hardening & Regression**:
  - Full automated regression test suites covering Labs 1, 2, and 3.
  - Apple-style Zen Green UI adherence, responsive audits across Desktop, Tablet, and Mobile ($scrollWidth === clientWidth$).
  - Removal of placeholder elements, dead links, and console errors.

### Explicitly Excluded
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- Email, SMS, LINE, push, or external notification services.
- Inventory consumption, spare-parts management, purchasing, or cost accounting.
- Time-sheet billing, payroll, or detailed labor-cost calculations.
- Multi-level approval workflows and electronic signatures.
- Advanced business-intelligence report builders, custom query designers, or export warehouses.
- Multi-tenant organizational hierarchies and production-scale cloud operations.
- New unapproved product features beyond the Sprint 4 engineering contract.

---

## 4. Functional Requirements

### Actions Taken
- **FR-01 (Actions Taken Listing)**: The system shall provide an endpoint (`GET /api/tickets/:id/actions`) allowing permitted users to retrieve all Actions Taken for a ticket, ordered deterministically by `actionDateTime ASC, id ASC`.
- **FR-02 (Actions Taken Creation)**: IT Staff and Administrators shall be able to record a new Action Taken under a non-cancelled ticket (`currentStatus != 'CANCELLED'`) via `POST /api/tickets/:id/actions`, specifying description, result, follow-up requirement, follow-up note, and attachment notes. Recording on terminal `CANCELLED` tickets is rejected per BR-11, whereas actions may be added across all other lifecycle statuses including `CLOSED` for post-resolution audit trail.
- **FR-03 (Automated Performer Attribution)**: The system shall automatically record the authenticated user as the performer (`performedById`) upon Action Taken creation; manual override of the performer identity by client payload is prohibited.
- **FR-04 (Follow-Up Conditional Validation)**: The system shall reject any Action Taken creation or update where `isFollowUpRequired` is true but `followUpNote` is empty, contains only whitespace, or has fewer than 3 non-whitespace characters (enforcing a minimum of 3 non-whitespace characters per BR-04).
- **FR-05 (Actions Taken Modification)**: IT Staff and Administrators shall be able to update an existing Action Taken (`PATCH /api/tickets/:id/actions/:actionId`) under an accessible non-cancelled ticket (`currentStatus != 'CANCELLED'`). Modifying Actions Taken on terminal `CANCELLED` tickets is rejected per BR-11. Deletion of Actions Taken is strictly prohibited to preserve an append-only audit log.
- **FR-06 (Requester Read-Only Access)**: Requesters shall be able to view all Actions Taken on tickets they own, but shall be strictly blocked from creating or modifying Actions Taken.

### Ticket Lifecycle & Workflow
- **FR-07 (Authoritative Resolution Gate)**: Only IT Staff and Administrators shall be authorized to transition a ticket to `RESOLVED` or `CLOSED`. Direct requests by Requesters to transition to these statuses shall be rejected with `HTTP 403 Forbidden`.
- **FR-08 (Advisory Resolution Indication)**: A Requester's submission of "Problem Appears Resolved" shall record advisory feedback without altering the official `currentStatus` of the ticket.
- **FR-09 (Permitted Transition Matrix Enforcement)**: The backend shall strictly validate all ticket status transitions against the authorized 8-state transition matrix, rejecting unauthorized state hops with `HTTP 400 Bad Request`.
- **FR-10 (Mandatory Concurrency Control & Stale-Update Protection)**: The system shall enforce `expectedUpdatedAt` as a strictly mandatory parameter on all status transitions (`PATCH /api/staff/tickets/:id/status`), verifying it against the current database `updatedAt` timestamp and rejecting missing timestamps with `HTTP 400 Bad Request` and stale/outdated submissions with `HTTP 409 Conflict`.

### Operational Dashboards
- **FR-11 (Requester Dashboard Metrics)**: The system shall provide an endpoint (`GET /api/requester/dashboard`) returning authoritative metrics strictly isolated to the authenticated Requester: `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `resolvedTickets` ("Resolved Tickets"), `closedTickets`, and up to 5 recent tickets (`recentTickets`).
- **FR-12 (IT Staff Dashboard Metrics)**: The system shall provide an endpoint (`GET /api/staff/dashboard`) returning authoritative operational metrics for IT Staff: primary card counts (`newTickets`, `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `myAssignedTickets`), workload indicators (`unassignedTickets`), full 8-status breakdown (`byStatus`), 4-level priority breakdown (`byPriority`), and recent queue tickets (`recentTickets`).
- **FR-13 (Dashboard Drill-Down Navigation & Empty States)**: The frontend shall support interactive drill-down navigation from dashboard metric cards directly to pre-filtered ticket list and queue views, alongside graceful loading indicators and empty states for zero-count metrics.
- **FR-14 (Dashboard Quick Actions)**: Dashboards shall provide contextual shortcut buttons for routine actions (Requester: "Create Ticket", "View All My Tickets"; IT Staff: "Create Ticket", "Search Tickets", "My Assigned Queue"; Administrator: "User Management", "Ticket Queue", "Create Ticket").
- **FR-15 (Administrator Dashboard Metrics)**: The system shall provide an endpoint (`GET /api/admin/dashboard`) returning authoritative operational ticket summaries (`totalActiveTickets`, `unassignedTickets`), recent queue tickets (`recentTickets`), and concise user account statistics (`totalUsers`, `activeUsers`, `inactiveUsers`, and breakdown `byRole`) strictly accessible to Administrators.
- **FR-16 (Regression Continuity & Ticket Reassignment Protection)**: All endpoints, views, and behaviors from Labs 1, 2, and 3 (Categories, Tickets, Attachments, Auth, Comments, Internal Notes, Admin User Management, and rejection of invalid ticket reassignments with `INVALID_OWNER` on inactive/non-IT Staff assignees and `INVALID_STATE` on closed/cancelled tickets) shall function without regression.
- **FR-17 (Zen Green UI Consistency & Responsive Polish for Core Screens)**: All four core application screens (Requester Dashboard `#/dashboard`, IT Staff Dashboard `#/staff-dashboard`, Administrator Dashboard `#/admin-dashboard`, and Ticket Detail with Actions Taken `#/ticket/:id`) shall conform strictly to the Zen Green design system across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports with zero horizontal scrolling ($scrollWidth === clientWidth$), no clipped text, and no colliding interactive controls.

---

## 4.1 Central Authorization Matrix

The table below defines the authoritative role-based access permissions for Sprint 4 operations:

| Operation | Requester | IT Staff | Administrator | Enforcement Mechanism & Error Codes |
| :--- | :---: | :---: | :---: | :--- |
| **View Actions Taken** | ✅ (Owned tickets) | ✅ (All tickets) | ✅ (All tickets) | Backend ownership check; non-owner Requester receives `403 Forbidden` |
| **Create Action Taken** | ❌ (403) | ✅ | ✅ | `requireRole(["IT_STAFF", "ADMINISTRATOR"])` returns `403 Forbidden` |
| **Update Action Taken** | ❌ (403) | ✅ | ✅ | `requireRole(["IT_STAFF", "ADMINISTRATOR"])` returns `403 Forbidden` |
| **Delete Action Taken** | ❌ (405/404) | ❌ (405/404) | ❌ (405/404) | Append-only audit policy: no delete route exists across all roles |
| **Transition Ticket to Resolved/Closed** | ❌ (403) | ✅ | ✅ | Resolution gate in status transition route; returns `403 Forbidden` for Requester |
| **Transition Ticket (Other Valid States)** | ❌ (403) | ✅ | ✅ | Transition matrix route; returns `403 Forbidden` for Requester |
| **Mark Problem Appears Resolved** | ✅ (Owned tickets) | ❌ (403) | ❌ (403) | Advisory endpoint; preserves `currentStatus` |
| **Access Staff Ticket Queue (`#/staff-queue`)** | ❌ (403) | ✅ | ✅ | Accessible to IT Staff and Administrator for triage and operational oversight |
| **Reassign Ticket Owner (`PATCH .../assign`)** | ❌ (403) | ✅ | ❌ (403) | Reassignment target must be active `IT_STAFF` member (`INVALID_OWNER`); reassigning `CLOSED` or `CANCELLED` tickets rejected with `INVALID_STATE` |
| **View Requester Dashboard (`GET .../requester/dashboard`)** | ✅ (Own data only)| ❌ (403) | ❌ (403) | `requireRole("REQUESTER")`; isolated strictly to `req.user.id` |
| **View IT Staff Dashboard (`GET .../staff/dashboard`)** | ❌ (403) | ✅ | ❌ (403) | `requireRole("IT_STAFF")`; returns `403 Forbidden` for Requester and Administrator |
| **View Administrator Dashboard (`GET .../admin/dashboard`)** | ❌ (403) | ❌ (403) | ✅ | `requireRole("ADMINISTRATOR")`; returns `403 Forbidden` for non-administrators |
| **Manage User Accounts** | ❌ (403) | ❌ (403) | ✅ | Restricted strictly to `ADMINISTRATOR` (carried forward from Lab 3) |

---

## 5. Business Rules

### Actions Taken Rules
- **BR-01 (Single Ticket Ownership & Scoped Access)**: Each `ActionTaken` record belongs to exactly one `Ticket`. It cannot be detached or moved between tickets. When updating an existing Action Taken (`PATCH /api/tickets/:id/actions/:actionId`), the backend strictly verifies that `action.ticketId === :id`. If the action does not exist or belongs to another ticket, the backend rejects the request with `HTTP 404 Not Found` (`NOT_FOUND`), preventing cross-ticket leakage and invalid modifications. Actions Taken may be recorded and updated across all non-terminal lifecycle statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`); only terminal `CANCELLED` tickets strictly reject creation and modification per BR-11.
- **BR-02 (Separation of Ticket Owner and Action Performer)**: The `Ticket.ticketOwnerId` coordinates the overall ticket, but an `ActionTaken` may be performed and recorded by any active IT Staff member or Administrator.
- **BR-03 (Automated Performer Assignment)**: The `performedById` field is automatically set to the authenticated user's ID at creation time. Clients cannot specify an alternate performer ID.
- **BR-04 (Mandatory Follow-Up Validation)**: If `isFollowUpRequired === true`, the `followUpNote` field is mandatory and must contain at least 3 non-whitespace characters. If `isFollowUpRequired === false`, `followUpNote` is optional or null. On partial updates (`PATCH`), validation is evaluated against the effective state: if the resulting `isFollowUpRequired` is `true`, any updated `followUpNote` (or existing note if unchanged) must satisfy the minimum 3 non-whitespace character requirement; if `isFollowUpRequired` is updated to `false`, `followUpNote` may be set to null or cleared.
- **BR-05 (Deterministic Ordering, Append-Only & Deletion Invariant)**: Actions Taken records are strictly append-only and ordered deterministically by `actionDateTime ASC, id ASC` (using auto-increment `id` as tie-breaker for concurrent or identical timestamps). Creation timestamps are immutable. Modifications (`PATCH`) are permitted for error corrections, but deletion (`DELETE`) is strictly prohibited across all roles to preserve a complete operational audit log.
- **BR-06 (Read-Only Transparency)**: Requesters have read-only visibility into all Actions Taken on tickets they own to promote service transparency. Internal notes remain hidden in the separate `InternalNote` model.

### Ticket Status & Workflow Rules
- **BR-07 (8-Status Lifecycle Matrix & Transition Delta from Lab 3)**: Tickets strictly follow permitted state transitions across the 8 statuses:
  - `NEW` $\to$ `OPEN`, `CANCELLED`
  - `OPEN` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  - `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` $\to$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` $\to$ `CLOSED`, `REOPENED`
  - `CLOSED` $\to$ `REOPENED`
  - `REOPENED` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `CANCELLED` $\to$ (Terminal state; no transitions permitted)
  
  *Transition Matrix Refinements from Lab 3 Baseline (Approved Sprint 4 Workflow)*:
  1. `NEW` $\to$ `IN_PROGRESS` removed: Tickets must first transition to `OPEN` during initial triage before active remediation begins.
  2. `OPEN` $\to$ `RESOLVED` removed: Tickets must enter `IN_PROGRESS` before resolution to ensure documented diagnostic or remediation work.
  3. `CLOSED` $\to$ `REOPENED` added: Permitted to allow reopening prematurely closed tickets or reoccurring issues without forcing requesters to recreate tickets.
  4. `REOPENED` $\to$ `WAITING_FOR_REQUESTER` added: Reopened tickets frequently require updated diagnostic information from the requester.
  These four refinements represent the authoritative Sprint 4 lifecycle contract approved over Lab 3 baseline rules.
- **BR-08 (Resolution Authority Gate)**: Only authenticated users with role `IT_STAFF` or `ADMINISTRATOR` are permitted to transition a ticket into `RESOLVED` or `CLOSED`.
- **BR-09 (Advisory Requester Indication)**: Setting `problemAppearsResolved = true` indicates user confirmation that their issue seems resolved, but does not alter `currentStatus`. IT Staff or Administrator must formally inspect the ticket and execute the status transition to `RESOLVED`.
- **BR-10 (Mandatory Optimistic Concurrency Protection)**: When transitioning ticket status (`PATCH /api/staff/tickets/:id/status`), the client MUST provide the ticket's known `expectedUpdatedAt` ISO timestamp. The backend evaluates three distinct failure scenarios:
  1. **Missing Parameter**: If `expectedUpdatedAt` is omitted, null, or empty, the backend rejects the request with `HTTP 400 Bad Request` (`VALIDATION_ERROR`).
  2. **Malformed Timestamp**: If `expectedUpdatedAt` is provided but is not a valid ISO-8601 UTC date string, the backend rejects the request with `HTTP 400 Bad Request` (`VALIDATION_ERROR`).
  3. **Stale/Mismatched Timestamp**: If `expectedUpdatedAt` is a valid ISO-8601 string but does not match the database `ticket.updatedAt` timestamp (compared at millisecond precision), the transition is aborted and returns `HTTP 409 Conflict` (`STALE_UPDATE_CONFLICT`) along with `currentUpdatedAt` and actionable conflict resolution instructions.
- **BR-11 (Immutable Terminal State & Scope Boundary)**: `CANCELLED` is an immutable terminal state with no outgoing transitions permitted (BR-07). Within the scope of Sprint 4 operations:
  1. Recording a new Action Taken (`POST /api/tickets/:id/actions`) on a cancelled ticket is rejected with `HTTP 400 Bad Request` (`TICKET_CANCELLED`).
  2. Modifying an Action Taken (`PATCH /api/tickets/:id/actions/:actionId`) on a cancelled ticket is rejected with `HTTP 400 Bad Request` (`TICKET_CANCELLED`).
  3. Status transitions (`PATCH /api/staff/tickets/:id/status`) and advisory resolution indications (`PATCH /api/requester/tickets/:id/resolve-indication`) on a cancelled ticket are rejected with `HTTP 400 Bad Request` (`TICKET_CANCELLED`).
  4. Scope Boundary & Lifecycle Gate Alignment: Within the engineering deliverables and contracts for Sprint 4, immutability of `CANCELLED` tickets is authoritatively enforced on Sprint 4 endpoints: creating Actions Taken (`POST /api/tickets/:id/actions`), updating Actions Taken (`PATCH /api/tickets/:id/actions/:actionId`), status transitions (`PATCH /api/staff/tickets/:id/status`), and advisory resolution indications (`PATCH /api/requester/tickets/:id/resolve-indication`), returning `HTTP 400 Bad Request` (`TICKET_CANCELLED`). For ticket reassignment (`PATCH /api/staff/tickets/:id/assign`), attempting to reassign a ticket whose `currentStatus` is `CLOSED` or `CANCELLED` is strictly rejected with `HTTP 400 Bad Request` (`INVALID_STATE`) per the explicit lifecycle gate specified in api-spec.md §3.3, BR-18, and Handout Part 6 (safeguarded under AC-25, API-15, and server regression suite `REG-01`). Unrelated pre-existing ticket operations established in Labs 1–3 (general ticket metadata viewing, attachments, comments) preserve their baseline behavior and continue to be safeguarded by regression test suites (`REG-01`, `REG-02`, `REG-03`).

### Dashboard Calculation Rules
- **BR-12 (Authoritative Backend Computation)**: All dashboard metrics must be computed server-side via direct SQL/Prisma aggregation (`count()`, `groupBy()`) rather than fetching full ticket collections to the client.
- **BR-13 (Requester Metric Definitions)**:
  - `openTickets` (`My Open Tickets`): Count of tickets where `requesterId = req.user.id` and `currentStatus IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')`.
  - `inProgressTickets` (`In Progress`): Count of tickets where `requesterId = req.user.id` and `currentStatus = 'IN_PROGRESS'`.
  - `waitingForRequesterTickets` (`Waiting for Requester`): Count of tickets where `requesterId = req.user.id` and `currentStatus = 'WAITING_FOR_REQUESTER'`.
  - `resolvedTickets` (`Resolved Tickets`): Count of tickets where `requesterId = req.user.id` and `currentStatus = 'RESOLVED'` (represents all resolved tickets awaiting requester confirmation or closure, without time-interval filtering).
  - `closedTickets` (`Closed`): Count of tickets where `requesterId = req.user.id` and `currentStatus = 'CLOSED'`.
  - `recentTickets` (`My Recent Tickets`): Top 5 tickets owned by requester ordered by `updatedAt DESC`.
- **BR-14 (IT Staff Metric Definitions)**:
  - Primary Metric Cards (5 cards):
    - `newTickets` (`New`): Count of active tickets where `currentStatus = 'NEW'`.
    - `openTickets` (`Open`): Count of active tickets where `currentStatus = 'OPEN'`.
    - `inProgressTickets` (`In Progress`): Count of active tickets where `currentStatus = 'IN_PROGRESS'`.
    - `waitingForRequesterTickets` (`Waiting for Requester`): Count of active tickets where `currentStatus = 'WAITING_FOR_REQUESTER'`.
    - `myAssignedTickets` (`My Assigned`): Count of active tickets where `ticketOwnerId = req.user.id` and `currentStatus NOT IN ('CLOSED', 'CANCELLED')` (strictly scoped to the authenticated IT Staff user; ticket reassignment requires active `IT_STAFF` role).
  - Operational Queue Aggregations:
    - `unassignedTickets` (`Unassigned Queue`): Count of active tickets where `ticketOwnerId IS NULL` and `currentStatus NOT IN ('CLOSED', 'CANCELLED')`.
    - `byStatus`: Complete counts across all 8 lifecycle statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
    - `byPriority`: Counts across all 4 priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) across active tickets.
    - `recentTickets` (`Recent Queue Tickets`): Top 5 active tickets in the system ordered by `updatedAt DESC`.
- **BR-15 (Interactive Drill-Down Mapping)**:
  - Requester Dashboard Drill-Downs:
    - `My Open Tickets` $\to$ `#/my-tickets?status=OPEN_GROUP` (filter preset mapping to all active non-final statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`, matching the server-computed `openTickets` metric count)
    - `In Progress` $\to$ `#/my-tickets?status=IN_PROGRESS`
    - `Waiting for Requester` $\to$ `#/my-tickets?status=WAITING_FOR_REQUESTER`
    - `Resolved Tickets` $\to$ `#/my-tickets?status=RESOLVED`
    - `Closed` $\to$ `#/my-tickets?status=CLOSED`
  - IT Staff Dashboard Drill-Downs:
    - `New` $\to$ `#/staff-queue?status=NEW`
    - `Open` $\to$ `#/staff-queue?status=OPEN`
    - `In Progress` $\to$ `#/staff-queue?status=IN_PROGRESS`
    - `Waiting for Requester` $\to$ `#/staff-queue?status=WAITING_FOR_REQUESTER`
    - `My Assigned` $\to$ `#/staff-queue?owner=me`
    - `Unassigned Queue` $\to$ `#/staff-queue?owner=unassigned`
  - Administrator Dashboard Drill-Downs:
    - `Total Active Tickets` $\to$ `#/staff-queue` (operational active ticket queue)
    - `Unassigned Queue` $\to$ `#/staff-queue?owner=unassigned` (unassigned queue)
    - `Total Users` $\to$ `#/admin-users` (all user management accounts)
    - `Active Users` $\to$ `#/admin-users` (user management accounts)
    - `Inactive Users` $\to$ `#/admin-users` (user management accounts)
- **BR-16 (Safe Empty & Loading States)**: When metric counts are zero or lists/queues are empty, dashboards display descriptive, friendly empty states with appropriate guidance rather than blank areas or raw zeros; asynchronous operations display accessible skeleton or spinner loading indicators without layout shift.
- **BR-17 (Administrator Dashboard Calculation Rules & Access)**:
  - `operational`: Summarizes non-final system tickets (`totalActiveTickets = count(currentStatus NOT IN ('CLOSED', 'CANCELLED'))`, `unassignedTickets = count(ticketOwnerId IS NULL AND currentStatus NOT IN ('CLOSED', 'CANCELLED'))`).
  - `recentTickets`: Top 5 active tickets across the system ordered by `updatedAt DESC` (enabling administrative queue oversight directly from the dashboard).
  - `users`: Computes authoritative account counts from `User` records (`totalUsers`, `activeUsers = count(isActive = true)`, `inactiveUsers = count(isActive = false)`), alongside distribution counts by role (`requester`, `itStaff`, `administrator`).
  - Access is restricted exclusively to authenticated users with role `ADMINISTRATOR`. Requester or IT Staff requests receive `HTTP 403 Forbidden`.

### Ticket Reassignment Rules
- **BR-18 (Ticket Reassignment Invariants & Lifecycle Gates)**: Reassigning ticket ownership (`PATCH /api/staff/tickets/:id/assign`) is restricted to authenticated `IT_STAFF` users and enforces two strict backend validations:
  1. **Active IT Staff Invariant**: The target assignee (`newOwnerId`) must exist, possess role `IT_STAFF`, and have `isActive === true`. Reassigning to an inactive user, a non-existent user, or a user of any role other than `IT_STAFF` is strictly rejected with `HTTP 400 Bad Request` (`INVALID_OWNER`), preserving the Lab 3 assignee protection contract (FR-16, Handout Part 6).
  2. **Lifecycle Gate**: Reassignment is prohibited on terminal tickets. If the ticket's `currentStatus` is `CLOSED` or `CANCELLED`, the request is strictly rejected with `HTTP 400 Bad Request` (`INVALID_STATE`), preventing owner reassignment on resolved or terminated work items (BR-11, api-spec.md §3.3, Handout Part 6).

---

## 6. UI Specification Summary

### Screen Layouts & Design Standards
- **Design Tokens**: Standardized on Apple-style Zen Green design system (`--zg-primary: #006B3C`, `--zg-bg-page: #F5F7F6`, `--zg-surface: #FFFFFF`, `--zg-border: #E2E8F0`, rounded corners 8px–12px, soft elevation shadows).
- **Navigation Bar**: Displays role-appropriate navigation with active state indicator:
  - Requester: `Dashboard`, `My Tickets`, `Create Ticket`, User Profile & Logout.
  - IT Staff: `Dashboard`, `Ticket Queue`, User Profile & Logout.
  - Administrator: `Dashboard`, `User Management`, User Profile & Logout.
  - Default view upon login routes directly to the user's role-appropriate `Dashboard`.

### Actions Taken Section (`ActionsTakenSection.tsx`)
- Located on the Ticket Detail screen directly below Ticket Metadata and above Comments/Notes (`#/ticket/:id`).
- Displays chronological list of action entries:
  - Header: Action Date/Time formatted cleanly, Performed by badge, Follow-Up indicator badge.
  - Body: Action Description and Result summary.
  - Footer: Follow-up Note (rendered with amber accent if required), Attachment Notes reference.
- **IT Staff & Administrator Mode**: Includes "+ Add Action Taken" button opening an inline modal/card. Form includes Date/Time picker (defaults to now), Description textarea, Result textarea, Follow-Up checkbox, dynamic Follow-Up Note input (mandatory when checked), and Attachment Notes input. Includes edit action for recorded items. Deletion is prohibited.
- **Requester Mode**: Purely read-only; Add/Edit buttons and forms are completely omitted.

### Dashboards
- **Requester Dashboard (`RequesterDashboard.tsx`)**:
  - Greeting banner with user's name.
  - Row of 5 primary metric cards: My Open Tickets (`openTickets`), In Progress (`inProgressTickets`), Waiting for Requester (`waitingForRequesterTickets`), Resolved Tickets (`resolvedTickets`), and Closed (`closedTickets`), with interactive drill-down navigation.
  - 2-column lower section: "My Recent Tickets" table/card list on the left, "Quick Actions" panel on the right (Create Ticket, View All My Tickets).
- **IT Staff Dashboard (`StaffDashboard.tsx`)**:
  - Operational summary banner with refresh button.
  - Row of 5 primary metric cards: New (`newTickets`), Open (`openTickets`), In Progress (`inProgressTickets`), Waiting for Requester (`waitingForRequesterTickets`), and My Assigned (`myAssignedTickets`).
  - Secondary workload indicators: Unassigned Queue highlight card (`unassignedTickets`), Full Lifecycle Status Distribution pill badges displaying live counts across all 8 statuses (`byStatus`: New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled), and 4-level Priority distribution badges (`byPriority`: Low, Medium, High, Urgent).
  - 2-column lower section: "Recent Queue Tickets" on the left, "Quick Actions" on the right (Create Ticket, Search Tickets, My Assigned Queue).
- **Administrator Dashboard (`AdminDashboard.tsx`)**:
  - Operational & administrative overview banner with system health and refresh controls.
  - Upper Metric Cards Grid: Operational Queue (`Total Active Tickets`, `Unassigned Queue`) alongside User Statistics (`Total Users`, `Active Users`, `Inactive Users`).
  - User Role Distribution Badges: Live count badges for `Requesters`, `IT Staff`, and `Administrators`.
  - 2-column lower section: "Recent System Queue" list (`recentTickets`) on the left, "Administrative Quick Actions" on the right ("User Management" linking to `#/admin-users`, "Ticket Queue" linking to `#/staff-queue`, "Create Ticket" linking to `#/create-ticket`).
  - Drill-down: Clicking `Total Active Tickets` navigates to `#/staff-queue`; clicking `Unassigned Queue` navigates to `#/staff-queue?owner=unassigned`; clicking User summary cards (`Total Users`, `Active Users`, `Inactive Users`) navigates to `#/admin-users`.

### Responsive Breakpoints
- **Desktop ($1280\text{px}+$ )**: Full multi-column grid layouts, data tables with complete column visibility.
- **Tablet ($768\text{px} - 1024\text{px}$)**: 2-column metric cards, responsive wrapping tables, persistent action buttons.
- **Mobile ($375\text{px} - 767\text{px}$)**: 1-column stacked cards, table-to-card transformation for ticket lists, full-width touch targets ($44\text{px}+$ min height), strict zero horizontal scroll ($scrollWidth === clientWidth$).

---

## 7. Data Changes & Migration Rationale

### 7.1 Prisma Model Increment
```prisma
model ActionTaken {
  id                 Int       @id @default(autoincrement())
  ticketId           Int
  ticket             Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime     DateTime  @default(now())
  actionDescription  String
  result             String
  performedById      Int
  performedBy        User      @relation(fields: [performedById], references: [id])
  isFollowUpRequired Boolean   @default(false)
  followUpNote       String?
  attachmentNotes    String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 7.2 Database Design Decisions & Justifications (Required by Handout §5.1)
1. **Decision 1: Relational Child Model with Cascading Deletion vs. JSON Column**
   - *Rationale*: Modeling `ActionTaken` as a discrete relational entity (`ActionTaken`) rather than a JSON array inside `Ticket` preserves third normal form (3NF), allows foreign key integrity to the `User` table for performer attribution, enables indexed queries on `actionDateTime` and `performedById` for staff workload reporting, and supports Prisma relational validation.
   - *Deletion Invariant & Cascading Policy*: Actions Taken records are strictly append-only in operational workflows; the API exposes no delete endpoint. The Prisma schema configuration `onDelete: Cascade` on the `ticket` relation exists strictly as an infrastructure-level safety mechanism for automated test database cleanup and administrative ticket purges during development. In standard application operation, tickets are never hard-deleted (only transitioned to `CLOSED` or `CANCELLED`), guaranteeing complete preservation of the audit trail.
2. **Decision 2: Optimistic Concurrency Control via Timestamp Validation (`updatedAt`)**
   - *Rationale*: Service desk environments frequently involve multiple staff members reviewing the same ticket queue simultaneously. Using Prisma's automatic `@updatedAt` timestamp as an optimistic concurrency barrier ensures that if Staff Member A modifies a ticket while Staff Member B has the screen open, Staff Member B's stale status transition is rejected with `409 Conflict`, preventing accidental state overwrites without requiring heavy pessimistic database locks.
   - *Concurrency Protection Scope Clarification*: Optimistic concurrency verification (`expectedUpdatedAt`) is strictly mandated for **Ticket Status Transitions** (`PATCH /api/staff/tickets/:id/status`) to guard against state collision during triage and resolution. Actions Taken (`ActionTaken`) are modeled as append-friendly chronological activity logs ($1:N$); edits to existing actions (`PATCH /api/tickets/:id/actions/:actionId`) are audited and tracked via Prisma's model-level `@updatedAt` timestamp and do not trigger concurrency locks on the parent ticket.

### 7.3 Migration, Backfill & Rollback/Recovery Strategy (Required by Handout §5.2)
- **Non-Destructive Forward Migration**: `ActionTaken` is an additive model. All existing tickets, users, attachments, comments, and notes from Labs 1, 2, and 3 remain completely valid without requiring backfill data.
- **Legacy Ticket Handling**: Dashboard calculations and ticket views treat legacy tickets with zero Actions Taken seamlessly using standard SQL outer joins or Prisma relation counts.
- **Migration Recovery and Test Database Isolation**:
  Migration recovery must distinguish between failed migrations and migrations that have already been applied successfully:
  - **Failed migrations**: Inspect the database schema and migration state before recovery. Use `npx prisma migrate resolve --rolled-back <migration_name>` only when the migration is genuinely recorded as failed (`finished_at IS NULL`) and the database schema has been restored (e.g. dropping partially created tables/indexes via `DROP TABLE IF EXISTS "ActionTaken" CASCADE;`) to a state suitable for safely retrying it via `npx prisma migrate deploy`. Verified by automated test suite `MIG-02`.
  - **Successfully applied migrations**: Do not delete or reset records in Prisma's internal `_prisma_migrations` table to force an already-applied migration to run again. Apply a new corrective or compensating migration when a schema change is required in production or staging environments.
  - **Migration testing & verification**: Use an isolated disposable test database with an explicitly prepared baseline schema where all preceding baseline migrations (Labs 1–3) are applied and recorded as successful in `_prisma_migrations`. Verify that `npx prisma migrate deploy` applies the pending migration successfully and preserves existing legacy data (`MIG-01`). Do not manipulate migration history to simulate a fresh migration run.

### 7.4 Required Seed Scenarios Mapping (Required by Handout §5.3)
The idempotent seed script (`prisma/seed.ts`) populates realistic test data covering all five required scenario dimensions (Handout §5.3) plus repeated-run idempotency verification (6 verification categories total). Suite `SEED-01` (`server/tests/lab-04/seed-data.test.ts`) verifies these scenarios directly across repeated runs:

| Seed Scenario Dimension | Seeded Characteristics in `seed.ts` | Target Verification in `SEED-01` & Test Suites |
| :--- | :--- | :--- |
| **1. Lifecycle Statuses** | Seed tickets across all 8 statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`) | `SEED-01` queries and verifies tickets in each of the 8 distinct statuses; further verified by `WF-03` & `API-10` |
| **2. IT Priorities** | Seed tickets across all 4 priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | `SEED-01` queries and verifies tickets in each of the 4 priority levels; further verified by `API-10` |
| **3. Ownership Distribution** | Seed tickets with assigned owner (`ticketOwnerId = staff.id`) and unassigned queue (`ticketOwnerId = null`) | `SEED-01` queries and verifies presence of both assigned and unassigned tickets; further verified by `API-10`, `API-15` |
| **4. Actions Taken Multiplicity** | Seed tickets with exactly 0, 1, and multiple ($\ge 2$) Actions Taken lines with varied staff performers | `SEED-01` asserts tickets with count = 0, count = 1, and count $\ge 2$; further verified by `API-04`, `UI-01a`, `E2E-01` |
| **5. Dashboard Metrics Sets** | Seed active users with non-zero metrics and clean/fresh user accounts with zero metrics | `SEED-01` verifies non-zero counts for active users and zero-count baselines for fresh users; further verified by `API-09`, `API-10`, `UI-05`, `UI-06` empty states |
| **6. Repeated Run Idempotency** | Seed script executed multiple times sequentially (`seed.ts` run 1 $\to$ run 2) | `SEED-01` asserts zero unique constraint/foreign key collisions, and confirms that total record counts remain identical after run 2 |

---

## 8. API Contract Summary (Reference to `api-spec.md`)

| Method | Endpoint | Authorized Roles | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id/actions` | Requester (owner), Staff, Admin | Retrieve chronological list of Actions Taken for ticket | 200, 401, 403, 404 |
| `POST` | `/api/tickets/:id/actions` | IT Staff, Administrator | Create new Action Taken; performer auto-set from session | 201, 400, 401, 403, 404 |
| `PATCH` | `/api/tickets/:id/actions/:actionId` | IT Staff, Administrator | Update details of an existing Action Taken | 200, 400, 401, 403, 404 |
| `PATCH` | `/api/staff/tickets/:id/status` | IT Staff, Administrator | Execute status transition with mandatory concurrency check | 200, 400, 401, 403, 404, 409 |
| `PATCH` | `/api/staff/tickets/:id/assign` | IT Staff | Reassign ticket owner (target must be active IT Staff; ticket cannot be closed/cancelled) | 200, 400 (`INVALID_OWNER`, `INVALID_STATE`), 401, 403, 404 |
| `GET` | `/api/requester/dashboard` | Requester | Retrieve authenticated Requester's 5 summary metrics | 200, 401, 403 |
| `GET` | `/api/staff/dashboard` | IT Staff | Retrieve IT Staff operational queue metrics & breakdowns | 200, 401, 403 |
| `GET` | `/api/admin/dashboard` | Administrator | Retrieve operational queue summary, recent tickets & user counts | 200, 401, 403 |

---

## 9. Acceptance Criteria

- **AC-01**: Given an authenticated IT Staff or Administrator user, when a valid Action Taken is submitted with description and result, it is successfully created with `performedById` automatically set to the authenticated user ID and linked to the correct ticket (FR-02, FR-03, BR-01, BR-02, BR-03).
- **AC-02**: Given an authenticated IT Staff or Administrator user, when an Action Taken is submitted with `isFollowUpRequired = true` but `followUpNote` is empty, contains only whitespace, or has fewer than 3 non-whitespace characters, the backend rejects the request with `HTTP 400 Bad Request` (`VALIDATION_ERROR`) and descriptive validation details: "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed" (FR-04, BR-04).
- **AC-03**: Given an authenticated Requester user, when attempting to create (`POST`) or edit (`PATCH`) an Action Taken via API, the backend rejects the request with `HTTP 403 Forbidden` (FR-06).
- **AC-04**: Given an authenticated Requester user, when viewing an owned ticket, all existing Actions Taken are retrieved via API in chronological order and rendered in read-only format with Add/Edit controls completely omitted (FR-01, FR-06, BR-05, BR-06).
- **AC-05**: Given an authenticated Requester user, when attempting to view Actions Taken on a ticket owned by another requester, the backend returns `HTTP 403 Forbidden` (FR-01).
- **AC-06**: Given an authenticated IT Staff or Administrator user, when updating an existing Action Taken (`PATCH /api/tickets/:id/actions/:actionId`) with valid data, the backend verifies that `action.ticketId === :id` (returning `HTTP 404 Not Found` if mismatched or missing) and updates the record in the database, returning updated fields and `updatedAt` timestamp (FR-05, BR-01, BR-02).
- **AC-07**: Given an authenticated Requester user, when attempting to call the status transition endpoint to change status to `RESOLVED` or `CLOSED`, the backend rejects the request with `HTTP 403 Forbidden` (FR-07, BR-08).
- **AC-08**: Given an authenticated Requester user, when marking "Problem Appears Resolved", the ticket's `problemAppearsResolved` flag is updated to `true`, but `currentStatus` remains unchanged (FR-08, BR-09).
- **AC-09**: Given an authenticated IT Staff or Administrator user, when attempting an invalid status transition (e.g. `NEW` $\to$ `RESOLVED`), the backend rejects the request with `HTTP 400 Bad Request` and descriptive transition error (FR-09, BR-07).
- **AC-10**: Given an authenticated IT Staff or Administrator user, when submitting a status transition with missing or malformed ISO-8601 `expectedUpdatedAt`, the backend rejects the request with `HTTP 400 Bad Request` (`VALIDATION_ERROR`) (FR-10, BR-10).
- **AC-11**: Given an authenticated IT Staff or Administrator user, when submitting a status transition with an outdated or mismatched `expectedUpdatedAt` timestamp, the backend rejects the request with `HTTP 409 Conflict` returning `currentUpdatedAt` (FR-10, BR-10).
- **AC-12**: Given an authenticated Requester user, when calling `GET /api/requester/dashboard`, the response returns authoritative counts for `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `resolvedTickets` ("Resolved Tickets"), `closedTickets`, and `recentTickets` strictly isolated to the user (FR-11, BR-12, BR-13).
- **AC-13**: Given an authenticated IT Staff user, when calling `GET /api/staff/dashboard`, the backend returns `HTTP 200 OK` with accurate queue metrics: primary counts (`newTickets`, `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `myAssignedTickets` reflecting the authenticated staff member's assignments), `unassignedTickets`, full 8-status `byStatus`, 4-level `byPriority`, and up to 5 recent queue tickets (`recentTickets`) strictly adhering to the API contract (FR-12, BR-12, BR-14).
- **AC-14**: Given an authenticated non-IT Staff user (Requester or Administrator), when attempting to call `GET /api/staff/dashboard`, the backend returns `HTTP 403 Forbidden` (FR-12).
- **AC-15a**: Given an authenticated Requester on the Dashboard UI, clicking any summary metric card navigates to the My Tickets view with the corresponding status filter preset (drill-down), including `Resolved Tickets` $\to$ `#/my-tickets?status=RESOLVED` (FR-13, BR-15).
- **AC-15b**: Given an authenticated IT Staff user on the Dashboard UI, clicking any primary metric card or unassigned queue indicator navigates to the Staff Ticket Queue with the corresponding filter preset (drill-down) (FR-13, BR-15).
- **AC-16**: Given an authenticated user on Requester, IT Staff, or Administrator Dashboard UI, the Quick Actions panel renders operational shortcut links (Requester: "Create Ticket", "View All My Tickets"; IT Staff: "Create Ticket", "Search Tickets", "My Assigned Queue"; Administrator: "User Management", "Ticket Queue", "Create Ticket") that navigate directly to target functional views upon click (FR-14, BR-13, BR-14, BR-17).
- **AC-17**: Given the four core responsive screens (Requester Dashboard `#/dashboard`, IT Staff Dashboard `#/staff-dashboard`, Administrator Dashboard `#/admin-dashboard`, and Ticket Detail with Actions Taken `#/ticket/:id`) across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$), zero horizontal scrolling occurs ($scrollWidth === clientWidth$), all interactive controls, cards, and status badges adhere to Zen Green design tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`), and components render without text clipping or overlapping modal/action controls (FR-17).
- **AC-18**: All regression test suites across Labs 1–3 pass 100% without failure: Server regression (`REG-01`) covers categories (`server/tests/lab-01/categories.test.ts`), authentication, ticket creation, ticket queues, attachments, public comments, internal notes, and user management; Client regression (`REG-02`) covers ticket category selection forms (`client/tests/lab-02/CreateTicket.test.tsx`), authentication, navigation, and modal components; and End-to-End regression (`REG-03`) covers core full-stack multi-role browser journeys across Labs 2–3 (FR-16, Handout §8.5).
- **AC-19a**: Given an authenticated Administrator user, when calling `GET /api/admin/dashboard`, the response returns `HTTP 200 OK` with authoritative operational summaries (`totalActiveTickets`, `unassignedTickets`), `recentTickets` (top 5 active tickets in the system ordered by `updatedAt DESC`), and user account distribution metrics (`totalUsers`, `activeUsers`, `inactiveUsers`, `byRole`) (FR-15, BR-17).
- **AC-19b**: Given an authenticated non-administrator user (Requester or IT Staff), when attempting to call `GET /api/admin/dashboard`, the backend rejects the request with `HTTP 403 Forbidden` (FR-15, BR-17).
- **AC-20**: Given an authenticated Administrator on the Dashboard UI, the view renders operational queue indicators (`totalActiveTickets`, `unassignedTickets`), user account statistics (`totalUsers`, `activeUsers`, `inactiveUsers`), role distribution badges (`byRole`), recent system queue list (`recentTickets`), administrative Quick Actions ("User Management" linking to `#/admin-users`, "Ticket Queue" linking to `#/staff-queue`, "Create Ticket" linking to `#/create-ticket`), and interactive drill-downs (clicking `Total Active Tickets` navigates to `#/staff-queue`, clicking `Unassigned Queue` navigates to `#/staff-queue?owner=unassigned`, clicking user statistics navigates to `#/admin-users`), conforming to Zen Green styling without text clipping or overlapping controls (FR-13, FR-14, FR-15, FR-17, BR-15, BR-17).
- **AC-21**: Given an isolated test database prepared with the required legacy schema, representative legacy data, and preceding baseline migrations (Labs 1–3) recorded as applied in `_prisma_migrations`, when the pending migration is deployed using `npx prisma migrate deploy`, then the migration must complete successfully, the expected schema changes (`ActionTaken` table, foreign keys, indexes) must be present, and all required legacy data (`User`, `Ticket`, `Attachment`, `Comment`, `InternalNote`) must remain intact. When testing migration recovery, simulating a failed migration state (`finished_at IS NULL`) is safely resolved by inspecting the schema, performing compensatory cleanup of partial schema remnants (e.g. `DROP TABLE IF EXISTS "ActionTaken" CASCADE;`) to restore the database to a clean pre-migration baseline state suitable for safe retry, executing `npx prisma migrate resolve --rolled-back <migration_name>` to reconcile `_prisma_migrations`, followed by clean re-deployment via `npx prisma migrate deploy`, without manual deletion or resetting of historical records in `_prisma_migrations` (Handout §5.2).
- **AC-22**: Given the execution of the seed script (`prisma/seed.ts`), when run initially and repeatedly (idempotency verification), no duplicate key violations occur, record counts remain consistent, and realistic test data covering all five required scenario dimensions (8 statuses, 4 priorities, assigned/unassigned ownership, 0/1/multiple Actions Taken, zero/non-zero dashboard metrics) plus repeated-run idempotency is populated and verified directly by `SEED-01` (Handout §5.3).
- **AC-23**: Given a ticket in `CANCELLED` terminal status (an immutable terminal state with no outgoing transitions permitted per BR-07 and BR-11), when attempting to create an Action Taken (`POST /api/tickets/:id/actions`), update an Action Taken (`PATCH /api/tickets/:id/actions/:actionId`), transition ticket status (`PATCH /api/staff/tickets/:id/status`), or submit advisory resolution indication (`PATCH /api/requester/tickets/:id/resolve-indication`), the backend rejects the request with `HTTP 400 Bad Request` (`TICKET_CANCELLED`), strictly preventing these four operations while preserving baseline ticket behavior from Labs 1–3 (FR-02, FR-05, FR-08, FR-09, BR-11).
- **AC-24**: Given any dashboard (Requester, Staff, Admin) or Ticket Detail with Actions Taken, when metric counts are zero or lists/queues contain no matching records, user-friendly empty state banners with clear instructional messaging are rendered; while network operations are loading, accessible loading state indicators (spinners or skeleton cards) are displayed without layout shifting (FR-13, BR-16).
- **AC-25**: Given an authenticated IT Staff user attempting to reassign ticket ownership (`PATCH /api/staff/tickets/:id/assign`), the backend enforces two validation gates: (1) if the target assignee (`newOwnerId`) is inactive, non-existent, or has a role other than `IT_STAFF`, the request is rejected with `HTTP 400 Bad Request` (`INVALID_OWNER`); and (2) if the ticket's `currentStatus` is `CLOSED` or `CANCELLED`, the request is rejected with `HTTP 400 Bad Request` (`INVALID_STATE`), fulfilling Handout §14 Part 6, api-spec.md §3.3, and preserving baseline reassignment integrity (FR-16, BR-11, BR-18).
- **AC-26**: Given an Action Taken creation or update request, the backend rigorously validates all provided fields: `actionDescription` (5–2000 chars), `result` (3–2000 chars), `actionDateTime` (valid ISO-8601 UTC date string), and `attachmentNotes` ($\le 500$ chars), returning `HTTP 400 Bad Request` (`VALIDATION_ERROR`) with specific field details on out-of-boundary values (FR-02, FR-04).
- **AC-27**: Given multiple Actions Taken on a ticket, they are strictly immutable with respect to deletion (no `DELETE` route exists), and are returned sorted deterministically by `actionDateTime ASC, id ASC`, ensuring identical stable ordering across repeat queries (FR-01, BR-05).
- **AC-28**: Given a ticket status update form in the frontend UI, when a concurrent update causes the backend to return `HTTP 409 Conflict`, the UI renders a prominent, non-destructive conflict notification banner displaying the updated database timestamp, while strictly preserving the user's uncommitted form inputs so they can review changes and retry without retyping (FR-10, BR-10).

---

## 10. Definition of Done (DoD)

### Stage 1: Implementation & Local Verification
- [ ] Prisma schema updated with `ActionTaken` model and migration generated cleanly without data loss.
- [ ] Idempotent seed script populates realistic tickets with zero, one, and multiple Actions Taken across all 5 dimensions.
- [ ] Backend endpoints for Actions Taken, workflow concurrency, and Dashboards implemented with strict validation and RBAC.
- [ ] Ticket reassignment validations (`INVALID_OWNER` on inactive/non-staff assignee and `INVALID_STATE` on closed/cancelled tickets) verified and documented with evidence.
- [ ] Frontend components for Actions Taken and Dashboards implemented according to Zen Green design tokens.
- [ ] All unit, API, UI component, UI style, performance-smoke, accessibility, and E2E tests authored and passing 100% locally.
- [ ] Migration recovery test (`MIG-02`) verified using Prisma-supported rollback commands on an isolated disposable test database.
- [ ] Responsive audit confirms zero horizontal overflow ($scrollWidth === clientWidth$) across Desktop, Tablet, and Mobile on `#/ticket/:id` and all dashboards.

### Stage 2: Peer Review & Release Integration
- [ ] Feature branch opened and Pull Request submitted to `lab4-staging`.
- [ ] Peer reviewer (@lephirada) provides code review comments and approval.
- [ ] Review feedback addressed and documented in `docs/lab-04/reviewer.md`.
- [ ] `docs/lab-04/ai-use.md` updated with key prompts and reflection.
- [ ] PR merged into `lab4-staging` and final release PR merged into `main`.
- [ ] All test suites passing 100% on `main` branch.
- [ ] Final 9-part PDF report compiled with working links and legible screenshots.

---

## 11. Assumptions and Implementation Decisions

1. **Auto-Populated Performer**: The system relies on the verified JWT claims (`req.user.id`) to assign `performedById`. Even if a client sends a different user ID in the JSON body, the backend silently ignores or strictly overrides it with the authenticated session ID.
2. **Advisory Resolution Flag Behavior**: Marking a ticket as "Problem Appears Resolved" by a Requester does not prevent further communication or actions. When an IT Staff or Administrator user subsequently transitions the ticket to `RESOLVED`, the advisory flag remains `true` as an audit record.
3. **Drill-Down Routing Architecture**: Drill-down interactions utilize URL hash parameters (e.g. `#/my-tickets?status=WAITING_FOR_REQUESTER` or `#/staff-queue?owner=unassigned`) to preserve browser history, allow shareable links, and enable predictable back-button navigation.
4. **Dashboard Aggregation Scope**: Dashboard metrics compute against non-cancelled tickets for active workloads, with explicit cards for resolved and closed tickets to reflect operational throughput.
5. **Administrator Operational Role Expansion**: In Lab 3, Administrator was restricted from ticket operations and queue access. In Lab 4, per stakeholder request and confirmed project policy, Administrator privileges are formally expanded to execute ticket status transitions, manage Actions Taken, and access the Ticket Queue (`#/staff-queue`) for operational oversight. However, ticket assignment (`ticketOwnerId`) remains exclusive to active `IT_STAFF` users, preserving the separation between assigned frontline workers and system administrators. Staff Dashboard (`GET /api/staff/dashboard`) is tailored to IT Staff personal workloads, while Administrator has a dedicated Admin Dashboard (`GET /api/admin/dashboard`) containing system-wide queue metrics, `recentTickets`, and user distribution statistics.
