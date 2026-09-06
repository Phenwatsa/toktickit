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

[![Tests](https://img.shields.io/badge/Tests-65%2F65%20Passing%20(100%25)-success?style=flat-square&logo=vitest)](./docs/lab-02/tests.md)
[![Build](https://img.shields.io/badge/Client_Build-Passing%20(0%20errors)-brightgreen?style=flat-square&logo=vite)](./client)
[![Methodology](https://img.shields.io/badge/Methodology-Spec--Driven%20Development%20(Spec%20DD)-006B3C?style=flat-square)](./docs/lab-02/specification.md)
[![Design System](https://img.shields.io/badge/Design_System-Zen_Green_(%23006B3C)-006B3C?style=flat-square)](./docs/lab-02/ui-spec.md)

</div>

---

## 📖 Project Overview
**TokTickIT** is an enterprise IT Service Desk web application engineered for managing support requests across **Account & Access, Hardware, Software, and Network** domains.

Developed under strict **Spec-Driven Development (Spec DD)** and **Test-Driven Development (TDD)** methodologies:
* **Lab 1 (Sprint 1):** Full-Stack Foundation, Health Check API & Category Seed Vertical Slice.
* **Lab 2 (Sprint 2):** Requester-Facing Ticketing MVP, Apple-style Zen Green UI System, Multi-Tenant Data Isolation, and File Attachment Lifecycles.

---

## 🏗 Full-Stack Architecture & Technology Matrix

| Layer | Technology | Key Libraries / Tools | Architectural Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **React 18** & **TypeScript** | Vite 6, React Router DOM, Custom CSS Modules | Single Page Application (SPA), accessible **Zen Green** design tokens, client-side validation, dirty navigation guard, and responsive table-to-card layouts. |
| **Backend API** | **Node.js** & **TypeScript** | Express.js, Multer, Zod Validation | RESTful API controllers, business rules, atomic sequential ticket generator (`TKT-YYYY-NNNNNN`), multipart upload processing, and tenant authorization (`X-Requester-Id`). |
| **Database & ORM** | **PostgreSQL 15** & **Prisma** | Prisma ORM, Prisma Client | Relational schema persistence, strict foreign key constraints, index optimization, and idempotent database seeding. |
| **Testing Pyramid** | **Vitest**, **Supertest**, **Playwright** | React Testing Library (RTL), Chromium | Full verification: **32 Server API tests**, **30 Client UI tests**, and **3 multi-viewport E2E browser automation scenarios** (100% passing). |

---

## 🌟 Key Features (Sprint 2 Requester MVP)

| Feature Module | Key Capabilities | Business Rules & Security Constraints |
| :--- | :--- | :--- |
| **Development Requester Selector** | Simulated authentication and identity switching | • Loads only active requesters (`isActive: true`) from PostgreSQL<br>• Persists selected user context globally across browser refreshes |
| **Ticket Creation (Create Mode)** | IT support request intake form | • Auto-generates unique Ticket Number (`TKT-YYYY-NNNNNN`)<br>• Assigns initial status `NEW`<br>• Field validation on summary & description with safe error state retention |
| **My Tickets (List Mode)** | Paginated ticket overview for current user | • **Strict Multi-Tenant Isolation**: Requesters can only view their own tickets<br>• Real-time search, status/priority/category filters, and sorting<br>• Distinct Loading, Empty, and No-Results feedback states |
| **Ticket Detail (View Mode)** | Read-only inspection of owned tickets | • Blocks unauthorized cross-requester URL/API access (HTTP 403/404)<br>• Displays ticket metadata, category, related system, and status |
| **Attachment Lifecycle** | Secure file attachments management | • Allowed formats: **JPG, PNG, WEBP, PDF** (Max **5 MB** per file, max **5 active files**)<br>• **Soft Removal**: Preserves metadata & reason while permanently disabling download (HTTP 410) |
| **Zen Green Design System** | Accessible Apple-style UI components | • Palette: Primary `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, BG `#F5F7F6`<br>• Fully responsive across Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), and Mobile ($< 768\text{px}$) |

---

## 📁 Repository Directory Structure

```text
toktickit/
├── client/                         # React Frontend Application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # Zen Green UI components (Navbar, Badges, Modals, Forms)
│   │   ├── context/                # Global RequesterContext & State Persistence
│   │   ├── pages/                  # RequesterSelector, CreateTicket, MyTickets, TicketDetail
│   │   ├── styles/                 # Zen Green design tokens (zen-green.css)
│   │   └── main.tsx                # Client entry point
│   └── tests/                      # Frontend UI Tests (Vitest + RTL)
│       ├── lab-01/
│       └── lab-02/
├── server/                         # Express Backend & Prisma ORM (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (RequesterUser, Ticket, Attachment, etc.)
│   │   └── seed.ts                 # Idempotent database seed script
│   ├── src/
│   │   ├── routes/                 # Express REST endpoint routers
│   │   ├── services/               # Business logic, Ticket Number generator
│   │   ├── middleware/             # Validation, file upload, error handling
│   │   └── index.ts                # Server startup & Express config
│   ├── uploads/                    # Local storage for physical attachment files
│   └── tests/                      # Backend API Tests (Supertest + Vitest)
│       ├── lab-01/
│       └── lab-02/
├── e2e/                            # End-to-End Browser Tests (Playwright)
│   └── lab-02/                     # Multi-viewport workflow test suites
├── docs/                           # Engineering Contracts & Documentation
│   ├── lab-01/                     # Lab 1 deliverables
│   └── lab-02/
│       ├── specification.md        # Sprint Goals, Scope, FRs, BRs, ACs, DoD
│       ├── ui-spec.md              # Zen Green tokens, layout rules, visual checklist
│       ├── api-spec.md             # REST API schema and endpoint contracts
│       ├── tests.md                # Test plan and AC traceability matrix
│       ├── reviewer.md             # Peer code review records
│       ├── ai-use.md               # Prompt logging and AI reflection
│       └── ai-collaboration-guide.md # AI collaboration protocol & rules
├── artifacts/                      # Visual inspection screenshots
│   └── lab-02/screenshots/
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
   *Set `DATABASE_URL` with your local PostgreSQL credentials:*
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit?schema=public"
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

## 🧪 Automated Testing Matrix (100% Passing)

| Test Level | Tool / Framework | Target Directory | Execution Command | What It Verifies |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | Supertest + Vitest | `server/tests/` | `npm --prefix server test` | HTTP status codes, JSON response schemas, validation errors, tenant isolation, file upload & soft-removal. |
| **Frontend UI** | Vitest + React Testing Library | `client/tests/` | `npm --prefix client test` | Form rendering, field-level error messages, submit busy state, requester switching, and table filtering. |
| **End-to-End** | Playwright | `e2e/` | `npx playwright test` | Full browser lifecycle flow across Desktop, Tablet, and Mobile viewports with zero horizontal overflow. |

---

## 🌿 Git Workflow & Sprint 2 Issue Decomposition

All sprint work follows strict Git discipline: `feature/*` or `docs/*` branches $\rightarrow$ Pull Request with Peer Review $\rightarrow$ `lab2-staging` $\rightarrow$ Release PR $\rightarrow$ `main`.

| GitHub Issue | Branch Name | Scope / Module | Status |
| :--- | :--- | :--- | :---: |
| **Issue #5** | `docs/lab2-spec-and-test-plan` | Sprint Engineering Specification, UI Spec, API Contract & Test Plan (Spec DD) | **Merged** |
| **Issue #6** | `feature/1-requester-context` | Database Schema, Idempotent Seed Data, Requester API & Selection Context | **Merged** |
| **Issue #7** | `feature/2-ticket-creation` | Ticket Number Generator, Create Ticket API & Zen Green Form Foundation | **Merged** |
| **Issue #8** | `feature/3-my-tickets` | My Tickets Search, Filtering, Sorting, Pagination & Multi-User Isolation | **Merged** |
| **Issue #9** | `feature/4-ticket-detail-attachments` | Ticket Detail View, Attachment Upload/Download & Soft-Removal Lifecycle | **Merged** |
| **Issue #10** | `feature/5-e2e-and-responsive` | Playwright E2E Test Suite, Responsive UI Verification & Visual Screenshots | **Merged** |
| **Issue #11** | `docs/lab2-documentation` | Final Documentation Polish, Peer Review Records (`reviewer.md`), AI Reflection (`ai-use.md`) & Release Integration | **Ready** |