# Lab 4 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) | `docs/lab4-spec-and-test-plan` | Issue 20 (#51): Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | **Approved** | `lab4-staging` |
| [PR #60](https://github.com/Phenwatsa/toktickit/pull/60) | `feature/lab4-1-actions-taken-foundation` | Issue 21 (#52): Database Migration, Seed Data & Actions Taken Backend API | **Approved** | `lab4-staging` |
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
  - **Authentication Architecture**: Reconciled `api-spec.md` (§1.1) with Lab 3 JWT Bearer authentication (`userId`, `role`, `tokenVersion`, `mustChangePassword`).
  - **Traceability & Test Matrix**: Expanded `tests.md` to 53 planned tests across 7 testing tiers covering all 28 parent Acceptance Criteria (30 distinct identifiers: `AC-01`–`AC-28`, `AC-15a/b`, `AC-19a/b`), with full multi-tier regression mapping for `AC-18` (`REG-01`, `REG-02`, `REG-03`).
  - **Validation & Business Rules**: Enforced $\ge 3$ non-whitespace characters for `followUpNote` (`BR-04`); clarified `BR-05`/`FR-05` as non-deletable audit trail; scoped optimistic concurrency (`expectedUpdatedAt`) and 409 conflict form state preservation strictly to ticket status transitions (`ui-spec.md` §6.4, `UI-04b`); restricted `AC-23` on CANCELLED tickets to the 4 defined Sprint 4 operations; and codified ticket reassignment lifecycle restrictions (`400 INVALID_STATE` on CLOSED/CANCELLED tickets, `400 INVALID_OWNER` on invalid assignees) under `BR-18`/`BR-11`, `API-15`, and `AC-25`.
  - **Migration & Seed Coverage**: Documented migration deployment and rollback recovery strategies (`MIG-01`, `MIG-02`) with compensatory schema rollback, alongside a comprehensive 5-dimension idempotent seed scenario matrix (`SEED-01`).
  - **Role Separation & UI Consistency**: Isolated IT Staff dashboard endpoint (`API-11`), mapped Administrator supervisory authority (`API-10b`) directly to `FR-07, FR-09` / `AC-07, AC-09`, established an authoritative 5-column Desktop metric cards layout (`E2E-04`), replaced "1:1" with "complete traceability" in `specification.md` §9, and standardized error responses with `"details": []`.

* **Review Cycle 2 (Approval) — Feedback received from @lephirada:**
  > "Thanks for addressing the previous review feedback. The updated specifications are much more consistent now, especially the follow-up note validation, migration recovery plan, seed scenario coverage, authentication contract, and AC-to-test traceability. I reviewed the documentation against the acceptance criteria. The required specification files are present, the planned tests cover the defined acceptance criteria, and the PR remains within the documentation-only scope. I approved. One minor documentation improvement would be to replace the phrase 1:1 for AC-to-test mapping with complete traceability, since some acceptance criteria are covered by multiple test suites. Overall, the documentation is ready to serve as the engineering contract for the subsequent implementation issues."

* **Author Response to @lephirada:**
  > "Thank you for the review and approval! I have updated the documentation in `specification.md` §9 to replace the phrase '1:1' with 'complete traceability' to accurately reflect our multi-tier test coverage across the acceptance criteria. With all feedback addressed and specifications finalized, PR #59 is ready to merge into `lab4-staging`."

* **Verdict:** **Approved**

---

### [PR #60](https://github.com/Phenwatsa/toktickit/pull/60) — Issue 21 (#52): Database Migration, Seed Data & Actions Taken Backend API
* **Branch:** `feature/lab4-1-actions-taken-foundation`
* **Target branch:** `lab4-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/60](https://github.com/Phenwatsa/toktickit/pull/60)
* **Review Cycle 1 (Approval) — Feedback received from @lephirada:**
  > "The PR appears to satisfy the specified backend acceptance criteria.
  > The ActionTaken Prisma model and additive migration establish the required relationships while preserving compatibility with existing tickets.
  > The seed script covers zero, one, and multiple Actions Taken records, including actions performed by ticket owners and other IT Staff members.
  > The REST handlers enforce IT_STAFF-only access for POST and PATCH, derive performedById from the authenticated session, and validate follow-up requirements.
  > Tests cover the main API behavior, role authorization, listing, and validation scenarios.
  > Minor suggestion: Add PATCH-specific tests for invalid isFollowUpRequired types, such as "false" and 1, to verify that invalid values consistently return 400 VALIDATION_ERROR without modifying existing records.
  > No blocking issue was identified in the reviewed scope."

* **Summary of Changes Applied:**
  - **PATCH Validation & Immutability Coverage**: Added dedicated negative tests in `server/tests/lab-04/actions-taken.api.test.ts` for PATCH requests receiving non-boolean `isFollowUpRequired` values (`"false"` and `1`), verifying `400 VALIDATION_ERROR` responses and confirming database record immutability.
  - **Mutator Role Guard**: Restricted `POST /api/tickets/:id/actions` and `PATCH /api/tickets/:id/actions/:actionId` strictly to `IT_STAFF` (`403 FORBIDDEN` for Requester and Administrator), while keeping `GET /api/tickets/:id/actions` accessible to Administrator and IT Staff for auditing.
  - **Strict Type Validation**: Enforced explicit `typeof isFollowUpRequired === "boolean"` checks on both POST and PATCH routes, preventing improper boolean coercion.

* **Author Response to @lephirada:**
  > "Thank you for the review and approval! I have addressed the minor suggestion by adding PATCH-specific negative tests in `actions-taken.api.test.ts` for both string `'false'` and numeric `1` payloads, asserting that they reject with `400 VALIDATION_ERROR` and verifying that database records remain unmodified. All 27 Actions Taken API tests and 35 total Lab 4 tests pass cleanly."

* **Verdict:** **Approved**

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
