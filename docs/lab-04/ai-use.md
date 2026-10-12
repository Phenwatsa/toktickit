# Lab 4 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.8 Flash)

## Selected key prompts (4 recorded; Prompts 5–10 scheduled across Issues 22–27)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 4 handout requirements (Actions Taken, Ticket status rules, role-appropriate dashboards, final regression), verify past working rules (`ai-collaboration-guide.md`) and existing codebase (Labs 1–3), and decompose Sprint 4 into isolated GitHub Issues (Issue 20 (#51) to Issue 27 (#58)) with strict in/out-of-scope boundaries and AI verification notes. | Formulated the complete sprint roadmap, prevented duplicate implementation of existing Lab 1–3 features, established branch naming conventions, and detailed issue scopes in `docs/lab-04/issues-plan.md`. |
| 2 | Author complete Sprint 4 engineering contracts under Spec-Driven Development (Spec DD) covering `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, and `ai-collaboration-guide.md` with 100% FR $\rightarrow$ BR $\rightarrow$ AC $\rightarrow$ Planned Test traceability, database design justifications, resolution gate rules, and stale-update concurrency conflict handling. | Established authoritative specification baselines before authoring implementation code, resolved architectural decisions (relational `ActionTaken` model, `@updatedAt` optimistic concurrency, role-appropriate dashboard metrics), and guaranteed backward compatibility. |
| 3 | Reconcile Sprint 4 specifications and test matrices following partner review on PR #59 and deep handout audit: reconcile JWT Bearer authentication architecture with Lab 3, split shared Acceptance Criteria into discrete entries (`AC-15a/b`, `AC-19a/b`), enforce 3-character minimum on follow-up note across all contracts, clarify concurrency scope, add migration rollback recovery (`MIG-02`) and 5-dimension seed scenario matrix (`SEED-01`), expand test plan to 53 tests (covering ticket reassignment validation for inactive assignees and closed/cancelled lifecycle gates `API-15`, field boundaries `API-16`, append-only invariant `API-17`, loading/empty states `UI-EMPTY-01`, style tokens `UI-STYLE-01`, 409 form preservation `UI-04b`, latency smoke `PERF-SMOKE-01`, and browser accessibility `A11Y-01`), and correct routes to singular `#/ticket/:id`. | Updated `reviewer.md`, `api-spec.md`, `ui-spec.md`, `specification.md`, `issues-plan.md`, and `tests.md` to resolve partner review comments and handout requirements with full cross-document traceability (28 parent criteria, 30 distinct identifiers: `AC-01` to `AC-28`, `MIG-01/02`, `SEED-01`, 53 planned tests), aligning role permissions, concurrency failure taxonomy, terminal ticket immutability, and responsive audit parameters. |
| 4 | Implement Issue 21 (#52) Database Migration, Seed Data & Actions Taken Backend Foundation: author additive `ActionTaken` Prisma model and migration `20261012070000_add_lab4_actions_taken`, author migration deploy & recovery tests (`MIG-01`, `MIG-02` in `migration-recovery.test.ts`), expand idempotent seed script (`prisma/seed.ts`) and test (`SEED-01` in `seed-data.test.ts`) covering all 5 required scenario dimensions across repeated runs, and implement Actions Taken REST APIs (`/api/tickets/:id/actions`) with strict RBAC, validation, terminal CANCELLED gates, and non-deletable audit trail invariants verified by 35 automated tests (`actions-taken.api.test.ts`). | Successfully generated Prisma migration without data loss, validated schema recovery workflows, populated realistic 5-dimension seed scenarios, implemented robust backend routes in `actionsTaken.ts`, and verified 100% test pass across all 43 new tests with zero regressions on 152 legacy server tests and 77 client tests. |

*(Prompts 5–10 will be recorded progressively in real time as each subsequent issue is implemented)*

---

## Reflection

### 1. The Role of Spec-Driven Development (Spec DD) in Sprint 4
In Sprint 4, Spec-Driven Development (Spec DD) provided vital architectural guardrails before writing code. By formalizing `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`, we eliminated ambiguity regarding:
- The distinction between overall Ticket ownership (coordination) and individual Action execution (performer attribution).
- The Resolution Gate: ensuring that Requester problem resolution indication remains purely advisory, while formal status transition is strictly restricted to IT Staff and Administrators at the backend layer.
- Optimistic concurrency control using `@updatedAt` to safeguard against stale updates.
- 100% traceability from Functional Requirements through Business Rules to Acceptance Criteria and automated tests.

### 2. Human-AI Pair Programming and Quality Multiplier
Pair programming with the Antigravity AI Coding Agent allowed for rigorous adherence to Software Engineering best practices:
- **Strict Separation of Concerns**: Maintaining clear boundaries between backend API contracts, database integrity, and frontend UI design.
- **Defensive Engineering**: Ensuring strict input validation, safe failure handling, and non-destructive database evolution without altering working code from previous labs.
- **Human Authority**: The developer retained absolute authority over Git commands, branch merges, and PR reviews, upholding software engineering discipline throughout the project.
