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
| 8 | *(To be added during Issue 10)* | |
| 9 | *(To be added during Issue 11)* | |

## Reflection

*(To be updated at the end of the sprint upon completing all feature implementations and peer reviews.)*
