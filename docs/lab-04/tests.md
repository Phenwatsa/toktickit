# TokTickIT Lab 4 — Test Plan & Traceability Matrix

This document provides the authoritative test plan, architecture breakdown, and full Requirements Traceability Matrix (RTM) for TokTickIT Sprint 4 (Lab 4). It links Functional Requirements (FR) and Business Rules (BR) to testable Acceptance Criteria (AC) and planned automated test cases across all six testing levels.

---

## 1. Test Strategy & Architectural Breakdown (6 Test Types)

The test plan enforces comprehensive multi-tier quality assurance covering all specified test dimensions:

1. **Unit Tests (`server/tests/lab-04/unit/`)**:
   Isolated validation and calculation logic testing business rules without network overhead:
   - `follow-up-validation.unit.test.ts` (`UNIT-01`): Validates conditional requirement and length rules for `followUpNote` when `isFollowUpRequired === true`: (a) fails on empty or whitespace-only (`"   "`), (b) fails on fewer than 3 non-whitespace characters (e.g. `"a"`, `"ab"`, `"  ab  "`), (c) passes on 3 or more non-whitespace characters (e.g. `"abc"`, `"  abc  "`), and (d) permits null/omitted when `isFollowUpRequired === false`.
   - `status-transition-matrix.unit.test.ts` (`UNIT-02`): Validates permitted vs forbidden transitions across all 8 statuses and role authority checks.
   - `concurrency-check.unit.test.ts` (`UNIT-03`): Validates optimistic concurrency timestamp comparison logic.
   - `dashboard-calculator.unit.test.ts` (`UNIT-04`): Validates aggregation logic for metric counts.
2. **API & Database Integration Tests (`server/tests/lab-04/`)**:
   Supertest suites and integration tests (17 planned tests total: 15 API endpoint tests and 2 Database integration tests) asserting HTTP status codes, request validation, database interactions, RBAC isolation, schema rollback, and seed integrity:
   - `actions-taken.api.test.ts`: Tests CRUD endpoints, auto-performer attribution, ticket scoping check (404 on cross-ticket patch), rejection of actions on CANCELLED tickets (`API-14`), and cross-user isolation for both `IT_STAFF` and `ADMINISTRATOR` roles (`API-01`–`API-06`, `API-14`).
   - `ticket-workflow.api.test.ts`: Tests status transitions, optimistic concurrency validation (missing/malformed ISO returns 400 `API-07`, stale timestamp returns 409 `API-08`), and rejection of status transitions on CANCELLED tickets (`API-14`).
   - `requester-dashboard.api.test.ts`: Tests Requester metrics calculation and strict tenant isolation (`API-09`).
   - `staff-dashboard.api.test.ts`: Tests Staff queue metrics, status breakdowns, priority breakdowns, Admin operational & user metrics (`API-12`), and non-permitted 403 rejections (`API-11`, `API-13`).
   - `migration-recovery.test.ts` (`MIG-01`): Tests migration deployment and legacy data preservation on an isolated disposable test database (`AC-21`):
     - *Preconditions*: Use an isolated disposable test database; prepare baseline legacy schema (Labs 1–3) without `ActionTaken`; insert representative legacy records across `User`, `Ticket`, `Attachment`, `Comment`, `InternalNote` and record baseline values; ensure all preceding baseline migrations (Labs 1–3) have been applied and recorded as successful in Prisma migration history (`_prisma_migrations`); and ensure target Lab 4 migration is pending and unapplied.
     - *Procedure*: (1) Verify initial schema, migration history, and legacy records; (2) Run `npx prisma migrate deploy`; (3) Verify migration completes successfully; (4) Verify all expected schema changes (`ActionTaken` table, columns, indexes, foreign keys) are present; (5) Verify all legacy records and values remain 100% intact; (6) Verify final migration state in `_prisma_migrations` reflects the newly applied migration without manual history deletion or resetting.
     - *Expected Result*: Pending migration applies cleanly, database matches post-migration schema, all legacy data is preserved intact, and migration history remains authoritative without manual manipulation.
   - `seed-data.test.ts` (`SEED-01`): Tests repeated seed execution (`prisma/seed.ts` run 1 and run 2 idempotency check), asserting zero constraint collisions, invariant record counts, and directly asserting all 8 lifecycle statuses, 4 priorities, assigned/unassigned ownership, 0/1/multiple Actions Taken, and zero/non-zero dashboard metric profiles (`AC-22`).
