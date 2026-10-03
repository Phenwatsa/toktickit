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

[![Tests](https://img.shields.io/badge/Tests-253%2F253%20Passing%20(100%25)-success?style=flat-square&logo=vitest)](./docs/lab-03/tests.md)
[![E2E](https://img.shields.io/badge/Playwright_E2E-24%2F24%20Passing-brightgreen?style=flat-square&logo=playwright)](./docs/lab-03/tests.md)
[![Build](https://img.shields.io/badge/Client_Build-Passing%20(0%20errors)-brightgreen?style=flat-square&logo=vite)](./client)
[![Methodology](https://img.shields.io/badge/Methodology-Spec--Driven%20Development%20(Spec%20DD)-006B3C?style=flat-square)](./docs/lab-03/specification.md)
[![Design System](https://img.shields.io/badge/Design_System-Zen_Green_(%23006B3C)-006B3C?style=flat-square)](./docs/lab-03/ui-spec.md)

</div>

---

## 📖 Project Overview
**TokTickIT** is an enterprise IT Service Desk web application engineered for managing support requests across **Account & Access, Hardware, Software, and Network** domains.

Developed under strict **Spec-Driven Development (Spec DD)** and **Test-Driven Development (TDD)** methodologies:
* **Lab 1 (Sprint 1):** Full-Stack Foundation, Health Check API & Category Seed Vertical Slice.
* **Lab 2 (Sprint 2):** Requester-Facing Ticketing MVP, Apple-style Zen Green UI System, Multi-Tenant Data Isolation, and File Attachment Lifecycles.
* **Lab 3 (Sprint 3):** Three-Role Access Control (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), Non-Destructive Database Migration, JWT Authentication with Session Revocation (`tokenVersion`), Staff Operational Queue & Triage, Confidential Internal Notes vs Collaborative Public Comments, Minimalist Administrator User Management, and Multi-Viewport Responsive Verification.

---

## 🏗 Full-Stack Architecture & Technology Matrix

| Layer | Technology | Key Libraries / Tools | Architectural Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **React 18** & **TypeScript** | Vite 6, Custom CSS Modules, Lucide SVGs | SPA with **Zen Green** tokens, client-side validation, password policy meter, role-based navigation guards, and responsive table-to-card layout without horizontal overflow. |
| **Backend API** | **Node.js** & **TypeScript** | Express.js, JWT, bcryptjs, Multer | RESTful API controllers, role authorization middleware, server-side token revocation (`tokenVersion`), 8-status finite state machine validator, and atomic operations. |
| **Database & ORM** | **PostgreSQL 15** & **Prisma** | Prisma ORM, Prisma Client | Relational schema (`User`, `Ticket`, `Comment`, `Attachment`, `Category`), zero-data-loss migration, and idempotent database seed with bcrypt hashing. |
| **Testing Pyramid** | **Vitest**, **Supertest**, **Playwright** | React Testing Library (RTL), Chromium | Full verification: **152 Server Unit/API tests**, **77 Client UI tests**, and **24 Playwright E2E browser automation scenarios** (100% passing across all viewports). |

---

## 🌟 Key Features (Sprint 3 Enterprise Operations)

| Feature Module | Key Capabilities | Business Rules & Security Constraints |
| :--- | :--- | :--- |
| **Authentication & Password Gate** | Secure JWT authentication & first-login gate | • Passwords hashed with bcrypt (salt rounds: 10)<br>• Enforces mandatory password change for new/seeded accounts before system access<br>• Real-time password policy validation ($\ge 8$ chars, upper, lower, number) |
| **Session Invalidation** | Server-side token revocation | • `tokenVersion` stored in database and JWT payload<br>• Instant invalidation upon logout, password reset, or account deactivation |
| **IT Staff Ticket Queue** | High-density multi-column operational triage console | • Multi-column filtering (Category, Status, Requested Priority, IT Priority, Owner)<br>• Debounced search, sorting, and pagination (10 / 25 / 50 items/page)<br>• Responsive 2-column card grid on tablets and cards on mobile ($< 1200\text{px}$) guaranteeing zero horizontal scrollbars |
| **Ticket Operations & State Machine** | Operational triage and lifecycle transitions | • Claim unassigned tickets and reassign owners<br>• Update IT Priority independently from Requested Priority<br>• Enforces 8-status Finite State Machine transitions with confirmation modal |
| **Confidential Discussions** | Dual-channel communication system | • **Public Comments**: Collaborative exchange between Requester and IT Staff<br>• **Internal Notes**: Amber-styled diagnostic notes strictly forbidden and invisible to Requesters (HTTP 403) |
| **Administrator User Management** | Minimalist user provisioning & administration | • List, search, role filters, user creation modal, password reset<br>• **Safety Guards**: Duplicate email rejection (409), self-deactivation prevention, last active administrator protection |
| **Requester Problem Resolution** | Soft confirmation of issue resolution | • Requester owner can mark problem appears resolved (`PATCH /api/requester/tickets/:id/resolve-indication`) without altering official ticket status |

---

## 📁 Repository Directory Structure

```text
toktickit/
├── client/                         # React Frontend Application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # Zen Green UI components (Navbar, Modals, Tables, Forms)
│   │   ├── context/                # Global AuthContext & JWT State Persistence
│   │   ├── pages/                  # Login, ChangePassword, StaffTicketQueue, StaffTicketDetail, UserManagement
│   │   ├── styles/                 # Zen Green design tokens (zen-green.css)
│   │   └── main.tsx                # Client entry point
│   └── tests/                      # Frontend UI Tests (Vitest + RTL)
│       ├── lab-01/
│       ├── lab-02/
│       └── lab-03/                 # Auth, Staff Queue, Staff Detail, User Management, Navigation
├── server/                         # Express Backend & Prisma ORM (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma           # Unified schema (User, Ticket, Comment, Attachment, Category, System)
│   │   └── seed.ts                 # Idempotent database seed script with bcrypt hashing
│   ├── src/
│   │   ├── routes/                 # Auth, Staff Queue, Staff Operations, Admin Users, Requester APIs
│   │   ├── services/               # State machine, priority init, token management
│   │   ├── middleware/             # Role authorization, password change gate, error handling
│   │   └── index.ts                # Server startup & Express config
│   ├── uploads/                    # Local storage for physical attachment files
│   └── tests/                      # Backend API & Unit Tests (Supertest + Vitest)
│       ├── lab-01/
│       ├── lab-02/
│       └── lab-03/                 # Auth, Staff Queue/Detail, Admin Users, Unit tests (guards, status, policy)
├── e2e/                            # End-to-End Browser Tests (Playwright)
│   ├── lab-02/
│   └── lab-03/                     # 24 E2E scenarios across all 3 roles, responsive viewports & workflows
├── docs/                           # Engineering Contracts & Documentation
│   ├── lab-01/
│   ├── lab-02/
│   └── lab-03/
│       ├── specification.md        # Sprint 3 Goals, Scope, FRs, BRs, ACs, DoD
│       ├── ui-spec.md              # Zen Green tokens, layout rules, responsive audit checklist
│       ├── api-spec.md             # REST API schema and endpoint contracts
│       ├── tests.md                # Test plan, AC traceability matrix, execution logs
│       ├── reviewer.md             # Mutual peer review records (Author: @Phenwatsa, Reviewer: @lephirada)
│       ├── ai-use.md               # Prompt logging and AI reflection
│       ├── issues-plan.md          # 8-issue sprint decomposition plan
│       └── ai-collaboration-guide.md # AI collaboration protocol & rules
├── artifacts/                      # Visual inspection screenshots
│   ├── lab-02/
│   └── lab-03/screenshots/         # 26 FHD screenshots across authentication, staff queue/detail, user admin
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
4. Run Prisma database migrations & seed initial data:
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
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

## 🧪 Automated Testing Matrix (100% Passing — 253/253 Tests)

| Test Level | Tool / Framework | Target Directory | Execution Command | Count | What It Verifies |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Backend Unit & API** | Supertest + Vitest | `server/tests/` | `npm --prefix server test` | **152** | JWT auth, role authorization, state machine, password policy, staff queue/detail, admin users, soft-removal. |
| **Frontend UI** | Vitest + React Testing Library | `client/tests/` | `npm --prefix client test` | **77** | Login view, password change meter, navigation guards, staff queue table/cards, admin modals. |
| **End-to-End** | Playwright | `e2e/lab-03/` | `npx playwright test` | **24** | Full browser journeys across all 3 roles, pagination, and zero horizontal overflow across Desktop, Tablet, and Mobile. |

---

## 🌿 Git Workflow & Sprint 3 Issue Decomposition

All sprint work follows strict Git discipline: `feature/*` or `docs/*` branches $\rightarrow$ Pull Request with Peer Review $\rightarrow$ `lab3-staging` $\rightarrow$ Release PR $\rightarrow$ `main`.

| GitHub Issue | Branch Name | Scope / Module | Status |
| :--- | :--- | :--- | :---: |
| **Issue 12 (#34)** | `docs/lab3-spec-and-test-plan` | Sprint Specification, Test Plan & AI Agreement (Spec DD) | **Merged** |
| **Issue 13 (#35)** | `feature/lab3-1-auth-foundation` | Database Migration, Seed Data & Auth Foundation API | **Merged** |
| **Issue 14 (#36)** | `feature/lab3-2-auth-ui` | Authentication & First-Login Password Change UI | **Merged** |
| **Issue 15 (#37)** | `feature/lab3-3-staff-queue` | IT Staff Ticket Queue (API & Responsive UI) | **Merged** |
| **Issue 16 (#38)** | `feature/lab3-4-ticket-detail-and-notes` | Staff Ticket Detail, Comments & Confidential Notes | **Merged** |
| **Issue 17 (#39)** | `feature/lab3-5-admin-user-management` | Minimalist Administrator User Management | **Merged** |
| **Issue 18 (#40)** | `feature/lab3-6-e2e-and-responsive` | End-to-End Testing, Responsive Audit & Visual Artifacts | **Merged** |
| **Issue 19 (#41)** | `docs/lab3-documentation` | Release Integration, Reviewer Consolidation & Final Docs | **Ready** |