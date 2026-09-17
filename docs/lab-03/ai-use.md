# Lab 3 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.8 Flash)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Thoroughly analyze Lab 3 requirements (3 roles, mandatory password change, queue/detail workflows, and grading criteria), examine previous Lab 2 conventions, and decompose the sprint into isolated GitHub Issues (Issue 12 (#34) to Issue 19 (#41)) with strict in/out-of-scope boundaries. | Established the foundation of Sprint 3, prevented branch collisions with `lab3-` prefixed branches, and defined vertical issue slices in `docs/lab-03/issues-plan.md`. |
| 2 | Apply Spec-Driven Development (Spec DD) to author complete engineering contracts (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, and `ai-collaboration-guide.md`) with explicit separation of duties (IT Staff vs Admin), database migration safety rules, 100% FR $\rightarrow$ BR $\rightarrow$ AC traceability, and code immutability rules. | Established formal baseline contracts before writing code, resolved architectural decisions (JWT + `tokenVersion` logout revocation, canonical status mappings), and codified 10 core engineering rules ensuring AI will not execute Git write commands or modify past working issues. |
| 3 | Execute database migration from Lab 2 to Lab 3 without data loss, implement idempotent seed data for Requesters, IT Staff, and Administrators with bcrypt password hashing, and implement auth REST endpoints (`POST /login`, `POST /logout`, `GET /me`, `POST /change-password`) backed by JWT and server-side `tokenVersion` revocation. | Applied migration `20260917070000_add_lab3_auth_and_models` safely preserving existing tables, created idempotent seed script with 11 users and realistic tickets, implemented password complexity validator (`UNIT-01`), role authorization middleware (`UNIT-03`), token revocation validator (`UNIT-06`), and supertest test suites (`auth.api.test.ts`, `authorization.api.test.ts`), achieving 100% pass rate across all 62 tests without regressions. |
| 4 | *(Planned: Frontend Auth & First-Login UI)* | *(To be populated during Issue 14 (#36) implementation)* |
| 5 | *(Planned: Staff Queue & Operational Ticketing)* | *(To be populated during Issue 15 (#37) & Issue 16 (#38) implementation)* |
| 6 | *(Planned: Admin User Management & Safety Guards)* | *(To be populated during Issue 17 (#39) implementation)* |
| 7 | *(Planned: E2E Playwright, Responsive & Artifact Capture)* | *(To be populated during Issue 18 (#40) implementation)* |
| 8 | *(Planned: Sprint Review, Documentation & Release Integration)* | *(To be populated during Issue 19 (#41) release)* |

---

## Reflection

### 1. The Impact of Spec-Driven Development (Spec DD) in Sprint 3
*(To be detailed upon sprint completion)*

### 2. AI as a Pair Programmer and Quality Multiplier
*(To be detailed upon sprint completion)*

### 3. Prompt Engineering & Context Management Insights
*(To be detailed upon sprint completion)*

### 4. Human-AI-Peer Review Synergy
*(To be detailed upon sprint completion)*