3. **Workflow Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)**:
   Stateful multi-step lifecycle integration tests:
   - Multi-step status progression (`NEW` $\to$ `OPEN` $\to$ `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER` $\to$ `RESOLVED` $\to$ `CLOSED`).
   - Resolution gate verification (Requester advisory indication vs IT Staff/Admin formal resolution).
   - Stale-update conflict recovery (`409 Conflict` followed by reload and retry).
4. **UI Component Tests (`client/tests/lab-04/`)**:
   Vitest & React Testing Library component tests:
   - `ActionsTaken.test.tsx`: Tests list rendering, modal form state, validation error banners, and read-only Requester presentation (`UI-01a`, `UI-01b`, `UI-02`, `UI-03`).
   - `TicketWorkflow.test.tsx`: Tests status transition controls, resolution feedback, and 409 conflict alert handling (`UI-04`).
   - `RequesterDashboard.test.tsx`: Tests metric cards rendering, empty state, drill-down triggers, and Requester Quick Actions (`UI-05`, `UI-07a`).
   - `StaffDashboard.test.tsx`: Tests 5 primary cards, 8-status breakdown, priority badges, drill-down routing, and Staff Quick Actions (`UI-06`, `UI-07b`).
   - `AdminDashboard.test.tsx`: Tests Admin dashboard overview rendering, user account statistics, Quick Actions ("User Management", "Ticket Queue", "Create Ticket"), and Recent Queue overview list (`UI-08`).
5. **End-to-End Playwright Tests (`e2e/lab-04/`)**:
   Full browser workflows executed under real session cookies/tokens:
   - `actions-taken-flow.spec.ts`: End-to-end recording of actions by staff and administrator, editing, and requester read-only audit (`E2E-01`).
   - `ticket-resolution.spec.ts`: Requester advisory resolution $\to$ IT Staff / Administrator formal review $\to$ official `RESOLVED` status transition (`E2E-02`).
   - `dashboards.spec.ts`: Live dashboard metric counts verification against database records, drill-down navigation, Quick Actions across Requester, Staff, and Admin, and responsive audits across the four core responsive screens (`E2E-03a`, `E2E-03b`, `E2E-04`).
6. **Regression Tests**:
   Continuous test runs ensuring that legacy features from Labs 1–3 remain functional with zero regressions across:
   - `REG-01` (Server Regression): All server API and unit test suites across Labs 1, 2, and 3 (`server/tests/lab-01/*`, `server/tests/lab-02/*`, `server/tests/lab-03/*`).
   - `REG-02` (Client Regression): All client UI component test suites across Labs 1, 2, and 3 (`client/tests/lab-01/*`, `client/tests/lab-02/*`, `client/tests/lab-03/*`).
   - `REG-03` (E2E Regression): All Playwright end-to-end regression workflows from Labs 2 and 3 (`e2e/lab-02/*`, `e2e/lab-03/*`).

---

## 2. Full Requirements Traceability Matrix (FR $\to$ BR $\to$ AC $\to$ Test ID)

