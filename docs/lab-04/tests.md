# TokTickIT Lab 4 — Test Plan & Traceability Matrix

This document provides the authoritative test plan, architecture breakdown, and full Requirements Traceability Matrix (RTM) for TokTickIT Sprint 4 (Lab 4). It links Functional Requirements (FR) and Business Rules (BR) to testable Acceptance Criteria (AC) and planned automated test cases across all seven testing tiers.

---

## 1. Test Strategy & Architectural Breakdown (7 Testing Tiers)

The test plan enforces comprehensive multi-tier quality assurance covering all specified test dimensions across 53 planned tests, achieving 100% bidirectional coverage across all 28 parent Acceptance Criteria (30 distinct criteria identifiers: AC-01–AC-28, with sub-criteria AC-15a/b and AC-19a/b):

1. **Unit Tests (`server/tests/lab-04/unit/`)**:
   Isolated validation and calculation logic testing business rules without network overhead (4 planned tests):
   - `follow-up-validation.unit.test.ts` (`UNIT-01`): Validates conditional requirement and length rules for `followUpNote` when `isFollowUpRequired === true`: (a) fails on empty or whitespace-only (`"   "`), (b) fails on fewer than 3 non-whitespace characters (e.g. `"a"`, `"ab"`, `"  ab  "`), (c) passes on 3 or more non-whitespace characters (e.g. `"abc"`, `"  abc  "`), and (d) permits null/omitted when `isFollowUpRequired === false`.
   - `status-transition-matrix.unit.test.ts` (`UNIT-02`): Validates permitted vs forbidden transitions across all 8 statuses and role authority checks.
   - `concurrency-check.unit.test.ts` (`UNIT-03`): Validates optimistic concurrency timestamp comparison logic.
   - `dashboard-calculator.unit.test.ts` (`UNIT-04`): Validates aggregation logic for metric counts.
2. **API & Performance Smoke Tests (`server/tests/lab-04/`)**:
   Supertest suites and performance benchmarks (21 planned tests: 20 API endpoint tests across `API-01`–`API-17` and 1 performance smoke test `PERF-SMOKE-01`) asserting HTTP status codes, request validation, RBAC isolation, database interactions, error schema compliance, and response latency thresholds:
   - `actions-taken.api.test.ts`: Tests CRUD endpoints, auto-performer attribution, ticket scoping check (404 on cross-ticket patch), rejection of Actions Taken creation and update on terminal `CANCELLED` tickets (`API-14a`), field boundary validations (`API-16`), non-deletable audit trail invariant asserting no delete endpoint exists (`API-17`), and cross-user isolation for both `IT_STAFF` and `ADMINISTRATOR` roles (`API-01`–`API-06`, `API-14a`, `API-16`, `API-17`).
   - `ticket-workflow.api.test.ts`: Tests status transitions, optimistic concurrency validation (missing/malformed ISO returns 400 `API-07`, stale timestamp returns 409 `API-08`), rejection of status transitions & advisory resolution on terminal `CANCELLED` tickets (`API-14b`), ticket reassignment validation asserting rejection of non-existent, inactive, or non-IT Staff assignees (`400 INVALID_OWNER`, verifying ticket owner remains unchanged) as well as rejection of reassignment on terminal `CLOSED` and `CANCELLED` tickets (`400 INVALID_STATE`, verifying ticket owner remains unchanged) (`API-15`), and Administrator supervisory ticket queue retrieval and status transition execution (`API-10b`).
   - `requester-dashboard.api.test.ts`: Tests Requester metrics calculation and strict tenant isolation (`API-09`).
   - `staff-dashboard.api.test.ts`: Tests Staff queue metrics, status breakdowns, priority breakdowns, and recent queue tickets for IT Staff (`API-10`), Admin operational & user metrics (`API-12`), and non-permitted 403 rejections for Requesters and Administrators (`API-11`, `API-13`).
   - `performance-smoke.test.ts` (`PERF-SMOKE-01`): Performance smoke benchmark asserting dashboard aggregation latency (< 300ms) and actions list retrieval latency (< 200ms) under standard seeded load.
