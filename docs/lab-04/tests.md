# TokTickIT Lab 4 — Test Plan & Traceability Matrix

This document provides the authoritative test plan, architecture breakdown, and full Requirements Traceability Matrix (RTM) for TokTickIT Sprint 4 (Lab 4). It links Functional Requirements (FR) and Business Rules (BR) to testable Acceptance Criteria (AC) and planned automated test cases across all six testing levels.

---

## 1. Test Strategy & Architectural Breakdown (6 Test Types)

The test plan enforces comprehensive multi-tier quality assurance covering all specified test dimensions:

1. **Unit Tests (`server/tests/lab-04/unit/`)**:
   Isolated validation and calculation logic testing business rules without network overhead:
   - `follow-up-validation.unit.test.ts` (`UNIT-01`): Validates conditional requirement for `followUpNote` when `isFollowUpRequired === true`.
   - `status-transition-matrix.unit.test.ts` (`UNIT-02`): Validates permitted vs forbidden transitions across all 8 statuses and role authority checks.
   - `concurrency-check.unit.test.ts` (`UNIT-03`): Validates optimistic concurrency timestamp comparison logic.
   - `dashboard-calculator.unit.test.ts` (`UNIT-04`): Validates aggregation logic for metric counts.
2. **API / Integration Tests (`server/tests/lab-04/`)**:
   Supertest suites asserting HTTP status codes, request validation, database interactions, and RBAC isolation:
   - `actions-taken.api.test.ts`: Tests CRUD endpoints, auto-performer attribution, and cross-user isolation.
   - `requester-dashboard.api.test.ts`: Tests Requester metrics calculation and strict tenant isolation.
   - `staff-dashboard.api.test.ts`: Tests Staff queue metrics, status breakdowns, priority breakdowns, and non-staff 403 rejection.
3. **Workflow Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)**:
   Stateful multi-step lifecycle integration tests:
   - Multi-step status progression (`NEW` $\to$ `OPEN` $\to$ `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER` $\to$ `RESOLVED` $\to$ `CLOSED`).
   - Resolution gate verification (Requester advisory indication vs IT Staff formal resolution).
   - Stale-update conflict recovery (`409 Conflict` followed by reload and retry).
4. **UI Component Tests (`client/tests/lab-04/`)**:
   Vitest & React Testing Library component tests:
   - `ActionsTaken.test.tsx`: Tests list rendering, modal form state, validation error banners, and read-only Requester presentation.
   - `TicketWorkflow.test.tsx`: Tests status transition controls, resolution feedback, and 409 conflict alert handling.
   - `RequesterDashboard.test.tsx`: Tests metric cards rendering, empty state, and drill-down navigation triggers.
   - `StaffDashboard.test.tsx`: Tests 5 primary cards, 8-status breakdown, priority badges, and drill-down routing.
5. **End-to-End Playwright Tests (`e2e/lab-04/`)**:
   Full browser workflows executed under real session cookies/tokens:
   - `actions-taken-flow.spec.ts`: End-to-end recording of actions by staff, editing, and requester read-only audit.
   - `ticket-resolution.spec.ts`: Requester advisory resolution $\to$ IT Staff formal review $\to$ official `RESOLVED` status transition.
   - `dashboards.spec.ts`: Live dashboard metric counts verification against database records and interactive drill-down navigation.
6. **Regression Tests (`server/tests/lab-01..03/`, `client/tests/lab-01..03/`, `e2e/lab-02..03/`)**:
   Continuous test runs ensuring that legacy Authentication, Attachments, Comments, Internal Notes, and User Management remain functional with zero regressions.

---

## 2. Full Requirements Traceability Matrix (FR $\to$ BR $\to$ AC $\to$ Test ID)

