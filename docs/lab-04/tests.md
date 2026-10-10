# TokTickIT Lab 4 — Test Plan & Traceability Matrix

This document provides the authoritative test plan, traceability matrix, and execution log for TokTickIT Sprint 4 (Lab 4). It maps each Acceptance Criterion (AC-01 through AC-15) to automated test suites across API, UI component, workflow, and End-to-End Playwright levels.

---

## 1. Test Strategy & Architectural Breakdown

The testing suite enforces full test-driven quality assurance:
1. **Server API Tests (`server/tests/lab-04/`)**: Supertest suites asserting HTTP response codes, JSON schemas, business rule validations, and RBAC isolation.
2. **Client UI Component Tests (`client/tests/lab-04/`)**: Vitest & React Testing Library suites verifying UI rendering, form state management, validation feedback, and drill-down navigation.
3. **End-to-End Playwright Tests (`e2e/lab-04/`)**: Full browser workflows validating cross-role user journeys, responsive viewports, and regression integrity.
4. **Regression Test Suites (`server/tests/lab-01..03/`, `client/tests/lab-01..03/`, `e2e/lab-02..03/`)**: Continuous execution verifying that baseline capabilities from Labs 1–3 remain functional without regression.

---

## 2. Acceptance Criteria Traceability Matrix

| AC ID | Test ID | Type | Requirement / AC Description | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **AC-01** | `API-01` | API | Create valid Action Taken | IT Staff records an Action Taken with description and result | Created with `201`, auto-assigned `performedById`, correct `ticketId` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **AC-02** | `API-02` | API | Follow-Up Note conditional validation | Submit Action Taken with `isFollowUpRequired = true` and blank note | Rejected with `400 Bad Request` and validation error message | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **AC-03** | `API-03` | API | Requester Action creation blocked | Requester calls `POST /api/tickets/:id/actions` | Rejected with `403 Forbidden` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **AC-04** | `API-04` | API | List Actions Taken (Requester owner) | Requester views Actions Taken on owned ticket | Returns `200 OK` with chronological action list | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **AC-05** | `API-05` | API | Cross-requester action isolation | Requester attempts to view Actions on another user's ticket | Rejected with `403 Forbidden` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **AC-06** | `API-06` | API | Resolution gate enforcement | Requester attempts to set status to `RESOLVED` or `CLOSED` | Rejected with `403 Forbidden` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **AC-07** | `API-07` | API | Advisory resolution indication | Requester marks problem appears resolved | Sets `problemAppearsResolved = true`; `currentStatus` preserved | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **AC-08** | `API-08` | API | Invalid transition rejection | IT Staff attempts invalid jump (e.g. `NEW` $\to$ `RESOLVED`) | Rejected with `400 Bad Request` and descriptive error | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **AC-09** | `API-09` | API | Stale-update concurrency conflict | IT Staff submits status update with outdated `expectedUpdatedAt` | Rejected with `409 Conflict` and current timestamp | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **AC-10** | `API-10` | API | Requester dashboard metrics isolation | Requester retrieves dashboard data | Returns `200 OK` with accurate counts for owned tickets only | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **AC-11** | `API-11` | API | IT Staff dashboard queue metrics | IT Staff retrieves operational dashboard metrics | Returns `200 OK` with accurate unassigned, assigned, and status counts | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **AC-12** | `API-12` | API | Non-staff blocked from staff dashboard | Requester calls `GET /api/staff/dashboard` | Rejected with `403 Forbidden` | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **AC-01** | `UI-01` | UI | Actions Taken UI list & modal | IT Staff renders action list and creates entry via modal form | List updates dynamically with new action card | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **AC-02** | `UI-02` | UI | Dynamic Follow-up Note validation | Check Follow-Up checkbox and submit without note text | Inline validation error displayed; submit blocked | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **AC-03** | `UI-03` | UI | Requester Actions read-only view | Requester views Ticket Detail screen | Actions list is visible; "+ Add Action Taken" button is hidden | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **AC-09** | `UI-04` | UI | Conflict feedback alert | Backend returns 409 Conflict on status change | User-friendly conflict banner displayed prompting reload | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **AC-10** | `UI-05` | UI | Requester dashboard rendering & drill-down | Requester views dashboard and clicks "In Progress" card | Navigates to `#/my-tickets` pre-filtered by In Progress | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **AC-11** | `UI-06` | UI | Staff dashboard rendering & drill-down | IT Staff views dashboard and clicks "Unassigned" card | Navigates to `#/staff-queue` pre-filtered by Unassigned | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **AC-01** | `E2E-01` | E2E | Actions Taken full lifecycle | IT Staff adds action, edits action; Requester verifies read-only | Complete cross-role flow executes successfully in browser | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **AC-06** | `E2E-02` | E2E | Ticket resolution workflow | Requester advises resolved; IT Staff formally resolves | Official status moves to Resolved with audit trail | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **AC-13** | `E2E-03` | E2E | Dashboard navigation & drill-down | User interacts with dashboard cards and quick action links | Browser routes accurately with persistent filter states | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **AC-14** | `E2E-04` | E2E | Cross-viewport responsive audit | Test Desktop, Tablet, and Mobile viewport layouts | `scrollWidth === clientWidth` on all major views | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **AC-15** | `REG-01` | E2E | Complete Labs 1–3 regression suite | Execute all legacy auth, tickets, notes, and admin specs | 100% of previous test suites pass without regression | `e2e/lab-03/*` & `e2e/lab-02/*` | Planned |

---

## 3. Test Suites Directory Structure

```text
server/tests/lab-04/
├── actions-taken.api.test.ts          # AC-01, AC-02, AC-03, AC-04, AC-05
├── ticket-workflow.api.test.ts        # AC-06, AC-07, AC-08, AC-09
├── requester-dashboard.api.test.ts    # AC-10
└── staff-dashboard.api.test.ts        # AC-11, AC-12

client/tests/lab-04/
├── ActionsTaken.test.tsx              # UI-01, UI-02, UI-03
├── TicketWorkflow.test.tsx            # UI-04
├── RequesterDashboard.test.tsx        # UI-05
└── StaffDashboard.test.tsx            # UI-06

e2e/lab-04/
├── actions-taken-flow.spec.ts         # E2E-01
├── ticket-resolution.spec.ts          # E2E-02
└── dashboards.spec.ts                 # E2E-03, E2E-04
```

---

## 4. Test Execution Summary Log (To be updated upon test execution)

*Test execution results will be recorded progressively during implementation issues and finalized prior to release.*