3. **Database Migration & Seed Tests (`server/tests/lab-04/`)**:
   Database migration lifecycle and idempotent seed integrity tests (3 planned tests):
   - `migration-recovery.test.ts` (`MIG-01`, `MIG-02`): Tests migration deployment, legacy data preservation, and rollback recovery simulation on an isolated disposable test database (`AC-21`):
     - *MIG-01 (Deploy & Preserve)*: (1) Verify initial schema, migration history, and legacy records; (2) Run `npx prisma migrate deploy`; (3) Verify migration completes successfully; (4) Verify all expected schema changes (`ActionTaken` table, columns, indexes, foreign keys) are present; (5) Verify all legacy records and values remain 100% intact; (6) Verify final migration state in `_prisma_migrations` reflects the newly applied migration without manual history deletion or resetting.
     - *MIG-02 (Rollback Recovery Simulation)*: (1) Prepare disposable database with baseline schema and simulated partially failed migration in `_prisma_migrations` (`finished_at IS NULL`); (2) Inspect schema and execute compensatory cleanup to drop partial/dangling remnants (e.g. `DROP TABLE IF EXISTS "ActionTaken" CASCADE;`) restoring the database schema to clean pre-migration baseline state suitable for safe re-run; (3) Run `npx prisma migrate resolve --rolled-back <migration_name>` to reconcile Prisma migration history; (4) Re-apply `npx prisma migrate deploy`; (5) Verify migration completes successfully, schema matches target state, legacy data remains 100% intact, and `_prisma_migrations` records successful application without corruption.
   - `seed-data.test.ts` (`SEED-01`): Tests repeated seed execution (`prisma/seed.ts` run 1 and run 2 idempotency check), asserting zero constraint collisions, invariant record counts, and directly asserting all 8 lifecycle statuses, 4 priorities, assigned/unassigned ownership, 0/1/multiple Actions Taken, and zero/non-zero dashboard metric profiles (`AC-22`).
4. **Workflow Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)**:
   Stateful multi-step lifecycle integration tests (3 planned tests):
   - Multi-step status progression (`NEW` $\to$ `OPEN` $\to$ `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER` $\to$ `RESOLVED` $\to$ `CLOSED`).
   - Resolution gate verification (Requester advisory indication vs IT Staff/Admin formal resolution).
   - Stale-update conflict recovery (`409 Conflict` followed by reload and retry).
