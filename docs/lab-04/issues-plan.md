# TokTickIT Lab 4 — GitHub Issues & Sprint Scope Breakdown

This document provides the definitive planning specification for GitHub Issues (Issue 20 (#51) through Issue 27 (#58)) for TokTickIT Sprint 4 (Lab 4). Each issue includes strict scope boundaries, branch requirements, testable acceptance criteria, and AI verification notes.

---

## 🔒 Issue Immutability & Code Stability Rule (Do NOT Touch Past Issues)
- **Completed Issues Are Frozen**: Once an issue is merged into `lab4-staging` (and for all baseline code inherited from Labs 1, 2, and 3), its code and tests are locked and must not be touched.
- **Strictly No Unsolicited Refactoring**: The AI is prohibited from modifying, refactoring, or rewriting code, CSS, or test files from past completed issues unless explicitly commanded to fix a critical blocking defect.
- **Additive Development Only**: Always develop new features additively by creating new files, new endpoints, or non-destructive extensions rather than altering existing working logic.

---

## Issue 20 (#51): Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD)
* **Type:** `Documentation`
* **Required branch:** `docs/lab4-spec-and-test-plan`
* **In-Scope:**
  - Author complete engineering contract files in `docs/lab-04/`:
    - `docs/lab-04/specification.md`: Sprint Goal, Stakeholder Request, In/Out Scope, numbered Functional Requirements (FR-01 to FR-17), Business Rules (BR-01 to BR-17 covering Actions Taken, ticket resolution gate, and dashboard calculations), Central Authorization Matrix, Concurrency/stale-update strategy, Database migration rationale, and Definition of Done.
    - `docs/lab-04/api-spec.md`: Formal REST contracts for Actions Taken endpoints, Requester Dashboard API, IT Staff Dashboard API, and Administrator Dashboard API (endpoints, methods, payload schemas, HTTP status codes 200, 201, 400, 401, 403, 404, 409, and safe error schemas).
    - `docs/lab-04/ui-spec.md`: Zen Green design token alignments, screen structure for Requester, Staff, and Admin Dashboards, Actions Taken section on Ticket Detail, responsive breakpoints (Desktop 1280px, Tablet 768px, Mobile 375px), state resilience (loading, empty, forbidden, conflict), and accessibility standards.
    - `docs/lab-04/tests.md`: Planned test matrix covering Unit, API/Integration, Database/Migration, UI Component, Workflow, Regression, Performance, and E2E Playwright tests across 53 planned tests with 100% Acceptance Criteria (28 parent criteria, 30 distinct criteria identifiers: AC-01 to AC-28) traceability.
    - `docs/lab-04/ai-use.md` & `docs/lab-04/reviewer.md`: Living documents initialized with core schemas and metadata; progressively maintained throughout the sprint.
* **Out-of-Scope & Deferred Dependencies:**
  - Writing or modifying runtime production code (`client/src/`, `server/src/`) (deferred to Issues 21–25 (#52–#56)).
  - Authoring executable test files (deferred to Issues 21–26 (#52–#57)).
* **Acceptance Criteria:**
  - [ ] All four core specification files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) are complete and committed.
  - [ ] Every Functional Requirement maps directly to governing Business Rules and testable Acceptance Criteria without gaps.
  - [ ] Planned test IDs in `tests.md` cover 100% of defined Acceptance Criteria across all 53 planned tests.
  - [ ] PR is opened targeting `lab4-staging` before any implementation code is written.
* **AI Verification Note:**
  > When verifying this issue, verify strictly the presence, completeness, and mutual consistency of documentation files in `docs/lab-04/`. Do not check for runtime application code, and do not fail verification on pending PR review/merge status.

---

## Issue 21 (#52): Database Migration, Seed Data & Actions Taken Backend Foundation
* **Type:** `Feature (Backend)`
* **Required branch:** `feature/lab4-1-actions-taken-foundation`
* **In-Scope:**
  - **Prisma Schema & Migration:**
    - Create `ActionTaken` model with fields: `id`, `ticketId`, `actionDateTime`, `actionDescription`, `result`, `performedById`, `isFollowUpRequired`, `followUpNote`, `attachmentNotes`, `createdAt`, `updatedAt`.
    - Establish foreign keys to `Ticket` (`ticketId`) and `User` (`performedById`).
    - Preserve backward compatibility: existing tickets without Actions Taken remain completely valid.
  - **Migration Deployment & Rollback Recovery Tests (`server/tests/lab-04/migration-recovery.test.ts`):**
    - `MIG-01`: Verify clean migration deployment via `npx prisma migrate deploy` on an isolated test database with preceding baseline migrations recorded as applied, confirming 100% legacy data preservation and schema integrity (`AC-21`).
    - `MIG-02`: Simulate migration failure recovery via schema inspection, compensatory cleanup (e.g. `DROP TABLE IF EXISTS "ActionTaken" CASCADE;` restoring clean baseline state), resolving via `npx prisma migrate resolve --rolled-back`, and confirming clean re-application without schema corruption (`AC-21`).
  - **Idempotent Seed Data (`server/prisma/seed.ts` & `server/tests/lab-04/seed-data.test.ts`):**
    - Seed tickets covering all 5 required dimensions: all 8 lifecycle statuses, 4 priorities, assigned/unassigned ownership, 0/1/multiple Actions Taken, and zero/non-zero dashboard metric profiles (`SEED-01`, `AC-22`).
    - Include cases where Actions Taken are performed by the Ticket Owner as well as other IT Staff members.
    - Ensure safe repeated execution (run 1 & run 2) without constraint violations (`SEED-01`).
  - **Actions Taken REST APIs (`server/src/routes/actionsTaken.ts`):**
    - `GET /api/tickets/:id/actions`: Retrieve Actions Taken for a ticket in deterministic order `actionDateTime ASC, id ASC` (`API-04`, `AC-04`, `AC-27`).
    - `POST /api/tickets/:id/actions`: Create Action Taken (strictly restricted to `IT_STAFF` and `ADMINISTRATOR`; auto-set `performedById` from authenticated session). Rejects requests on `CANCELLED` tickets with HTTP 400 (`TICKET_CANCELLED`, `API-14a`).
    - `PATCH /api/tickets/:id/actions/:actionId`: Update Action Taken details (restricted to `IT_STAFF` and `ADMINISTRATOR`). Enforces ticket scoping: if `actionId` does not belong to `:id`, returns HTTP 404 (`NOT_FOUND`, `API-06`). Rejects requests on `CANCELLED` tickets with HTTP 400 (`TICKET_CANCELLED`, `API-14a`).
    - **Validation & Boundaries (`API-16`, `AC-26`)**: Enforce character boundaries on `actionDescription` (5–2000), `result` (3–2000), `attachmentNotes` ($\le 500$), valid parseable ISO-8601 UTC date string, and mandatory `followUpNote` (minimum 3 non-whitespace characters) when `isFollowUpRequired === true` (`API-02`, `AC-02`).
    - **Append-Only Invariant (`API-17`, `AC-27`)**: Deletion is prohibited; HTTP DELETE on `/api/tickets/:id/actions/:actionId` returns 404 / unhandled.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/actions-taken.api.test.ts` (`API-01`, `API-02`, `API-03a/b`, `API-04`, `API-05`, `API-06`, `API-14a`, `API-16`, `API-17`), `migration-recovery.test.ts` (`MIG-01`, `MIG-02`), and `seed-data.test.ts` (`SEED-01`).
* **Out-of-Scope & Deferred Dependencies:**
  - Actions Taken UI components in React (deferred to Issue 23 (#54)).
  - Status transition matrix and resolution gate enforcement (deferred to Issue 22 (#53)).
  - Dashboard aggregation APIs (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Prisma migration executes cleanly without losing data from earlier labs (`AC-21`, `MIG-01`).
  - [ ] Migration rollback recovery simulation resolves cleanly via schema rollback cleanup and `prisma migrate resolve --rolled-back` (`AC-21`, `MIG-02`).
  - [ ] Seed script runs idempotently across 2 consecutive runs and populates all 5 required scenario dimensions (`AC-22`, `SEED-01`).
  - [ ] Requesters are blocked from creating or modifying Actions Taken (HTTP 403 Forbidden); IT Staff and Administrators are permitted (`AC-03`, `API-03a/b`).
  - [ ] Submitting an Action Taken with `isFollowUpRequired = true` without a note (< 3 non-whitespace characters) returns HTTP 400 validation error (`AC-02`, `API-02`).
  - [ ] Field boundary violations return HTTP 400 validation error (`AC-26`, `API-16`).
  - [ ] Actions Taken listing returns records in deterministic order (`actionDateTime ASC, id ASC`) and DELETE route is unhandled (`AC-27`, `API-04`, `API-17`).
  - [ ] Modifying an Action Taken belonging to another ticket returns HTTP 404 Not Found (`AC-06`, `API-06`).
  - [ ] Attempting to add or modify Actions Taken on a CANCELLED ticket returns HTTP 400 Bad Request (`TICKET_CANCELLED`, `AC-23`, `API-14a`).
  - [ ] 100% of tests in `actions-taken.api.test.ts`, `migration-recovery.test.ts`, and `seed-data.test.ts` pass.
* **AI Verification Note:**
  > Verify only backend migration, seed, route handlers, and test suites in `server/tests/lab-04/`. Do not fail verification due to missing UI elements or unmerged PR status.

---

## Issue 22 (#53): Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement)
* **Type:** `Feature (Backend & Workflow)`
* **Required branch:** `feature/lab4-2-ticket-workflow-enforcement`
* **In-Scope:**
  - **Resolution Gate Backend Enforcement:**
    - Restrict transitioning status to `RESOLVED` and `CLOSED` strictly to `IT_STAFF` and `ADMINISTRATOR` (`WF-01`, `AC-07`).
    - Enforce that Requester's "Problem Appears Resolved" (`problemAppearsResolved = true`) remains purely advisory and does NOT alter `currentStatus` (`WF-02`, `AC-08`).
  - **Strict Status Transition Matrix:**
    - Enforce permitted status transitions across all 8 statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED` (`UNIT-02`, `WF-03`, `AC-09`).
    - Reject forbidden transitions with descriptive HTTP 400 errors (`INVALID_TRANSITION`).
    - Reject any transition attempt on a terminal `CANCELLED` ticket with HTTP 400 (`TICKET_CANCELLED`, `API-14b`, `AC-23`).
  - **Ticket Reassignment Active Staff Enforcement (`PATCH /api/staff/tickets/:id/assign`):**
    - Require target assignee (`newOwnerId`) to be an active IT Staff user (`isActive === true` and `role === 'IT_STAFF'`).
    - Reject attempts to assign tickets to non-existent users, inactive users, or non-IT Staff users with HTTP 400 (`INVALID_OWNER`, `API-15`, `AC-25`, `BR-18`), verifying existing ticket owner remains unchanged.
    - Reject reassignments on `CLOSED` tickets with HTTP 400 (`INVALID_STATE`, `API-15`, `AC-25`, `BR-18`), verifying ticket remains unchanged.
    - Reject reassignments on `CANCELLED` tickets with HTTP 400 (`INVALID_STATE`, `API-15`, `AC-25`, `BR-11`, `BR-18`), verifying ticket remains unchanged.
  - **Concurrency & Stale-Update Protection:**
    - Implement optimistic concurrency detection verifying mandatory `expectedUpdatedAt` ISO-8601 UTC timestamp (`UNIT-03`, `AC-10`).
    - Missing `expectedUpdatedAt` returns HTTP 400 (`VALIDATION_ERROR`, `API-07`).
    - Malformed ISO-8601 timestamp returns HTTP 400 (`VALIDATION_ERROR`, `API-07`).
    - Stale timestamp mismatch returns HTTP 409 (`STALE_UPDATE_CONFLICT`, `API-08`, `AC-11`) with `currentUpdatedAt`.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/unit/follow-up-validation.unit.test.ts` (`UNIT-01`), `status-transition-matrix.unit.test.ts` (`UNIT-02`), and `concurrency-check.unit.test.ts` (`UNIT-03`).
    - Author and execute `server/tests/lab-04/ticket-workflow.api.test.ts` verifying permitted/forbidden transitions (`WF-03`), resolution gate security (`WF-01`), advisory resolution (`WF-02`), missing/malformed timestamp rejection (`API-07`), stale conflict handling (`API-08`), cancelled ticket rejection (`API-14b`), ticket reassignment validation rejecting non-existent, inactive, or non-staff assignees (verifying ticket owner unchanged) and closed/cancelled tickets (`API-15`), and Administrator supervisory ticket queue retrieval and status transition execution (`API-10b`).
* **Out-of-Scope & Deferred Dependencies:**
  - Frontend status dropdown adjustments (deferred to Issue 23 (#54)).
  - Dashboard metric calculations (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Direct API attempts by Requesters to set status to `RESOLVED` or `CLOSED` are strictly blocked (HTTP 403); IT Staff and Administrators are permitted (`AC-07`, `WF-01`).
  - [ ] Status transitions follow the authorized transition matrix; invalid transitions return HTTP 400 (`AC-09`, `UNIT-02`, `WF-03`).
  - [ ] Ticket reassignment validations strictly enforced (`API-15`, `AC-25`, `BR-18`): (1) assigning to non-existent, inactive, or non-IT Staff targets returns HTTP 400 Bad Request (`INVALID_OWNER`), verifying existing ticket owner remains unchanged; (2) attempting reassignment on a `CLOSED` ticket returns HTTP 400 Bad Request (`INVALID_STATE`), verifying ticket attributes remain unchanged; (3) attempting reassignment on a `CANCELLED` ticket returns HTTP 400 Bad Request (`INVALID_STATE`), verifying ticket attributes remain unchanged.
  - [ ] Administrator possesses authorized supervisory access to retrieve the Staff Ticket Queue (`GET /api/staff/tickets`) and execute ticket status transitions (`PATCH /api/staff/tickets/:id/status`) (`AC-07`, `AC-09`, `API-10b`).
  - [ ] Missing or malformed `expectedUpdatedAt` returns HTTP 400 Bad Request (`VALIDATION_ERROR`, `AC-10`, `API-07`).
  - [ ] Concurrent or stale status updates return HTTP 409 Conflict without overwriting unread changes (`AC-11`, `API-08`).
  - [ ] Attempting to transition status or indicate resolution on a CANCELLED ticket returns HTTP 400 Bad Request (`TICKET_CANCELLED`, `AC-23`, `API-14b`).
  - [ ] 100% of tests in `server/tests/lab-04/ticket-workflow.api.test.ts` and unit test suites pass.
* **AI Verification Note:**
  > Verify backend status validation, reassignment checks, and concurrency handling in `ticket-workflow.api.test.ts`. Do not fail verification due to missing frontend UI integration or unmerged PR status.

---

## Issue 23 (#54): Actions Taken UI & Ticket Detail Integration (Frontend)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab4-3-actions-taken-ui`
* **In-Scope:**
  - **Actions Taken UI Component (`client/src/components/ActionsTakenSection.tsx`):**
    - Render ordered list of Actions Taken on Ticket Detail (`#/ticket/:id`) displaying: Action Date/Time, Action Description, Result, Performed by (auto-populated name), Follow-Up badge, Follow-Up Note (if present), and Attachment Notes.
    - Responsive table on desktop transforming cleanly to readable card layout on mobile.
  - **IT Staff & Administrator Mode:**
    - "Add Action Taken" button triggering modal (`ActionTakenModal.tsx`) with focus trapping and focus restoration.
    - Performed by is automatically populated from authenticated session.
    - Dynamic Follow-Up checkbox with required note field conditional validation (min 3 non-whitespace chars).
    - Edit mode for existing actions.
  - **Requester Mode:**
    - Read-only presentation; create/edit controls are completely hidden.
  - **Ticket Workflow UI Polish & Concurrency Resilience:**
    - Reflect permitted status transitions in the IT Staff & Administrator action dropdown.
    - Display safe conflict alerts if a 409 status is returned (`UI-04`, `AC-11`).
    - **Form State Preservation (`UI-04b`, `AC-28`)**: Preserve uncommitted inputs in status transition controls upon 409 conflict, enabling the user to review server updates without losing uncommitted transition text.
  - **Loading & Zero-States (`UI-EMPTY-01`, `AC-24`):**
    - Render pulsing skeleton loaders during fetch and friendly empty states when 0 actions exist.
  - **Automated UI Tests:**
    - `client/tests/lab-04/ActionsTaken.test.tsx`: Test list rendering, create form, validation, and role-based control visibility (`UI-01a`, `UI-01b`, `UI-02`, `UI-03`).
    - `client/tests/lab-04/TicketWorkflow.test.tsx`: Test transition selection, conflict feedback, and uncommitted form preservation (`UI-04`, `UI-04b`).
    - `client/tests/lab-04/UIStates.test.tsx`: Test skeleton loading states and empty state rendering (`UI-EMPTY-01`).
* **Out-of-Scope & Deferred Dependencies:**
  - Dashboard views and navigation (deferred to Issue 25 (#56)).
  - Playwright E2E browser tests (deferred to Issue 26 (#57)).
* **Acceptance Criteria:**
  - [ ] IT Staff and Administrators can create and edit Actions Taken on `#/ticket/:id` with immediate list refresh (`AC-01`, `AC-06`).
  - [ ] Requesters can view Actions Taken on owned tickets with zero edit controls available (`AC-04`, `UI-03`).
  - [ ] Form prevents submission if Follow-Up is checked without note text (< 3 non-whitespace chars) (`AC-02`, `UI-02`).
  - [ ] 409 Conflict alert preserves uncommitted status transition input and provides state refresh button (`AC-28`, `UI-04b`).
  - [ ] Layout conforms to Zen Green design standards with zero horizontal overflow on mobile viewports.
  - [ ] 100% of Vitest tests in `ActionsTaken.test.tsx`, `TicketWorkflow.test.tsx`, and `UIStates.test.tsx` pass.
* **AI Verification Note:**
  > Verify frontend components and Vitest tests for Actions Taken and Ticket Detail. Do not check for Dashboard views or fail due to unmerged PR status.

---

## Issue 24 (#55): Role-Appropriate Dashboard Metrics APIs (Backend)
* **Type:** `Feature (Backend)`
* **Required branch:** `feature/lab4-4-dashboard-apis`
* **In-Scope:**
  - **Requester Dashboard Endpoint (`GET /api/requester/dashboard`):**
    - Restricted to authenticated Requester; isolated strictly to `req.user.id`.
    - Returns: `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `resolvedTickets` (all resolved tickets owned by requester without date filtering), `closedTickets`, and `recentTickets` list (up to 5 items) (`AC-12`, `API-09`).
  - **IT Staff Dashboard Endpoint (`GET /api/staff/dashboard`):**
    - Restricted strictly to `IT_STAFF` (`API-10`, `AC-13`). Administrators and Requesters are blocked with HTTP 403 Forbidden (`API-11`, `AC-14`).
    - Returns: 5 primary cards (`newTickets`, `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `myAssignedTickets` scoped to current staff user), workload indicators (`unassignedTickets`), full 8-status breakdown (`byStatus`), 4-priority breakdown (`byPriority`), and `recentTickets`.
  - **Admin Dashboard Endpoint (`GET /api/admin/dashboard`):**
    - Restricted strictly to `ADMINISTRATOR` (`API-12`, `AC-19a`). Requesters and IT Staff receive HTTP 403 Forbidden (`API-13`, `AC-19b`).
    - Returns: operational summaries (`totalActiveTickets`, `unassignedTickets`), user account distribution statistics (`totalUsers`, `activeUsers`, `inactiveUsers`, and breakdown `byRole`), and recent system tickets (`recentTickets`).
  - **Performance Smoke Benchmarks (`server/tests/lab-04/performance-smoke.test.ts`):**
    - `PERF-SMOKE-01`: Asserts dashboard aggregation response latency < 300ms and actions list retrieval latency < 200ms under standard seeded load.
  - **Automated Backend Tests:**
    - `server/tests/lab-04/unit/dashboard-calculator.unit.test.ts` (`UNIT-04`).
    - `server/tests/lab-04/requester-dashboard.api.test.ts` (`API-09`).
    - `server/tests/lab-04/staff-dashboard.api.test.ts` (`API-10`, `API-11`, `API-12`, `API-13`).
    - `server/tests/lab-04/performance-smoke.test.ts` (`PERF-SMOKE-01`).
* **Out-of-Scope & Deferred Dependencies:**
  - Client-side Dashboard UI rendering (deferred to Issue 25 (#56)).
  - Playwright E2E browser verification (deferred to Issue 26 (#57)).
* **Acceptance Criteria:**
  - [ ] Requester dashboard metrics match database counts and never expose tickets belonging to other users (`AC-12`, `API-09`).
  - [ ] IT Staff users receive HTTP 200 OK with accurate counts for primary cards (including `myAssignedTickets` scoped to staff user), unassigned queue, 8-status distribution, priorities, and recent queue tickets on `GET /api/staff/dashboard` (`AC-13`, `API-10`).
  - [ ] Administrator dashboard endpoint returns accurate operational queue, user account distribution metrics, and recent system tickets (`AC-19a`, `API-12`).
  - [ ] Non-permitted roles receive HTTP 403 Forbidden on role-restricted dashboard endpoints (`AC-14`, `AC-19b`, `API-11`, `API-13`).
  - [ ] Performance smoke benchmarks verify response latency under thresholds (< 300ms dashboard, < 200ms actions list) (`PERF-SMOKE-01`).
  - [ ] 100% of tests in `requester-dashboard.api.test.ts`, `staff-dashboard.api.test.ts`, and `performance-smoke.test.ts` pass.
* **AI Verification Note:**
  > Verify backend dashboard routes, performance benchmarks, and tests. Do not check for Dashboard UI rendering or fail due to unmerged PR status.

---

## Issue 25 (#56): Role-Appropriate Dashboards UI & Drill-Down (Frontend)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab4-5-dashboard-ui`
* **In-Scope:**
  - **Requester Dashboard View (`client/src/pages/RequesterDashboard.tsx`):**
    - 5 Metric cards: My Open Tickets (`openTickets`), In Progress (`inProgressTickets`), Waiting for Requester (`waitingForRequesterTickets`), Resolved Tickets (`resolvedTickets`), Closed (`closedTickets`).
    - My Recent Tickets list with status badges and timestamps.
    - Quick actions: "Create Ticket", "View All My Tickets".
    - Drill-down: Clicking metric cards navigates to `MyTickets` pre-filtered (`#/my-tickets?status=OPEN_GROUP`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`).
  - **IT Staff Dashboard View (`client/src/pages/StaffDashboard.tsx`):**
    - 5 Primary cards: New, Open, In Progress, Waiting for Requester, My Assigned.
    - Workload badges: Unassigned Queue highlight, 8-status distribution pills, 4-priority badges.
    - Recent Queue Tickets list with priority badges and assignees.
    - Quick actions: "Create Ticket", "Search Tickets", "My Assigned Queue".
    - Drill-down: Clicking metric cards/badges navigates to `StaffTicketQueue` with active filter presets.
  - **Administrator Dashboard View (`client/src/pages/AdminDashboard.tsx`):**
    - Overview banner with system health and refresh controls.
    - Upper Metric Cards Grid: Operational Queue (`Total Active Tickets`, `Unassigned Queue`) alongside User Statistics (`Total Users`, `Active Users`, `Inactive Users`).
    - User Role Distribution Badges: Requesters, IT Staff, Administrators.
    - Recent System Queue list and Administrative Quick Actions ("User Management" linking to `#/admin-users`, "Ticket Queue" linking to `#/staff-queue`, "Create Ticket" linking to `#/create-ticket`).
    - Drill-down: Clicking `Total Active Tickets` navigates to `#/staff-queue`; clicking `Unassigned Queue` navigates to `#/staff-queue?owner=unassigned`; clicking User metric cards (`Total Users`, `Active Users`, `Inactive Users`) navigates to `#/admin-users`.
  - **App Shell & Navigation Updates (`App.tsx`, `Header.tsx`):**
    - Add role-aware "Dashboard" link to Header navigation bar for all roles with active state indicator.
    - Set role-appropriate Dashboard as the default landing view upon login.
    - Loading skeletons, empty states, and manual refresh controls.
  - **Automated UI Tests:**
    - `client/tests/lab-04/RequesterDashboard.test.tsx` (metrics rendering, empty state, drill-down, quick actions `UI-05`, `UI-07a`).
    - `client/tests/lab-04/StaffDashboard.test.tsx` (cards rendering, quick actions, drill-down `UI-06`, `UI-07b`).
    - `client/tests/lab-04/AdminDashboard.test.tsx` (operational cards, user stats, quick actions, drill-down across all 5 cards `UI-08`).
    - `client/tests/lab-04/DesignSystemTokens.test.tsx` (token verification, badge styles, focus rings, private/shared cues `UI-STYLE-01`, `AC-17`).
* **Out-of-Scope & Deferred Dependencies:**
  - Playwright E2E browser testing (deferred to Issue 26 (#57)).
  - Final release documentation (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] Requester, Staff, and Administrator Dashboards load authoritative metrics and handle empty/loading states gracefully (`AC-15a`, `AC-15b`, `AC-20`, `AC-24`).
  - [ ] Clicking metric cards on Requester and Staff Dashboards drills down into pre-filtered views; clicking Admin operational cards (`Total Active Tickets`, `Unassigned Queue`) drills down into `#/staff-queue` (with owner filter where applicable), and clicking User metric cards (`Total Users`, `Active Users`, `Inactive Users`) drills down into `#/admin-users` (`AC-15a`, `AC-15b`, `AC-20`).
  - [ ] Header navigation bar correctly highlights the active Dashboard tab.
  - [ ] Design System token test verifies computed CSS variables and component styling (`AC-17`, `UI-STYLE-01`).
  - [ ] Layout is fully responsive across Desktop, Tablet, and Mobile with zero clipping.
  - [ ] 100% of Vitest tests in `RequesterDashboard.test.tsx`, `StaffDashboard.test.tsx`, `AdminDashboard.test.tsx`, and `DesignSystemTokens.test.tsx` pass.
* **AI Verification Note:**
  > Verify Dashboard components, navigation routing, and Vitest test files. Do not fail verification on pending PR merge or missing Playwright E2E files.

---

## Issue 26 (#57): End-to-End Testing, Responsive Audit & Screenshot Artifacts
* **Type:** `Testing & Quality Assurance`
* **Required branch:** `feature/lab4-6-e2e-and-responsive`
* **In-Scope:**
  - **Playwright E2E Test Suites (`e2e/lab-04/`):**
    - `actions-taken-flow.spec.ts`: IT Staff and Administrator adding/editing Actions Taken, validation trigger, and Requester read-only verification (`E2E-01`).
    - `ticket-resolution.spec.ts`: Requester advisory indication, IT Staff formal resolution, status transitions, and stale conflict handling (`E2E-02`).
    - `dashboards.spec.ts`: Requester, IT Staff, and Administrator dashboard loading, metric validation against UI, Quick Actions, and drill-down navigation (`E2E-03a`, `E2E-03b`).
    - `accessibility.spec.ts`: Modal focus trapping (`ActionTakenModal`), focus restoration, keyboard cycling, and ARIA feedback (`A11Y-01`).
  - **Regression Testing:**
    - Execute existing Lab 1, 2, and 3 E2E test suites to guarantee zero regression on Auth, Attachments, Comments, Notes, and Admin User Management (`REG-01`, `REG-02`, `REG-03`).
  - **Responsive Layout Audit (`dashboards.spec.ts` `E2E-04`):**
    - Automated viewport audit across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) across all four core responsive screens (Requester Dashboard `#/dashboard`, IT Staff Dashboard `#/staff-dashboard`, Administrator Dashboard `#/admin-dashboard`, Ticket Detail `#/ticket/:id`), asserting zero horizontal overflow (`scrollWidth === clientWidth`), grid restructuring (5-column Desktop metric cards row, 2–3 column Tablet grid, 1-column Mobile stack), zero interactive control collisions, no clipped text, and conformance to Zen Green design tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`) per FR-17 and AC-17.
  - **Screenshot Artifacts Generation:**
    - Capture and save structured screenshots into `artifacts/lab-04/screenshots/`:
      - `staff-dashboard/`
      - `requester-dashboard/`
      - `admin-dashboard/`
      - `actions-taken/`
* **Out-of-Scope & Deferred Dependencies:**
  - Final PDF compiling and report submission (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] All Lab 4 Playwright E2E specs pass 100% in headless mode (`E2E-01`, `E2E-02`, `E2E-03a`, `E2E-03b`, `E2E-04`, `A11Y-01`).
  - [ ] Zero regression errors across Labs 1, 2, and 3 test suites (`REG-01`, `REG-02`, `REG-03`).
  - [ ] Responsive audit confirms zero horizontal overflow (`scrollWidth === clientWidth`), zero control collisions, no text clipping, and valid Zen Green tokens across all four core screens (Requester Dashboard, IT Staff Dashboard, Administrator Dashboard, Ticket Detail `#/ticket/:id`) on Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) viewports (`AC-17`, `E2E-04`).
  - [ ] Accessibility suite verifies focus trapping, restoration, keyboard cycling, and ARIA live regions (`A11Y-01`).
  - [ ] All required screenshots are captured clearly at standard viewports and stored in the artifacts directory.
* **AI Verification Note:**
  > Verify E2E test files, passing execution results, and presence of generated screenshot files. Do not fail on unmerged PR status.

---

## Issue 27 (#58): Release Integration, Peer Review, AI Reflection & Final Handover
* **Type:** `Documentation & Release`
* **Required branch:** `docs/lab4-documentation`
* **In-Scope:**
  - **Peer Review Record (`docs/lab-04/reviewer.md`):**
    - Document all Pull Requests for Sprint 4 (PR #59 for Issue #51, and PRs for Issues #52 through #58), review comments from peer reviewer, developer responses, fixes applied, and final approvals.
    - Document reciprocal review feedback for partner.
  - **AI Usage Log & Reflection (`docs/lab-04/ai-use.md`):**
    - Record LLM model used (Antigravity AI / Gemini 3.8 Flash).
    - Document 6–10 representative prompts with specific outcomes.
    - Provide a thoughtful "My Reflection" on the experience with specification and coding agents.
  - **Authoritative Test Logs (`docs/lab-04/tests.md`):**
    - Update traceability matrix with final file paths and passing status across all 53 planned tests.
    - Append raw test execution summary output demonstrating 100% pass across Unit, API, UI, DB, and E2E suites.
  - **Release Integration:**
    - Merge feature branches into `lab4-staging` and perform final verification.
    - Open release PR from `lab4-staging` into `main`, obtain peer approval, and merge.
    - Update root `README.md` with Lab 4 architecture, seed instructions, and test commands.
  - **Submission Readiness:**
    - Validate that evidence for Answer Part 1 through Answer Part 9 is complete and ready for the single PDF export.
* **Out-of-Scope & Deferred Dependencies:**
  - Post-Sprint 4 features.
* **Acceptance Criteria:**
  - [ ] `reviewer.md`, `ai-use.md`, and `tests.md` are completely finalized and verified.
  - [ ] All 53 tests pass on the final `main` branch.
  - [ ] Clean Git commit graph demonstrating feature branches $\to$ `lab4-staging` $\to$ `main`.
  - [ ] Repository contains all artifacts and evidence required to compile the 9-part submission PDF.
* **AI Verification Note:**
  > Verify completion of all documentation, test logs, and release readiness.
