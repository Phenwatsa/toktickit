# TokTickIT (ตอกติ๊กไอที) — IT Service Desk Application

**TokTickIT** is an enterprise IT Service Desk web application designed for processing and managing support requests across **Account & Access, Hardware, Software, and Network** categories. 

The project is developed following strict **Spec-Driven Development (Spec DD)** and **Test-Driven Development (TDD)** methodologies:
- **Lab 1 (Sprint 1):** Full-Stack Foundation & Category Seed Vertical Slice
- **Lab 2 (Sprint 2):** Requester Ticketing MVP with Zen Green UI Foundation, Multi-Tenant Data Isolation, and Attachment Lifecycle

---

## 🏗 Full-Stack Architecture & Technology Matrix

| Layer | Technology | Key Libraries / Frameworks | Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React 18 & TypeScript | Vite, React Router, Custom CSS / Bootstrap 5 | Single Page Application (SPA), responsive Zen Green design system, form state management, validation feedback, and ticket inspection. |
| **Backend API** | Node.js & TypeScript | Express.js, Multer, Zod / Validation | RESTful API routing, business logic validation, unique ticket number generation, safe file upload processing, and multi-user ownership authorization. |
| **Database & ORM** | PostgreSQL | Prisma ORM, Prisma Client | Relational data persistence, schema migrations, foreign key constraints, indexing, and idempotent database seeding. |
| **Testing Suite** | Vitest & Playwright | Supertest, React Testing Library | Full test pyramid: Unit logic, REST API integration tests, React component tests, and multi-viewport End-to-End (E2E) browser automation. |

---

## 🌟 Key Features (Sprint 2 MVP)

| Feature Module | Key Functionality | Business Rules & Constraints |
| :--- | :--- | :--- |
| **Development Requester Selector** | Simulated user authentication and switching | • Loads only active requesters (`isActive: true`) from PostgreSQL<br>• Persists selected user context globally across client sessions |
| **Ticket Creation (Create Mode)** | IT support request intake form | • Auto-generates unique Ticket Number (`TKT-YYYY-NNNNNN`)<br>• Sets initial status to `NEW`<br>• Field validation on summary & description with safe error state retention |
| **My Tickets (List Mode)** | Paginated ticket overview for current user | • **Strict Multi-User Isolation**: Requesters can only see their own tickets<br>• Multi-field search, status/priority/category filters, and sorting<br>• Distinct Loading, Empty, and No-Results states |
| **Ticket Detail (View Mode)** | Read-only inspection of owned tickets | • Blocks unauthorized cross-requester URL/API access (HTTP 403/404)<br>• Displays ticket metadata, category, related system, and status |
| **Attachment Lifecycle** | Secure file attachments management | • Allowed formats: **JPG, PNG, WEBP, PDF** (Max **5 MB** per file, max **5 active files**)<br>• **Soft Removal**: Preserves metadata & reason while permanently disabling download |
| **Zen Green Design System** | Reusable accessible UI components | • Palette: Primary `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, BG `#F5F7F6`<br>• Fully responsive across Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$), and Mobile ($< 768\text{px}$) |

---

## 📁 Repository Directory Structure

```
toktickit/
├── client/                         # React Frontend Application
│   ├── src/
│   │   ├── components/             # Reusable Zen Green UI components (Navbar, Badges, Modals)
│   │   ├── context/                # Global RequesterContext & State
│   │   ├── pages/                  # RequesterSelector, CreateTicket, MyTickets, TicketDetail
│   │   ├── styles/                 # Zen Green design tokens and CSS modules
│   │   └── main.tsx                # Client entry point
│   └── tests/                      # Frontend UI Tests (Vitest + RTL)
│       ├── lab-01/
│       └── lab-02/
├── server/                         # Express Backend & Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (Requester, Ticket, Attachment, etc.)
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
3. Create and configure `.env`:
   ```bash
   cp .env.example .env
   ```
   *Configure `DATABASE_URL` with your local PostgreSQL credentials:*
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit?schema=public"
   PORT=3000
   ```
4. Run Prisma database migrations & seed reference data:
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *API will be available at `http://localhost:3000`.*

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
3. Create local `.env` (optional for custom port):
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Application will be available at `http://localhost:5173`.*

---

## 🧪 Automated Testing Matrix

| Test Level | Tool / Framework | Target Directory | Command | What It Verifies |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | Supertest + Vitest | `server/tests/` | `cd server && npm test` | HTTP status codes, JSON response schemas, validation errors, ownership checks, file upload & soft-removal. |
| **Frontend UI** | Vitest + React Testing Library | `client/tests/` | `cd client && npm test` | Form rendering, field-level error messages, submit busy state, requester switching, and table filtering. |
| **End-to-End** | Playwright | `e2e/` | `npx playwright test` | Full browser lifecycle flow across Desktop, Tablet, and Mobile viewport configurations. |

---

## 🌿 Git Workflow & Sprint 2 Issue Decomposition

All sprint work follows strict Git discipline: `feature/*` or `docs/*` branches $\rightarrow$ Pull Request with Peer Review $\rightarrow$ `lab2-staging` $\rightarrow$ Release PR $\rightarrow$ `main`.

| GitHub Issue | Branch Name | Scope / Module |
| :--- | :--- | :--- |
| **Issue #5** | `docs/lab2-spec-and-test-plan` | Sprint Engineering Specification, UI Spec, API Contract & Test Plan (Spec DD) |
| **Issue #6** | `feature/1-requester-context` | Database Schema, Idempotent Seed Data, Requester API & Selection Context |
| **Issue #7** | `feature/2-ticket-creation` | Ticket Number Generator, Create Ticket API & Zen Green Form Foundation |
| **Issue #8** | `feature/3-my-tickets` | My Tickets Search, Filtering, Sorting, Pagination & Multi-User Isolation |
| **Issue #9** | `feature/4-ticket-detail-attachments` | Ticket Detail View, Attachment Upload/Download & Soft-Removal Lifecycle |
| **Issue #10** | `feature/5-e2e-and-responsive` | Playwright E2E Test Suite, Responsive UI Verification & Visual Screenshots |
| **Issue #11** | `docs/lab2-documentation` | Final Documentation Polish, Peer Review Records (`reviewer.md`), AI Reflection (`ai-use.md`) & Release Integration |