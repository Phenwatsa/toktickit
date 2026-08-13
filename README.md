# TokTickIT (ตอกติ๊กกิต) — IT Service Desk Application

TokTickIT is an IT service desk web application for handling Account & Access, Hardware, Software, and Network support requests. This repository contains the **Lab 1: Full-Stack Hello World Starter** vertical slice.

---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Bootstrap 5
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library

---

## 📁 Repository Structure

```
toktickit/
├── client/                 # React frontend application
│   ├── src/                # React source code
│   └── tests/lab-01/       # UI test files (Vitest)
├── server/                 # Express backend API & Prisma ORM
│   ├── prisma/             # Prisma schema & seed scripts
│   ├── src/                # Server source code (app, routes, db client)
│   └── tests/lab-01/       # REST API test files (Supertest)
├── docs/lab-01/            # Lab documentation and evidence
│   ├── ai_use.md           # Prompt log and AI usage reflection
│   ├── reviewer.md         # Peer code review records
│   └── tests.md            # Test execution plan & evidence
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** database server running locally or via Docker

---

### 1. Backend Setup (`server`)

1. Change directory to `server`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create local `.env` file from template:
   ```bash
   cp .env.example .env
   ```
4. Update `DATABASE_URL` in `.env` to match your local PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit?schema=public"
   PORT=3000
   ```
5. Run Prisma migrations and seed database:
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:3000`.

---

### 2. Frontend Setup (`client`)

1. Change directory to `client`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create local `.env` file from template:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend application will run on `http://localhost:5173`.

---

## 🧪 Running Automated Tests

### Client Tests (Vitest + React Testing Library)
```bash
cd client
npm test
```

### Server Tests (Vitest + Supertest)
```bash
cd server
npm test
```

---

## 🌿 Git Branch Discipline

- `main`: Protected stable release branch.
- `lab1-staging`: Integration branch for Lab 1.
- `feature/*`: Short-lived feature branches for each GitHub Issue:
  - `feature/1-project-foundation`
  - `feature/2-health-check`
  - `feature/3-category-seed`
  - `feature/4-category-list`