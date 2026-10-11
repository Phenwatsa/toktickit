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
    - `docs/lab-04/api-spec.md`: Formal REST contracts for Actions Taken endpoints, Requester Dashboard API, and IT Staff Dashboard API (endpoints, methods, payload schemas, HTTP status codes 200, 201, 400, 401, 403, 404, 409, and safe error schemas).
    - `docs/lab-04/ui-spec.md`: Zen Green design token alignments, screen structure for Requester and Staff Dashboards, Actions Taken section on Ticket Detail, responsive breakpoints (Desktop 1280px, Tablet 768px, Mobile 375px), and accessibility checklist.
    - `docs/lab-04/tests.md`: Planned test matrix covering Unit, API/Integration, UI Component, Workflow, Regression, and E2E Playwright tests with 100% Acceptance Criteria (AC-xx) traceability.
    - `docs/lab-04/ai-use.md` & `docs/lab-04/reviewer.md`: Living documents initialized with core schemas and metadata; progressively maintained throughout the sprint.
* **Out-of-Scope & Deferred Dependencies:**
  - Writing or modifying runtime production code (`client/src/`, `server/src/`) (deferred to Issues 21–25 (#52–#56)).
  - Authoring executable test files (deferred to Issues 21–26 (#52–#57)).
* **Acceptance Criteria:**
  - [ ] All four core specification files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) are complete and committed.
  - [ ] Every Functional Requirement maps directly to governing Business Rules and testable Acceptance Criteria without gaps.
  - [ ] Planned test IDs in `tests.md` cover 100% of defined Acceptance Criteria.
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
  - **Idempotent Seed Data (`server/prisma/seed.ts`):**
    - Seed tickets with zero, one, and multiple Actions Taken lines.
    - Include cases where Actions Taken are performed by the Ticket Owner as well as other IT Staff members.
    - Ensure safe repeated execution without constraint violations.
  - **Actions Taken REST APIs (`server/src/routes/actionsTaken.ts`):**
    - `GET /api/tickets/:id/actions`: Retrieve Actions Taken for a ticket (accessible to permitted Requester owner, IT Staff, and Administrator).
    - `POST /api/tickets/:id/actions`: Create Action Taken (strictly restricted to `IT_STAFF` and `ADMINISTRATOR`; auto-set `performedById` from authenticated session). Rejects requests on `CANCELLED` tickets with HTTP 400 (`TICKET_CANCELLED`).
    - `PATCH /api/tickets/:id/actions/:actionId`: Update Action Taken details (restricted to `IT_STAFF` and `ADMINISTRATOR`). Enforces ticket scoping: if `actionId` does not belong to `:id`, returns HTTP 404 (`NOT_FOUND`). Rejects requests on `CANCELLED` tickets with HTTP 400 (`TICKET_CANCELLED`).
    - Validation: Enforce `followUpNote` as mandatory (minimum 3 non-whitespace characters) when `isFollowUpRequired === true`.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/actions-taken.api.test.ts` covering creation, listing, updating, validation rules, cross-ticket scoping (404), terminal cancelled rejection (`API-14a`), and role authorization rejection (403 for Requester; 201/200 for IT Staff & Admin).
* **Out-of-Scope & Deferred Dependencies:**
  - Actions Taken UI components in React (deferred to Issue 23 (#54)).
  - Status transition matrix and resolution gate enforcement (deferred to Issue 22 (#53)).
  - Dashboard aggregation APIs (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Prisma migration executes cleanly without losing data from earlier labs.
  - [ ] Seed script runs idempotently and populates realistic Actions Taken records.
  - [ ] Requesters are blocked from creating or modifying Actions Taken (HTTP 403 Forbidden); IT Staff and Administrators are permitted.
  - [ ] Submitting an Action Taken with `isFollowUpRequired = true` without a note returns HTTP 400 validation error.
  - [ ] Modifying an Action Taken belonging to another ticket returns HTTP 404 Not Found.
  - [ ] Attempting to add or modify Actions Taken on a CANCELLED ticket returns HTTP 400 Bad Request (`TICKET_CANCELLED`, `API-14a`).
  - [ ] 100% of tests in `server/tests/lab-04/actions-taken.api.test.ts` pass.
* **AI Verification Note:**
  > Verify only backend migration, seed, route handlers, and `actions-taken.api.test.ts`. Do not fail verification due to missing UI elements or unmerged PR status.

---

## Issue 22 (#53): Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement)
* **Type:** `Feature (Backend & Workflow)`
* **Required branch:** `feature/lab4-2-ticket-workflow-enforcement`
* **In-Scope:**
  - **Resolution Gate Backend Enforcement:**
    - Restrict transitioning status to `RESOLVED` and `CLOSED` strictly to `IT_STAFF` and `ADMINISTRATOR`.
    - Enforce that Requester's "Problem Appears Resolved" (`problemAppearsResolved = true`) remains purely advisory and does NOT alter `currentStatus`.
  - **Strict Status Transition Matrix:**
    - Enforce permitted status transitions across all 8 statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`.
    - Reject forbidden transitions with descriptive HTTP 400 errors.
    - Reject any transition attempt on a terminal `CANCELLED` ticket with HTTP 400 (`TICKET_CANCELLED`).
  - **Concurrency & Stale-Update Protection:**
    - Implement optimistic concurrency detection verifying mandatory `expectedUpdatedAt` ISO-8601 UTC timestamp.
    - Missing `expectedUpdatedAt` returns HTTP 400 (`VALIDATION_ERROR`).
    - Malformed ISO-8601 timestamp returns HTTP 400 (`VALIDATION_ERROR`).
    - Stale timestamp mismatch returns HTTP 409 (`STALE_UPDATE_CONFLICT`) with `currentUpdatedAt`.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/ticket-workflow.api.test.ts` verifying permitted/forbidden transitions, resolution gate security (permitting IT Staff and Admin, blocking Requester), missing/malformed timestamp rejection (400), stale conflict handling (409), and cancelled ticket rejection (400 `TICKET_CANCELLED`, `API-14b`).
* **Out-of-Scope & Deferred Dependencies:**
  - Frontend status dropdown adjustments (deferred to Issue 23 (#54)).
  - Dashboard metric calculations (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Direct API attempts by Requesters to set status to `RESOLVED` or `CLOSED` are strictly blocked (HTTP 403); IT Staff and Administrators are permitted.
  - [ ] Status transitions follow the authorized transition matrix; invalid transitions return HTTP 400.
  - [ ] Missing or malformed `expectedUpdatedAt` returns HTTP 400 Bad Request (`VALIDATION_ERROR`).
  - [ ] Concurrent or stale status updates return HTTP 409 Conflict without overwriting unread changes.
  - [ ] Attempting to transition status or indicate resolution on a CANCELLED ticket returns HTTP 400 Bad Request (`TICKET_CANCELLED`, `AC-23`, `API-14b`). Pre-existing ticket operations from Labs 1–2 retain baseline behavior under regression suites.
  - [ ] 100% of tests in `server/tests/lab-04/ticket-workflow.api.test.ts` pass.
* **AI Verification Note:**
  > Verify backend status validation and concurrency handling in `ticket-workflow.api.test.ts`. Do not fail verification due to missing frontend UI integration or unmerged PR status.

---

## Issue 23 (#54): Actions Taken UI & Ticket Detail Integration (Frontend)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab4-3-actions-taken-ui`
* **In-Scope:**
  - **Actions Taken UI Component (`client/src/components/ActionsTakenSection.tsx`):**
    - Render ordered list of Actions Taken displaying: Action Date/Time, Action Description, Result, Performed by (auto-populated name), Follow-Up badge, Follow-Up Note (if present), and Attachment Notes.
    - Responsive table on desktop transforming cleanly to readable card layout on mobile.
  - **IT Staff & Administrator Mode:**
    - "Add Action Taken" button triggering create form/modal.
    - Performed by is automatically populated from authenticated session.
    - Dynamic Follow-Up checkbox with required note field conditional validation.
    - Edit mode for existing actions.
  - **Requester Mode:**
    - Read-only presentation; create/edit controls are completely hidden.
  - **Ticket Workflow UI Polish:**
    - Reflect permitted status transitions in the IT Staff & Administrator action dropdown.
    - Display safe conflict alerts if a 409 status is returned.
  - **Automated UI Tests:**
    - `client/tests/lab-04/ActionsTaken.test.tsx`: Test list rendering, create form, validation, and role-based control visibility.
    - `client/tests/lab-04/TicketWorkflow.test.tsx`: Test transition selection and conflict feedback.
* **Out-of-Scope & Deferred Dependencies:**
  - Dashboard views and navigation (deferred to Issue 25 (#56)).
  - Playwright E2E browser tests (deferred to Issue 26 (#57)).
* **Acceptance Criteria:**
  - [ ] IT Staff and Administrators can create and edit Actions Taken with immediate list refresh.
  - [ ] Requesters can view Actions Taken on owned tickets with zero edit controls available.
  - [ ] Form prevents submission if Follow-Up is checked without note text.
  - [ ] Layout conforms to Zen Green design standards with zero horizontal overflow on mobile viewports.
  - [ ] 100% of Vitest tests in `ActionsTaken.test.tsx` and `TicketWorkflow.test.tsx` pass.
* **AI Verification Note:**
  > Verify frontend components and Vitest tests for Actions Taken. Do not check for Dashboard views or fail due to unmerged PR status.

---

## Issue 24 (#55): Role-Appropriate Dashboard Metrics APIs (Backend)
* **Type:** `Feature (Backend)`
* **Required branch:** `feature/lab4-4-dashboard-apis`
* **In-Scope:**
  - **Requester Dashboard Endpoint (`GET /api/requester/dashboard`):**
    - Restricted to authenticated Requester; isolated strictly to `req.user.id`.
    - Returns: `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `resolvedTickets`, `closedTickets`, and `recentTickets` list (up to 5 items).
  - **IT Staff Dashboard Endpoint (`GET /api/staff/dashboard`):**
    - Restricted to `IT_STAFF` and `ADMINISTRATOR`.
    - Returns: 5 primary cards (`newTickets`, `openTickets`, `inProgressTickets`, `waitingForRequesterTickets`, `myAssignedTickets`), workload indicators (`unassignedTickets`), full 8-status breakdown (`byStatus`), 4-priority breakdown (`byPriority`), and `recentTickets`.
  - **Admin Dashboard Endpoint (`GET /api/admin/dashboard`):**
    - Restricted strictly to `ADMINISTRATOR`.
    - Returns: operational summaries (`totalActiveTickets`, `unassignedTickets`) alongside user account distribution statistics (`totalUsers`, `activeUsers`, `inactiveUsers`, and breakdown `byRole`).
  - **Database Query Optimization:**
    - Use Prisma `count()` and targeted queries to compute metrics efficiently.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/requester-dashboard.api.test.ts` (test metric accuracy and strict user isolation `API-09`).
    - Author and execute `server/tests/lab-04/staff-dashboard.api.test.ts` (test queue metrics for IT Staff `API-10a` and Administrator `API-10b`, Admin operational/user stats `API-12`, and role restrictions `API-11`, `API-13`).
* **Out-of-Scope & Deferred Dependencies:**
  - Client-side Dashboard UI rendering (deferred to Issue 25 (#56)).
  - Playwright E2E browser verification (deferred to Issue 26 (#57)).
* **Acceptance Criteria:**
  - [ ] Requester dashboard metrics match database counts and never expose tickets belonging to other users (`AC-12`, `API-09`).
  - [ ] IT Staff users receive HTTP 200 OK with accurate counts for primary cards (including `myAssignedTickets` scoped to staff user), unassigned queue, 8-status distribution, priorities, and recent queue tickets on `GET /api/staff/dashboard` (`AC-13a`, `API-10a`).
  - [ ] Administrator users receive HTTP 200 OK with accurate counts for primary cards (including `myAssignedTickets` scoped to admin user), unassigned queue, 8-status distribution, priorities, and recent queue tickets on `GET /api/staff/dashboard` (`AC-13b`, `API-10b`).
  - [ ] Administrator dashboard endpoint returns accurate operational queue and user account distribution metrics (`AC-19a`, `API-12`).
  - [ ] Non-permitted roles receive HTTP 403 Forbidden on role-restricted dashboard endpoints (`AC-14`, `AC-19b`, `API-11`, `API-13`).
  - [ ] 100% of tests in `requester-dashboard.api.test.ts` and `staff-dashboard.api.test.ts` pass.
* **AI Verification Note:**
  > Verify backend dashboard routes and tests. Do not check for Dashboard UI rendering or fail due to unmerged PR status.

---

## Issue 25 (#56): Role-Appropriate Dashboards UI & Drill-Down (Frontend)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab4-5-dashboard-ui`
* **In-Scope:**
  - **Requester Dashboard View (`client/src/pages/RequesterDashboard.tsx`):**
    - 5 Metric cards: My Open Tickets (`openTickets`), In Progress (`inProgressTickets`), Waiting for Requester (`waitingForRequesterTickets`), Recently Resolved (`resolvedTickets`), Closed (`closedTickets`).
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
    - Author `client/tests/lab-04/RequesterDashboard.test.tsx` (metrics rendering, empty state, drill-down, quick actions `UI-05`, `UI-07a`).
    - Author `client/tests/lab-04/StaffDashboard.test.tsx` (cards rendering, quick actions, drill-down `UI-06`, `UI-07b`).
    - Author `client/tests/lab-04/AdminDashboard.test.tsx` (operational cards, user stats, quick actions, drill-down across all 5 cards `UI-08`).
* **Out-of-Scope & Deferred Dependencies:**
  - Playwright E2E browser testing (deferred to Issue 26 (#57)).
  - Final release documentation (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] Requester, Staff, and Administrator Dashboards load authoritative metrics and handle empty/loading states gracefully.
  - [ ] Clicking metric cards on Requester and Staff Dashboards drills down into pre-filtered views; clicking Admin operational cards (`Total Active Tickets`, `Unassigned Queue`) drills down into `#/staff-queue` (with owner filter where applicable), and clicking User metric cards (`Total Users`, `Active Users`, `Inactive Users`) drills down into `#/admin-users` (`AC-15a`, `AC-15b`, `AC-20`).
  - [ ] Header navigation bar correctly highlights the active Dashboard tab.
  - [ ] Layout is fully responsive across Desktop, Tablet, and Mobile with zero clipping.
  - [ ] 100% of Vitest tests in `RequesterDashboard.test.tsx`, `StaffDashboard.test.tsx`, and `AdminDashboard.test.tsx` pass.
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
  - **Regression Testing:**
    - Execute existing Lab 1, 2, and 3 E2E test suites to guarantee zero regression on Auth, Attachments, Comments, Notes, and Admin User Management (`REG-01`, `REG-02`, `REG-03`).
  - **Responsive Layout Audit (`dashboards.spec.ts` `E2E-04`):**
    - Automated viewport audit across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) across all four core responsive screens (Requester Dashboard `#/dashboard`, IT Staff Dashboard `#/staff-dashboard`, Administrator Dashboard `#/admin-dashboard`, Ticket Detail `#/tickets/:id`), asserting zero horizontal overflow (`scrollWidth === clientWidth`), zero interactive control collisions, no clipped text, and conformance to Zen Green design tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`) per FR-17 and AC-17.
  - **Screenshot Artifacts Generation:**
    - Capture and save structured screenshots into `artifacts/lab-04/screenshots/`:
      - `staff-dashboard/`
      - `requester-dashboard/`
      - `admin-dashboard/`
      - `actions-taken/`
* **Out-of-Scope & Deferred Dependencies:**
  - Final PDF compiling and report submission (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] All Lab 4 Playwright E2E specs pass 100% in headless mode.
  - [ ] Zero regression errors across Labs 1, 2, and 3 test suites.
  - [ ] Responsive audit confirms zero horizontal overflow (`scrollWidth === clientWidth`), zero control collisions, no text clipping, and valid Zen Green tokens across all four core screens (Requester Dashboard, IT Staff Dashboard, Administrator Dashboard, Ticket Detail) on Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) viewports (`AC-17`, `E2E-04`).
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
    - Update traceability matrix with final file paths and passing status.
    - Append raw test execution summary output demonstrating 100% pass across Unit, API, UI, and E2E suites.
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
  - [ ] All tests pass on the final `main` branch.
  - [ ] Clean Git commit graph demonstrating feature branches $\to$ `lab4-staging` $\to$ `main`.
  - [ ] Repository contains all artifacts and evidence required to compile the 9-part submission PDF.
* **AI Verification Note:**
  > Verify completion of all documentation, test logs, and release readiness.