| FR ID | Governing BR | AC ID | Test ID | Type | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **FR-01** | BR-05, BR-06 | **AC-04** | `API-04` | API | List Actions Taken on owned ticket | Returns 200 with chronological actions list | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-01** | BR-06 | **AC-05** | `API-05` | API | Cross-requester actions isolation | Non-owner requester receives 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-02** | BR-01, BR-02 | **AC-01** | `API-01` | API | IT Staff records valid Action Taken | Created with 201 under target ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-03** | BR-03 | **AC-01** | `API-01` | API | Performer auto-attribution from session | `performedById` matches authenticated user ID | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-04** | BR-04 | **AC-02** | `UNIT-01`| Unit | Follow-up note validator logic | Returns false when note empty & required = true | `server/tests/lab-04/unit/follow-up-validation.unit.test.ts` | Planned |
| **FR-04** | BR-04 | **AC-02** | `API-02` | API | Conditional validation on Action creation | 400 Bad Request if followUpNote is blank | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-05** | BR-01, BR-02 | **AC-06** | `API-06` | API | IT Staff updates existing Action Taken | Returns 200 with updated fields & timestamp | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-06** | BR-06 | **AC-03** | `API-03a`| API | Requester Action creation blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-06** | BR-06 | **AC-03** | `API-03b`| API | Requester Action modification blocked | 403 Forbidden returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **FR-07** | BR-08 | **AC-07** | `WF-01`  | Workflow | Resolution gate: Requester cannot resolve/close | Requester calling resolve/close rejected (403) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-08** | BR-09 | **AC-08** | `WF-02`  | Workflow | Advisory resolution indication | `problemAppearsResolved = true`; status unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-09** | BR-07 | **AC-09** | `UNIT-02`| Unit | 8-status transition matrix validator | Validates all valid/invalid state hops | `server/tests/lab-04/unit/status-transition-matrix.unit.test.ts` | Planned |
| **FR-09** | BR-07 | **AC-09** | `WF-03`  | Workflow | Multi-step lifecycle status flow | Transitions sequentially through valid states | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-10** | `UNIT-03`| Unit | Optimistic concurrency comparator | Flags missing or mismatched timestamp | `server/tests/lab-04/unit/concurrency-check.unit.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-10** | `API-07` | API | Missing `expectedUpdatedAt` rejection | 400 Bad Request with validation details | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-10** | BR-10 | **AC-11** | `API-08` | API | Stale update detection & conflict | 409 Conflict with `currentUpdatedAt` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **FR-11** | BR-12, BR-13 | **AC-12**| `UNIT-04`| Unit | Requester metrics calculator logic | Computes all 5 distinct metric formulas | `server/tests/lab-04/unit/dashboard-calculator.unit.test.ts` | Planned |
| **FR-11** | BR-13 | **AC-12** | `API-09` | API | Requester dashboard metrics isolation | Returns 200 with 5 metrics for owned tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **FR-12** | BR-14 | **AC-13** | `API-10` | API | Staff dashboard queue metrics & byStatus | Returns 200 with 5 primary cards & all 8 statuses | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-12** | Matrix | **AC-14** | `API-11` | API | Requester blocked from staff dashboard | 403 Forbidden returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **FR-02** | BR-03 | **AC-01** | `UI-01a` | UI | Actions Taken list & create modal | List updates with new action item | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-05** | BR-01 | **AC-06** | `UI-01b` | UI | Actions Taken edit form & state update | Existing action updated with edited content | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-04** | BR-04 | **AC-02** | `UI-02`  | UI | Follow-up note UI inline validation | Checkbox triggers mandatory validation error | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-06** | BR-06 | **AC-03** | `UI-03`  | UI | Requester Actions read-only UI | Add/Edit buttons completely omitted | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **FR-10** | BR-10 | **AC-11** | `UI-04`  | UI | 409 Conflict alert UI feedback | User-friendly conflict banner displayed | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **FR-11** | BR-13, BR-15 | **AC-15**| `UI-05`  | UI | Requester dashboard rendering & drill-down | Clicking card navigates to filtered MyTickets | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **FR-12** | BR-14, BR-15 | **AC-15**| `UI-06`  | UI | Staff dashboard rendering & drill-down | Clicking card navigates to filtered Queue | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **FR-14** | BR-14 | **AC-16** | `UI-07`  | UI | Dashboard Quick Actions shortcuts navigation | Clicking shortcut button navigates to target screen | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **FR-01** | BR-02 | **AC-01** | `E2E-01` | E2E | Actions Taken cross-role workflow | Staff creates/edits; Requester views read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **FR-07** | BR-08, BR-09 | **AC-07**| `E2E-02` | E2E | Resolution gate lifecycle E2E | Requester advises; Staff formally resolves | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **FR-13** | BR-15 | **AC-15** | `E2E-03a`| E2E | Dashboards drill-down navigation E2E | Live cards filter queues seamlessly in browser | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-14** | BR-14 | **AC-16** | `E2E-03b`| E2E | Dashboard Quick Actions browser interaction | Quick Action shortcuts functional in real browser | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-16** | Handout §8.6| **AC-17** | `E2E-04` | E2E | Responsive viewport audit | Zero horizontal overflow across 3 viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **FR-15** | Handout §8.5| **AC-18** | `REG-01` | Regression | Labs 1–3 full regression test suites | 100% of previous test suites pass | `e2e/lab-03/*` & `e2e/lab-02/*` | Planned |

---

## 3. Test Suites Directory Structure

```text
server/tests/lab-04/
├── unit/
│   ├── follow-up-validation.unit.test.ts      # UNIT-01
│   ├── status-transition-matrix.unit.test.ts  # UNIT-02
│   ├── concurrency-check.unit.test.ts         # UNIT-03
│   └── dashboard-calculator.unit.test.ts      # UNIT-04
├── actions-taken.api.test.ts                  # API-01, API-02, API-03, API-04, API-05, API-06
├── ticket-workflow.api.test.ts                # WF-01, WF-02, WF-03, API-07, API-08
├── requester-dashboard.api.test.ts            # API-09
└── staff-dashboard.api.test.ts                # API-10, API-11

client/tests/lab-04/
├── ActionsTaken.test.tsx                      # UI-01, UI-02, UI-03
├── TicketWorkflow.test.tsx                    # UI-04
├── RequesterDashboard.test.tsx                # UI-05
└── StaffDashboard.test.tsx                    # UI-06

e2e/lab-04/
├── actions-taken-flow.spec.ts                 # E2E-01
├── ticket-resolution.spec.ts                  # E2E-02
└── dashboards.spec.ts                         # E2E-03, E2E-04
```

---

## 4. Test Execution Summary Log (To be updated upon test execution)

*Test execution results will be recorded progressively during implementation issues and finalized prior to release.*
