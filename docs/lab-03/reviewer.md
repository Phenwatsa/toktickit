# Lab 3 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #42](https://github.com/Phenwatsa/toktickit/pull/42) | `docs/lab3-spec-and-test-plan` | Issue 12 (#34): Sprint Specification, Test Plan & AI Agreement (Spec DD) | **Approved** | `lab3-staging` |
| [PR #43](https://github.com/Phenwatsa/toktickit/pull/43) | `feature/lab3-1-auth-foundation` | Issue 13 (#35): Database Migration, Seed Data & Auth Foundation API | **Approved** | `lab3-staging` |
| [PR #44](https://github.com/Phenwatsa/toktickit/pull/44) | `feature/lab3-2-auth-ui` | Issue 14 (#36): Authentication & First-Login Password Change UI | **Approved** | `lab3-staging` |
| [PR #45](https://github.com/Phenwatsa/toktickit/pull/45) | `feature/lab3-3-staff-queue` | Issue 15 (#37): IT Staff Ticket Queue (API & Responsive UI) | **Approved** | `lab3-staging` |
| [PR #46](https://github.com/Phenwatsa/toktickit/pull/46) | `feature/lab3-4-ticket-detail-and-notes` | Issue 16 (#38): Staff Ticket Detail, Comments & Confidential Notes | **Approved** | `lab3-staging` |
| [PR #47](https://github.com/Phenwatsa/toktickit/pull/47) | `feature/lab3-5-admin-user-management` | Issue 17 (#39): Minimalist Administrator User Management | **Approved** | `lab3-staging` |
| [PR #48](https://github.com/Phenwatsa/toktickit/pull/48) | `feature/lab3-6-e2e-and-responsive` | Issue 18 (#40): End-to-End Testing, Responsive Audit & Visual Artifacts | **Approved** | `lab3-staging` |
| *[Upcoming PR]* | `docs/lab3-documentation` | Issue 19 (#41): Release Integration, Reviewer Consolidation & Final Docs | *Pending (Issue 19 / #41)* | `lab3-staging` $\rightarrow$ `main` |

---

### [PR #42](https://github.com/Phenwatsa/toktickit/pull/42) — Issue 12 (#34): Sprint Specification, Test Plan & AI Agreement (Spec DD)
* **Branch:** `docs/lab3-spec-and-test-plan`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/42](https://github.com/Phenwatsa/toktickit/pull/42)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "Request changes for these small documentation updates. I found two small documentation clarifications that would improve consistency:
  > 1. AC-20 covers attachment upload, download, and soft-delete ownership isolation, but the current API continuity section and API-21 description do not explicitly define or test the attachment download operation. Please add the download endpoint/authorization behavior and include it in API-21.
  > 2. AC-03 covers both requester ticket-list isolation and unauthorized ticket-detail access, but API-06 currently focuses mainly on a client-supplied requesterId. Please clarify that API-06 also verifies that a requester cannot access another user's ticket detail and that ownership is always derived from req.user.id.
  > The remaining items, including the planned status of tests and the pending living-document sections, are appropriate for this documentation stage. Please address these minor traceability clarifications before merging PR #42 into lab3-staging."
* **How I responded (Cycle 1):**
  - **Actions Taken After Review:**
    1. Added `GET /api/attachments/:id/download` endpoint and ownership authorization rules in `docs/lab-03/api-spec.md`, `specification.md`, and test `API-21` (`AC-20`).
    2. Clarified single-ticket detail ownership isolation derived strictly from session `req.user.id` (blocking unauthorized access with HTTP 403) in `api-spec.md`, `specification.md`, and test `API-06` (`AC-03`).
    3. Added explicit continuity references to Lab 2 API contracts in `api-spec.md` and `specification.md`.
  - **Reply Message to Reviewer:**
    > "Hi @lephirada, I have updated the documentation based on your review (added attachment download in AC-20/API-21, clarified req.user.id ticket detail ownership in AC-03/API-06, and explicitly referenced Lab 2 contracts). Please re-check and approve PR #42 when you have a moment. Thanks!"
* **Review Cycle 2 — Approval received from @lephirada:**
  > "Reviewed the updates. The required Lab 3 specifications and previous requested clarifications are now included. The acceptance criteria are met.
  > 
  > Approved Ka."
* **My Response (Cycle 2):**
  > "Thank you so much @lephirada for reviewing and approving PR #42! All criteria are met. I am now proceeding to merge PR #42 into `lab3-staging` to conclude Issue 12 (#34)."
* **Verdict:** **Approved**

---

### [PR #43](https://github.com/Phenwatsa/toktickit/pull/43) — Issue 13 (#35): Database Migration, Seed Data & Auth Foundation API
* **Branch:** `feature/lab3-1-auth-foundation`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/43](https://github.com/Phenwatsa/toktickit/pull/43)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "Please make a few updates before approval:
  > 
  > 1. Set the seeded Administrator’s mustChangePassword to true, as required by the acceptance criteria.
  > 2. Add evidence that the migration completed without data loss.
  > 3. Include the actual test output to confirm that the required tests pass.
  > 
  > After these updates, I can review the PR again."
* **How I responded (Cycle 1):**
  - **Actions Taken After Review:**
    1. **Seeded Administrator Password Change Flag:** Updated `server/prisma/seed.ts` to set `mustChangePassword: true` for the seeded Administrator (`admin@toktickit.local`), strictly adhering to the acceptance criteria for initial administrator provisioning.
    2. **Migration Zero-Data-Loss Evidence:**
       - `RequesterUser` $\rightarrow$ `User`: Renamed table in-place preserving 100% of user rows, IDs, emails, departments, and active statuses; verified foreign key continuity (`Ticket.requesterId` $\rightarrow$ `User.id`).
       - `Ticket.itPriority`: Backfilled from `requestedPriority` for all existing tickets before applying `NOT NULL` constraint; 0 null records.
       - `Ticket.ticketOwner`: Backfilled to `ticketOwnerId` matching `User.name` or `User.email`. Furthermore, to guarantee zero data loss on arbitrary legacy databases, unmatched values are archived in `_LegacyTicketOwnerAudit` table and appended to ticket `description` before dropping the column.
       - `Category`, `RelatedSystem`, and `Attachment` records are 100% intact.
    3. **Actual Test Output Included:** Ran full test suite confirming 100% pass rate (64/64 tests passed across 12 test files).
  - **Actual Test Runner Output:**
    ```text
    ✓ tests/lab-01/categories.test.ts (1)
    ✓ tests/lab-01/health.test.ts (1)
    ✓ tests/lab-02/attachments.api.test.ts (9)
    ✓ tests/lab-02/create-ticket.api.test.ts (8)
    ✓ tests/lab-02/my-tickets.api.test.ts (7)
    ✓ tests/lab-02/requesters.api.test.ts (2)
    ✓ tests/lab-02/ticket-detail.api.test.ts (4)
    ✓ tests/lab-03/auth.api.test.ts (8)
    ✓ tests/lab-03/authorization.api.test.ts (7)
    ✓ tests/lab-03/unit/password-policy.unit.test.ts (7)
    ✓ tests/lab-03/unit/role-auth.unit.test.ts (5)
    ✓ tests/lab-03/unit/token-version.unit.test.ts (5)

    Test Files  12 passed (12)
         Tests  64 passed (64)
      Duration  4.53s
    ```
  - **Reply Message to Reviewer:**
    > "Hi @lephirada, thank you for the feedback! I have addressed all 3 items:
    > 1. Updated `seed.ts` to set `mustChangePassword: true` for the seeded Administrator.
    > 2. Documented zero-data-loss migration verification evidence across Users, Tickets, and Attachments in `reviewer.md` and `specification.md`.
    > 3. Included the actual test output demonstrating all 64/64 server tests passing cleanly.
    > Please re-check PR #43 when you have a moment. Thanks!"
* **Review Cycle 2 — Approval received from @lephirada:**
  > "Thanks for addressing the previous feedback. The required scope and acceptance criteria are now covered. All reported tests are passing. Approved."
* **My Response (Cycle 2):**
  > "Thank you so much @lephirada for reviewing and approving PR #43! Everything is in place and verified. You can go ahead and merge this PR into `lab3-staging` whenever you're ready."
* **Verdict:** **Approved**

---

### [PR #44](https://github.com/Phenwatsa/toktickit/pull/44) — Issue 14 (#36): Authentication & First-Login Password Change UI
* **Branch:** `feature/lab3-2-auth-ui`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/44](https://github.com/Phenwatsa/toktickit/pull/44)
* **Review Cycle 1 — Approval received from @lephirada:**
  > "Reviewed the latest updates against the acceptance criteria. The mock requester selector has been removed, authentication state and route guards are implemented, mandatory password change is handled, and role-based navigation and logout are working as required. The required frontend tests and CI checks are passing.
  > 
  > Approved."
* **My Response (Cycle 1):**
  > "Thank you so much @lephirada for reviewing and approving PR #44! All acceptance criteria and tests have been confirmed. You can go ahead and merge this PR into `lab3-staging` whenever you're ready."
* **Verdict:** **Approved**

---

### [PR #45](https://github.com/Phenwatsa/toktickit/pull/45) — Issue 15 (#37): IT Staff Ticket Queue (API & Responsive UI)
* **Branch:** `feature/lab3-3-staff-queue`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/45](https://github.com/Phenwatsa/toktickit/pull/45)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "I reviewed the latest changes against the acceptance criteria.
  >
  > The backend implementation is generally well structured, and the role restriction, query support, pagination metadata, and error handling are covered. The CI check is also passing.
  >
  > Before approval, I found two items that should be addressed:
  >
  > 1. **Requested Priority filter is missing from the UI.** The API supports requestedPriority, but StaffTicketQueue.tsx currently exposes filters for status, category, IT priority, and owner only. Please add Requested Priority to both the desktop filter bar and mobile filter modal, including reset handling, active filter count, and the API request.
  > 2. **Responsive table may still require horizontal scrolling.** The desktop table uses minWidth: "1190px" together with overflowX: "auto", while it is displayed from the md breakpoint. This may cause horizontal scrolling on tablet-sized viewports, which does not match the requirement for a responsive table/card approach. Please adjust the responsive design so that tablet viewports are usable without horizontal scrolling (e.g. show the card view on tablet as well, or ensure the table fits within 768px - 1024px without scrollWidth > clientWidth).
  >
  > Once these two items are resolved, the PR is ready for approval."
* **How I responded (Cycle 1):**
  - **Actions Taken After Review:**
    1. **Requested Priority Filter Added to UI:**
       - Added the `Requested Priority` dropdown filter to the desktop filter bar (`data-testid="staff-queue-req-priority-filter"`) with options: *All Req Priorities*, *Low*, *Medium*, *High*, and *Urgent*.
       - Added the `Requested Priority` select field to the mobile filter modal (`data-testid="staff-queue-mobile-req-priority-filter"`).
       - Connected `requestedPriority` state into `fetchStaffTickets` query params, `activeFilterCount` badge calculation, and `handleResetFilters`.
       - Added comprehensive unit tests in `client/tests/lab-03/StaffTicketQueue.test.tsx` verifying requested priority filtering on both desktop and mobile modal.
    2. **Responsive Table & Tablet Card Layout:**
       - Updated table breakpoint from `d-none d-md-block` to `d-none d-xl-block` (displaying the 10-column table only on Desktop $\ge 1200\text{px}$ where it comfortably fits without horizontal scrolling).
       - Updated card layout from `d-block d-md-none` to `d-block d-xl-none` with responsive Bootstrap grid `col-12 col-md-6`. This renders a clean 2-column card grid on tablet viewports ($768\text{px} \dots 1199\text{px}$) and a 1-column card list on mobile screens ($< 768\text{px}$), eliminating table overflow and guaranteeing `scrollWidth === clientWidth` without horizontal scrollbars.
       - Updated styling in `client/src/styles/zen-green.css` for `.staff-filter-req-priority` so that all 5 filter dropdowns wrap neatly on tablet and align horizontally on desktop.
    3. **Automated Verification:**
       - Ran client test suite: all 10 test files and 56 tests passed (`tests/lab-03/StaffTicketQueue.test.tsx` 9/9 passed).
       - Ran client production build (`npm --prefix client run build`): completed cleanly with zero errors.
  - **Reply Message to Reviewer:**
    > "Hi @lephirada, thank you for the thorough review! I have addressed both items in the latest commit:
    > 1. Added the `Requested Priority` filter to both the desktop filter bar and mobile filter modal, fully integrated with active filter counts, reset handlers, and API query params. Added unit tests for desktop and mobile filtering.
    > 2. Re-architected tablet responsiveness so viewports below 1200px render fluid 2-column cards (`col-md-6`), completely eliminating horizontal scrolling on tablet devices while keeping the full 10-column table on desktop ($\ge 1200\text{px}$).
    > 
    > Both automated tests and client build are passing cleanly. Please take a look and approve PR #45 when you have a moment. Thanks!"
* **Review Cycle 2 — Approval received from @lephirada:**
  > "I reviewed the latest updates against the acceptance criteria. Approved."
* **My Response (Cycle 2):**
  > "Thank you so much @lephirada for reviewing and approving PR #45! All acceptance criteria and responsive requirements are verified. You can go ahead and merge this PR into `lab3-staging` whenever you're ready."
* **Verdict:** **Approved**

---

### [PR #46](https://github.com/Phenwatsa/toktickit/pull/46) — Issue 16 (#38): IT Staff Ticket Operations, Public Comments & Internal Notes
* **Branch:** `feature/lab3-4-ticket-detail-and-notes`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/46](https://github.com/Phenwatsa/toktickit/pull/46)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "Reviewed the latest changes against the acceptance criteria. The required staff ticket operations, comments, internal notes, requester resolution action, frontend updates, and tests are implemented. CI is also passing.
  > 
  > Approved."
* **My Response (Cycle 1):**
  > "Thank you so much @lephirada for reviewing and approving PR #46! All staff ticket operations, public comments, internal notes, requester resolution indication, responsive frontend views, and tests are confirmed. Proceeding to merge PR #46 into `lab3-staging`."
* **Verdict:** **Approved**

---

### [PR #47](https://github.com/Phenwatsa/toktickit/pull/47) — Issue 17 (#39): Minimalist Administrator User Management (Full-Stack)
* **Branch:** `feature/lab3-5-admin-user-management`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/47](https://github.com/Phenwatsa/toktickit/pull/47)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "Reviewed the latest changes against the acceptance criteria. The admin user management API, safety guards, UI, and required tests are implemented, and CI is passing.
  > 
  > Approved."
* **My Response (Cycle 1):**
  > "Thank you so much @lephirada for reviewing and approving PR #47! All admin endpoints, safety rules, interactive UI, and test suites are verified. Proceeding to merge PR #47 into `lab3-staging` to complete Issue 17 (#39)."
* **Verdict:** **Approved**

---

### [PR #48](https://github.com/Phenwatsa/toktickit/pull/48) — Issue 18 (#40): End-to-End Testing, Responsive Audit & Visual Artifacts
* **Branch:** `feature/lab3-6-e2e-and-responsive`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/48](https://github.com/Phenwatsa/toktickit/pull/48)
* **Review Cycle 1 — Feedback received from @lephirada:**
  > "Reviewed the latest changes against the acceptance criteria. The required E2E suites, responsive checks, screenshots, and CI tests are all passing.
  > 
  > Approved."
* **My Response (Cycle 1):**
  > "Thank you so much @lephirada for reviewing and approving PR #48! All 24 Playwright E2E tests, zero horizontal overflow responsive assertions across desktop/tablet/mobile, staff queue pagination verifications, and visual screenshot artifacts are verified and passing cleanly on CI. Proceeding to merge PR #48 into `lab3-staging` to complete Issue 18 (#40)."
* **Verdict:** **Approved**

---

## 2. Pull Requests I Reviewed for My Partner (@lephirada)

| PR | Partner Branch | Scope / Issue | My Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #32](https://github.com/lephirada/toktickit/pull/32) | `feature/10-lab3-documentation` | Issue 10 (#24): Documentation and Engineering Contract | **Approved** | `lab3-staging` |
| [PR #33](https://github.com/lephirada/toktickit/pull/33) | `feature/11-database-migration` | Issue 11 (#25): Database Schema, Migration, and Seed | **Approved** | `lab3-staging` |
| [PR #34](https://github.com/lephirada/toktickit/pull/34) | `feature/12-authentication-authorization` | Issue 12 (#26): Authentication and Authorization | **Approved** | `lab3-staging` |
| [PR #35](https://github.com/lephirada/toktickit/pull/35) | `feature/13-client-auth-shell` | Issue 13 (#27): Client Authentication and Shared Application Shell | **Approved** | `lab3-staging` |
| [PR #36](https://github.com/lephirada/toktickit/pull/36) | `feature/14-staff-queue` | Issue 14 (#28): Staff Queue | **Approved** | `lab3-staging` |
| [PR #37](https://github.com/lephirada/toktickit/pull/37) | `feature/15-staff-ticket-operations` | Issue 15 (#29): Staff Ticket Operations | **Approved** | `lab3-staging` |
| [PR #38](https://github.com/lephirada/toktickit/pull/38) | `feature/16-user-management` | Issue 16 (#30): User Management | **Approved** | `lab3-staging` |
| [PR #39](https://github.com/lephirada/toktickit/pull/39) | `feature/17-integration-e2e` | Issue 17 (#31): Integration, End-to-End Testing, Responsive UI & Final Verification | **Pending Review** | `lab3-staging` |

---

### [PR #32](https://github.com/lephirada/toktickit/pull/32) — Issue 10 (#24): Documentation and Engineering Contract
* **Partner Branch:** `feature/10-lab3-documentation`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/32](https://github.com/lephirada/toktickit/pull/32)
* **Scope / Issue:** [Issue 10 (#24)](https://github.com/lephirada/toktickit/issues/24) — Documentation and Engineering Contract
* **Review Cycle 1 — Feedback given by @Phenwatsa:**
  > "Reviewed the latest changes against the Lab 03 acceptance criteria. The required documentation is complete, FR-01 to FR-15 are consistent, and the API, UI, testing, migration, and evidence specifications are properly documented. The previous logout ambiguity has also been clarified.
  > No blocking issues found."
* **Partner Response (@lephirada):**
  > "Thank you for your careful review Ka! You can merge this PR into lab3-staging as the documentation foundation is now complete and aligned with all acceptance criteria."
* **My Verdict:** **Approved**

---

### [PR #33](https://github.com/lephirada/toktickit/pull/33) — Issue 11 (#25): Database Schema, Migration, and Seed
* **Partner Branch:** `feature/11-database-migration`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/33](https://github.com/lephirada/toktickit/pull/33)
* **Scope / Issue:** [Issue 11 (#25)](https://github.com/lephirada/toktickit/issues/25) — Database Schema, Migration, and Seed
* **Review Cycle 1 — Feedback given by @Phenwatsa (Request Changes):**
  > "Request Changes
  > 
  > I found two issues that should be fixed before approval:
  > 1. `mustChangePassword` is set to `false` by default in both `schema.prisma` and the migration, but the acceptance criteria require the default to be `true`.
  > 2. `migration.test.ts` tests a locally duplicated `runSeed()` implementation instead of executing the actual `server/prisma/seed.ts`. Therefore, it does not fully verify the real seed script's idempotency and password-state preservation required by AC-11-05 and AC-11-08.
  > 
  > Please fix these issues and update the migration tests accordingly."
* **Partner Response (@lephirada):**
  > "Thank you for the feedback Ka. I have reviewed and addressed both concerns. Please check the PR again."
* **Review Cycle 2 — Approval given by @Phenwatsa:**
  > "Reviewed the latest changes against the Lab 03 acceptance criteria.
  > 
  > The previous issues have been addressed:
  > • `mustChangePassword` now defaults to `true` in both the Prisma schema and migration.
  > • `migration.test.ts` now executes the actual `server/prisma/seed.ts` and verifies seed idempotency and credential preservation.
  > 
  > The migration, schema changes, seed logic, and verification tests are consistent with the requirements. CI is also passing.
  > No blocking issues found."
* **Partner Response (@lephirada):**
  > "Thank you for the review and approval Ka, I have updated reviewer.md of docs/lab-03. You can merging this PR into lab2-staging now."
* **My Verdict:** **Approved**

---

### [PR #34](https://github.com/lephirada/toktickit/pull/34) — Issue 12 (#26): Authentication and Authorization
* **Partner Branch:** `feature/12-authentication-authorization`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/34](https://github.com/lephirada/toktickit/pull/34)
* **Scope / Issue:** [Issue 12 (#26)](https://github.com/lephirada/toktickit/issues/26) — Authentication and Authorization
* **Review Cycle 1 — Feedback given by @Phenwatsa (Request Changes):**
  > "I found two issues that should be fixed before approval:
  > 1. JWT verification does not require `iat` and `exp`
  >    • `verifySessionToken()` only validates `sub`, `email`, and `role`.
  >    • A correctly signed token without `iat` / `exp` could still pass verification, which does not fully match the required JWT contract and could allow a token without expiration.
  > 2. `JWT_SECRET` is not validated at application startup
  >    • `getJwtSecret()` exits the process for a missing/weak secret only when the function is called.
  >    • The server can therefore start in production without a valid `JWT_SECRET`, contrary to the requirement that production must fail to start when the secret is missing or weak.
  > 
  > Please fix these two issues before approval."
* **Partner Response (@lephirada):**
  > "Thanks for pointing these out. Both issues have been fixed"
* **Review Cycle 2 — Approval given by @Phenwatsa:**
  > "Reviewed the latest changes against the Issue 12 acceptance criteria. All required authentication, JWT/session handling, role-based authorization, requester ownership isolation, password-change gate, discussion endpoints, CORS configuration, and test coverage are implemented as required.
  > 
  > The two issues from the previous review have also been addressed:
  > • `iat` and `exp` are now required during JWT verification.
  > • `JWT_SECRET` is now validated at application startup in production.
  > 
  > No blocking issues found.
  > 
  > Approve."
* **My Verdict:** **Approved**

---

### [PR #35](https://github.com/lephirada/toktickit/pull/35) — Issue 13 (#27): Client Authentication and Shared Application Shell
* **Partner Branch:** `feature/13-client-auth-shell`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/35](https://github.com/lephirada/toktickit/pull/35)
* **Scope / Issue:** [Issue 13 (#27)](https://github.com/lephirada/toktickit/issues/27) — Client Authentication and Shared Application Shell
* **Review Cycle 1 — Feedback given by @Phenwatsa:**
  > "Reviewed the PR against the Issue 13 Acceptance Criteria. All required auth flows, protected routes, role-based navigation, logout, Requester workflow, comments/resolved flow, tests, and evidence are complete.
  > CI (Client/Server/Playwright) also passes with no blocking issues.
  > 
  > Approve"
* **Partner Response (@lephirada):**
  > "Thank you for the review and approval Ka. I have updated docs/lab-03. You can merge this PR into lab3-staging now."
* **My Verdict:** **Approved**

---

### [PR #36](https://github.com/lephirada/toktickit/pull/36) — Issue 14 (#28): Staff Queue
* **Partner Branch:** `feature/14-staff-queue`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/36](https://github.com/lephirada/toktickit/pull/36)
* **Scope / Issue:** [Issue 14 (#28)](https://github.com/lephirada/toktickit/issues/28) — Staff Queue
* **Review Cycle 1 — Feedback given by @Phenwatsa:**
  > "Reviewed the PR against the Issue 14 Acceptance Criteria. The Staff Queue API, RBAC, search/filter/sort/pagination, responsive UI, required tests, and desktop/tablet/mobile evidence are all implemented.
  > CI passes for Server, Client, and Playwright E2E with no blocking issues.
  > 
  > Approve"
* **Partner Response (@lephirada):**
  > "Thank you for the review and approval Ka. I have updated docs/lab-03. You can merge this PR into lab3-staging now."
* **My Verdict:** **Approved**

---

### [PR #37](https://github.com/lephirada/toktickit/pull/37) — Issue 15 (#29): Staff Ticket Operations
* **Partner Branch:** `feature/15-staff-ticket-operations`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/37](https://github.com/lephirada/toktickit/pull/37)
* **Scope / Issue:** [Issue 15 (#29)](https://github.com/lephirada/toktickit/issues/29) — Staff Ticket Operations
* **Review Cycle 1 — Feedback given by @Phenwatsa (Request Changes):**
  > "Reviewed PR #37 against the Issue 15 Acceptance Criteria. Most requirements are implemented and CI passes successfully, including the staff detail API/UI, assignment, priority, state machine, internal notes, attachments, atomic activity logging, tests, and screenshots.
  > 
  > However, AC-15-08 is not fully enforced:
  > • `POST /api/tickets/:id/comments` still allows Public Comments on tickets in `CLOSED` state.
  > • AC-15-08 states that closed tickets cannot be modified unless explicitly reopened.
  > • The current tests cover closed-ticket assignment, priority, status, notes, and attachments, but do not cover closed-ticket public comments.
  > 
  > Please block public comment creation on `CLOSED` tickets (and add a regression test) before approval.
  > 
  > CI is currently passing, but this acceptance-criteria gap remains.
  > 
  > Request Changes"
* **Partner Response (@lephirada):**
  > "Thank you for catching this! I have addressed the issue by blocking public comment creation on both `CLOSED` and `CANCELLED` tickets (`422 Unprocessable Entity`), with double-check guards inside the database transaction. Added regression tests covering rejection on closed/cancelled tickets in `server/tests/lab-03/comments-notes.api.test.ts`. All 220 server tests and 104 client tests are now passing. Ready for your re-review!"
* **Review Cycle 2 — Approval given by @Phenwatsa:**
  > "Re-reviewed PR #37 against the Issue 15 Acceptance Criteria.
  > 
  > The previous AC-15-08 gap has been fixed: public comments are now blocked on `CLOSED` and `CANCELLED` tickets, with regression tests and transaction-level guards added.
  > 
  > CI also passes successfully with no remaining blocking issues.
  > 
  > Approve"
* **Partner Response (@lephirada):**
  > "@Phenwatsa Thank you for the review and approval Ka. I have updated docs/lab-03. You can merge this PR into lab3-staging now."
* **My Verdict:** **Approved**

---

### [PR #38](https://github.com/lephirada/toktickit/pull/38) — Issue 16 (#30): User Management
* **Partner Branch:** `feature/16-user-management`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/38](https://github.com/lephirada/toktickit/pull/38)
* **Scope / Issue:** [Issue 16 (#30)](https://github.com/lephirada/toktickit/issues/30) — User Management
* **Review Cycle 1 — Feedback given by @Phenwatsa:**
  > "Reviewed PR #38 against the Issue 16 Acceptance Criteria.
  > 
  > The Admin User Management API/UI, RBAC, user creation/editing, password reset, duplicate-email validation, self-deactivation and last-admin protection, inactive-user assignment guard, responsive UI, tests, and evidence are all implemented.
  > 
  > Server/client tests and CI are passing with no blocking issues.
  > 
  > Approve"
* **Partner Response (@lephirada):**
  > "Thank you for the review and approval Ka! Updating documentation and ready for merge into lab3-staging."
* **My Verdict:** **Approved**

---

### [PR #39](https://github.com/lephirada/toktickit/pull/39) — Issue 17 (#31): Integration, End-to-End Testing, Responsive UI & Final Verification
* **Partner Branch:** `feature/17-integration-e2e`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/lephirada/toktickit/pull/39](https://github.com/lephirada/toktickit/pull/39)
* **Scope / Issue:** [Issue 17 (#31)](https://github.com/lephirada/toktickit/issues/31) — Integration, End-to-End Testing, Responsive UI, and Final Verification
* **Status:** **Pending Review** (PR #39 is currently open on partner repository `lephirada/toktickit`; awaiting formal peer review submission from @Phenwatsa)
* **My Verdict:** **Pending**

