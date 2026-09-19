# Lab 3 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.8 Flash)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Thoroughly analyze Lab 3 requirements (3 roles, mandatory password change, queue/detail workflows, and grading criteria), examine previous Lab 2 conventions, and decompose the sprint into isolated GitHub Issues (Issue 12 (#34) to Issue 19 (#41)) with strict in/out-of-scope boundaries. | Established the foundation of Sprint 3, prevented branch collisions with `lab3-` prefixed branches, and defined vertical issue slices in `docs/lab-03/issues-plan.md`. |
| 2 | Apply Spec-Driven Development (Spec DD) to author complete engineering contracts (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, and `ai-collaboration-guide.md`) with explicit separation of duties (IT Staff vs Admin), database migration safety rules, 100% FR $\rightarrow$ BR $\rightarrow$ AC traceability, and code immutability rules. | Established formal baseline contracts before writing code, resolved architectural decisions (JWT + `tokenVersion` logout revocation, canonical status mappings), and codified 10 core engineering rules ensuring AI will not execute Git write commands or modify past working issues. |
| 3 | Execute database migration from Lab 2 to Lab 3 without data loss, implement idempotent seed data for Requesters, IT Staff, and Administrators with bcrypt password hashing, and implement auth REST endpoints (`POST /login`, `POST /logout`, `GET /me`, `POST /change-password`) backed by JWT and server-side `tokenVersion` revocation. | Applied migration `20260917070000_add_lab3_auth_and_models` safely preserving existing tables, created idempotent seed script with 11 users and realistic tickets, implemented password complexity validator (`UNIT-01`), role authorization middleware (`UNIT-03`), token revocation validator (`UNIT-06`), and supertest test suites (`auth.api.test.ts`, `authorization.api.test.ts`), achieving 100% pass rate across all 62 tests without regressions. |
| 4 | Implement authentication state management, login view (`Login.tsx`), mandatory first-login password change intercept (`ChangePassword.tsx`), role-based navigation bar, and completely decommission the Lab 2 mock requester selector without breaking backward compatibility for requester workflows. | Built `AuthContext` with persistent JWT handling and auto-intercept for `mustChangePassword`, created Zen Green styled `Login` and `ChangePassword` views with live password rule feedback, updated `Navigation` to conditionally display links per user role, and authored Vitest suites (`Login.test.tsx`, `ChangePassword.test.tsx`), achieving 100% test pass rate across all tests. |
| 5 | Implement IT Staff operational queue and detail workflows: staff ticket list with multi-column filtering, single ticket detail with claim, reassign, IT priority updates, 8-status finite state machine validator, dual comments/notes section with confidential amber notes strictly forbidden to non-staff, collaborative green public comments, and requester "problem appears resolved" indication. | Implemented backend REST endpoints (`/api/staff/tickets`, `/api/staff/tickets/:id/*`, `/api/tickets/:id/comments`, `/api/tickets/:id/notes`, `/api/requester/tickets/:id/resolve-indication`), state transition validator (`UNIT-02`), priority initializer (`UNIT-04`), Supertest integration suites (`API-07` through `API-13`, `API-22`), and responsive frontend components (`StaffTicketQueue`, `StaffTicketDetail`, `CommentsNotesSection`, `RequesterTicketDetail`), verifying 100% pass across 68 client tests and 31 server unit tests. |
| 6 | Implement full-stack minimalist Administrator User Management: admin REST endpoints (`/api/admin/users`), safety guards (duplicate email rejection, self-deactivation prevention, last active administrator protection), session invalidation on deactivation/password reset, Zen Green management UI (`UserManagement.tsx`) with search, role filters, creation and edit modals, password reset section, and comprehensive automated test suites. | Authored backend admin router with `checkSelfDeactivation` and `checkLastActiveAdminProtection` safety guards, integrated token invalidation, created responsive Apple-style Zen Green UI with SVG icons and active state toggles (disabled with warning for current admin), built Vitest unit/integration suites (`UNIT-05`, `API-14` to `API-18`, `UI-08`, `UI-09`), and achieved 100% test pass rate across 229 total tests (152 server, 77 client) and clean production builds. |
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
