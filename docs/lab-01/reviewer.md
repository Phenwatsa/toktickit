# Lab 1 — Peer Review Record

**Author:** Penwatsa Saengyenpan — 67070503431 — GitHub: @Phenwatsa
**Peer reviewer:** Phirada Lekpaeng — 67070503491 — GitHub: @lephilara

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| PR #1 | feature/1-project-foundation | Approved |
| PR #2 | feature/2-health-check | Approved |
| PR #3 | feature/3-category-seed | Approved |
|      | feature/4-category-list |  |

**Reviewer comment I received (PR #1):**
> I reviewed this PR against the Acceptance Criteria for Issue 1, and overall everything is implemented as expected. The frontend and backend can build and start successfully, Bootstrap is installed and used in the frontend, the Prisma/PostgreSQL foundation is set up, and Vitest/Supertest are configured for testing.
> 
> I also checked the .gitignore, .env.example, and README. No secrets or node_modules are committed, and the README provides the necessary setup instructions.
> 
> The Health Check and Category API do not need to be implemented in this PR since they are part of the following issues.
> 
> I see docs/lab-01/reviewer.md still contains placeholder-style formatting such as <your ...>. This should be cleaned up before merging na ka.
> 
> Overall, this PR meets the scope and requirements of Issue 1 and is ready to merge.

**How I responded (PR #1):**
> Thank you for the review! I have cleaned up the placeholder-style formatting (`<your ...>`, `<student ...>`, `<username ...>`) in `docs/lab-01/reviewer.md` and updated the peer review log accordingly.

**Reviewer comment I received (PR #2):**
> Reviewed against the acceptance criteria. The /api/health endpoint returns HTTP 200 with the required JSON response, and the Supertest test verifies both fields. The React UI also calls the real health endpoint and correctly shows Online/Offline states with an error message when the backend is unavailable and CI is passing. Overall acceptance criteria are met so I approved this.

**How I responded (PR #2):**
> Thanks for the review!

**Reviewer comment I received (PR #3):**
> Reviewed against the Issue 3 acceptance criteria. The Category model, migration, and seed script are implemented correctly. The seed includes all four required categories and uses upsert to prevent duplicates when run multiple times. Database credentials are also excluded from Git through .gitignore. CI is passing. All acceptance criteria are met. Approved.

**How I responded (PR #3):**
> Thank you for the review and approval! I have updated `docs/lab-01/reviewer.md` with your review record and I am merging this PR into `lab1-staging` now.

## Pull Requests I reviewed for my partner
**My comment:** <...>
**Partner's response:** <...>
