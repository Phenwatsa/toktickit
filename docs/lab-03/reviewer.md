# Lab 3 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #42](https://github.com/Phenwatsa/toktickit/pull/42) | `docs/lab3-spec-and-test-plan` | Issue 12 (#34): Sprint Specification, Test Plan & AI Agreement (Spec DD) | Request Changes *(Addressed)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-1-auth-foundation` | Issue 13 (#35): Database Migration, Seed Data & Auth Foundation API | *Pending (Issue 13 / #35)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-2-auth-ui` | Issue 14 (#36): Authentication & First-Login Password Change UI | *Pending (Issue 14 / #36)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-3-staff-queue` | Issue 15 (#37): IT Staff Ticket Queue (API & Responsive UI) | *Pending (Issue 15 / #37)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-4-ticket-detail-and-notes` | Issue 16 (#38): Staff Ticket Detail, Comments & Confidential Notes | *Pending (Issue 16 / #38)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-5-admin-user-management` | Issue 17 (#39): Minimalist Administrator User Management | *Pending (Issue 17 / #39)* | `lab3-staging` |
| *[Upcoming PR]* | `feature/lab3-6-e2e-and-responsive` | Issue 18 (#40): End-to-End Testing, Responsive Audit & Visual Artifacts | *Pending (Issue 18 / #40)* | `lab3-staging` |
| *[Upcoming PR]* | `docs/lab3-documentation` | Issue 19 (#41): Release Integration, Reviewer Consolidation & Final Docs | *Pending (Issue 19 / #41)* | `lab3-staging` $\rightarrow$ `main` |

---

### [PR #42](https://github.com/Phenwatsa/toktickit/pull/42) — Issue 12 (#34): Sprint Specification, Test Plan & AI Agreement (Spec DD)
* **Branch:** `docs/lab3-spec-and-test-plan`
* **Target branch:** `lab3-staging`
* **PR Link:** [https://github.com/Phenwatsa/toktickit/pull/42](https://github.com/Phenwatsa/toktickit/pull/42)
* **Reviewer comment received from @lephirada:**
  > "Request changes for these small documentation updates. I found two small documentation clarifications that would improve consistency:
  > 1. AC-20 covers attachment upload, download, and soft-delete ownership isolation, but the current API continuity section and API-21 description do not explicitly define or test the attachment download operation. Please add the download endpoint/authorization behavior and include it in API-21.
  > 2. AC-03 covers both requester ticket-list isolation and unauthorized ticket-detail access, but API-06 currently focuses mainly on a client-supplied requesterId. Please clarify that API-06 also verifies that a requester cannot access another user's ticket detail and that ownership is always derived from req.user.id.
  > The remaining items, including the planned status of tests and the pending living-document sections, are appropriate for this documentation stage. Please address these minor traceability clarifications before merging PR #42 into lab3-staging."
* **How I responded:**
  - **Addressed Attachment Download in AC-20 & API-21**:
    1. Explicitly documented `GET /api/attachments/:id/download` endpoint in `docs/lab-03/api-spec.md` (§5.3) specifying ownership authorization (`ticket.requesterId === req.user.id` for Requesters, HTTP 403 Forbidden for non-owner Requesters and Admins, IT Staff queue access allowed, HTTP 410 Gone for soft-removed files).
    2. Updated Central Authorization Matrix in `docs/lab-03/specification.md` row `Manage Attachments (Upload/Download/Soft-Delete)`.
    3. Updated `API-21` and `AC-20` in `docs/lab-03/tests.md`, `docs/lab-03/specification.md`, and `docs/lab-03/issues-plan.md` to explicitly verify download operation isolation alongside upload and soft-delete.
  - **Clarified Ticket-Detail Access & `req.user.id` in AC-03 & API-06**:
    1. Updated `API-06` in `docs/lab-03/tests.md` and `docs/lab-03/issues-plan.md` to verify that Requester queries strictly derive identity from session `req.user.id`, excluding foreign tickets from list queries and rejecting unauthorized single-ticket detail access (`GET /api/tickets/:id`) with HTTP 403 Forbidden.
    2. Updated `AC-03` in `docs/lab-03/specification.md` and `docs/lab-03/tests.md` to explicitly govern both ticket list and single ticket detail isolation.
    3. Updated `Single Ticket Detail` contract in `docs/lab-03/api-spec.md` (§5.3) to state that ownership is derived from `req.user.id` and any client-supplied `requesterId` in query/header is discarded.
* **Verdict:** Request Changes *(Addressed — Ready for Re-review & Approval)*

---

## 2. Pull Requests I Reviewed for My Partner (@lephirada)

*(To be populated as partner @lephirada shares her feature branches and pull requests for review)*

| PR | Partner Branch | Scope / Issue | My Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| *(Pending)* | *(Pending)* | *(Pending partner PR details)* | *Pending* | `lab3-staging` |

