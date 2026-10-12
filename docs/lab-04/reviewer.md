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
* **Review Cycle 1 — Feedback received from @lephirada:**
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
  - **Strict Type & Contract Hardening**: Enforced explicit `typeof isFollowUpRequired === "boolean"` checks, added type and length validation for `followUpNote` ($\le 2000$ chars, string or null) across both POST and PATCH, and codified strict RFC 3339 / ISO-8601 UTC date validation (`isValidIsoUtcDateString`) for `actionDateTime`.

* **Review Cycle 2 (Approval) — Feedback received from @lephirada:**
  > "The Prisma migration, seed data, and Actions Taken APIs look good to me. The required role restrictions and follow-up validation are implemented, and the backend tests and CI checks pass. I approved."

* **Author Response to @lephirada:**
  > "Thank you for the review and approval! All review comments, type safety enhancements, and negative test suites covering boolean types, note boundaries, and ISO-8601 UTC date formats are in place. All 35 Actions Taken API tests, 43 total Lab 4 tests, and 152 regression tests pass cleanly. PR #60 is ready to merge into `lab4-staging`."

* **Verdict:** **Approved**

---

## 2. Pull Requests I Reviewed for Partner (@lephirada)

### Partner Sprint Roadmap & Issue Breakdown

| Issue | Title / Feature | Associated PR | Status | Target Branch |
|:---|:---|:---|:---|:---|
| [Issue #41](https://github.com/lephirada/toktickit/issues/41) | Issue 18: Sprint 4 Engineering Contract, Specifications, and Test Plan | [PR #50](https://github.com/lephirada/toktickit/pull/50) | **Completed / Merged** | `lab4-staging` |
| [Issue #42](https://github.com/lephirada/toktickit/issues/42) | Issue 19: Database Migration, Seed Data & Verification Tests | [PR #51](https://github.com/lephirada/toktickit/pull/51) | **Completed / Merged** | `lab4-staging` |
| [Issue #43](https://github.com/lephirada/toktickit/issues/43) | Issue 20: Actions Taken REST APIs with Concurrency Control & Validation | [PR #52](https://github.com/lephirada/toktickit/pull/52) | **In Progress / Under Review** | `lab4-staging` |
| [Issue #44](https://github.com/lephirada/toktickit/issues/44) | Issue 21: Ticket Resolution Gate and Lab 3 State Machine Preservation | *(Planned)* | Planned | `lab4-staging` |
| [Issue #45](https://github.com/lephirada/toktickit/issues/45) | Issue 22: Requester and Staff Dashboard Backend APIs | *(Planned)* | Planned | `lab4-staging` |
| [Issue #46](https://github.com/lephirada/toktickit/issues/46) | Issue 23: Actions Taken UI & Ticket Detail Integration (Frontend) | *(Planned)* | Planned | `lab4-staging` |
| [Issue #47](https://github.com/lephirada/toktickit/issues/47) | Issue 24: Role-Appropriate Dashboards UI & Drill-Down (Frontend) | *(Planned)* | Planned | `lab4-staging` |
| [Issue #48](https://github.com/lephirada/toktickit/issues/48) | Issue 25: End-to-End Testing, Responsive Audit & Screenshot Artifacts | *(Planned)* | Planned | `lab4-staging` |
| [Issue #49](https://github.com/lephirada/toktickit/issues/49) | Issue 26: Release Integration, Peer Review, AI Reflection & Final Handover | *(Planned)* | Planned | `lab4-staging` |

---

### Partner Pull Request Review Summary

| Partner PR | Partner Branch | Scope / Feature | My Verdict | Target Branch | Status |
|:---|:---|:---|:---|:---|:---|
| [PR #50](https://github.com/lephirada/toktickit/pull/50) | `feature/18-lab4-spec-docs` | Issue 18 (#41): Sprint 4 Engineering Contract, Specifications, and Test Plan | **Approved** | `lab4-staging` | Merged |
| [PR #51](https://github.com/lephirada/toktickit/pull/51) | `feature/19-database-migration-actions` | Issue 19 (#42): Database Schema Evolution, ActionTaken Model & Seed Migration | **Approved** | `lab4-staging` | Merged |
| [PR #52](https://github.com/lephirada/toktickit/pull/52) | `feature/20-actions-taken-backend` | Issue 20 (#43): Actions Taken REST APIs with Concurrency Control & Validation | **Changes Requested** | `lab4-staging` | In Progress |

---

### [Partner PR #50](https://github.com/lephirada/toktickit/pull/50) — Issue 18 (#41): Sprint 4 Engineering Contract, Specifications, and Test Plan
* **Partner Repository / PR:** [@lephirada/toktickit#50](https://github.com/lephirada/toktickit/pull/50)
* **Branch:** `feature/18-lab4-spec-docs` $\rightarrow$ `lab4-staging`
* **Review Cycle 1 — Comments Submitted by @Phenwatsa:**
  > "I found a few specification issues that should be resolved before implementation:
  > 1. resolutionIndicated conflicts with the Acceptance Criteria: The Acceptance Criteria states that resolutionIndicated = true is strictly advisory and must not alter the ticket status. However, the current specification says that POST /api/tickets/:id/confirm-resolved automatically transitions WAITING_FOR_REQUESTER -> IN_PROGRESS. Please align this behavior with the Acceptance Criteria and update the affected references consistently across specification.md, api-spec.md, and tests.md.
  > 2. performedAt validation is inconsistent: BR-06 states that performedAt cannot be future-dated, while the API/UI specifications allow timestamps up to 5 minutes in the future. Please define one authoritative rule and apply it consistently across all three specifications before implementation.
  > 3. Resolution Gate test coverage needs boundary cases: The specification requires resolutionSummary to be 10–1000 characters, but the test traceability does not explicitly cover all boundaries. Please add planned tests for missing resolutionSummary, fewer than 10 characters, exactly 10 characters, exactly 1000 characters, more than 1000 characters, actionsCount = 0, and valid resolution with at least one action.
  > Overall, the Sprint 4 documentation is comprehensive and covers the required FR/BR, API contracts, UI behavior, authorization, concurrency, and traceability well. However, the inconsistencies above should be resolved before approval so the specification provides a single, deterministic contract for implementation. Verdict: Request Changes"
* **Partner Response from @lephirada:**
  > "Thank you so much for the thorough review! I have addressed all 3 points across the entire documentation suite:
  > 1. resolutionIndicated is strictly advisory: Updated specification.md (FR-06, BR-05, Section 8.3), api-spec.md (Section 6.1), and tests.md (AC-21-09, Section 3, Section 4 BR-05) to strictly enforce that resolutionIndicated = true does NOT alter the ticket status under any circumstance (the current ticket status remains completely unchanged).
  > 2. performedAt authoritative rule: Defined one single rule that performedAt cannot be in the future (performedAt <= now()), rejecting future timestamps with 422 VALIDATION_ERROR on the server and enforcing the max attribute on the UI date picker across specification.md, api-spec.md, ui-spec.md, and tests.md.
  > 3. Comprehensive Resolution Gate boundary tests: Explicitly documented all 7 boundary cases in specification.md (AC-21), api-spec.md (Section 3.2), and tests.md (Section 3.1 & Matrix): missing summary, < 10 chars, = 10 chars, = 1000 chars, > 1000 chars, actionsCount = 0, and valid resolution with ≥ 1 action.
  > All 4 specification files now provide a single, deterministic engineering contract ready for implementation."

* **Review Cycle 2 — Comments Submitted by @Phenwatsa:**
  > "Request Changes — Clarify Dashboard Metric Definitions: The dashboard metric definitions would benefit from more explicit and consistent scope rules. Currently, totalTimeSpentMinutes sums action durations associated with active or recently resolved tickets, while categoryBreakdown aggregates non-terminal tickets and their action durations. Although these definitions may be intentional, the specification should clarify the exact ticket-status scope used for each metric to ensure consistent implementation and testing. Please explicitly define which ticket statuses and associated ActionTaken records are included in each metric, and ensure the definitions are consistent across api-spec.md and tests.md. This will help prevent different implementations from producing different results while still appearing to follow the specification."

* **Partner Response from @lephirada:**
  > "Thank you for the excellent suggestion! I completely agree that clarifying the exact ticket-status scopes for dashboard metrics is essential for ensuring consistent implementation and testing. I have updated the documentation suite to incorporate explicit definitions and mathematical consistency guarantees."

* **Review Cycle 3 (Approval) — Comments Submitted by @Phenwatsa:**
  > "The latest revision addresses the previously identified concerns: resolutionIndicated is explicitly advisory and does not change the ticket status. performedAt validation consistently rejects future timestamps. Resolution Gate boundary cases are documented and mapped to the test plan. Dashboard metric scopes are now clearly defined, including ticket-status eligibility, ActionTaken duration aggregation, SQL examples, and the invariant that the sum of category durations equals totalTimeSpentMinutes. The updated documentation provides clearer and more consistent requirements for implementation and testing. I have no further blocking concerns regarding the previously identified issues. Recommendation: Approve."

* **Partner Response from @lephirada:**
  > "Thanks for the review! The file has been updated based on your comments. Ready to merge."

* **Final Verdict:** **Approved** (Merged into `lab4-staging`)

---

### [Partner PR #51](https://github.com/lephirada/toktickit/pull/51) — Issue 19 (#42): Database Schema Evolution, ActionTaken Model & Seed Migration
* **Partner Repository / PR:** [@lephirada/toktickit#51](https://github.com/lephirada/toktickit/pull/51)
* **Branch:** `feature/19-database-migration-actions` $\rightarrow$ `lab4-staging`
* **Review Cycle 1 (Approval) — Comments Submitted by @Phenwatsa:**
  > "The PR satisfies the core acceptance criteria for Issue 19: The ActionTaken model includes the required fields and string-length constraints. The migration adds the new table, indexes, and foreign keys without introducing destructive changes to existing tables. The foreign-key deletion rules preserve the intended behavior: ON DELETE CASCADE for tickets and ON DELETE RESTRICT for users, consistent with BR-15. The seed implementation uses existing-record checks and upserts to support repeatable execution and covers tickets with zero, one, and multiple actions. The added verification tests cover schema constraints, referential integrity, migration data preservation, and seed behavior. I found no blocking issues in the reviewed diff. The reported test results are documented in the PR, although I have not independently rerun the migration or test suite during this review. Recommendation: Approve."

* **Partner Response from @lephirada:**
  > "Thanks for the review! The file has been updated based on your comments. Ready to merge."

* **Final Verdict:** **Approved** (Merged into `lab4-staging`)

---

### [Partner PR #52](https://github.com/lephirada/toktickit/pull/52) — Issue 20 (#43): Actions Taken REST APIs with Concurrency Control & Validation
* **Partner Repository / PR:** [@lephirada/toktickit#52](https://github.com/lephirada/toktickit/pull/52)
* **Branch:** `feature/20-actions-taken-backend` $\rightarrow$ `lab4-staging`
* **Review Cycle 1 — Comments Submitted by @Phenwatsa:**
  > "The PR implements the core Actions Taken API endpoints and covers the main acceptance criteria, including session-derived performedById, Requester ownership restrictions, role authorization, terminal-ticket guards, validation, and atomic conditional updates for optimistic concurrency control. Before approval, I recommend addressing the following issues:
  > 1. Optimistic concurrency token reliability: The update handler explicitly sets updatedAt to new Date(). If the new timestamp equals the previous value at the database's timestamp precision, a stale expectedUpdatedAt token may still match, undermining the guarantee that concurrent edits result in exactly one success and one 409 STALE_ACTION_CONFLICT. Please guarantee that the concurrency token changes on every successful update and add a test for same-timestamp updates.
  > 2. PUT follow-up note validation: The update handler does not consistently validate followUpNote length when followUpRequired is false. An oversized value may reach the database and result in a 500 instead of a validation response. Please validate the field whenever it is supplied and add a corresponding API test.
  > 3. Future timestamp boundary: The current validation allows timestamps up to 60 seconds in the future, despite the PR description stating that future timestamps are rejected. Please align the implementation and tests with the authoritative specification.
  > 4. Verification evidence consistency: docs/lab-04/evidence.md reports different full-suite totals (280/280 and 285/285). Please reconcile these values with the actual test output.
  > The existing API test suite provides broad coverage, but I have not independently rerun the tests or build during this review. Recommendation: Request Changes until the concurrency-token guarantee and validation gaps are addressed."

* **Partner Response from @lephirada:**
  *(Pending — partner currently addressing review findings on concurrency token reliability and input validation)*

* **Final Verdict:** **Changes Requested** (In Progress)
