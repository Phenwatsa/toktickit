# Lab 2 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict |
|:---|:---|:---|:---|
| [PR #26](https://github.com/Phenwatsa/toktickit/pull/26) | `docs/lab2-spec-and-test-plan` | Issue 5: Sprint Specification & Test Plan (Spec DD) | **Approved** |
| [PR #27](https://github.com/Phenwatsa/toktickit/pull/27) | `feature/1-requester-context` | Issue 6: Development Requester Context & Seed Data | **Approved** |
| [PR #28](https://github.com/Phenwatsa/toktickit/pull/28) | `feature/2-ticket-creation` | Issue 7: Ticket Creation & Zen Green Form Foundation | **Approved** |
| [PR #29](https://github.com/Phenwatsa/toktickit/pull/29) | `feature/3-my-tickets` | Issue 8: My Tickets List Screen & Filtering | **Approved** |
| [PR #30](https://github.com/Phenwatsa/toktickit/pull/30) | `feature/4-ticket-detail-attachments` | Issue 9: Ticket Detail, Attachment Upload & Soft-Removal | **Approved** |
| [PR #31](https://github.com/Phenwatsa/toktickit/pull/31) | `feature/5-e2e-and-responsive` | Issue 10: E2E Testing, Responsive Polish & Visual Artifacts | **Approved** |
| PR #32 | `docs/lab2-documentation` | Issue 11: Release Integration & Final Documentation | Ready for Review |

---

### [PR #26](https://github.com/Phenwatsa/toktickit/pull/26) — Issue 5: Sprint Specification and Test Plan (Spec DD)
* **Target branch:** `lab2-staging`
* **Reviewer comment received from @lephirada:**
  > "Overall, this PR meets the acceptance criteria. The required specification and test-plan documents are present and cover the requested FRs, BRs, ACs, UI rules, API contracts, and AC-to-test traceability. I only noticed a couple of minor documentation consistency issues: FR-07 mentions IT Priority filtering, but this is not reflected in the API/UI filter specifications, and the AI collaboration guide contains local file:/// links. These are not blockers for this PR, but I recommend aligning them before the related implementation issues."
* **How I responded:**
  > "Thank you for the thorough review and helpful suggestions! I have resolved both consistency items:
  > 1. Updated `docs/lab-02/api-spec.md` (GET /api/tickets query parameters) and `docs/lab-02/ui-spec.md` (Filter Bar section) to explicitly include the `itPriority` filter parameter and UI dropdown, aligning them with FR-07 and the ticket list specification.
  > 2. Replaced all absolute `file:///` paths in `docs/lab-02/ai-collaboration-guide.md` with standard relative markdown links (`./specification.md`, `./ui-spec.md`, etc.)."
* **Verdict:** Approved

---

### [PR #27](https://github.com/Phenwatsa/toktickit/pull/27) — Issue 6: Development Requester Context & Seed Data
* **Target branch:** `lab2-staging`
* **Reviewer comment received from @lephirada:**
  > "Reviewed against all acceptance criteria. Everything looks good, the Prisma models/relations, idempotent seed data, active requester API, requester selection UI, global context, and Change Requester flow are all implemented as expected. The required Supertest and Vitest tests are also included and passing.
  > Approved Ka."
* **How I responded:**
  > "Thank you for the review and approval! I have updated `docs/lab-02/tests.md` and `docs/lab-02/reviewer.md` with the peer review record. You can merge this PR into `lab2-staging` now."
* **Verdict:** Approved

---

### [PR #28](https://github.com/Phenwatsa/toktickit/pull/28) — Issue 7: Ticket Creation & Zen Green Form Foundation
* **Target branch:** `lab2-staging`
* **Reviewer comment received from @lephirada:**
  > "Reviewed against all acceptance criteria. The API, Create Ticket UI, validation, attachment constraints, loading/error handling, and requester context are all implemented as expected. The required Supertest and Vitest tests are included and passing."
* **How I responded:**
  > "Thank you for the review and approval! I have updated the peer review record. PR #28 is ready to be merged into `lab2-staging`."
* **Verdict:** Approved

---

### [PR #29](https://github.com/Phenwatsa/toktickit/pull/29) — Issue 8: My Tickets List Screen & Filtering
* **Target branch:** `lab2-staging`
* **Reviewer comment received from @lephirada:**
  > "Reviewed the changes against the acceptance criteria. Everything looks good requester isolation, filtering, sorting, pagination, My Tickets UI, and the different UI states are all implemented correctly. The Supertest and Vitest tests are also included and passing, including the multi-user isolation and requester switching cases. So approved ka."
* **How I responded:**
  > "Thank you for the review and approval! I have updated the peer review record in `reviewer.md`. PR #29 is ready to be merged into `lab2-staging`."
* **Verdict:** Approved

---

### [PR #30](https://github.com/Phenwatsa/toktickit/pull/30) — Issue 9: Ticket Detail, Attachment Upload API & Soft-Removal
* **Target branch:** `lab2-staging`
* **Reviewer comment received from @lephirada:**
  > "Reviewed the changes against all acceptance criteria. Everything looks good, ticket detail ownership, attachment upload/download, 5-file limit, and soft-removal are implemented as expected. The Requester Ticket Detail and Attachment UI also cover the required actions and states, and the Supertest/Vitest tests are included and passing. So approved ka."
* **How I responded:**
  > "Thank you for the thorough review and approval! I have recorded the peer review in `reviewer.md`. PR #30 is ready to be merged into `lab2-staging`."
* **Verdict:** Approved

---

### [PR #31](https://github.com/Phenwatsa/toktickit/pull/31) — Issue 10: End-to-End Testing & Responsive Polish
* **Target branch:** `lab2-staging`
* **Reviewer initial comment received from @lephirada (Request Changes):**
  > "The E2E flow and responsive checks look good, and the required screenshots are included. I only noticed one small documentation inconsistency: the visual checklist still lists the page background as #F5F7F6, while the current CSS uses #F8FAF9. Please update the checklist/spec to match the current implementation. Once this is fixed, I'm happy to approve."
* **How I responded:**
  > "Thank you for pointing that out! I have reconciled the background color across `zen-green.css`, `specification.md`, `ui-spec.md`, and `tests.md` to ensure complete consistency with the `#F5F7F6` palette token."
* **Reviewer follow-up comment received from @lephirada:**
  > "Reviewed the updates again. Everything looks good now the E2E flow, responsive behavior, overflow checks, screenshots, and visual checklist are all covered and consistent. The issue from my previous review has also been fixed."
* **Verdict:** Approved

---

## 2. Pull Requests I Reviewed for My Partner (@lephirada)

| PR | Partner Branch | Scope / Issue | My Verdict |
|:---|:---|:---|:---|
| [PR #18](https://github.com/lephirada/toktickit/pull/18) | `feature/5-spec-docs` | Issue 5: Define sprint specifications and test plan (#13) | **Approved** |
| [PR #19](https://github.com/lephirada/toktickit/pull/19) | `feature/6-requester-context` | Issue 6: Implement development requester context and seed data (#14) | **Approved** |
| [PR #20](https://github.com/lephirada/toktickit/pull/20) | `feature/7-create-ticket` | Issue 7: Create IT support tickets with pre-upload attachments (#15) | **Approved** |
| [PR #21](https://github.com/lephirada/toktickit/pull/21) | `feature/8-my-tickets` | Issue 8: Display, search, filter, and paginate requester tickets (#16) | **Changes Requested** |
| Pending | `feature/9-ticket-detail` | Issue 9: View ticket details and manage attachment soft-removal (#17) | *Pending (Partner in progress)* |

---

### [PR #18](https://github.com/lephirada/toktickit/pull/18) — Issue 5: Define sprint specifications and test plan (#13)
* **Partner Repository:** `https://github.com/lephirada/toktickit`
* **Target branch:** `lab2-staging`
* **My review comment:**
  > "checked the documentation against the acceptance criteria. The required specs are all included: functional requirements, business rules, acceptance criteria, DoD, API specifications, UI/design guidelines, planned tests, and the traceability matrix. Everything looks good. Once this PR is peer-reviewed and merged into lab2-staging, the final acceptance criterion will be fully satisfied.
  > I Approved."
* **Partner response / action:**
  > Resolved Copilot & peer review feedback by clarifying standard error envelope definitions and updating schema deletion behaviors to match retention rules.
* **My Verdict:** Approved

---

### [PR #19](https://github.com/lephirada/toktickit/pull/19) — Issue 6: Implement development requester context and seed data (#14)
* **Partner Repository:** `https://github.com/lephirada/toktickit`
* **Target branch:** `lab2-staging`
* **My review comment:**
  > "I checked the PR against the acceptance criteria, and everything looks good.
  > - Prisma models and relationships are set up correctly.
  > - Seed data is complete and idempotent, with CI verifying 4 active requesters, 1 inactive requester, 4 categories, and 6 related systems.
  > - GET /api/requesters retrieves active requesters from PostgreSQL.
  > - The requester selection, localStorage persistence, header display, and requester switching flow are implemented.
  > - Dirty form changes are handled with a confirmation dialog, and tickets are reloaded for the selected requester.
  > - Both frontend and backend tests are run in CI.
  > All acceptance criteria are covered. Approve"
* **Partner response:**
  > "Thank you for the review and approval, I have updated reviewer.md , ai_use.md of docs/lab-02 . You can merging this PR into lab2-staging now."
* **My Verdict:** Approved

---

### [PR #20](https://github.com/lephirada/toktickit/pull/20) — Issue 7: Create IT support tickets with pre-upload attachments (#15)
* **Partner Repository:** `https://github.com/lephirada/toktickit`
* **Target branch:** `lab2-staging`
* **My initial review comment:**
  > "Overall, the implementation looks good and most of the acceptance criteria are covered. The API, ticket creation flow, validation, UI states, and tests are all in place.
  > One thing to fix is the client-side attachment MIME validation. Currently, a file can pass validation if its extension is allowed even when its MIME type is not. Since the requirement specifies allowed MIME types (JPG, PNG, WEBP, PDF), the client should validate the MIME type directly as well.
  > Once this is fixed, I think the PR should be ready to approve"
* **Partner response:**
  > "Updated! Added direct file.type MIME validation alongside extension checks in CreateTicketForm.tsx, and added unit tests covering invalid MIME rejection on the client. All tests are passing green. You can merging this PR into lab2-staging now."
* **My follow-up review comment:**
  > "Re-checked the changes after the MIME validation fix. The client now validates both file extension and MIME type, and the new tests cover invalid MIME/extension cases.
  > The ticket API, attachment constraints, form validation, error handling, and Supertest/Vitest coverage all look good. CI is also passing for both frontend and backend.
  > All acceptance criteria are covered. Approved"
* **My Verdict:** Approved

---

### [PR #21](https://github.com/lephirada/toktickit/pull/21) — Issue 8: Display, search, filter, and paginate requester tickets (#16)
* **Partner Repository:** `https://github.com/lephirada/toktickit`
* **Target branch:** `lab2-staging`
* **My review comment (Changes Requested):**
  > "Overall, the PR looks good and most of the acceptance criteria are covered. CI is also passing for both frontend and backend.
  > There are just a couple of things that still need to be fixed:
  > 1. Ticket navigation: Currently, onViewTicket in App.tsx only logs the ticket ID. Clicking a ticket doesn't navigate to /tickets/:id yet. Please connect it to the Ticket Detail route and add a frontend test for the navigation.
  > 2. Requester selection: The requirement says clicking “Profile” should display the Requester Selection screen. Currently, the flow seems to be Profile → Switch Requester → Selection. Could you please confirm if this is the intended behavior?
  > Once these are fixed, I think the PR should be ready to approve."
* **Status:** In progress by partner (Pending resolution and re-review)
* **My Verdict:** Changes Requested



