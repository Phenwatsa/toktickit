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
    - `POST /api/tickets/:id/actions`: Create Action Taken (strictly restricted to `IT_STAFF` and `ADMINISTRATOR`; auto-set `performedById` from authenticated session).
    - `PATCH /api/tickets/:id/actions/:actionId`: Update Action Taken details (restricted to `IT_STAFF` and `ADMINISTRATOR`).
    - Validation: Enforce `followUpNote` as mandatory when `isFollowUpRequired === true`.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/actions-taken.api.test.ts` covering creation, listing, updating, validation rules, and role authorization rejection (403 for Requester; 201/200 for IT Staff & Admin).
* **Out-of-Scope & Deferred Dependencies:**
  - Actions Taken UI components in React (deferred to Issue 23 (#54)).
  - Status transition matrix and resolution gate enforcement (deferred to Issue 22 (#53)).
  - Dashboard aggregation APIs (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Prisma migration executes cleanly without losing data from earlier labs.
  - [ ] Seed script runs idempotently and populates realistic Actions Taken records.
  - [ ] Requesters are blocked from creating or modifying Actions Taken (HTTP 403 Forbidden); IT Staff and Administrators are permitted.
  - [ ] Submitting an Action Taken with `isFollowUpRequired = true` without a note returns HTTP 400 validation error.
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
  - **Concurrency & Stale-Update Protection:**
    - Implement optimistic concurrency detection (e.g. verifying `updatedAt` timestamp or version token upon status change).
    - Return HTTP 409 Conflict with safe messaging when an update is attempted on stale data.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/ticket-workflow.api.test.ts` verifying permitted/forbidden transitions, resolution gate security (permitting IT Staff and Admin, blocking Requester), and 409 Conflict handling.
