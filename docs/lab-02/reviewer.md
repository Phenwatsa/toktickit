# Lab 2 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: @Phenwatsa  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: @lephirada  

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| PR #26 | docs/lab2-spec-and-test-plan | Approved |
| PR #27 | feature/1-requester-context | Approved |
| PR #28 | feature/2-ticket-creation | Approved |
| PR #29 | feature/3-my-tickets | Approved |
| PR #30 | feature/4-ticket-detail-attachments | Approved |
| PR #31 | feature/5-e2e-and-responsive | Approved |
| PR #... | docs/lab2-documentation | Pending |

---

## PR #26 — Issue 5: Sprint Specification and Test Plan (Spec DD)
**Reviewer comment I received:**
> Overall, this PR meets the acceptance criteria. The required specification and test-plan documents are present and cover the requested FRs, BRs, ACs, UI rules, API contracts, and AC-to-test traceability. I only noticed a couple of minor documentation consistency issues: FR-07 mentions IT Priority filtering, but this is not reflected in the API/UI filter specifications, and the AI collaboration guide contains local file:/// links. These are not blockers for this PR, but I recommend aligning them before the related implementation issues.

**How I responded:**
> Thank you for the thorough review and helpful suggestions! I have resolved both consistency items:
> 1. Updated `docs/lab-02/api-spec.md` (GET /api/tickets query parameters) and `docs/lab-02/ui-spec.md` (Filter Bar section) to explicitly include the `itPriority` filter parameter and UI dropdown, aligning them with FR-07 and the ticket list specification.
> 2. Replaced all absolute `file:///` paths in `docs/lab-02/ai-collaboration-guide.md` with standard relative markdown links (`./specification.md`, `./ui-spec.md`, etc.).

---

## PR #27 — Issue 6: Development Requester Context & Seed Data
**Reviewer comment I received:**
> Reviewed against all acceptance criteria. Everything looks good, the Prisma models/relations, idempotent seed data, active requester API, requester selection UI, global context, and Change Requester flow are all implemented as expected. The required Supertest and Vitest tests are also included and passing.
> Approved Ka.

**How I responded:**
> Thank you for the review and approval! I have updated `docs/lab-02/tests.md` and `docs/lab-02/reviewer.md` with the peer review record. You can merge this PR into `lab2-staging` now.

---

## PR #28 — Issue 7: Ticket Creation & Zen Green Form Foundation
**Reviewer comment I received:**
> Reviewed against all acceptance criteria. The API, Create Ticket UI, validation, attachment constraints, loading/error handling, and requester context are all implemented as expected. The required Supertest and Vitest tests are included and passing.

**How I responded:**
> Thank you for the review and approval! I have updated the peer review record. PR #28 is ready to be merged into `lab2-staging`.

---

## PR #29 — Issue 8: My Tickets List Screen & Filtering
**Reviewer comment I received:**
> Reviewed the changes against the acceptance criteria. Everything looks good requester isolation, filtering, sorting, pagination, My Tickets UI, and the different UI states are all implemented correctly. The Supertest and Vitest tests are also included and passing, including the multi-user isolation and requester switching cases. So approved ka.

**How I responded:**
> Thank you for the review and approval! I have updated the peer review record in `reviewer.md`. PR #29 is ready to be merged into `lab2-staging`.

---

## PR #30 — Issue 9: Ticket Detail, Attachment Upload API & Soft-Removal
**Reviewer comment I received:**
> Reviewed the changes against all acceptance criteria. Everything looks good, ticket detail ownership, attachment upload/download, 5-file limit, and soft-removal are implemented as expected. The Requester Ticket Detail and Attachment UI also cover the required actions and states, and the Supertest/Vitest tests are included and passing. So approved ka.

**How I responded:**
> Thank you for the thorough review and approval! I have recorded the peer review in `reviewer.md`. PR #30 is ready to be merged into `lab2-staging`.

---

## PR #31 — Issue 10: End-to-End Testing & Responsive Polish
**Reviewer comment I received:**
> Reviewed the updates again. Everything looks good now the E2E flow, responsive behavior, overflow checks, screenshots, and visual checklist are all covered and consistent. The issue from my previous review has also been fixed.

**How I responded:**
> Thank you for the re-review and approval! I have recorded the approved peer review in `reviewer.md`. PR #31 is ready to be merged into `lab2-staging`.

---

## Pull Requests I reviewed for my partner
| PR | Partner Branch | My verdict |
|----|----------------|------------|
| PR #... | docs/lab2-spec-and-test-plan | Pending |
| PR #... | feature/1-requester-context | Pending |
| PR #... | feature/2-ticket-creation | Pending |
| PR #... | feature/3-my-tickets | Pending |
| PR #... | feature/4-ticket-detail-attachments | Pending |
| PR #... | feature/5-e2e-and-responsive | Pending |
| PR #... | docs/lab2-documentation | Pending |
