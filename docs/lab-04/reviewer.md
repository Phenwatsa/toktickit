# Lab 4 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) | `docs/lab4-spec-and-test-plan` | Issue 20 (#51): Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | **Revisions Applied (Awaiting Partner Approval)** | `lab4-staging` |
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

* **Summary of Changes Applied:**
  - **Authentication Architecture**: Reconciled `api-spec.md` (§1.1) with Lab 3 JWT Bearer auth (`userId`, `role`, `tokenVersion`, `mustChangePassword`).
  - **Traceability & Test Matrix**: Expanded `tests.md` to 53 planned tests covering AC-01–AC-28, including inactive assignee rejection (`API-15`), field boundaries (`API-16`), append-only invariant (`API-17`), migration rollback simulation (`MIG-02`), token/style assertions (`UI-STYLE-01`), loading/empty states (`UI-EMPTY-01`), 409 uncommitted form preservation (`UI-04b`), performance smoke (`PERF-SMOKE-01`), and browser accessibility (`A11Y-01`).
  - **Validation & Business Rules**: Enforced minimum 3 non-whitespace characters for `followUpNote` across API, UI, and tests; restricted optimistic concurrency (`expectedUpdatedAt`) to ticket status transitions; enforced terminal immutability for CANCELLED tickets (`AC-23`).
  - **Migration & Seed Coverage**: Added migration deploy/recovery strategy (`MIG-01`, `MIG-02`) and 5-dimension seed scenario matrix (`SEED-01`).
  - **Specification Harmonization**: Corrected routes to singular `#/ticket/:id`, standardized "Resolved Tickets" (`resolvedTickets`), aligned Administrator oversight permissions, and added `recentTickets` to Admin Dashboard.

* **Verdict:** **Revisions Applied (Awaiting Partner Approval)**

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
