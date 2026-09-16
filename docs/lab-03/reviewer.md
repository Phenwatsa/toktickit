# Lab 3 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: [@lephirada](https://github.com/lephirada)  

---

## 1. Pull Requests I Authored (Reviewed by @lephirada)

| PR | Branch | Scope / Feature | Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| [PR #42](https://github.com/Phenwatsa/toktickit/pull/42) | `docs/lab3-spec-and-test-plan` | Issue 12 (#34): Sprint Specification, Test Plan & AI Agreement (Spec DD) | **Approved** | `lab3-staging` |
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

## 2. Pull Requests I Reviewed for My Partner (@lephirada)

*(To be populated as partner @lephirada shares her feature branches and pull requests for review)*

| PR | Partner Branch | Scope / Issue | My Verdict | Target Branch |
|:---|:---|:---|:---|:---|
| *(Pending)* | *(Pending)* | *(Pending partner PR details)* | *Pending* | `lab3-staging` |