* **Out-of-Scope & Deferred Dependencies:**
  - Frontend status dropdown adjustments (deferred to Issue 23 (#54)).
  - Dashboard metric calculations (deferred to Issue 24 (#55)).
* **Acceptance Criteria:**
  - [ ] Direct API attempts by Requesters to set status to `RESOLVED` or `CLOSED` are strictly blocked (HTTP 403); IT Staff and Administrators are permitted.
  - [ ] Status transitions follow the authorized transition matrix; invalid transitions return HTTP 400.
  - [ ] Concurrent or stale status updates return HTTP 409 Conflict without overwriting unread changes.
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
    - Returns: Total Open Tickets, Tickets Waiting for Requester, Recently Resolved Tickets, and Recent Tickets list (up to 5 items).
  - **IT Staff Dashboard Endpoint (`GET /api/staff/dashboard`):**
    - Restricted strictly to `IT_STAFF` (and reusable for `ADMINISTRATOR`).
    - Returns: Unassigned Tickets count, My Assigned Tickets count, Tickets by Status counts, Tickets by IT Priority counts, and Recent Queue Tickets.
  - **Admin Dashboard Extensions (`GET /api/admin/dashboard` or staff reuse):**
    - Reuse IT Staff operational summary with optional user account statistics.
  - **Database Query Optimization:**
    - Use Prisma `count()` and targeted queries to compute metrics efficiently.
  - **Automated Backend Tests:**
    - Author and execute `server/tests/lab-04/requester-dashboard.api.test.ts` (test metric accuracy and strict user isolation).
    - Author and execute `server/tests/lab-04/staff-dashboard.api.test.ts` (test queue metrics and role restriction).
* **Out-of-Scope & Deferred Dependencies:**
  - Client-side Dashboard UI rendering (deferred to Issue 25 (#56)).
  - Playwright E2E browser verification (deferred to Issue 26 (#57)).
* **Acceptance Criteria:**
  - [ ] Requester dashboard metrics match database counts and never expose tickets belonging to other users.
  - [ ] IT Staff dashboard endpoint calculates accurate counts for unassigned, assigned, and status groups.
  - [ ] Requester calling Staff Dashboard endpoint receives HTTP 403 Forbidden.
  - [ ] 100% of tests in `requester-dashboard.api.test.ts` and `staff-dashboard.api.test.ts` pass.
* **AI Verification Note:**
  > Verify backend dashboard routes and tests. Do not check for Dashboard UI rendering or fail due to unmerged PR status.

---

## Issue 25 (#56): Role-Appropriate Dashboards UI & Drill-Down (Frontend)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab4-5-dashboard-ui`
* **In-Scope:**
  - **Requester Dashboard View (`client/src/pages/RequesterDashboard.tsx`):**
    - Metric cards: My Open Tickets, In Progress, Resolved, Closed.
    - My Recent Tickets list with status badges and timestamps.
    - Quick actions: "Create Ticket", "View My Tickets".
    - Drill-down: Clicking a metric card navigates to `MyTickets` pre-filtered by that status.
  - **IT Staff Dashboard View (`client/src/pages/StaffDashboard.tsx`):**
    - Metric cards: New, Open, In Progress, Waiting for Requester, My Assigned.
    - Recent Tickets list with priority badges and assignees.
    - Quick actions: "Create Ticket", "Search Tickets", "My Queue".
    - Drill-down: Clicking a metric card navigates to `StaffTicketQueue` with active filter preset.
  - **App Shell & Navigation Updates (`App.tsx`, `Header.tsx`):**
    - Add "Dashboard" link to Header navigation bar for all roles with active state indicator.
    - Set Dashboard as the default landing view upon login.
    - Loading skeletons, empty states, and manual refresh controls.
  - **Automated UI Tests:**
    - Author `client/tests/lab-04/RequesterDashboard.test.tsx` (metrics rendering, empty state, drill-down).
    - Author `client/tests/lab-04/StaffDashboard.test.tsx` (cards rendering, quick actions, drill-down).
* **Out-of-Scope & Deferred Dependencies:**
  - Playwright E2E browser testing (deferred to Issue 26 (#57)).
  - Final release documentation (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] Both Dashboards load authoritative metrics and handle empty/loading states gracefully.
  - [ ] Clicking any metric card drills down into the respective filtered queue/list screen.
  - [ ] Header navigation bar correctly highlights the active Dashboard tab.
  - [ ] Layout is fully responsive across Desktop, Tablet, and Mobile with zero clipping.
  - [ ] 100% of Vitest tests in `RequesterDashboard.test.tsx` and `StaffDashboard.test.tsx` pass.
* **AI Verification Note:**
  > Verify Dashboard components, navigation routing, and Vitest test files. Do not fail verification on pending PR merge or missing Playwright E2E files.

---

## Issue 26 (#57): End-to-End Testing, Responsive Audit & Screenshot Artifacts
* **Type:** `Testing & Quality Assurance`
* **Required branch:** `feature/lab4-6-e2e-and-responsive`
* **In-Scope:**
  - **Playwright E2E Test Suites (`e2e/lab-04/`):**
    - `actions-taken-flow.spec.ts`: IT Staff adding/editing Actions Taken, validation trigger, and Requester read-only verification.
    - `ticket-resolution.spec.ts`: Requester advisory indication, IT Staff formal resolution, status transitions, and stale conflict handling.
    - `dashboards.spec.ts`: Requester and IT Staff dashboard loading, metric validation against UI, and drill-down navigation.
  - **Regression Testing:**
    - Execute existing Lab 1, 2, and 3 E2E test suites to guarantee zero regression on Auth, Attachments, Comments, Notes, and Admin User Management.
  - **Responsive Layout Audit:**
    - Automated viewport check across Desktop (1280x800), Tablet (768x1024), and Mobile (375x667), asserting `scrollWidth === clientWidth` (zero horizontal overflow).
  - **Screenshot Artifacts Generation:**
    - Capture and save structured screenshots into `artifacts/lab-04/screenshots/`:
      - `staff-dashboard/`
      - `requester-dashboard/`
      - `actions-taken/`
* **Out-of-Scope & Deferred Dependencies:**
  - Final PDF compiling and report submission (deferred to Issue 27 (#58)).
* **Acceptance Criteria:**
  - [ ] All Lab 4 Playwright E2E specs pass 100% in headless mode.
  - [ ] Zero regression errors across Labs 1, 2, and 3 test suites.
  - [ ] Zero horizontal scrollbars detected on any screen across Desktop, Tablet, and Mobile.
  - [ ] All required screenshots are captured clearly at standard viewports and stored in the artifacts directory.
* **AI Verification Note:**
  > Verify E2E test files, passing execution results, and presence of generated screenshot files. Do not fail on unmerged PR status.

---

## Issue 27 (#58): Release Integration, Peer Review, AI Reflection & Final Handover
* **Type:** `Documentation & Release`
* **Required branch:** `docs/lab4-documentation`
* **In-Scope:**
  - **Peer Review Record (`docs/lab-04/reviewer.md`):**
    - Document all PRs (#51 to #58), review comments from peer reviewer, developer responses, fixes applied, and final approvals.
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
