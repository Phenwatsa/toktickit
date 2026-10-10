# Lab 4 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.8 Flash)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Analyze Lab 4 handout requirements (Actions Taken, Ticket status rules, role-appropriate dashboards, final regression), verify past working rules (`ai-collaboration-guide.md`) and existing codebase (Labs 1–3), and decompose Sprint 4 into isolated GitHub Issues (Issue 20 (#51) to Issue 27 (#58)) with strict in/out-of-scope boundaries and AI verification notes. | Formulated the complete sprint roadmap, prevented duplicate implementation of existing Lab 1–3 features, established branch naming conventions, and detailed issue scopes in `docs/lab-04/issues-plan.md`. |
| 2 | Author complete Sprint 4 engineering contracts under Spec-Driven Development (Spec DD) covering `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, and `ai-collaboration-guide.md` with 100% FR $\rightarrow$ BR $\rightarrow$ AC $\rightarrow$ Planned Test traceability, database design justifications, resolution gate rules, and stale-update concurrency conflict handling. | Established authoritative specification baselines before authoring implementation code, resolved architectural decisions (relational `ActionTaken` model, `@updatedAt` optimistic concurrency, role-appropriate dashboard metrics), and guaranteed backward compatibility. |

*(Prompts 3–10 will be recorded progressively in real time as each subsequent issue is implemented)*

---

## Reflection

### 1. The Role of Spec-Driven Development (Spec DD) in Sprint 4
In Sprint 4, Spec-Driven Development (Spec DD) provided vital architectural guardrails before writing code. By formalizing `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`, we eliminated ambiguity regarding:
- The distinction between overall Ticket ownership (coordination) and individual Action execution (performer attribution).
- The Resolution Gate: ensuring that Requester problem resolution indication remains purely advisory, while formal status transition is strictly restricted to IT Staff at the backend layer.
- Optimistic concurrency control using `@updatedAt` to safeguard against stale updates.
- 100% traceability from Functional Requirements through Business Rules to Acceptance Criteria and automated tests.

### 2. Human-AI Pair Programming and Quality Multiplier
Pair programming with the Antigravity AI Coding Agent allowed for rigorous adherence to Software Engineering best practices:
- **Strict Separation of Concerns**: Maintaining clear boundaries between backend API contracts, database integrity, and frontend UI design.
- **Defensive Engineering**: Ensuring strict input validation, safe failure handling, and non-destructive database evolution without altering working code from previous labs.
- **Human Authority**: The developer retained absolute authority over Git commands, branch merges, and PR reviews, upholding software engineering discipline throughout the project.
