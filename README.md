# TokTickIT (ตอกติ๊กไอที) — Enterprise IT Service Desk

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

<br/>

[![Tests](https://img.shields.io/badge/Tests-501%2F501%20Passing%20(100%25)-success?style=flat-square&logo=vitest)](./docs/lab-04/tests.md)
[![E2E](https://img.shields.io/badge/Playwright_E2E-41%2F41%20Passing%20(14%20Lab4%20%2B%2027%20Reg)-brightgreen?style=flat-square&logo=playwright)](./docs/lab-04/tests.md)
[![Build](https://img.shields.io/badge/Client_Build-Passing%20(0%20errors)-brightgreen?style=flat-square&logo=vite)](./client)
[![Methodology](https://img.shields.io/badge/Methodology-Spec--Driven%20Development%20(Spec%20DD)-006B3C?style=flat-square)](./docs/lab-04/specification.md)
[![Design System](https://img.shields.io/badge/Design_System-Zen_Green_(%23006B3C)-006B3C?style=flat-square)](./docs/lab-04/ui-spec.md)

</div>

---

## 📖 Project Overview
**TokTickIT** is an enterprise IT Service Desk web application engineered for managing support requests across **Account & Access, Hardware, Software, and Network** domains.

Developed under strict **Spec-Driven Development (Spec DD)** and **Test-Driven Development (TDD)** methodologies:
* **Lab 1 (Sprint 1):** Full-Stack Foundation, Health Check API & Category Seed Vertical Slice.
* **Lab 2 (Sprint 2):** Requester-Facing Ticketing MVP, Apple-style Zen Green UI System, Multi-Tenant Data Isolation, and File Attachment Lifecycles.
* **Lab 3 (Sprint 3):** Three-Role Access Control (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), Non-Destructive Database Migration, JWT Authentication with Session Revocation (`tokenVersion`), Staff Operational Queue & Triage, Confidential Internal Notes vs Collaborative Public Comments, Minimalist Administrator User Management, and Multi-Viewport Responsive Verification.
* **Lab 4 (Sprint 4):** Diagnostic Actions Taken History & Non-Deletable Audit Trail, Server-Enforced Resolution Gate, Optimistic Concurrency Control (OCC) with Form State Preservation, Role-Appropriate Operational Dashboards & Drill-Downs (Requester, IT Staff, Administrator), Zen Green Design System Invariants, and Multi-Tier Automated Regression Architecture.

---

## 🏗 Full-Stack Architecture & Technology Matrix

| Layer | Technology | Key Libraries / Tools | Architectural Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **React 18** & **TypeScript** | Vite 6, Custom CSS Modules, Lucide SVGs | SPA with **Zen Green** tokens (`#006B3C`, `#F5F7F6`, `#FFFFFF`, `#E2E8F0`), client-side validation, password policy meter, role-based navigation guards, and responsive table-to-card layout without horizontal overflow. |
| **Backend API** | **Node.js** & **TypeScript** | Express.js, JWT, bcryptjs, Multer | RESTful API controllers, role authorization middleware, server-side token revocation (`tokenVersion`), 8-status finite state machine validator, optimistic concurrency control (`expectedUpdatedAt`), and sub-300ms aggregated metric calculations. |
| **Database & ORM** | **PostgreSQL 15** & **Prisma** | Prisma ORM, Prisma Client | Relational schema (`User`, `Ticket`, `ActionTaken`, `Comment`, `Attachment`, `Category`), zero-data-loss additive migrations, and idempotent database seed with realistic 5-dimension scenario coverage. |
| **Testing Pyramid** | **Vitest**, **Supertest**, **Playwright** | React Testing Library (RTL), Chromium | Full verification: **298 Server Unit/API tests**, **162 Client UI tests**, **14 Lab 4 E2E Playwright tests**, and **27 Regression E2E tests** (501 tests total, 100% passing across Desktop, Tablet, and Mobile viewports). |

---

## 🌟 Key Features (Sprint 4 Enterprise Operations)

| Feature Module | Key Capabilities | Business Rules & Security Constraints |
| :--- | :--- | :--- |
| **Diagnostic Actions Taken** | Non-deletable audit trail of technical diagnostic actions | • Chronological ordering (`actionDateTime ASC, id ASC`)<br>• IT Staff and Administrator create/edit; Requester read-only (403 Forbidden for mutation)<br>• Performer auto-attributed from session (`performedById`)<br>• Mandatory follow-up note validation ($\ge 3$ non-whitespace chars)<br>• Terminal `CANCELLED` tickets reject actions (400) |
| **Ticket Resolution Gate** | Server-enforced formal ticket resolution workflow | • Status changes to `RESOLVED` and `CLOSED` strictly restricted to `IT_STAFF` and `ADMINISTRATOR`<br>• Requester `problemAppearsResolved = true` is purely advisory and leaves `currentStatus` completely unchanged<br>• `RESOLVED` transition mandates at least 1 recorded `ActionTaken` and non-empty `resolutionSummary` (10–1000 chars) |
| **Optimistic Concurrency (OCC)** | Stale update prevention with unsaved form preservation | • Ticket updates require ISO-8601 `expectedUpdatedAt`<br>• Returns HTTP 409 Conflict with `currentUpdatedAt` on timestamp mismatch<br>• UI displays conflict banner with "Refresh Ticket State" while strictly preserving uncommitted input |
| **Role-Appropriate Dashboards** | Tailored operational summaries for all three roles | • **Requester**: 5 metrics for owned tickets, recent tickets, quick actions, and filter drill-downs<br>• **IT Staff**: 5 primary queue cards (including staff-scoped `myAssignedTickets`), unassigned queue, 8-status and 4-priority breakdowns<br>• **Administrator**: System operational summaries, user statistics (total, active, inactive), and quick administrative shortcuts<br>• Query latency benchmark verified sub-300ms |
| **Zen Green Design System** | Accessible, responsive Apple-inspired design system | • Strict CSS tokens (`--zg-primary: #006B3C`, `--zg-bg-page: #F5F7F6`, `--zg-surface: #FFFFFF`, `--zg-border: #E2E8F0`)<br>• 8-status badge styles with distinct color palettes<br>• Multi-viewport responsive audit (1280px Desktop, 768px Tablet, 375px Mobile) strictly enforcing zero horizontal overflow ($scrollWidth === clientWidth$), zero control collisions, $\ge 44\text{px}$ touch targets, and zero text clipping |

---

## 📁 Repository Directory Structure

```text
toktickit/
├── client/                         # React Frontend Application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # Zen Green UI components (ActionsTakenSection, Modals, Tables, Forms)
│   │   ├── context/                # Global AuthContext & JWT State Persistence
│   │   ├── pages/                  # Login, ChangePassword, Dashboards, StaffTicketQueue, TicketDetail, UserManagement
│   │   ├── styles/                 # Zen Green design tokens (zen-green.css)
│   │   └── main.tsx                # Client entry point
│   └── tests/                      # Frontend UI Tests (Vitest + RTL)
│       ├── lab-01/
│       ├── lab-02/
│       ├── lab-03/
│       └── lab-04/                 # ActionsTaken, TicketWorkflow, Dashboards, UIStates, DesignSystemTokens
├── server/                         # Express Backend & Prisma ORM (TypeScript)
│   ├── prisma/
│   │   ├── migrations/             # Additive migrations (20261012070000_add_lab4_actions_taken)
│   │   ├── schema.prisma           # Unified schema (User, Ticket, ActionTaken, Comment, Attachment, Category)
│   │   └── seed.ts                 # Idempotent 5-dimension database seed script
│   ├── src/
│   │   ├── routes/                 # Actions Taken, Workflow, Dashboards, Auth, Staff Queue, Admin Users
│   │   ├── utils/                  # Dashboard calculators, validation helpers, concurrency checkers
│   │   ├── middleware/             # Role authorization, password change gate, error handling
│   │   └── index.ts                # Server startup & Express config
│   ├── uploads/                    # Local storage for physical attachment files
│   └── tests/                      # Backend API & Unit Tests (Supertest + Vitest)
│       ├── lab-01/
│       ├── lab-02/
│       ├── lab-03/
│       └── lab-04/                 # Unit, Actions Taken, Workflow, Dashboards, Migration Recovery, Seed
├── e2e/                            # End-to-End Browser Tests (Playwright)
│   ├── lab-02/                     # Requester flow under authenticated session (3 tests)
│   ├── lab-03/                     # Multi-role operational queue, auth, user admin (24 tests)
│   └── lab-04/                     # Actions Taken, Resolution Gate, Dashboards & Responsive Audit (14 tests)
├── docs/                           # Engineering Contracts & Documentation
│   ├── lab-01/
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/
│       ├── specification.md        # Sprint 4 Goals, Scope, FRs, BRs, ACs, DoD
│       ├── ui-spec.md              # Zen Green tokens, layout rules, responsive audit checklist
│       ├── api-spec.md             # REST API schema and endpoint contracts
│       ├── tests.md                # 53 planned tests, RTM matrix, raw execution logs
│       ├── reviewer.md             # Mutual peer review records (Author: @Phenwatsa, Reviewer: @lephirada)
│       ├── ai-use.md               # 10 Prompts logging and deep AI reflections
│       ├── issues-plan.md          # 8-issue sprint decomposition plan
│       ├── ai-collaboration-guide.md # AI collaboration protocol & rules
│       └── lab4-final-report.md    # 9-part comprehensive final report ready for single PDF export
├── artifacts/                      # Visual inspection screenshots
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/screenshots/         # 17 FHD screenshots across actions-taken, dashboards, responsive views
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **PostgreSQL** database instance (local or containerized)

---

### Step 1: Backend Setup (`server`)

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (`.env`):
   ```bash
   cp .env.example .env
   ```
   *Set `DATABASE_URL` and `JWT_SECRET` with your credentials:*
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit?schema=public"
   JWT_SECRET="toktickit-super-secret-jwt-key-2026"
   PORT=3000
   ```
   > **Note:** The `JWT_SECRET` string above is a development placeholder for local evaluation. In staging or production environments, always generate a secure random secret (e.g. `openssl rand -base64 32`).
4. Run Prisma database migrations & seed initial data:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *API will run at `http://localhost:3000`.*

---

### Step 2: Frontend Setup (`client`)

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Application will be live at `http://localhost:5173`.*

---

## 🧪 Automated Testing Matrix (100% Passing — 501/501 Tests)

| Test Level | Tool / Framework | Target Directory | Execution Command | Count | What It Verifies |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Backend Unit, API, DB** | Supertest + Vitest | `server/tests/` | `npm run test:server` | **298** | Actions Taken, Resolution Gate, OCC, Dashboard metrics, Migration deploy/recovery, Idempotent seed, and full Labs 1–3 regression. |
| **Frontend UI Components** | Vitest + RTL | `client/tests/` | `npm run test:client` | **162** | Actions Taken modal/list, Resolution controls, Role Dashboards, Empty/Skeleton states, Design System Tokens, and full Labs 1–3 regression. |
| **Lab 4 End-to-End** | Playwright | `e2e/lab-04/` | `npm run test:e2e` | **14** | Actions Taken lifecycle, Resolution gate flow, Ground truth DB metrics assertions, Quick Actions, and Multi-viewport responsive audit. |
| **E2E Regression (Labs 2 & 3)** | Playwright | `e2e/lab-02/`, `e2e/lab-03/` | `npm run test:e2e:regression` | **27** | Authenticated Lab 2 Requester lifecycle (3 tests) and complete Lab 3 multi-role operational queue, auth, and user administration (24 tests). |
| **Full Regression Suite** | Vitest + Playwright | Full Workspace | `npm run test:regression` | **487** | Chained execution of all Server regression (`REG-01`), Client regression (`REG-02`), and E2E regression (`REG-03`). |

---

## 🌿 Git Workflow & Sprint 4 Issue Decomposition

All sprint work follows strict Git discipline: `feature/lab4-*` or `docs/lab4-*` branches $\rightarrow$ Pull Request with Peer Review $\rightarrow$ `lab4-staging` $\rightarrow$ Release PR $\rightarrow$ `main`.

| GitHub Issue | Branch Name | Scope / Module | Status |
| :--- | :--- | :--- | :---: |
| **Issue 20 (#51)** | `docs/lab4-spec-and-test-plan` | Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | **Merged** |
| **Issue 21 (#52)** | `feature/lab4-1-actions-taken-foundation` | Database Migration, Seed Data & Actions Taken Backend API | **Merged** |
| **Issue 22 (#53)** | `feature/lab4-2-ticket-workflow-enforcement` | Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement) | **Merged** |
| **Issue 23 (#54)** | `feature/lab4-3-actions-taken-ui` | Actions Taken UI & Ticket Detail Integration (Frontend) | **Merged** |
| **Issue 24 (#55)** | `feature/lab4-4-dashboard-apis` | Role-Appropriate Dashboard Metrics APIs (Backend) | **Merged** |
| **Issue 25 (#56)** | `feature/lab4-5-dashboard-ui` | Role-Appropriate Dashboards UI & Drill-Down (Frontend) | **Merged** |
| **Issue 26 (#57)** | `feature/lab4-6-e2e-and-responsive` | End-to-End Testing, Responsive Audit & Screenshot Artifacts | **Merged** |
| **Issue 27 (#58)** | `docs/lab4-documentation` | Release Integration, Peer Review, AI Reflection & Final Handover | **In Progress** |
