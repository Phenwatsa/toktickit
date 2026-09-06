# Lab 2 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.7 Flash)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Thoroughly analyze the Lab 2 assignment requirements, explain the full-stack scope, exclusions, and grading deliverables. | Understood the Requester-facing ticketing scope, multi-user isolation rules, and 9-part PDF report criteria. |
| 2 | Decompose the sprint into a disciplined sequence of GitHub Issues (#5 to #11) with clear branch names and testable Acceptance Criteria. | Created and structured GitHub Issues #5 to #11 on the project Kanban board and planned the feature branches. |
| 3 | Apply Spec-Driven Development (Spec DD) to author `specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md` before writing code. | Established a complete engineering contract covering FRs, BRs, Zen Green design tokens, REST API contracts, and AC traceability. |
| 4 | Implement Development Requester Context, Prisma schema/migrations, idempotent seed data, active requesters API with Supertest, and React RequesterSelector with Vitest. | Built multi-model Prisma schema, seeded 5 users (4 active, 1 inactive), implemented GET /api/requesters/active, and created the Zen Green simulated login context. |
| 5 | Implement Ticket Creation API (POST /api/tickets) with unique ticket number generator, field validation, Supertest suite, and Zen Green CreateTicket UI form with Vitest. | Developed TKT-YYYY-NNNNNN generator, reference data endpoints, client-side validation, busy states, safe error retention, and file attachment constraints. |
| 6 | Implement My Tickets list and filtering API (GET /api/tickets) with multi-tenant data isolation, Supertest suite, and Zen Green MyTickets UI table with search, filters, pagination, and Vitest. | Developed multi-parameter query builder, tenant isolation rules, empty/no-results states, pagination controls, and automated tests. |
| 7 | Implement Ticket Detail inspection API (GET /api/tickets/:id), Attachment Binary Upload (POST /api/tickets/:id/attachments), Download restriction (GET /api/attachments/:id/download), Soft-Removal (DELETE /api/tickets/:id/attachments/:attachmentId), Supertest suites, and Zen Green RequesterTicketDetail & AttachmentSection UI with Vitest. | Developed read-only detail view, multipart upload storage, BR-10 soft-removal retention with audit reason, 410 Gone download blocking, and full client/server test suites. |
| 8 | Implement Playwright End-to-End Test Suite (`e2e/lab-02/requester-ticket-flow.spec.ts`), Responsive Design across Desktop/Tablet/Mobile (`zen-green.css`), and automate capture of all deliverable screenshots under `artifacts/lab-02/screenshots/`. | Built full E2E lifecycle and data isolation suites, polished mobile/tablet styling with no horizontal scroll, and captured 11 screenshot artifacts for PDF report. |
| 9 | Refine UI with Apple-style Zen Green design system: high-contrast header, single-row filter bar, prominent Clear Filters button, deduplicated Cancel action, browser Back/Forward hash navigation, Change Requester confirmation modal, and concise readable copy. | Enhanced visual clarity, typography, responsive single-row filtering, and intuitive navigation ergonomics across all views while preserving 100% test coverage. |
| 10 | Consolidate Sprint 2 deliverables: finalize peer review logs in `reviewer.md`, verify 100% test passing output across Unit/API/UI/E2E in `tests.md`, author the sprint reflection in `ai-use.md`, update `README.md`, and verify release readiness for merging into `main`. | Completed all Lab 2 documentation deliverables, verified 65 automated tests across frontend, backend, and E2E suites, recorded mutual peer reviews with partner @lephirada, and prepared release integration. |

---

## Reflection

### 1. The Impact of Spec-Driven Development (Spec DD)
Adopting Spec-Driven Development (Spec DD) during Issue 5 established a crystal-clear engineering contract before any code was written. Having `specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md` upfront prevented scope creep and architectural divergence. When implementing complex features—such as multi-tenant ticket isolation (`X-Requester-Id`), unique ticket number generation (`TKT-YYYY-NNNNNN`), and attachment soft-removal with audit reasons—the specifications served as a single source of truth for both frontend and backend contracts.

### 2. AI as a Pair Programmer and Quality Multiplier
Collaborating with the Antigravity AI Coding Agent significantly accelerated development while enforcing disciplined software engineering practices:
- **Architectural & Schema Design:** AI assisted in designing normalized Prisma models with appropriate foreign keys, index structures, and cascade/nullify rules that conformed strictly to business rules (e.g., preserving soft-removed attachments).
- **Test Generation & Coverage:** AI drafted comprehensive unit, integration, and E2E test scenarios based on the planned-test matrix. This resulted in 32 backend tests (Supertest), 30 frontend tests (Vitest + RTL), and 3 full-flow multi-viewport Playwright scenarios with 100% pass rate.
- **Responsive UI Refinement:** AI provided CSS modularization strategies for the Zen Green design system (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`), implementing responsive table-to-card transitions and assertion scripts in Playwright ensuring zero horizontal scroll across Desktop, Tablet, and Mobile viewports.

### 3. Prompt Engineering & Context Management Insights
The most effective prompts were those that provided rich domain context, explicit constraints, and clear acceptance criteria. Breaking the sprint into discrete GitHub Issues (#5 to #11) with dedicated feature branches allowed each AI prompt to focus on an isolated vertical slice. Providing error outputs and strict schema definitions in prompt instructions minimized hallucination and generated production-ready code with minimal back-and-forth iteration.

### 4. Human-AI-Peer Review Synergy
The combination of AI code generation, automated test verification, and peer code review with @lephirada established a robust quality gate. Peer review caught subtle inconsistencies early—such as client-side MIME validation requirements, routing hooks for ticket details, and design palette token synchronization—which were promptly verified and resolved before merging into `lab2-staging`.

Overall, AI-assisted Spec-Driven Development proved to be an exceptionally effective workflow for delivering high-quality, fully tested enterprise software on schedule.