| FR ID | Governing BR | AC ID | Test ID | Type | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-01** | BR-05, BR-06 | **AC-04** | `API-04` | API | List Actions Taken on owned ticket | Returns 200 with chronological actions list | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-01** | BR-06 | **AC-05** | `API-05` | API | Cross-requester actions isolation | Non-owner requester receives 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-02** | BR-01, BR-02 | **AC-01** | `API-01` | API | IT Staff and Administrator record valid Action Taken | Created with 201 under target ticket for both roles | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-03** | BR-03 | **AC-01** | `API-01` | API | Performer auto-attribution from session (Staff & Admin) | `performedById` matches authenticated user ID for both roles | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-04** | BR-04 | **AC-02** | `UNIT-01`| Unit | Follow-up note validator logic (empty, whitespace, < 3 chars, $\ge 3$ chars) | Returns false for empty/whitespace or < 3 non-whitespace chars; returns true for $\ge 3$ non-whitespace chars | `server/tests/lab-04/unit/follow-up-validation.unit.test.ts` | Planned |
| **FR-04** | BR-04 | **AC-02** | `API-02` | API | Conditional validation on Action creation & update | 400 Bad Request with "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed" when blank, whitespace, or < 3 chars; 201/200 when $\ge 3$ chars | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-05** | BR-01, BR-02 | **AC-06** | `API-06` | API | IT Staff and Administrator update Action Taken; verify cross-ticket 404 scoping | Returns 200 with updated fields for valid update; returns 404 Not Found if action belongs to another ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-06** | BR-06 | **AC-03** | `API-03a`| API | Requester Action creation blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-06** | BR-06 | **AC-03** | `API-03b`| API | Requester Action modification blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-07** | BR-08 | **AC-07** | `WF-01`  | Workflow | Resolution gate: Requester cannot resolve/close | Requester calling resolve/close rejected (403); IT Staff and Administrator permitted | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-08** | BR-09 | **AC-08** | `WF-02`  | Workflow | Advisory resolution indication | `problemAppearsResolved = true`; status unchanged; IT Staff or Administrator executes formal resolution | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-09** | BR-07 | **AC-09** | `UNIT-02`| Unit | 8-status transition matrix validator | Validates all valid/invalid state hops | `server/tests/lab-04/unit/status-transition-matrix.unit.test.ts` | Planned |
| **FR-09** | BR-07 | **AC-09** | `WF-03`  | Workflow | Multi-step lifecycle status flow | Transitions sequentially through valid states | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-10** | `UNIT-03`| Unit | Optimistic concurrency comparator | Flags missing or mismatched timestamp | `server/tests/lab-04/unit/concurrency-check.unit.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-10** | `API-07` | API | Missing or malformed `expectedUpdatedAt` rejection | 400 Bad Request (`VALIDATION_ERROR`) on missing or malformed ISO date string | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-11** | `API-08` | API | Stale update detection & conflict | 409 Conflict with `currentUpdatedAt` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-11** | BR-12, BR-13 | **AC-12**| `UNIT-04`| Unit | Requester metrics calculator logic | Computes all 5 distinct metric formulas | `server/tests/lab-04/unit/dashboard-calculator.unit.test.ts` | Planned |
| **FR-11** | BR-13 | **AC-12** | `API-09` | API | Requester dashboard metrics isolation | Returns 200 with 5 metrics for owned tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **FR-12** | BR-14 | **AC-13** | `API-10` | API | Staff dashboard queue metrics, breakdowns & recent queue for IT Staff and Administrator | Returns 200 with 5 primary cards, `unassignedTickets`, 8 statuses `byStatus`, 4 priorities `byPriority`, and `recentTickets` for both IT_STAFF and ADMINISTRATOR roles | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-12** | Matrix | **AC-14** | `API-11` | API | Requester blocked from staff dashboard | 403 Forbidden returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-02, FR-05, FR-08, FR-09** | BR-11 | **AC-23** | `API-14` | API | Reject modifications, status transitions, and advisory indications on CANCELLED ticket | Returns 400 Bad Request (`TICKET_CANCELLED`) when attempting to create/update actions, transition status, or indicate resolution on cancelled ticket | `server/tests/lab-04/actions-taken.api.test.ts; server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-02** | BR-03 | **AC-01** | `UI-01a` | UI | Actions Taken list & create modal (Staff & Admin) | Form submits and list updates with new action item for both roles | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-05** | BR-01 | **AC-06** | `UI-01b` | UI | Actions Taken edit form & state update (Staff & Admin) | Existing action updated with edited content for both roles | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-04** | BR-04 | **AC-02** | `UI-02`  | UI | Follow-up note UI inline validation (empty, whitespace, < 3 chars, $\ge 3$ chars) | Blocks submit and displays "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed" on blank/whitespace/< 3 chars; permits submit on $\ge 3$ chars | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-06** | BR-06 | **AC-04** | `UI-03`  | UI | Requester Actions read-only UI | Add/Edit buttons completely omitted | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-10** | BR-10 | **AC-11** | `UI-04`  | UI | 409 Conflict alert UI feedback | User-friendly conflict banner displayed | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **FR-11** | BR-13, BR-15 | **AC-15a**| `UI-05`  | UI | Requester dashboard rendering & drill-down | Clicking card navigates to filtered MyTickets | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **FR-12** | BR-14, BR-15 | **AC-15b**| `UI-06`  | UI | Staff dashboard rendering & drill-down | Clicking card navigates to filtered Queue | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **FR-14** | BR-13 | **AC-16** | `UI-07a` | UI | Requester Dashboard Quick Actions navigation | Clicking 'Create Ticket' and 'View All My Tickets' triggers correct route navigation | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **FR-14** | BR-14 | **AC-16** | `UI-07b` | UI | Staff Dashboard Quick Actions navigation | Clicking 'Create Ticket', 'Search Tickets', and 'My Assigned Queue' triggers correct route navigation | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **FR-01, FR-02, FR-05, FR-06** | BR-01..03, BR-05..06 | **AC-01, AC-03, AC-04, AC-06** | `E2E-01` | E2E | Actions Taken complete cross-role workflow (Staff & Admin create/edit, Requester read-only audit) | Staff and Admin create/edit action; Requester views in chronological order with zero edit controls | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **FR-07** | BR-08, BR-09 | **AC-07**| `E2E-02` | E2E | Resolution gate lifecycle E2E | Requester advises; Staff and Administrator formally resolve | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **FR-13** | BR-15 | **AC-15a, AC-15b, AC-20** | `E2E-03a`| E2E | Dashboards drill-down navigation E2E across Requester, Staff, and Admin | Live cards filter queues and user tables seamlessly in browser for all three dashboard roles | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-14** | BR-13, BR-14, BR-17 | **AC-16** | `E2E-03b`| E2E | Cross-role Dashboard Quick Actions browser interaction (Requester, Staff, Admin) | Shortcut actions for Requester ("Create Ticket", "View All My Tickets"), IT Staff ("Create Ticket", "Search Tickets", "My Assigned Queue"), and Administrator ("User Management", "Ticket Queue", "Create Ticket") navigate seamlessly to target views in browser | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-15** | BR-17 | **AC-19a**| `API-12` | API | Admin dashboard operational & user distribution metrics | Returns 200 with operational summary and accurate user stats | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-15** | Matrix | **AC-19b**| `API-13` | API | Non-admin blocked from admin dashboard | Returns 403 Forbidden for Requester and IT Staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-13, FR-14, FR-15, FR-17** | BR-15, BR-17 | **AC-16, AC-20** | `UI-08`  | UI | Admin dashboard overview, statistics, Quick Actions & drill-downs | Renders 5 operational/user cards, role distribution badges, recent queue list, Quick Actions ("User Management", "Ticket Queue", "Create Ticket"), and drill-down links (Total Active Tickets -> #/staff-queue, Unassigned Queue -> #/staff-queue?owner=unassigned, user stats -> #/admin-users) | `client/tests/lab-04/AdminDashboard.test.tsx` | Planned |
| **FR-17** | Handout §8.6, §7| **AC-17** | `E2E-04` | E2E | Responsive layout, overlap, clipping, and Zen Green token audit across 4 core screens | Zero horizontal overflow (scrollWidth === clientWidth), zero control collisions/clipping, and Zen Green tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`) verified across Desktop, Tablet, and Mobile for Requester, Staff, Admin dashboards and Ticket Detail | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-16** | Handout §8.5| **AC-18** | `REG-01` | Regression (Server) | Labs 1–3 Server API & Unit regression suites | 100% of previous server test suites pass without regression | `server/tests/lab-01/*`, `server/tests/lab-02/*`, `server/tests/lab-03/*` | Planned |
| **FR-16** | Handout §8.5| **AC-18** | `REG-02` | Regression (Client) | Labs 1–3 Client UI component regression suites | 100% of previous client test suites pass without regression | `client/tests/lab-01/*`, `client/tests/lab-02/*`, `client/tests/lab-03/*` | Planned |
| **FR-16** | Handout §8.5| **AC-18** | `REG-03` | Regression (E2E) | Labs 2–3 Full-stack E2E workflow regression suites | 100% of previous Playwright E2E suites pass without regression | `e2e/lab-02/*`, `e2e/lab-03/*` | Planned |
| **Migration** | Handout §5.2 | **AC-21** | `MIG-01` | Integration / DB | Migration deployment & legacy data preservation | In an isolated test database with preceding baseline migrations recorded as applied and representative legacy data present, deploys pending migration via `npx prisma migrate deploy`; verifies `ActionTaken` schema additions, 100% legacy data preservation, and valid migration state without manual `_prisma_migrations` history manipulation | `server/tests/lab-04/migration-recovery.test.ts` | Planned |
| **Seed** | Handout §5.3 | **AC-22** | `SEED-01` | Integration / DB | Idempotent seed data 5 scenario dimensions plus repeated-run verification | Executes `seed.ts` consecutively (run 1 & run 2); confirms zero duplicate key collisions, invariant record counts, and directly asserts presence of all 8 statuses, 4 priorities, assigned/unassigned tickets, 0/1/multiple Actions Taken, and zero/non-zero dashboard metrics | `server/tests/lab-04/seed-data.test.ts` | Planned |

---

## 3. Test Suites Directory Structure

```text
server/tests/lab-04/
├── unit/
│   ├── follow-up-validation.unit.test.ts      # UNIT-01
│   ├── status-transition-matrix.unit.test.ts  # UNIT-02
│   ├── concurrency-check.unit.test.ts         # UNIT-03
│   └── dashboard-calculator.unit.test.ts      # UNIT-04
├── actions-taken.api.test.ts                  # API-01, API-02, API-03a, API-03b, API-04, API-05, API-06, API-14
├── ticket-workflow.api.test.ts                # WF-01, WF-02, WF-03, API-07, API-08, API-14
├── requester-dashboard.api.test.ts            # API-09
├── staff-dashboard.api.test.ts                # API-10, API-11, API-12, API-13
├── migration-recovery.test.ts                 # MIG-01
└── seed-data.test.ts                          # SEED-01

client/tests/lab-04/
├── ActionsTaken.test.tsx                      # UI-01a, UI-01b, UI-02, UI-03
├── TicketWorkflow.test.tsx                    # UI-04
├── RequesterDashboard.test.tsx                # UI-05, UI-07a
├── StaffDashboard.test.tsx                    # UI-06, UI-07b
└── AdminDashboard.test.tsx                    # UI-08

e2e/lab-04/
├── actions-taken-flow.spec.ts                 # E2E-01
├── ticket-resolution.spec.ts                  # E2E-02
└── dashboards.spec.ts                         # E2E-03a, E2E-03b, E2E-04
```

---

## 4. Test Suites Summary & Execution Log

### Planned Test Suite Breakdown (42 Total Planned Tests)

| Testing Level | Test Count | Test IDs | Primary Test Files |
| :--- | :---: | :--- | :--- |
| **1. Unit Tests** | 4 | `UNIT-01` to `UNIT-04` | `follow-up-validation`, `status-transition-matrix`, `concurrency-check`, `dashboard-calculator` |
| **2. API & Database Integration Tests** | 17 | `API-01` to `API-14` (API: 15), `MIG-01`, `SEED-01` (DB: 2) | `actions-taken.api.test.ts`, `requester-dashboard.api.test.ts`, `staff-dashboard.api.test.ts`, `ticket-workflow.api.test.ts`, `migration-recovery.test.ts`, `seed-data.test.ts` |
| **3. Workflow Tests** | 3 | `WF-01`, `WF-02`, `WF-03` | `ticket-workflow.api.test.ts` |
| **4. UI Component Tests** | 10 | `UI-01a` to `UI-08` (`UI-01a`, `UI-01b`, `UI-07a`, `UI-07b`) | `ActionsTaken`, `TicketWorkflow`, `RequesterDashboard`, `StaffDashboard`, `AdminDashboard` |
| **5. E2E Playwright Tests** | 5 | `E2E-01`, `E2E-02`, `E2E-03a`, `E2E-03b`, `E2E-04` | `actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts`, `dashboards.spec.ts` |
| **6. Regression Suites** | 3 | `REG-01`, `REG-02`, `REG-03` | Server regression (`REG-01`), Client regression (`REG-02`), E2E regression (`REG-03`) |
| **Total** | **42** | | Across all 6 testing levels |

*Test execution results will be recorded progressively during implementation issues and finalized prior to release.*
