# TokTickIT Lab 3 — GitHub Issues & Sprint Scope Breakdown

This document provides the definitive planning specification for GitHub Issues #12 through #19 for TokTickIT Sprint 3 (Lab 3). Each issue includes strict scope boundaries, branch requirements, and testable acceptance criteria.

---

## 🔒 Issue Immutability & Code Stability Rule (Do NOT Touch Past Issues)
- **Completed Issues Are Frozen**: Once an issue is merged into `lab3-staging` (and for all baseline code inherited from Lab 1 and Lab 2), its code and tests are locked and must not be touched.
- **Strictly No Unsolicited Refactoring**: The AI is prohibited from modifying, refactoring, or rewriting code, CSS, or test files from past completed issues unless:
  1. The developer explicitly commands a fix for a specific past issue, OR
  2. A critical, blocking defect directly halts the current issue from functioning.
- **Additive Development Only**: Always develop new features additively by creating new files, new endpoints, or non-destructive extensions rather than altering existing working logic.

---

## Issue #12: Sprint 3 Engineering Contracts, Specification & Test Plan (Spec DD)
* **Type:** `Documentation`
* **Required branch:** `docs/lab3-spec-and-test-plan`
* **In-Scope:**
  - Author complete engineering contract files in `docs/lab-03/`:
    - `docs/lab-03/specification.md`: Sprint Goal, Stakeholder Request, In/Out Scope, numbered Functional Requirements (FR-xx), Business Rules (BR-01 to BR-xx), Authorization Matrix (Requester, IT Staff, Admin), Data Migration strategy, Product Definition of Done (DoD).
    - `docs/lab-03/api-spec.md`: Complete REST contracts for Authentication, IT Staff Queue/Detail, Public Comments, Internal Notes, and Admin User Management (endpoints, HTTP methods, headers, payload schemas, query parameters, status codes, and safe error responses).
    - `docs/lab-03/ui-spec.md`: Apple-style Zen Green design token alignments, screen structure specifications (Login, Change Password, Staff Queue, Staff Detail, Admin User Management), responsive layout breakpoints (Desktop, Tablet, Mobile), and visual checklist.
    - `docs/lab-03/tests.md`: Planned test matrix covering Unit, API/Integration, UI Component, and E2E Playwright tests with full Acceptance Criteria (AC-xx) traceability.
    - `docs/lab-03/ai-collaboration-guide.md`: Establish AI coding protocol, 9 engineering rules, and issue workflow for Sprint 3.
* **Out-of-Scope:**
  - Writing or modifying any runtime production code or test implementation code.
* **Acceptance Criteria:**
  - [ ] All 5 specification documents are committed and merged to `lab3-staging` before any implementation code is authored.
  - [ ] Every Functional Requirement (FR) maps directly to at least one Business Rule (BR) and Acceptance Criterion (AC).
  - [ ] The Authorization Matrix strictly distinguishes operations permitted for Requester, IT Staff, and Administrator.
  - [ ] Planned test IDs in `tests.md` cover 100% of defined Acceptance Criteria.

---

