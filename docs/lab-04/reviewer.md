# Lab 4 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) | `docs/lab4-spec-and-test-plan` | Issue 20 (#51): Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | **Revisions Applied (Cycle 4 Refinements Complete — Ready for Partner Approval)** | `lab4-staging` |
| [PR #52](https://github.com/Phenwatsa/toktickit/pull/52) | `feature/lab4-1-actions-taken-foundation` | Issue 21 (#52): Database Migration, Seed Data & Actions Taken Backend API | **Planned** | `lab4-staging` |
| [PR #53](https://github.com/Phenwatsa/toktickit/pull/53) | `feature/lab4-2-ticket-workflow-enforcement` | Issue 22 (#53): Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement) | **Planned** | `lab4-staging` |
| [PR #54](https://github.com/Phenwatsa/toktickit/pull/54) | `feature/lab4-3-actions-taken-ui` | Issue 23 (#54): Actions Taken UI & Ticket Detail Integration (Frontend) | **Planned** | `lab4-staging` |
| [PR #55](https://github.com/Phenwatsa/toktickit/pull/55) | `feature/lab4-4-dashboard-apis` | Issue 24 (#55): Role-Appropriate Dashboard Metrics APIs (Backend) | **Planned** | `lab4-staging` |
| [PR #56](https://github.com/Phenwatsa/toktickit/pull/56) | `feature/lab4-5-dashboard-ui` | Issue 25 (#56): Role-Appropriate Dashboards UI & Drill-Down (Frontend) | **Planned** | `lab4-staging` |
| [PR #57](https://github.com/Phenwatsa/toktickit/pull/57) | `feature/lab4-6-e2e-and-responsive` | Issue 26 (#57): End-to-End Testing, Responsive Audit & Screenshot Artifacts | **Planned** | `lab4-staging` |
| [PR #58](https://github.com/Phenwatsa/toktickit/pull/58) | `docs/lab4-documentation` | Issue 27 (#58): Release Integration, Peer Review, AI Reflection & Final Handover | **Planned** | `lab4-staging` |

---

### [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) — Issue 20 (#51): Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD)
* **Branch:** `docs/lab4-spec-and-test-plan`
* **Target branch:** `lab4-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/59](https://github.com/Phenwatsa/toktickit/pull/59)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "The documentation is well structured and covers the main Lab 4 requirements, including Actions Taken, the resolution gate, concurrency handling, role-based dashboards, and responsive UI specifications. Before approval, I think a few points need clarification to ensure the specifications are consistent and safe to use for implementation.
  > 
  > 1. Authentication contract: api-spec.md specifies JWT Bearer authentication. Please reconcile this with the existing Lab 3 authentication mechanism and explicitly document the approved approach so the new APIs remain compatible with the existing application.
  > 2. Acceptance criteria and test traceability: Please review the AC-to-test mappings in tests.md, especially the shared AC-15 and AC-19 entries. Separate criteria where they represent distinct behaviors, and ensure each criterion has clear, testable coverage.
  > 3. Follow-up validation consistency: BR-04 requires at least three non-whitespace characters in the follow-up note, but the UI validation description does not explicitly reflect the same minimum length. Please align the API, UI, and planned tests.
  > 4. Concurrency scope: Please clarify whether optimistic concurrency protection applies only to ticket status transitions or also to edits of other records, including Actions Taken.
  > 5. Migration recovery and seed coverage: Please document the migration rollback or recovery strategy and its planned verification. Also, explicitly map the required seed scenarios ticket statuses, priorities, assigned and unassigned ownership, zero/one/multiple Actions Taken, and zero/non-zero dashboard metrics to the planned tests."
* **How I responded (Cycle 1):**
  - **Authentication reconciliation**: Reconciled and documented in `api-spec.md` Section 1.1 confirming complete compatibility with Lab 3 JWT Bearer auth (`userId`, `role`, `tokenVersion`, and `mustChangePassword` enforced via `requireAuth`).
  - **Discrete Acceptance Criteria & Traceability**: Separated shared ACs into discrete criteria (`AC-15a` Requester drill-down, `AC-15b` Staff drill-down, `AC-19a` Admin dashboard metrics 200, `AC-19b` Non-admin 403 rejection) and aligned `AC-04` with `UI-03` for frontend read-only presentation.
  - **Follow-up Note validation length**: Aligned `ui-spec.md` Section 3.3 and `specification.md` to explicitly enforce the 3 non-whitespace character minimum length with matching error feedback across API, UI, and test suites.
  - **Concurrency protection scope**: Clarified in `specification.md` Section 7.2 and `api-spec.md` Section 3 that mandatory `expectedUpdatedAt` optimistic concurrency applies strictly to Ticket Workflow Status Transitions (`PATCH /api/staff/tickets/:id/status`), while Actions Taken function as append-friendly chronological activity logs tracked via Prisma `@updatedAt`.
  - **Migration recovery & seed coverage**: Documented the rollback/recovery strategy in `specification.md` Section 7.3 and added a comprehensive Seed Scenario Mapping Matrix covering all 8 statuses, 4 priorities, assignment states, action multiplicity (0, 1, multiple), and dashboard zero/non-zero metrics linked to planned tests.
* **Review Cycle 2 — Cross-Document Consistency Review & Harmonization:**
  - **Role Authorization Symmetry**: Reconciled Administrator and IT Staff permissions across `specification.md` (§1, §2, §4.1, FR-02/05/09/14), `ui-spec.md` (§3.2, §3.3, §4.3), and `issues-plan.md` (Issues 21–25) ensuring both roles are authorized to create/edit Actions Taken, execute ticket status transitions, and access Staff Dashboard metrics.
  - **Quick Actions & Drill-Downs Uniformity**: Standardized Quick Action naming across Requester, IT Staff, and Admin dashboards, and formalized explicit drill-down routing for all Admin Dashboard cards (`Total Active Tickets` -> `#/staff-queue`, `Unassigned Queue` -> `#/staff-queue?owner=unassigned`, user metrics -> `#/admin-users`) across specification, UI spec, test matrix (`UI-08`, `E2E-03a`), and issue breakdown.
  - **Ticket Scoping Invariant**: Enforced backend ticket scoping check on `PATCH /api/tickets/:id/actions/:actionId` returning `HTTP 404 Not Found` (`NOT_FOUND`) if `actionId` does not belong to `:id`.
  - **Optimistic Concurrency 3 Failure Cases**: Rigorously documented the three distinct failure outcomes on `PATCH /api/staff/tickets/:id/status`: missing timestamp (400), malformed ISO date string (400), and stale timestamp conflict (409) across `specification.md` (BR-10, AC-10, AC-11), `api-spec.md` (§3.1), and `tests.md` (`API-07`, `API-08`).
  - **Terminal CANCELLED Ticket Immutability**: Formalized rejection of POST/PATCH actions, status transitions, and advisory resolution indications on `CANCELLED` tickets with `HTTP 400 Bad Request` (`TICKET_CANCELLED`), mapped to criterion `AC-23` and automated test `API-14` across `actions-taken.api.test.ts` and `ticket-workflow.api.test.ts` (maintaining 42 total planned tests).
  - **Prisma-Supported Migration Recovery & Test Database Isolation**: Reconciled migration recovery across `specification.md` (§7.3, AC-21) and `tests.md` (`MIG-01`) to eliminate manual manipulation of `_prisma_migrations` for applied migrations, formalizing recovery rules for failed migration state (`prisma migrate resolve --rolled-back`), forward compensating migrations for applied schema changes, and isolated disposable test database preconditions/procedures for verifying 100% legacy data preservation.
* **Review Cycle 3 — Verification Preconditions & Scope Boundary Alignment:**
  - **MIG-01 Baseline History Precondition**: Added explicit precondition in `specification.md` (§7.3, AC-21) and `tests.md` (`MIG-01`) that all preceding baseline migrations (Labs 1–3) must be recorded as applied and successful in `_prisma_migrations` prior to running `npx prisma migrate deploy` on the pending Lab 4 migration.
  - **Staff Dashboard `recentTickets` Alignment**: Aligned `AC-13` with `FR-12`, `api-spec.md` (§4.2), and `API-10` by explicitly including `recentTickets` in the authoritative response criteria.
  - **Responsive Scope Clarification**: Reconciled `ui-spec.md` (§5.1) and `tests.md` (`E2E-04`) to specify that `E2E-04` is the automated test suite responsible for the full responsive audit across all 4 core screens at all 3 viewports, while UI component tests verify isolated component mounting and internal structures.
  - **Design Tokens Consistency**: Harmonized the 4 required Zen Green design tokens (`--zg-primary`, `--zg-bg-page`, `--zg-surface`, `--zg-border`) identically across `specification.md` (`AC-17`), `ui-spec.md` (§5.1), and `tests.md` (`E2E-04`).
* **Review Cycle 4 — Traceability Matrix, Admin Access & Contract Harmonization:**
  - **Admin Access on Staff Dashboard (`AC-13a`/`AC-13b`, `API-10a`/`API-10b`)**: Split acceptance criteria and test IDs to explicitly verify positive `HTTP 200 OK` and accurate queue metrics (`myAssignedTickets` scoped to user) separately for both `IT_STAFF` (`AC-13a`, `API-10a`) and `ADMINISTRATOR` (`AC-13b`, `API-10b`), rather than solely asserting non-requester rejection.
  - **Admin Dashboard Drill-Down Scope Harmonization (`UI-08`, `AC-20`)**: Standardized drill-down destinations across all 5 metric cards (`Total Active Tickets` -> `#/staff-queue`, `Unassigned Queue` -> `#/staff-queue?owner=unassigned`, `Total Users` / `Active Users` / `Inactive Users` -> `#/admin-users`) consistently across `specification.md`, `ui-spec.md`, `tests.md` (`UI-08`), and `issues-plan.md` (Issue 25).
  - **CANCELLED Scope Boundary Clarification (`BR-11`, `AC-23`, `API-14a`/`API-14b`)**: Explicitly demarcated Sprint 4 contracted and tested endpoints (Actions Taken creation/modification, status transitions, advisory indications) from pre-existing Lab 1–2 baseline operations (ticket metadata editing, claiming, reassignment) safeguarded under regression suites (`REG-01`, `REG-02`, `REG-03`).
  - **Responsive Protocol Alignment across FR-17, AC-17, Issue 26 & E2E-04**: Harmonized all four core screens (Requester Dashboard, IT Staff Dashboard, Administrator Dashboard, Ticket Detail), standard viewports (Desktop $1280\text{px}$, Tablet $768\text{px}$, Mobile $375\text{px}$), and validation criteria across specification, UI spec, test plan, and issue plan.
  - **Discrete Traceability for API-14**: Cleanly separated `API-14` in RTM into `API-14a` (`server/tests/lab-04/actions-taken.api.test.ts`) and `API-14b` (`server/tests/lab-04/ticket-workflow.api.test.ts`), establishing 1:1 test file traceability.
  - **Quick Actions Naming Standardization**: Unified button and tile labels across all documents: Requester ("Create Ticket", "View All My Tickets"), IT Staff ("Create Ticket", "Search Tickets", "My Assigned Queue"), and Administrator ("User Management", "Ticket Queue", "Create Ticket").
  - **Error Message Formatting Alignment**: Removed trailing periods across top-level `error` explanations and response messages in `api-spec.md` to ensure uniform contract assertions matching the reviewer log.
  - **Authoritative Test Count Audit**: Reconciled test architecture to exactly 44 planned tests across 6 testing levels (4 Unit, 19 API & DB Integration [17 API + 2 DB], 3 Workflow, 10 UI, 5 E2E, 3 Regression) with 100% mutual consistency.
* **Verdict:** **Revisions Applied (Cycle 4 Refinements Complete — Ready for Partner Approval)**

---

## 2. Pull Requests I Reviewed for Partner (@lephirada)

| Partner PR | Partner Branch | Scope / Feature | My Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| PR #XX | `docs/lab4-spec-and-test-plan` | Sprint 4 Engineering Contracts & Test Plan | *(Pending)* | `lab4-staging` |

---

### Partner PR #XX — Sprint 4 Engineering Contracts & Test Plan
* **Partner Repository / PR:** [@lephirada/toktickit](https://github.com/lephirada/toktickit)
* **Review Cycle 1 Comments Submitted:**
  *(Pending partner PR)*
* **Partner Fixes & Resolution:**
  *(Pending)*
* **My Final Verdict:** *(Pending)*