5. **UI Component Tests (`client/tests/lab-04/`)**:
   Vitest & React Testing Library component tests (13 planned tests):
   - `ActionsTaken.test.tsx`: Tests list rendering, modal form state, validation error banners, and read-only Requester presentation (`UI-01a`, `UI-01b`, `UI-02`, `UI-03`).
   - `TicketWorkflow.test.tsx`: Tests status transition controls, resolution feedback, 409 conflict alert handling (`UI-04`), and uncommitted form state preservation on 409 conflict (`UI-04b`).
   - `RequesterDashboard.test.tsx`: Tests metric cards rendering, empty state, drill-down triggers, and Requester Quick Actions (`UI-05`, `UI-07a`).
   - `StaffDashboard.test.tsx`: Tests 5 primary cards, 8-status breakdown, priority badges, drill-down routing, and Staff Quick Actions (`UI-06`, `UI-07b`).
   - `AdminDashboard.test.tsx` (`UI-08`): Tests Admin dashboard operational & user metric cards rendering, role distribution badges, recent queue list, Quick Actions ("User Management", "Ticket Queue", "Create Ticket"), and interactive drill-downs across all 5 metric cards (Total Active Tickets $\to$ `#/staff-queue`, Unassigned Queue $\to$ `#/staff-queue?owner=unassigned`, Total Users / Active Users / Inactive Users $\to$ `#/admin-users`).
   - `UIStates.test.tsx` (`UI-EMPTY-01`): Tests skeleton loading placeholders and friendly empty zero-states across Requester Dashboard, Staff Dashboard, Admin Dashboard, and Ticket Detail (`AC-24`).
   - `DesignSystemTokens.test.tsx` (`UI-STYLE-01`): Component-level DOM and CSS assertions verifying Zen Green design tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`), status badge styles and colors across all 8 statuses, visible focus rings (`:focus-visible`), and private/shared role-based visual cues (`AC-17`).
6. **End-to-End Playwright Tests (`e2e/lab-04/`)**:
   Full browser workflows executed under real session tokens (6 planned tests):
   - `actions-taken-flow.spec.ts`: End-to-end recording of actions by staff and administrator, editing, and requester read-only audit (`E2E-01`).
   - `ticket-resolution.spec.ts`: Requester advisory resolution $\to$ IT Staff / Administrator formal review $\to$ official `RESOLVED` status transition (`E2E-02`).
   - `dashboards.spec.ts`: Live dashboard metric counts verification against database records, drill-down navigation, Quick Actions across Requester, Staff, and Admin (`E2E-03a`, `E2E-03b`), and multi-viewport responsive audit across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) asserting zero horizontal overflow ($scrollWidth === clientWidth$), grid restructuring (5-column Desktop metric cards row, 2–3 column Tablet grid, 1-column Mobile stack), zero element collisions/clipping, and accessible controls across the four core screens (`E2E-04`).
   - `accessibility.spec.ts` (`A11Y-01`): Browser accessibility suite verifying modal focus trapping (`ActionTakenModal`), focus restoration to triggering button upon modal close, keyboard navigation cycling, and semantic ARIA announcements.
7. **Regression Tests**:
   Continuous test runs ensuring that legacy features from Labs 1–3 remain functional with zero regressions (3 planned test suites):
   - `REG-01` (Server Regression): All server API and unit test suites across Labs 1, 2, and 3 (`server/tests/lab-01/*`, `server/tests/lab-02/*`, `server/tests/lab-03/*`), directly safeguarding categories (`server/tests/lab-01/categories.test.ts`), authentication, ticket creation, ticket queues, attachments, public comments, internal notes, and administrative user management.
   - `REG-02` (Client Regression): All client UI component test suites across Labs 1, 2, and 3 (`client/tests/lab-01/*`, `client/tests/lab-02/*`, `client/tests/lab-03/*`), safeguarding category selection in ticket creation forms (`client/tests/lab-02/CreateTicket.test.tsx`), authentication, forms, navigation, and modal components.
   - `REG-03` (E2E Regression): All Playwright end-to-end regression workflows from Labs 2 and 3 (`e2e/lab-02/*`, `e2e/lab-03/*`), safeguarding complete cross-role browser journeys including ticket lifecycle workflows.

---

## 2. Full Requirements Traceability Matrix (FR $\to$ BR $\to$ AC $\to$ Test ID)

This matrix links Functional Requirements (FR) and Business Rules (BR) to all 28 parent Acceptance Criteria (30 distinct criteria identifiers: AC-01–AC-28, including sub-criteria AC-15a/b and AC-19a/b) and planned automated test cases across all seven testing tiers.

| FR ID | Governing BR | AC ID | Test ID | Type | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-01** | BR-05, BR-06 | **AC-04, AC-27** | `API-04` | API | List Actions Taken on owned ticket with deterministic ordering | Returns 200 with chronological actions list sorted deterministically by `actionDateTime ASC, id ASC` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-01** | BR-06 | **AC-05** | `API-05` | API | Cross-requester actions isolation | Non-owner requester receives 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-02** | BR-01, BR-02 | **AC-01** | `API-01` | API | IT Staff and Administrator record valid Action Taken | Created with 201 under target ticket for both roles | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-03** | BR-03 | **AC-01** | `API-01` | API | Performer auto-attribution from session (Staff & Admin) | `performedById` matches authenticated user ID for both roles | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-04** | BR-04 | **AC-02** | `UNIT-01`| Unit | Follow-up note validator logic (empty, whitespace, < 3 chars, $\ge 3$ chars) | Returns false for empty/whitespace or < 3 non-whitespace chars; returns true for $\ge 3$ non-whitespace chars | `server/tests/lab-04/unit/follow-up-validation.unit.test.ts` | Passed |
| **FR-04** | BR-04 | **AC-02** | `API-02` | API | Conditional validation on Action creation & update | 400 Bad Request with "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed" when blank, whitespace, or < 3 chars; 201/200 when $\ge 3$ chars | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-05** | BR-01, BR-02 | **AC-06** | `API-06` | API | IT Staff and Administrator update Action Taken; verify cross-ticket 404 scoping | Returns 200 with updated fields for valid update; returns 404 Not Found if action belongs to another ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-06** | BR-06 | **AC-03** | `API-03a`| API | Requester Action creation blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-06** | BR-06 | **AC-03** | `API-03b`| API | Requester Action modification blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-07** | BR-08 | **AC-07** | `WF-01`  | Workflow | Resolution gate: Requester cannot resolve/close | Requester calling resolve/close rejected (403); IT Staff and Administrator permitted | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-08** | BR-09 | **AC-08** | `WF-02`  | Workflow | Advisory resolution indication | `problemAppearsResolved = true`; status unchanged; IT Staff or Administrator executes formal resolution | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-09** | BR-07 | **AC-09** | `UNIT-02`| Unit | 8-status transition matrix validator | Validates all valid/invalid state hops | `server/tests/lab-04/unit/status-transition-matrix.unit.test.ts` | Passed |
| **FR-09** | BR-07 | **AC-09** | `WF-03`  | Workflow | Multi-step lifecycle status flow | Transitions sequentially through valid states | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-10** | BR-10 | **AC-10** | `UNIT-03`| Unit | Optimistic concurrency comparator | Flags missing or mismatched timestamp | `server/tests/lab-04/unit/concurrency-check.unit.test.ts` | Passed |
| **FR-10** | BR-10 | **AC-10** | `API-07` | API | Missing or malformed `expectedUpdatedAt` rejection | 400 Bad Request (`VALIDATION_ERROR`) on missing or malformed ISO date string | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-10** | BR-10 | **AC-11** | `API-08` | API | Stale update detection & conflict | 409 Conflict with `currentUpdatedAt` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-11** | BR-12, BR-13 | **AC-12**| `UNIT-04`| Unit | Requester metrics calculator logic | Computes all 5 distinct metric formulas | `server/tests/lab-04/unit/dashboard-calculator.unit.test.ts` | Passed |
| **FR-11** | BR-13 | **AC-12** | `API-09` | API | Requester dashboard metrics isolation | Returns 200 with 5 metrics for owned tickets (`resolvedTickets` without date filtering) | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **FR-12** | BR-14 | **AC-13** | `API-10` | API | Staff dashboard queue metrics for IT Staff | Returns 200 with 5 primary cards (`myAssignedTickets` scoped to staff user), `unassignedTickets`, 8 statuses `byStatus`, 4 priorities `byPriority`, and `recentTickets` for `IT_STAFF` role | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **FR-07, FR-09** | Central Matrix, BR-07, BR-08 | **AC-07, AC-09** | `API-10b` | API | Administrator supervisory queue access & status transition authority | Returns 200 on `GET /api/staff/tickets` retrieving active queue, and returns 200 on `PATCH /api/staff/tickets/:id/status` executing authorized status transition | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-12** | Matrix | **AC-14** | `API-11` | API | Staff dashboard RBAC rejection (Requester & Admin blocked) | 403 Forbidden returned for non-IT Staff users (Requesters and Administrators) calling `GET /api/staff/dashboard` | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **FR-02, FR-05** | BR-11 | **AC-23** | `API-14a` | API | Reject Actions Taken creation and update on CANCELLED ticket | Precondition: ticket is CANCELLED. Returns 400 Bad Request (`TICKET_CANCELLED`) on `POST /api/tickets/:id/actions` and `PATCH /api/tickets/:id/actions/:actionId`; zero records created or modified; ticket remains `CANCELLED` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-08, FR-09** | BR-07, BR-11 | **AC-23** | `API-14b` | API | Reject status transitions and resolution indications on CANCELLED ticket | Precondition: ticket is CANCELLED. Returns 400 Bad Request (`TICKET_CANCELLED`) on `PATCH /api/staff/tickets/:id/status` and `PATCH /api/requester/tickets/:id/resolve-indication`; ticket remains strictly `CANCELLED` with unchanged `updatedAt` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-16** | BR-11, BR-18 | **AC-25** | `API-15` | API | Ticket reassignment validation: reject non-existent, inactive, or non-IT Staff assignee, and reject reassignment on CLOSED and CANCELLED tickets | (1) Returns 400 Bad Request (`INVALID_OWNER`) when `newOwnerId` does not exist in system, is inactive, or has non-staff role, verifying existing ticket owner remains unchanged; (2) Precondition: ticket is `CLOSED`. Returns 400 Bad Request (`INVALID_STATE`), verifying ticket owner and attributes remain unchanged; (3) Precondition: ticket is `CANCELLED`. Returns 400 Bad Request (`INVALID_STATE`), verifying ticket owner and attributes remain unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **FR-02, FR-04** | BR-02, BR-04 | **AC-26** | `API-16` | API | Actions Taken boundary validations | Validates character limits for `actionDescription` (5–2000), `result` (3–2000), `attachmentNotes` ($\le 500$), and valid ISO-8601 date parsing | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **FR-01** | BR-05 | **AC-27** | `API-17` | API | Non-deletable audit trail invariant & no delete endpoint | HTTP DELETE request on `/api/tickets/:id/actions/:actionId` returns 404 / route unhandled | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **Non-Func** | Handout §10 | **N/A** | `PERF-SMOKE-01` | API / Perf | Dashboard and actions query latency smoke benchmark | Asserts dashboard aggregation response latency < 300ms and actions list retrieval latency < 200ms under standard seeded load | `server/tests/lab-04/performance-smoke.test.ts` | Passed |

| **FR-02** | BR-03 | **AC-01** | `UI-01a` | UI | Actions Taken list & create modal (Staff & Admin) | Form submits and list updates with new action item for both roles | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **FR-05** | BR-01 | **AC-06** | `UI-01b` | UI | Actions Taken edit form & state update (Staff & Admin) | Existing action updated with edited content for both roles | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **FR-04** | BR-04 | **AC-02** | `UI-02`  | UI | Follow-up note UI inline validation (empty, whitespace, < 3 chars, $\ge 3$ chars) | Blocks submit and displays "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed" on blank/whitespace/< 3 chars; permits submit on $\ge 3$ chars | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **FR-06** | BR-06 | **AC-04** | `UI-03`  | UI | Requester Actions read-only UI | Add/Edit buttons completely omitted | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **FR-10** | BR-10 | **AC-11** | `UI-04`  | UI | 409 Conflict alert UI feedback | User-friendly conflict banner displayed | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **FR-10** | BR-16 | **AC-28** | `UI-04b` | UI | Uncommitted form state preservation upon 409 conflict | Preserves unsaved status transition inputs and notes upon 409 conflict, allowing user to refresh state and retry without losing data | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **FR-11** | BR-13, BR-15 | **AC-15a**| `UI-05`  | UI | Requester dashboard rendering & drill-down | Clicking card navigates to filtered MyTickets | `client/tests/lab-04/RequesterDashboard.test.tsx` | Passed |
| **FR-12** | BR-14, BR-15 | **AC-15b**| `UI-06`  | UI | Staff dashboard rendering & drill-down | Clicking card navigates to filtered Queue | `client/tests/lab-04/StaffDashboard.test.tsx` | Passed |
| **FR-14** | BR-13 | **AC-16** | `UI-07a` | UI | Requester Dashboard Quick Actions navigation | Clicking 'Create Ticket' and 'View All My Tickets' triggers correct route navigation | `client/tests/lab-04/RequesterDashboard.test.tsx` | Passed |
| **FR-14** | BR-14 | **AC-16** | `UI-07b` | UI | Staff Dashboard Quick Actions navigation | Clicking 'Create Ticket', 'Search Tickets', and 'My Assigned Queue' triggers correct route navigation | `client/tests/lab-04/StaffDashboard.test.tsx` | Passed |
| **FR-13, FR-14, FR-15, FR-17** | BR-15, BR-17 | **AC-16, AC-20** | `UI-08`  | UI | Admin dashboard overview, statistics, Quick Actions & drill-downs | Renders 5 operational/user cards, role distribution badges, recent queue list, Quick Actions ("User Management", "Ticket Queue", "Create Ticket"), and drill-down links (Total Active Tickets -> `#/staff-queue`, Unassigned Queue -> `#/staff-queue?owner=unassigned`, Total Users / Active Users / Inactive Users -> `#/admin-users`) | `client/tests/lab-04/AdminDashboard.test.tsx` | Passed |
| **FR-11, FR-12, FR-15** | BR-16 | **AC-24** | `UI-EMPTY-01` | UI | Safe loading skeletons and friendly empty zero-states | Asserts skeleton placeholders during async loading and friendly empty illustrations/prompts when queues or actions lists contain zero items | `client/tests/lab-04/UIStates.test.tsx` | Passed |
| **FR-17** | Handout §7, §10 | **AC-17** | `UI-STYLE-01` | UI | Zen Green design tokens, badge styling, focus rings & styling cues | Component-level verification of CSS variables (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`), 8 status badge styles, focus rings (`:focus-visible`), and role styling cues | `client/tests/lab-04/DesignSystemTokens.test.tsx` | Passed |
| **FR-01, FR-02, FR-05, FR-06** | BR-01..03, BR-05..06 | **AC-01, AC-03, AC-04, AC-06** | `E2E-01` | E2E | Actions Taken complete cross-role workflow (Staff & Admin create/edit, Requester read-only audit) | Staff and Admin create/edit action; Requester views in chronological order with zero edit controls | `e2e/lab-04/actions-taken-flow.spec.ts` | Passed |
| **FR-07** | BR-08, BR-09 | **AC-07, AC-08** | `E2E-02` | E2E | Resolution gate lifecycle E2E | Requester advises; Staff and Administrator formally resolve | `e2e/lab-04/ticket-resolution.spec.ts` | Passed |
| **FR-13** | BR-15 | **AC-15a, AC-15b, AC-20** | `E2E-03a`| E2E | Dashboards drill-down navigation E2E across Requester, Staff, and Admin | Live cards filter queues and user tables seamlessly in browser for all three dashboard roles | `e2e/lab-04/dashboards.spec.ts` | Passed |
| **FR-14** | BR-13, BR-14, BR-17 | **AC-16** | `E2E-03b`| E2E | Cross-role Dashboard Quick Actions browser interaction (Requester, Staff, Admin) | Shortcut actions for Requester ("Create Ticket", "View All My Tickets"), IT Staff ("Create Ticket", "Search Tickets", "My Assigned Queue"), and Administrator ("User Management", "Ticket Queue", "Create Ticket") navigate seamlessly to target views in browser | `e2e/lab-04/dashboards.spec.ts` | Passed |
| **FR-17** | Handout §8.6, §7| **AC-17** | `E2E-04` | E2E | Multi-viewport responsive layout, overflow & control integrity audit across 4 core screens | Zero horizontal overflow ($scrollWidth === clientWidth$, $scrollX === 0$), responsive grid restructuring (5-column Desktop metric cards row, 2–3 column Tablet grid, 1-column Mobile stack), zero control collisions/clipping, and accessible touch targets across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) for Requester, Staff, Admin dashboards and Ticket Detail (`#/ticket/:id`) | `e2e/lab-04/dashboards.spec.ts` | Passed |
| **Non-Func** | Handout §10 | **N/A** | `A11Y-01` | E2E / A11y | Keyboard navigation, modal focus trapping, and ARIA feedback | Traps focus within open `ActionTakenModal`, restores focus to trigger button upon close, allows complete keyboard operation, and announces errors/conflicts via ARIA live regions | `e2e/lab-04/accessibility.spec.ts` | Passed |
| **FR-15** | BR-17 | **AC-19a**| `API-12` | API | Admin dashboard operational & user distribution metrics | Returns 200 with operational summary, user statistics, and recent system tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **FR-15** | Matrix | **AC-19b**| `API-13` | API | Non-admin blocked from admin dashboard | Returns 403 Forbidden for Requester and IT Staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **FR-16** | Handout §8.5| **AC-18** | `REG-01` | Regression (Server) | Labs 1–3 Server API & Unit regression suites | 100% of previous server test suites pass without regression across categories (`server/tests/lab-01/categories.test.ts`), authentication, tickets, queue, comments, notes, and user management | `server/tests/lab-01/*`, `server/tests/lab-02/*`, `server/tests/lab-03/*` | Passed |
| **FR-16** | Handout §8.5| **AC-18** | `REG-02` | Regression (Client) | Labs 1–3 Client UI component regression suites | 100% of previous client test suites pass without regression across category selection forms (`client/tests/lab-02/CreateTicket.test.tsx`), authentication, navigation, and modal components | `client/tests/lab-01/*`, `client/tests/lab-02/*`, `client/tests/lab-03/*` | Passed |

| **FR-16** | Handout §8.5| **AC-18** | `REG-03` | Regression (E2E) | Labs 2–3 Full-stack E2E workflow regression suites | 100% of previous Playwright E2E suites pass without regression across core multi-role browser journeys | `e2e/lab-02/*`, `e2e/lab-03/*` | Passed |
| **Migration** | Handout §5.2 | **AC-21** | `MIG-01` | Integration / DB | Migration deployment & legacy data preservation | In an isolated test database with preceding baseline migrations recorded as applied and representative legacy data present, deploys pending migration via `npx prisma migrate deploy`; verifies `ActionTaken` schema additions, 100% legacy data preservation, and valid migration state without manual `_prisma_migrations` history manipulation | `server/tests/lab-04/migration-recovery.test.ts` | Passed |
| **Migration** | Handout §5.2 | **AC-21** | `MIG-02` | Integration / DB | Migration failure rollback recovery simulation | Simulates partially failed migration (`finished_at IS NULL`), asserts compensatory schema rollback/cleanup (restoring database schema to clean pre-migration baseline state suitable for safe re-run), executes `npx prisma migrate resolve --rolled-back`, and confirms clean re-deployment on disposable test DB without legacy data loss | `server/tests/lab-04/migration-recovery.test.ts` | Passed |
| **Seed** | Handout §5.3 | **AC-22** | `SEED-01` | Integration / DB | Idempotent seed data 5 scenario dimensions plus repeated-run verification | Executes `seed.ts` consecutively (run 1 & run 2); confirms zero duplicate key collisions, invariant record counts, and directly asserts presence of all 8 statuses, 4 priorities, assigned/unassigned tickets, 0/1/multiple Actions Taken, and zero/non-zero dashboard metrics | `server/tests/lab-04/seed-data.test.ts` | Passed |

---

## 3. Test Suites Directory Structure

```text
server/tests/lab-04/
├── unit/
│   ├── follow-up-validation.unit.test.ts      # UNIT-01
│   ├── status-transition-matrix.unit.test.ts  # UNIT-02
│   ├── concurrency-check.unit.test.ts         # UNIT-03
│   └── dashboard-calculator.unit.test.ts      # UNIT-04
├── actions-taken.api.test.ts                  # API-01, API-02, API-03a, API-03b, API-04, API-05, API-06, API-14a, API-16, API-17
├── ticket-workflow.api.test.ts                # WF-01, WF-02, WF-03, API-07, API-08, API-10b, API-14b, API-15
├── requester-dashboard.api.test.ts            # API-09
├── staff-dashboard.api.test.ts                # API-10, API-11, API-12, API-13
├── performance-smoke.test.ts                  # PERF-SMOKE-01
├── migration-recovery.test.ts                 # MIG-01, MIG-02
└── seed-data.test.ts                          # SEED-01

client/tests/lab-04/
├── ActionsTaken.test.tsx                      # UI-01a, UI-01b, UI-02, UI-03
├── TicketWorkflow.test.tsx                    # UI-04, UI-04b
├── RequesterDashboard.test.tsx                # UI-05, UI-07a
├── StaffDashboard.test.tsx                    # UI-06, UI-07b
├── AdminDashboard.test.tsx                    # UI-08
├── UIStates.test.tsx                          # UI-EMPTY-01
└── DesignSystemTokens.test.tsx                # UI-STYLE-01

e2e/lab-04/
├── actions-taken-flow.spec.ts                 # E2E-01
├── ticket-resolution.spec.ts                  # E2E-02
├── dashboards.spec.ts                         # E2E-03a, E2E-03b, E2E-04
└── accessibility.spec.ts                      # A11Y-01
```

---

## 4. Test Suites Summary & Execution Log

### Planned Test Suite Breakdown (53 Total Planned Tests)

| Testing Level | Test Count | Test IDs | Primary Test Files | Status |
| :--- | :---: | :--- | :--- | :---: |
| **1. Unit Tests** | 4 | `UNIT-01` to `UNIT-04` | `follow-up-validation`, `status-transition-matrix`, `concurrency-check`, `dashboard-calculator` | **100% Passed** (4/4) |
| **2. API & Integration Tests** | 21 | `API-01` to `API-17` (API: 20), `PERF-SMOKE-01` (Perf: 1) | `actions-taken.api.test.ts`, `requester-dashboard.api.test.ts`, `staff-dashboard.api.test.ts`, `ticket-workflow.api.test.ts`, `performance-smoke.test.ts` | **100% Passed** (21/21) |
| **3. Database Migration & Seed Tests** | 3 | `MIG-01`, `MIG-02`, `SEED-01` | `migration-recovery.test.ts`, `seed-data.test.ts` | **100% Passed** (3/3) |
| **4. Workflow Tests** | 3 | `WF-01`, `WF-02`, `WF-03` | `ticket-workflow.api.test.ts` | **100% Passed** (3/3) |
| **5. UI Component Tests** | 13 | `UI-01a` to `UI-08`, `UI-04b`, `UI-EMPTY-01`, `UI-STYLE-01` | `ActionsTaken`, `TicketWorkflow`, `RequesterDashboard`, `StaffDashboard`, `AdminDashboard`, `UIStates`, `DesignSystemTokens` | **100% Passed** (13/13) |
| **6. E2E Playwright & A11y Tests** | 6 | `E2E-01`, `E2E-02`, `E2E-03a`, `E2E-03b`, `E2E-04`, `A11Y-01` | `actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts`, `dashboards.spec.ts`, `accessibility.spec.ts` | **100% Passed** (6/6) |
| **7. Regression Suites** | 3 | `REG-01`, `REG-02`, `REG-03` | Server regression (`REG-01`), Client regression (`REG-02`), E2E regression (`REG-03`) | **100% Passed** (3/3) |
| **Total** | **53** | | Across all testing levels | **100% Passed (53/53)** |

### Execution Log Summary

- **Server Unit, API, Migration & Seed Tests (`server/tests/lab-04/`):**
  - Command: `npm --prefix server test -- tests/lab-04`
  - Result: **11 passed (11 files), 143 passed (143 assertions)**
  - Latency: Smoke benchmark `< 300ms` for dashboard aggregation, `< 200ms` for actions taken list.
- **Client Vitest UI Component Tests (`client/tests/lab-04/`):**
  - Command: `npm --prefix client test -- tests/lab-04`
  - Result: **7 passed (7 files), 67 passed (67 assertions)**
- **Playwright End-to-End Test Suites (`e2e/lab-04/`):**
  - Command: `npx playwright test e2e/lab-04/`
  - Result: **14 passed (4 spec files)**
  - Specs:
    - `actions-taken-flow.spec.ts` (`E2E-01`): Staff/Admin create & edit, validation error, Requester read-only.
    - `ticket-resolution.spec.ts` (`E2E-02`): Requester advisory resolution, IT Staff formal resolution, stale update 409 conflict handling & state preservation.
    - `dashboards.spec.ts` (`E2E-03a`, `E2E-03b`, `E2E-04`): Metrics loading, interactive drill-downs, Quick Actions, multi-viewport responsive audit (1280px, 768px, 375px) across all 4 core screens with zero overflow.
    - `accessibility.spec.ts` (`A11Y-01`): Modal focus trapping, restoration, keyboard cycling, ARIA live region feedback.
- **Full Regression Test Execution:**
  - `REG-01` (Server Regression): `npm run test:server` -> **31 files passed, 295 tests passed**.
  - `REG-02` (Client Regression): `npm run test:client` -> **20 files passed, 162 tests passed**.
  - `REG-03` (E2E Regression): `TEST_DIR=./e2e/lab-03 npx playwright test` -> **24 passed**.
- **Screenshot Artifacts (`artifacts/lab-04/screenshots/`):**
  - `actions-taken/`: 5 PNG images
  - `admin-dashboard/`: 4 PNG images
  - `requester-dashboard/`: 4 PNG images
  - `staff-dashboard/`: 4 PNG images
  - Total: **17 high-resolution artifacts captured and stored**.