## Issue #13: Database Migration, Seed Data & Authentication Foundation (Backend API)
* **Type:** `Feature (Backend)`
* **Required branch:** `feature/lab3-1-auth-foundation`
* **In-Scope:**
  - **Prisma Schema & Migration:**
    - Evolve database schema from Lab 2 without losing existing Categories, RelatedSystems, Tickets, or Attachments data.
    - Migrate `RequesterUser` to a unified `User` model with fields: `id`, `name`, `email` (unique), `passwordHash`, `role` (ENUM: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), `mustChangePassword` (boolean, default false), `isActive` (boolean, default true), and timestamps.
    - Update `Ticket` model to include `itPriority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `URGENT`), and optional `ticketOwnerId` foreign key referencing `User`.
    - Create models for append-only communication: `PublicComment` (ticketId, authorId, content, createdAt) and `InternalNote` (ticketId, authorId, content, createdAt).
  - **Idempotent Seed Data (`server/prisma/seed.ts`):**
    - Seed at least 4 active Requesters and 1 inactive Requester.
    - Seed at least 3 active IT Staff and 1 inactive IT Staff.
    - Seed at least 1 active Administrator.
    - Seed realistic initial tickets across various statuses, priorities, and assignments with sample public comments and internal notes.
    - Ensure passwords are cryptographically hashed (e.g. bcrypt) with documented development credentials.
  - **Authentication REST API (`server/src/routes/auth.ts`):**
    - `POST /api/auth/login`: Authenticate active users with email and password; reject inactive users or invalid credentials with safe 401 response; return token/session and user profile (`id`, `name`, `email`, `role`, `mustChangePassword`).
    - `POST /api/auth/logout`: Invalidate session/token.
    - `GET /api/auth/me`: Retrieve current authenticated user profile.
    - `POST /api/auth/change-password`: Allow authenticated user requiring password change to submit current password and valid new password, clearing `mustChangePassword` flag upon success.
  - **Auth Middleware:**
    - `requireAuth`, `requireActive`, and `requireRole(...)` middlewares enforcing server-side authorization.
  - **Automated Backend Tests:**
    - `server/tests/lab-03/auth.api.test.ts`: Supertest suite verifying valid login, invalid login, inactive account rejection, session retrieval, password change validation, and logout.
* **Out-of-Scope:**
  - Frontend login forms, UI components, or client-side navigation (deferred to Issue #14).
  - IT Staff Ticket Queue or Detail endpoints (deferred to Issue #15 & #16).
* **Acceptance Criteria:**
  - [ ] Migration runs cleanly against existing Lab 2 database without data loss.
  - [ ] Seed script is idempotent and can be executed multiple times without unique constraint violations.
  - [ ] Passwords are never stored or logged in plaintext.
  - [ ] Authentication API returns generic, safe error messages upon invalid credentials.
  - [ ] Inactive accounts are strictly blocked from authenticating.
  - [ ] Users with `mustChangePassword = true` successfully update their password and clear the flag.
  - [ ] 100% of tests in `server/tests/lab-03/auth.api.test.ts` pass.

---

## Issue #14: Authentication & First-Login Password Change UI (Frontend UI)
* **Type:** `Feature (Frontend)`
* **Required branch:** `feature/lab3-2-auth-ui`
* **In-Scope:**
  - **Decommission Mock Requester:**
    - Remove the temporary `Development Requester selector` and `Change Requester` modal from client application shell.
  - **Auth Context & State Management (`client/src/context/AuthContext.tsx`):**
    - Global authentication state holding current user profile, token/cookie, and login/logout functions.
    - Route guards protecting application screens based on authenticated status and assigned role.
  - **Login View (`client/src/pages/Login.tsx`):**
    - Email and password input fields styled according to Zen Green design tokens.
    - Client-side validation, submit busy state (loading spinner), and safe generic error banner.
  - **Mandatory Password Change View / Modal (`client/src/pages/ChangePassword.tsx`):**
    - Intercept and block access to all other application routes if `mustChangePassword === true`.
    - Form requiring current password, new password, and password confirmation with policy validation rules.
    - Clear success message and automatic continuation into the application upon completion.
  - **Application Shell Navigation:**
    - Update Header/Navbar to display authenticated user's name, role badge, and a functional Logout button.
    - Display navigation links strictly matching the user's role (Requesters only see Requester routes; IT Staff see Staff routes; Admins see Admin routes).
  - **Automated UI Tests:**
    - `client/src/tests/lab-03/Login.test.tsx` (Vitest + React Testing Library).
    - `client/src/tests/lab-03/ChangePassword.test.tsx`.
* **Out-of-Scope:**
  - IT Staff Queue and Detail screen development (deferred to Issue #15 & #16).
  - Administrator user management screens (deferred to Issue #17).
* **Acceptance Criteria:**
  - [ ] Simulated requester selector is completely removed from UI.
  - [ ] User can log in with valid credentials and receive appropriate feedback on invalid credentials.
  - [ ] Users flagged with `mustChangePassword` are confined to the password change screen and cannot navigate away until a valid new password is saved.
  - [ ] Navigation bar dynamically reflects current user identity, role badge, and permitted links.
  - [ ] Clicking Logout clears authentication state and redirects to the Login screen.
  - [ ] 100% of Vitest tests in `Login.test.tsx` and `ChangePassword.test.tsx` pass.

---

## Issue #15: IT Staff Ticket Queue (API & UI)
* **Type:** `Feature (Full-Stack)`
* **Required branch:** `feature/lab3-3-staff-queue`
* **In-Scope:**
  - **IT Staff Queue REST API (`server/src/routes/staff.ts`):**
    - `GET /api/staff/tickets`: Protected endpoint restricted to `IT_STAFF` and `ADMINISTRATOR` roles.
    - Query capabilities: keyword search (ticket number, summary), filters (status, category, requested priority, IT priority, assigned owner), sorting (created date, updated date, priority), and pagination (page, limit, total count metadata).
    - Return safe HTTP 403 Forbidden if called by a `REQUESTER`.
  - **IT Staff Ticket Queue UI (`client/src/pages/StaffTicketQueue.tsx`):**
    - Zen Green styled table on desktop and responsive card view on mobile.
    - Displays: Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status badge, and Ticket Owner.
    - Search input, single-row filter bar, column sorting controls, and pagination bar.
    - Handles UI states: Loading skeleton/spinner, Empty queue, No-results search state, and error alerts.
    - Clickable row / action button navigating to Ticket Detail view.
  - **Automated Tests:**
    - `server/tests/lab-03/staff-queue.api.test.ts` (Supertest: query filtering, pagination, and role restriction).
    - `client/src/tests/lab-03/StaffTicketQueue.test.tsx` (Vitest: rendering, filter interactions, pagination, empty state).
* **Out-of-Scope:**
  - Claiming, reassigning, or editing ticket details (deferred to Issue #16).
  - Internal notes and comments creation (deferred to Issue #16).
* **Acceptance Criteria:**
  - [ ] Endpoint `GET /api/staff/tickets` returns paginated list of all system tickets for IT Staff/Admin, but returns 403 Forbidden for Requester users.
  - [ ] Search, filter by status/priority, and pagination metadata work accurately.
  - [ ] Desktop table transforms smoothly to card layout on small viewports without horizontal scroll.
  - [ ] Loading, Empty, and No-Results states display distinct, user-friendly Zen Green feedback.
  - [ ] 100% of tests in `staff-queue.api.test.ts` and `StaffTicketQueue.test.tsx` pass.

---

## Issue #16: IT Staff Ticket Operations, Public Comments & Internal Notes (Full-Stack)
* **Type:** `Feature (Full-Stack)`
* **Required branch:** `feature/lab3-4-ticket-detail-and-notes`
* **In-Scope:**
  - **IT Staff Ticket Operations API:**
    - `GET /api/staff/tickets/:id`: Retrieve single ticket detail with attachments, public comments, and internal notes (restricted to IT Staff/Admin).
    - `PATCH /api/staff/tickets/:id/claim`: Assign current IT Staff user as ticket owner.
    - `PATCH /api/staff/tickets/:id/assign`: Reassign ticket owner to another active IT Staff user.
    - `PATCH /api/staff/tickets/:id/priority`: Update `itPriority` (only IT Staff/Admin permitted).
    - `PATCH /api/staff/tickets/:id/status`: Transition ticket status according to defined 8-status transition matrix (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
  - **Comments & Notes APIs:**
    - `POST /api/tickets/:id/comments`: Append Public Comment (author recorded from session; accessible by Requester owner, IT Staff, Admin).
    - `GET /api/tickets/:id/comments`: Retrieve Public Comments for the ticket.
    - `POST /api/tickets/:id/notes`: Append Internal Note (restricted to IT Staff/Admin; strictly rejects empty/whitespace content).
    - `GET /api/tickets/:id/notes`: Retrieve Internal Notes (restricted to IT Staff/Admin; Requesters receive 403 Forbidden with zero note data leaked).
  - **Requester Resolution Action:**
    - `PATCH /api/requester/tickets/:id/resolve-indication`: Endpoint allowing ticket requester to mark "Problem Appears Resolved" without formally closing the ticket.
  - **Frontend UI Enhancements:**
    - `StaffTicketDetail.tsx`: Ticket header, metadata grid, operational action controls (Claim button, Reassign dropdown, IT Priority selector, Status transition dropdown with confirmation).
    - Reusable Comments & Notes component: Visually distinct presentation separating Public Comments (green accent) from Internal Notes (amber/private styling).
    - Update Requester Ticket Detail screen to render Public Comments and "Problem Appears Resolved" button while preserving Lab 2 attachments view.
  - **Automated Tests:**
    - `server/tests/lab-03/staff-ticket-detail.api.test.ts`.
    - `server/tests/lab-03/comments-notes.api.test.ts`.
    - `client/src/tests/lab-03/StaffTicketDetail.test.tsx`.
* **Out-of-Scope:**
  - Actions Taken by IT Staff (explicitly deferred to Lab 4).
  - User administration screens (deferred to Issue #17).
  - Editing or deleting comments/notes (append-only by requirement).
* **Acceptance Criteria:**
  - [ ] IT Staff can claim ownership, reassign to active staff, and adjust IT Priority.
  - [ ] Status transitions adhere strictly to permitted state flow.
  - [ ] Requesters can add and view Public Comments, and indicate problem resolved, but cannot alter formal status to Resolved/Closed.
  - [ ] Internal Notes are completely inaccessible and invisible to Requester users via both UI and direct API calls (403 Forbidden).
  - [ ] Comments and notes reject whitespace-only or empty submissions and persist creation timestamps and authors.
  - [ ] All associated Supertest and Vitest test suites pass 100%.

---

## Issue #17: Minimalist Administrator User Management (Full-Stack)
* **Type:** `Feature (Full-Stack)`
* **Required branch:** `feature/lab3-5-admin-user-management`
* **In-Scope:**
  - **Admin User Management API (`server/src/routes/admin.ts`):**
    - Restricted exclusively to `ADMINISTRATOR` role (non-admins receive 403 Forbidden).
    - `GET /api/admin/users`: List users with name/email search and optional role filter.
    - `POST /api/admin/users`: Create a user with name, email, single role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), activation status, and initial password (sets `mustChangePassword = true`).
    - `PATCH /api/admin/users/:id`: Edit user's name, email, role, and active status.
    - `POST /api/admin/users/:id/reset-password`: Set a new initial password and mark `mustChangePassword = true`.
  - **Safety Rules Enforcement:**
    - Reject duplicate email addresses with a 409 Conflict error.
    - Prevent an Administrator from deactivating their own account.
    - Prevent deactivating or demoting the last remaining active Administrator in the system.
    - Enforce deactivation instead of deletion (no DELETE endpoint).
  - **Admin User Management UI (`client/src/pages/UserManagement.tsx`):**
    - Minimalist Zen Green table displaying: Name, Email, Role badge, Status badge, and Edit action.
    - Search bar (name/email) and Role filter dropdown.
    - "Create New User" modal/drawer with validation, single-role selector, and initial password field.
    - "Edit User" modal/drawer allowing status toggle (Activate/Deactivate) and "Reset Password" button.
    - Protective client-side guards preventing self-deactivation with clear tooltips/alerts.
  - **Automated Tests:**
    - `server/tests/lab-03/users-admin.api.test.ts` (Supertest: CRUD, safety rules, duplicate email, self-deactivation block, last admin guard, non-admin forbidden).
    - `client/src/tests/lab-03/UserManagement.test.tsx` (Vitest: user list rendering, creation modal, edit modal, validation feedback).
* **Out-of-Scope:**
  - Permanent user deletion, bulk user operations, import/export.
  - Multi-role assignments, profile photo uploads, department hierarchies.
  - Email dispatching for passwords (local manual display only).
* **Acceptance Criteria:**
  - [ ] Non-administrators (Requester and IT Staff) receive 403 Forbidden when calling Admin APIs or navigating to `/admin/users`.
  - [ ] Administrator can create a user with a single role; the new user is flagged to change password on first login.
  - [ ] Duplicate email submission is rejected with clear error feedback.
  - [ ] System strictly rejects attempts by an admin to deactivate themselves or the last active admin.
  - [ ] User list search and role filter operate responsively without table layout clipping.
  - [ ] 100% of tests in `users-admin.api.test.ts` and `UserManagement.test.tsx` pass.

---

## Issue #18: End-to-End Testing, Responsive Audit & Visual Inspection
* **Type:** `Testing & Quality Assurance`
* **Required branch:** `feature/lab3-6-e2e-and-responsive`
* **In-Scope:**
  - **Playwright E2E Test Suites (`e2e/lab-03/`):**
    - `authentication.spec.ts`: Test valid/invalid login, inactive account blockage, mandatory first-login password change flow, authenticated navigation bar, and logout invalidation.
    - `staff-ticket-flow.spec.ts`: Test IT Staff login, queue search/filter/pagination, opening ticket detail, claiming ticket, updating IT Priority, status transitions, adding Public Comment, and adding Internal Note.
    - `user-administration.spec.ts`: Test Admin login, user creation, duplicate email rejection, role assignment, resetting initial password, and self-deactivation guard.
    - `requester-regression.spec.ts`: Verify Lab 2 Requester flows (create ticket, my tickets, view attachments) still work flawlessly with authenticated sessions.
  - **Responsive Layout & Overflow Audit:**
    - Test all major views across Desktop ($1280 \times 800$), Tablet ($768 \times 1024$), and Mobile ($375 \times 667$).
    - Assert `scrollWidth === clientWidth` ensuring zero horizontal overflow on all screen sizes.
  - **Automated Screenshot Artifact Generation:**
    - Capture structured screenshots saved to `artifacts/lab-03/screenshots/`:
      - `authentication/` (login, password-change, invalid-error, inactive-error)
      - `staff-queue/` (desktop-table, mobile-cards, filters, empty-state)
      - `staff-ticket-detail/` (detail-view, claim-state, public-comments, internal-notes)
      - `user-management/` (user-list, create-modal, edit-modal, safety-alert)
* **Out-of-Scope:**
  - Modifying business logic or data contracts (unless bug fixes are uncovered).
  - Final PDF report generation (deferred to Issue #19).
* **Acceptance Criteria:**
  - [ ] All E2E test suites pass 100% on headless browser runs.
  - [ ] Zero horizontal scrollbars detected across all views in mobile/tablet viewports.
  - [ ] All required screenshots are clearly captured, high-resolution, and organized in their respective directories.

---

## Issue #19: Release Integration, Peer Review Consolidation & Sprint Documentation
* **Type:** `Documentation & Release`
* **Required branch:** `docs/lab3-documentation`
* **In-Scope:**
  - **Peer Review Record (`docs/lab-03/reviewer.md`):**
    - Document all authored PRs (#XX to #YY), review comments from @lephirada, developer responses, fixes applied, and final approvals.
    - Document all PRs reviewed for partner @lephirada with actionable review feedback.
  - **AI Usage Log & Reflection (`docs/lab-03/ai-use.md`):**
    - Record LLM model used (Antigravity AI / Gemini 3.8 Flash).
    - Detail 6–10 representative prompts with descriptions of outcomes and integration.
    - Write a thorough "My Reflection" on Spec-DD agent and Coding agent usage.
  - **Test Execution Logs (`docs/lab-03/tests.md`):**
    - Update planned test table with actual automated test file paths and final pass status.
    - Append complete CLI test summary output showing 100% passing across Unit, API, UI, and E2E suites.
  - **Project Documentation Updates:**
    - Update root `README.md` with Sprint 3 architecture badges, data model summary, and test commands.
  - **Release Integration:**
    - Merge all feature branches into `lab3-staging`.
    - Conduct final regression audit on `lab3-staging`.
    - Open release Pull Request from `lab3-staging` to `main`, obtain peer approval, and merge.
* **Out-of-Scope:**
  - Lab 4 features (Actions Taken, SLA, notifications).
* **Acceptance Criteria:**
  - [ ] `docs/lab-03/reviewer.md`, `ai-use.md`, and `tests.md` are completely filled out and verified.
  - [ ] All tests pass on the final `main` branch.
  - [ ] Full commit history reflects clean Git discipline: feature branches $\rightarrow$ `lab3-staging` $\rightarrow$ `main`.
  - [ ] Materials are ready for compilation into the 9-part PDF submission report.
