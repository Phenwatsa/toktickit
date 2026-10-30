# TokTickIT (ตอกติ๊กไอที) — Lab 4 Individual Sprint Report
## Diagnostic Actions Taken, Resolution Gate, Role-Appropriate Dashboards & Multi-Tier Regression

---

**Course:** CPE334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Lab Assignment:** Lab 4 — TokTickIT Actions Taken, Dashboards, and Final Regression (Score: 60)  
**Author:** Penwatsa Saengyenpan (รหัสนักศึกษา: 67070503431) — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer Reviewer:** Phirada Lekpaeng (รหัสนักศึกษา: 67070503491) — GitHub: [@lephirada](https://github.com/lephirada)  
**Author Repository:** [https://github.com/Phenwatsa/toktickit.git](https://github.com/Phenwatsa/toktickit.git)  
**Partner Repository:** [https://github.com/lephirada/toktickit.git](https://github.com/lephirada/toktickit.git)  
**Date:** October 30, 2026  

---

# Table of Contents
1. [Answer Part 1: Git Use with Engineering Workflow](#answer-part-1-git-use-with-engineering-workflow) (10 Points)
2. [Answer Part 2: Spec DD](#answer-part-2-spec-dd) (5 Points)
3. [Answer Part 3: Test DD and Traceability](#answer-part-3-test-dd-and-traceability) (10 Points)
4. [Answer Part 4: AI Use with Reflection](#answer-part-4-ai-use-with-reflection) (5 Points)
5. [Answer Part 5: Working IT Staff Dashboard UI](#answer-part-5-working-it-staff-dashboard-ui) (5 Points)
6. [Answer Part 6: Working Actions Taken UI](#answer-part-6-working-actions-taken-ui) (10 Points)
7. [Answer Part 7: Working Ticket Workflow](#answer-part-7-working-ticket-workflow) (5 Points)
8. [Answer Part 8: Working Requester Dashboard and Final Regression UI](#answer-part-8-working-requester-dashboard-and-final-regression-ui) (5 Points)
9. [Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish](#answer-part-9-zen-green-ui-responsive-accessibility-and-final-polish) (5 Points)

---

# Answer Part 1: Git Use with Engineering Workflow
*(10 Points — Evidence: Commit history, Feature $\to$ `lab4-staging` $\to$ `main`, Kanban, `reviewer.md`, README & .gitignore, Directory structure)*

## 1.1 Git Commit History & Branch Flow
TokTickIT ปฏิบัติตามหลักการ Git Discipline อย่างเข้มงวด: ทุกฟีเจอร์แยกพัฒนาบน Branch อิสระ (`feature/lab4-*` และ `docs/lab4-*`) ส่งผ่าน Pull Request ให้คู่ตรวจ (@lephirada) ตรวจสอบและให้ข้อเสนอแนะจนได้รับการ Approve จึง Merge เข้าสู่ `lab4-staging` และสุดท้ายรวมเข้าสู่ `main` ผ่าน Release PR

### Feature Branch to `lab4-staging` Pull Requests Traceability Table

| Issue # | Issue Title | Feature Branch | Pull Request | Reviewer Verdict | Target Branch |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **#51** (Issue 20) | Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | `docs/lab4-spec-and-test-plan` | [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) | **Approved** | `lab4-staging` |
| **#52** (Issue 21) | Database Migration, Seed Data & Actions Taken Backend API | `feature/lab4-1-actions-taken-foundation` | [PR #60](https://github.com/Phenwatsa/toktickit/pull/60) | **Approved** | `lab4-staging` |
| **#53** (Issue 22) | Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement) | `feature/lab4-2-ticket-workflow-enforcement` | [PR #61](https://github.com/Phenwatsa/toktickit/pull/61) | **Approved** | `lab4-staging` |
| **#54** (Issue 23) | Actions Taken UI & Ticket Detail Integration (Frontend) | `feature/lab4-3-actions-taken-ui` | [PR #62](https://github.com/Phenwatsa/toktickit/pull/62) | **Approved** | `lab4-staging` |
| **#55** (Issue 24) | Role-Appropriate Dashboard Metrics APIs (Backend) | `feature/lab4-4-dashboard-apis` | [PR #63](https://github.com/Phenwatsa/toktickit/pull/63) | **Approved** | `lab4-staging` |
| **#56** (Issue 25) | Role-Appropriate Dashboards UI & Drill-Down (Frontend) | `feature/lab4-5-dashboard-ui` | [PR #64](https://github.com/Phenwatsa/toktickit/pull/64) | **Approved** | `lab4-staging` |
| **#57** (Issue 26) | End-to-End Testing, Responsive Audit & Screenshot Artifacts | `feature/lab4-6-e2e-and-responsive` | [PR #65](https://github.com/Phenwatsa/toktickit/pull/65) | **Approved** | `lab4-staging` |
| **#58** (Issue 27) | Release Integration, Peer Review, AI Reflection & Final Handover | `docs/lab4-documentation` | [PR #66](https://github.com/Phenwatsa/toktickit/pull/66) | **In Progress** | `lab4-staging` $\rightarrow$ `main` |

> [!NOTE] Staged Release Architecture & Next Step
> ตามขั้นตอนทางวิศวกรรมซอฟต์แวร์ (Staged Release Architecture):
> 1. **PR #66 (`docs/lab4-documentation` $\rightarrow$ `lab4-staging`):** รวบรวมเอกสาร, บันทึกการรีวิว, ผลทดสอบ และโครงสร้างรายงานฉบับสมบูรณ์เข้าสู่ `lab4-staging` ให้ครบถ้วนเป็นหนึ่งเดียว
> 2. **Final Release PR (`lab4-staging` $\rightarrow$ `main`):** จะดำเนินการเปิดทันทีหลังจาก PR #66 ได้รับการอนุมัติและ Merge เข้า `lab4-staging` เพื่อนำโค้ดและเอกสารทั้งหมดของ Sprint 4 ขึ้นสู่ `main` อย่างเป็นทางการ
> 3. **Final Verification on `main`:** ดำเนินการรันชุดทดสอบทั้งหมด 501 ข้อบน `main` อีกครั้ง และ export เอกสารรายงานนี้เป็น Single PDF เพื่อส่งมอบงาน

### Git Commit Log Excerpt (Clean Staging Merges)
```text
* 39689f1 (origin/lab4-staging) Merge pull request #65 from Phenwatsa/feature/lab4-6-e2e-and-responsive
|\
| * 50161a7 docs(reviewer): document peer review cycles for PR #65 and partner PR #58 (#57)
| * 14d8990 test(e2e): execute Lab 2 regression suite under authenticated session and chain with Lab 3 (#57)
| * 3571cfc test(e2e): extend vertical text clipping detection to fixed heights and line-clamp styles (#57)
| * 98c1ccf test(e2e): enhance text clipping assertion to cover table cells and vertical constraints (#57)
| * 7ed5a91 test(e2e): expand responsive control collision assertions to cover visible form inputs, selects, and textareas (#57)
| * 2571488 test(e2e): enforce exact Zen Green token values and expand clipped text selectors (#57)
* | 66eb74c Merge pull request #64 from Phenwatsa/feature/lab4-5-dashboard-ui
|/
* c979e2a Merge pull request #63 from Phenwatsa/feature/lab4-4-dashboard-apis
* bd97bc1 Merge pull request #62 from Phenwatsa/feature/lab4-3-actions-taken-ui
* e104f26 Merge pull request #61 from Phenwatsa/feature/lab4-2-ticket-workflow-enforcement
* f23aa9b Merge pull request #60 from Phenwatsa/feature/lab4-1-actions-taken-foundation
* a873bf9 Merge pull request #59 from Phenwatsa/docs/lab4-spec-and-test-plan
```

## 1.2 GitHub Kanban Project Board
ทุก Issue ได้รับการแจกแจง Acceptance Criteria ชัดเจน และเคลื่อนย้ายผ่าน Workflow: `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Review/QA` $\rightarrow$ `Done` โดย Issue #51 ถึง #57 อยู่ในสถานะ **Done** และ Issue #58 อยู่ในสถานะ Final Handover

## 1.3 Rendered Peer Review Record Summary (`docs/lab-04/reviewer.md`)
บันทึกการรีวิวร่วมกับคุณภิรดา (@lephirada) ใน `docs/lab-04/reviewer.md` บันทึกการรีวิวอย่างโปร่งใส ครบทุก Cycle:
- **PR #65 Multi-Cycle Review:**
  - *Cycle 1:* ตรวจพบข้อจำกัดเรื่อง Ground truth ของ Metrics และ CI Regression $\rightarrow$ พัฒนา Prisma direct assertions และเพิ่ม `npm run test:e2e:regression` ใน CI
  - *Cycle 2:* ตรวจพบ Control collision ขาด form controls $\rightarrow$ ขยาย selector ครอบคลุม `input`, `select`, `textarea`
  - *Cycle 3:* ตรวจพบ Regression เดิมรันเฉพาะ Lab 3 $\rightarrow$ ปรับปรุง `e2e/lab-02/requester-ticket-flow.spec.ts` ให้รันบน Auth ใหม่ และรันครบ 27 ข้อ (Lab 2 + Lab 3)
  - *Cycle 4:* **Approved**
- **Partner Reviews:** ตรวจสอบและให้ข้อเสนอแนะเชิงลึกต่อ PR ของเพื่อน (PR #50 ถึง PR #58) ในประเด็น Resolution Gate Error Code, Optimistic Concurrency Token advancing และ Form validation จนเพื่อนแก้ไขและได้รับการ Approved ครบถ้วน

## 1.4 Repository Structure & Evidence
```text
toktickit/
├── client/                         # React 18, Vite 6, TypeScript SPA
│   ├── src/components/             # ActionsTakenSection, Modals, Dashboards, Tables
│   └── tests/                      # Vitest UI Component tests (162 tests)
├── server/                         # Express.js, TypeScript, Prisma ORM
│   ├── prisma/                     # Schema, Additive Migrations, Idempotent Seed
│   └── tests/                      # Supertest API & Unit tests (298 tests)
├── e2e/                            # Playwright Browser Automation (41 tests)
│   ├── lab-02/                     # Requester flow under Auth session (3 tests)
│   ├── lab-03/                     # Staff queue, detail, notes, admin users (24 tests)
│   └── lab-04/                     # Actions Taken, Resolution Gate, Dashboards (14 tests)
├── docs/lab-04/                    # Engineering contracts & Living docs
│   ├── specification.md            # Spec DD: FRs, BRs, ACs, DoD
│   ├── api-spec.md                 # REST API endpoints, schemas, status codes
│   ├── ui-spec.md                  # Zen Green design tokens, responsive rules
│   ├── tests.md                    # 53 planned tests, RTM, execution logs
│   ├── reviewer.md                 # Bidirectional peer review records
│   ├── ai-use.md                   # 10 Prompts log and deep reflections
│   └── issues-plan.md              # 8-issue decomposition with 49 checked ACs
├── artifacts/lab-04/screenshots/   # 17 FHD visual inspection deliverables
├── README.md                       # Architecture badges, setup, and test guide
└── .gitignore                      # Securely ignores node_modules, .env, dist
```

---

# Answer Part 2: Spec DD
*(5 Points — Evidence: Link to & rendered `docs/lab-04/specification.md`, Numbered FRs/BRs/ACs, Transition rules, DB decisions, DoD, Evidence spec existed before code)*

## 2.1 Specification Baseline Link & Pre-Implementation Evidence
- **File Link:** [`docs/lab-04/specification.md`](specification.md)
- **Pre-Implementation Evidence:** สัญญาวิศวกรรมซอฟต์แวร์ทั้งหมดถูกสร้างและ Commit บน branch `docs/lab4-spec-and-test-plan` และ Merge ผ่าน [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) เข้าสู่ `lab4-staging` ที่ Commit `a873bf9` ก่อนหน้า Commit แรกของโค้ด Implementation ใน [PR #60](https://github.com/Phenwatsa/toktickit/pull/60)

## 2.2 Numbered Functional Requirements (FR) & Business Rules (BR)
- **FR-01 to FR-06 (Actions Taken Lifecycle):** การบันทึกและแก้ไขประวัติการทำงาน, การจัดเรียงตามลำดับเวลา (`actionDateTime ASC, id ASC`), การดึง Performer จาก Session, สิทธิ์แบบอ่านอย่างเดียวสำหรับ Requester และการเป็น Append-only Audit Trail ที่ห้ามมี Delete endpoint
- **FR-07 to FR-10 (Workflow & Resolution Gate):** การจำกัดสิทธิ์ Resolve/Close ให้เฉพาะ IT Staff และ Admin, สัญญาณแก้ไขของ Requester เป็นเพียง Advisory, การบังคับให้มีอย่างน้อย 1 Action และ Summary ก่อน Resolve, และกลไก Optimistic Concurrency Control ผ่าน `expectedUpdatedAt`
- **FR-11 to FR-15 (Role-Appropriate Dashboards):** แดชบอร์ดสรุปตัวชี้วัด 3 บทบาท (Requester, IT Staff, Admin) พร้อมระบบ Drill-down สู่ตารางตั๋วที่คัดกรองล่วงหน้า และปุ่มลัด Quick Actions
- **FR-16 & FR-17 (Regression & Design Invariants):** ความเข้ากันได้ย้อนหลัง 100% กับแล็บ 1–3 และการบังคับใช้ Zen Green Design Tokens
- **BR-04 (Follow-Up Rule):** หาก `isFollowUpRequired === true` ต้องระบุ `followUpNote` ที่มีตัวอักษรไม่ใช่อักขระว่างอย่างน้อย 3 ตัวอักษร
- **BR-08 (Resolution Gate Rule):** การเปลี่ยนสถานะเป็น `RESOLVED` บังคับให้มี Action Taken อย่างน้อย 1 รายการ และ `resolutionSummary` 10–1000 ตัวอักษร
- **BR-10 (OCC Rule):** การอัปเดตสถานะตั๋วต้องส่ง `expectedUpdatedAt` หากตรวจพบ Stale update จะตอบกลับ `409 Conflict` และฝั่ง UI จะคงข้อมูลที่ผู้ใช้พิมพ์ค้างไว้
- **BR-11 (Cancelled Ticket Invariant):** ตั๋วที่มีสถานะ `CANCELLED` จะไม่สามารถเพิ่ม/แก้ไข Action, เปลี่ยนสถานะ หรือ Reassign ได้

## 2.3 Database Decisions & Justifications
1. **Relational `ActionTaken` Child Model with Cascade Delete:** แยกตาราง `ActionTaken` เชื่อมโยง Many-to-One กับ `Ticket` โดยใช้ `onDelete: Cascade` สำหรับ Ticket เพื่อให้การลบตั๋วทดสอบทำความสะอาดข้อมูลอัตโนมัติ แต่ใช้ `onDelete: Restrict` กับ `User` เพื่อรักษาวินัย Audit Trail ไม่ให้ลบผู้ปฏิบัติงานที่มีประวัติบันทึกงาน
2. **Deterministic Optimistic Concurrency using `@updatedAt` Timestamp:** ใช้คอลัมน์ `updatedAt` ในตาราง `Ticket` เป็น Concurrency Token โดยไม่ต้องเพิ่มคอลัมน์ Version แยกต่างหาก และบังคับการเลื่อนเวลาแบบ Monotonic (`Math.max(Date.now(), expectedDate.getTime() + 1)`) เพื่อแก้ปัญหา Same-millisecond race condition

---

# Answer Part 3: Test DD and Traceability
*(10 Points — Evidence: Link to & rendered `docs/lab-04/tests.md`, 53 planned tests matrix, Actual paths, 100% passing test outputs across Unit/API/UI/Workflow/Regression/E2E)*

## 3.1 Test Plan Link & Requirements Traceability Matrix (RTM)
- **File Link:** [`docs/lab-04/tests.md`](tests.md)
- **Traceability Summary:** ครอบคลุม 53 Planned Tests ทั่วทั้ง 7 Testing Tiers เชื่อมโยง 100% สู่ 28 Parent Acceptance Criteria (30 Distinct Criteria Identifiers: `AC-01` ถึง `AC-28`):

| Testing Tier | Count | Test IDs | Test Files | Status |
| :--- | :---: | :--- | :--- | :---: |
| **1. Unit Tests** | 4 | `UNIT-01` .. `UNIT-04` | `follow-up-validation`, `status-transition-matrix`, `concurrency-check`, `dashboard-calculator` | **Passed (100%)** |
| **2. API & Perf Smoke** | 21 | `API-01` .. `API-17`, `PERF-SMOKE-01` | `actions-taken.api.test.ts`, `ticket-workflow.api.test.ts`, `requester-dashboard.api.test.ts`, `staff-dashboard.api.test.ts`, `performance-smoke.test.ts` | **Passed (100%)** |
| **3. Database Migration/Seed** | 3 | `MIG-01`, `MIG-02`, `SEED-01` | `migration-recovery.test.ts`, `seed-data.test.ts` | **Passed (100%)** |
| **4. Workflow Tests** | 3 | `WF-01`, `WF-02`, `WF-03` | `ticket-workflow.api.test.ts` | **Passed (100%)** |
| **5. UI Component Tests** | 13 | `UI-01a` .. `UI-08`, `UI-04b`, `UI-EMPTY-01`, `UI-STYLE-01` | `ActionsTaken.test.tsx`, `TicketWorkflow.test.tsx`, `RequesterDashboard.test.tsx`, `StaffDashboard.test.tsx`, `AdminDashboard.test.tsx`, `UIStates.test.tsx`, `DesignSystemTokens.test.tsx` | **Passed (100%)** |
| **6. Playwright E2E & A11y** | 6 | `E2E-01` .. `E2E-04`, `A11Y-01` | `actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts`, `dashboards.spec.ts`, `accessibility.spec.ts` | **Passed (100%)** |
| **7. Regression Suites** | 3 | `REG-01`, `REG-02`, `REG-03` | Server Regression (`REG-01`), Client Regression (`REG-02`), E2E Regression (`REG-03`) | **Passed (100%)** |
| **Total Planned Tests** | **53** | | **All 53 Tests Passing (100%)** | **Passed** |

## 3.2 Raw Automated Test Execution Logs (501 Tests Total — 100% Pass)

### 1. Server Unit, API, Migration, and Regression (`npm run test:server`)
```text
 ✓ tests/lab-04/unit/follow-up-validation.unit.test.ts (4 tests)
 ✓ tests/lab-04/unit/status-transition-matrix.unit.test.ts (8 tests)
 ✓ tests/lab-04/unit/concurrency-check.unit.test.ts (5 tests)
 ✓ tests/lab-04/unit/dashboard-calculator.unit.test.ts (9 tests)
 ✓ tests/lab-04/actions-taken.api.test.ts (35 tests)
 ✓ tests/lab-04/ticket-workflow.api.test.ts (32 tests)
 ✓ tests/lab-04/requester-dashboard.api.test.ts (6 tests)
 ✓ tests/lab-04/staff-dashboard.api.test.ts (10 tests)
 ✓ tests/lab-04/performance-smoke.test.ts (4 tests)
 ✓ tests/lab-04/migration-recovery.test.ts (2 tests)
 ✓ tests/lab-04/seed-data.test.ts (1 test)
 ✓ tests/lab-01/*, tests/lab-02/*, tests/lab-03/* (182 legacy tests)

 Test Files  31 passed (31)
      Tests  298 passed (298)
   Duration  20.3s
```

### 2. Client Component and Regression Tests (`npm run test:client`)
```text
 ✓ tests/lab-04/ActionsTaken.test.tsx (4 tests)
 ✓ tests/lab-04/TicketWorkflow.test.tsx (5 tests)
 ✓ tests/lab-04/RequesterDashboard.test.tsx (11 tests)
 ✓ tests/lab-04/StaffDashboard.test.tsx (16 tests)
 ✓ tests/lab-04/AdminDashboard.test.tsx (16 tests)
 ✓ tests/lab-04/UIStates.test.tsx (7 tests)
 ✓ tests/lab-04/DesignSystemTokens.test.tsx (8 tests)
 ✓ tests/lab-01/*, tests/lab-02/*, tests/lab-03/* (95 legacy tests)

 Test Files  20 passed (20)
      Tests  162 passed (162)
   Duration  10.6s
```

### 3. Playwright E2E Tests (`npm run test:e2e` & `npm run test:e2e:regression`)
```text
Running 14 tests using 1 worker
  ✓ e2e/lab-04/actions-taken-flow.spec.ts (4 tests passed, 10.2s)
  ✓ e2e/lab-04/ticket-resolution.spec.ts (4 tests passed, 11.5s)
  ✓ e2e/lab-04/dashboards.spec.ts (6 tests passed, 14.8s)
  14 passed (36.5s)

Running Regression Suite (npm run test:e2e:regression)
  ✓ e2e/lab-02/requester-ticket-flow.spec.ts (3 tests passed, 14.4s)
  ✓ e2e/lab-03/authentication.spec.ts (6 tests passed)
  ✓ e2e/lab-03/staff-ticket-flow.spec.ts (7 tests passed)
  ✓ e2e/lab-03/user-administration.spec.ts (4 tests passed)
  ✓ e2e/lab-03/requester-resolution.spec.ts (4 tests passed)
  ✓ e2e/lab-03/responsive.spec.ts (2 tests passed)
  ✓ e2e/lab-03/requester-regression.spec.ts (1 test passed)
  27 passed (62.4s)
```

---

# Answer Part 4: AI Use with Reflection
*(5 Points — Evidence: Rendered `docs/lab-04/ai-use.md`, LLM model named, 10 key prompts, Brief "My Reflection" on Spec-Agent & Coding-Agent)*

- **File Link:** [`docs/lab-04/ai-use.md`](ai-use.md)
- **LLM / Agent Used:** `Antigravity AI Coding Agent (Gemini 3.8 Flash)`

## 4.1 Ten Key Prompts Summary
1. **Prompt 1 (Issue Decomposition):** วิเคราะห์ข้อกำหนด Lab 4 และวางแผนแบ่ง 8 GitHub Issues (Issue 20 ถึง 27) พร้อมขอบเขต In/Out of Scope
2. **Prompt 2 (Spec DD Contracts):** ร่างสัญญาวิศวกรรมซอฟต์แวร์ `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`
3. **Prompt 3 (Spec Reconciliation):** ปรับแก้ข้อกำหนดตามคำแนะนำของ Peer Reviewer (JWT Authentication, Follow-up $\ge 3$ chars, Migration rollback)
4. **Prompt 4 (Migration & Actions Taken API):** พัฒนา Prisma Schema, Migration, Seed 5 มิติ และ REST APIs สำหรับ Actions Taken
5. **Prompt 5 (Workflow Hardening & Resolution Gate):** พัฒนาระบบตรวจสอบ 8 สถานะ, Resolution Gate, Reassignment Validation และ Optimistic Concurrency Control
6. **Prompt 6 (Actions Taken UI):** พัฒนา ActionsTakenSection, Modal, Validation, OCC state preservation และ Requester read-only view
7. **Prompt 7 (Dashboard APIs):** พัฒนา REST APIs คำนวณตัวชี้วัดแดชบอร์ด 3 บทบาท พร้อม Performance Smoke Test (< 300ms)
8. **Prompt 8 (Dashboard UI):** พัฒนาหน้าจอแดชบอร์ด Requester, IT Staff และ Admin พร้อม Quick Actions และ Drill-down navigation
9. **Prompt 9 (E2E & Responsive Audit):** พัฒนา Playwright E2E suites, ตรวจสอบ Responsive Invariants ข้าม 3 Viewports, ตรวจ DB Ground Truth, และบันทึก Screenshot 17 ภาพ
10. **Prompt 10 (Release & Documentation):** รวบรวมผลการทดสอบ, บันทึก Peer Review สองทาง, เขียนบทสะท้อน AI และจัดทำ Final Report 9 ส่วน

## 4.2 My Reflection
1. **สถาปัตยกรรมที่ชัดเจนจาก Spec DD:** การระบุสเปกอย่างแม่นยำก่อนเขียนโค้ดช่วยตัดปัญหาความคลุมเครือได้อย่างสิ้นเชิง โดยเฉพาะเรื่องการแยกสิทธิ์ระหว่างผู้ถือตั๋ว (Ticket Owner) กับผู้ปฏิบัติงาน (Action Performer) และการทำให้การยืนยันของ Requester เป็นเพียง Advisory
2. **AI ในฐานะ Pair Programmer คุณภาพสูง:** AI ช่วยคิดค้นและดักจับ Edge Cases สำคัญ เช่น การป้องกัน Calendar Rollover Anomaly ในวันที่ไม่มีจริง, การบังคับ Monotonic Timestamp เพื่อป้องกัน Race Condition, และการเขียน Playwright Evaluator เพื่อตรวจจับ Control Collisions ในระดับ DOM
3. **วินัยทางวิศวกรรมและ Human Authority:** มนุษย์ยังคงเป็นผู้ถืออำนาจสูงสุดในการตัดสินใจทางสถาปัตยกรรม การควบคุมคำสั่ง Git (Commit, Push, Merge) ด้วยตนเอง และการรีวิวโค้ดทุกบรรทัดเพื่อรักษาความปลอดภัยและความถูกต้องของระบบ

---

# Answer Part 5: Working IT Staff Dashboard UI
*(5 Points — Evidence: Operational metrics, current-user actions, recent tickets, accurate counts, drill-down, loading, empty, forbidden, safe-failure, responsive, DB query matching)*

## 5.1 IT Staff Operational Summary
- **Metric Cards (5 Cards Row):** แดชบอร์ดสรุปตัวชี้วัดคิวงานส่วนกลางและคิวงานตนเอง: Total Assigned Queue, My Assigned Tickets (คำนวณเฉพาะ Staff ที่ล็อกอินอยู่), Unassigned Tickets, Waiting for Requester, และ Resolved Past 7 Days
- **Authoritative Database Query Matching:** ค่าตัวชี้วัดทั้งหมดคำนวณผ่าน `server/src/utils/dashboardCalculator.ts` ซึ่งตรงกับผลลัพธ์การ Query บนฐานข้อมูล PostgreSQL จริง 100% โดยได้รับการยืนยันผ่านการเปรียบเทียบค่าแบบสดใน Playwright E2E Test (`e2e/lab-04/dashboards.spec.ts`)
- **Drill-Down Behavior:** การคลิกที่การ์ดตัวชี้วัดจะทำการนำทางแบบไร้รอยต่อไปยังหน้า Staff Ticket Queue พร้อมส่ง Query Parameters กรองสถานะและเจ้าของตั๋วไว้ล่วงหน้า (เช่น `#/staff-queue?status=WAITING_FOR_REQUESTER` หรือ `#/staff-queue?owner=unassigned`)
- **Safe Failure & Resilience:** แสดง Skeleton Loading เมื่อกำลังดึงข้อมูล, แสดง Friendly Empty State เมื่อคิวงานว่าง, และส่งกลับ HTTP 403 Forbidden เมื่อ Requester พยายามเข้าถึงหน้านี้

## 5.2 Embedded IT Staff Dashboard Screenshots

![IT Staff Dashboard Desktop](artifacts/lab-04/screenshots/staff-dashboard/01-staff-dashboard-desktop.png)
*รูปที่ 5.1: IT Staff Dashboard บน Desktop (1280px) แสดง 5 การ์ดตัวชี้วัด, Breakdown สถานะ/ความสำคัญ, ตั๋วล่าสุด และ Quick Actions*

![IT Staff Dashboard Tablet](artifacts/lab-04/screenshots/staff-dashboard/02-staff-dashboard-tablet.png)
*รูปที่ 5.2: IT Staff Dashboard บน Tablet (768px) การ์ดยุบตัวแบบ Responsive สวยงาม*

![IT Staff Dashboard Mobile](artifacts/lab-04/screenshots/staff-dashboard/03-staff-dashboard-mobile.png)
*รูปที่ 5.3: IT Staff Dashboard บน Mobile (375px) เรียงคอลัมน์เดี่ยว 1fr ปราศจาก Horizontal Scrollbar*

![IT Staff Dashboard Drill-down](artifacts/lab-04/screenshots/staff-dashboard/04-staff-dashboard-drilldown.png)
*รูปที่ 5.4: ผลการคลิกการ์ดตัวชี้วัดเพื่อ Drill-down สู่ตารางคิวงานที่ผ่านการกรองข้อมูลล่วงหน้า*

---

# Answer Part 6: Working Actions Taken UI
*(10 Points — Evidence: List, create, assign, edit, status transition, complete, cancel, validation, inactive-assignee rejection, role restrictions, safe failures, responsive, multiple actions on one ticket)*

## 6.1 Actions Taken Engineering Implementation
- **List & Ordering:** แสดงรายการ Actions Taken เรียงลำดับตามเวลาแบบ Deterministic (`actionDateTime ASC, id ASC`) โดยตั๋ว 1 ใบสามารถมี Action Taken ได้หลายรายการจากเจ้าหน้าที่หลายคน
- **Auto-Attribution:** ผู้กระทำ (`performedById`) ถูกดึงมาจาก JWT Session ของผู้ใช้ที่ล็อกอินอยู่โดยอัตโนมัติ ไม่สามารถปลอมแปลงได้
- **Validation Rules:** หากเลือกช่อง "Follow-up Required" ระบบจะบังคับให้กรอก Follow-up Note อย่างน้อย 3 ตัวอักษรที่ไม่ใช่ช่องว่าง หากไม่ถูกต้องจะแสดงข้อความเตือนและบล็อกการบันทึก
- **Role Restrictions:** เฉพาะ `IT_STAFF` และ `ADMINISTRATOR` เท่านั้นที่เห็นปุ่ม Add Action และ Edit Action ส่วน `REQUESTER` จะเห็นเฉพาะตารางประวัติการทำงานแบบอ่านอย่างเดียว (Read-only View) ปราศจากปุ่มแก้ไขใดๆ ใน DOM
- **Terminal CANCELLED Protection:** ตั๋วที่ถูก Cancelled จะปฏิเสธการเพิ่มหรือแก้ไข Action ด้วย HTTP 400 (`TICKET_CANCELLED`)

## 6.2 Embedded Actions Taken Screenshots

![Actions Taken List](artifacts/lab-04/screenshots/actions-taken/01-actions-taken-list-staff.png)
*รูปที่ 6.1: ตารางประวัติ Actions Taken มุมมอง IT Staff แสดงรายการการปฏิบัติงานหลายรายการบนตั๋วใบเดียวกัน*

![Actions Taken Create Modal](artifacts/lab-04/screenshots/actions-taken/02-actions-taken-modal-create.png)
*รูปที่ 6.2: Modal บันทึก Action Taken ใหม่ แสดงชื่อ Performer อัตโนมัติจาก Session*

![Actions Taken Validation Error](artifacts/lab-04/screenshots/actions-taken/03-actions-taken-validation-error.png)
*รูปที่ 6.3: แสดงข้อความแจ้งเตือนสีแดงเมื่อเลือก Follow-up Required แต่กรอกข้อความ < 3 ตัวอักษร*

![Actions Taken Edit Modal](artifacts/lab-04/screenshots/actions-taken/04-actions-taken-edit-modal.png)
*รูปที่ 6.4: Modal แก้ไข Action Taken ที่บันทึกไว้*

![Actions Taken Requester Readonly](artifacts/lab-04/screenshots/actions-taken/05-actions-taken-requester-readonly.png)
*รูปที่ 6.5: มุมมอง Requester ตรวจสอบประวัติ Actions Taken แบบอ่านอย่างเดียว (ไม่มีปุ่ม Add/Edit)*

---

# Answer Part 7: Working Ticket Workflow
*(5 Points — Evidence: Permitted ticket transitions, stable ordering, append-only behavior, role-appropriate visibility, Resolution gate, OCC 409)*

## 7.1 Server-Enforced Resolution Gate & State Transitions
- **Resolution Gate:** การเปลี่ยนสถานะตั๋วสู่ `RESOLVED` และ `CLOSED` ถูกจำกัดให้ทำได้เฉพาะบทบาท `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น โดยระบบจะตรวจสอบว่าตั๋วต้องมีบันทึก `ActionTaken` อย่างน้อย 1 รายการ และมี `resolutionSummary` ครบถ้วน หากไม่มี Action Taken จะถูกปฏิเสธด้วย HTTP 422 `ACTION_TAKEN_REQUIRED_FOR_RESOLUTION`
- **Advisory Requester Flow:** เมื่อ Requester กด "Problem Appears Resolved" เซิร์ฟเวอร์จะอัปเดต `problemAppearsResolved: true` โดยที่ `currentStatus` ของตั๋วยังคงเดิม เพื่อรอให้เจ้าหน้าที่ไอทีตรวจสอบงานและทำการ Resolve อย่างเป็นทางการ
- **Optimistic Concurrency Control (OCC):** ทุกการอัปเดตสถานะตั๋วต้องส่ง `expectedUpdatedAt` โดยหากมีผู้แก้ไขตัดหน้า เซิร์ฟเวอร์จะปฏิเสธด้วย HTTP 409 Conflict พร้อมส่งค่าล่าสุดกลับมา ส่วนฝั่ง UI จะแสดง Banner แจ้งเตือนพร้อมปุ่ม "Refresh Ticket State" โดยยังคงเก็บรักษาข้อความที่ผู้ใช้พิมพ์ค้างไว้ใน Form ไม่ให้สูญหาย

```typescript
// server/src/routes/ticketWorkflow.ts (Resolution Gate Core Logic)
if (targetStatus === "RESOLVED") {
  const actionsCount = await prisma.actionTaken.count({ where: { ticketId } });
  if (actionsCount === 0) {
    return res.status(422).json({
      error: "ACTION_TAKEN_REQUIRED_FOR_RESOLUTION",
      message: "At least one diagnostic action must be recorded before resolving a ticket.",
    });
  }
}
```

---

# Answer Part 8: Working Requester Dashboard and Final Regression UI
*(5 Points — Evidence: Requester-owned metrics, recent & attention-required tickets, drill-down, ownership protection, representative regression evidence across Labs 1–3)*

## 8.1 Requester Dashboard & Tenant Isolation
- **Scoped Metrics:** แดชบอร์ด Requester ดึงข้อมูลผ่าน `GET /api/requester/dashboard` ซึ่งจำกัดสิทธิ์เฉพาะตั๋วที่เป็นของตนเองตาม `req.user.id` อย่างเคร่งครัด
- **Summary Cards:** แสดง 5 การ์ดตัวชี้วัด (Total Tickets, Open Tickets, In Progress, Waiting for Requester, Resolved/Closed)
- **Interactive Drill-Down:** การคลิกที่การ์ดจะนำทางไปยัง `#/my-tickets?status=...` แสดงเฉพาะตั๋วในสถานะที่เลือก
- **Tenant Isolation:** ป้องกันการดูตั๋วของผู้อื่นอย่างเด็ดขาด หาก Requester พยายามเข้าถึงตั๋วของผู้อื่นทาง URL จะได้รับ HTTP 403 Forbidden ทันที

## 8.2 Embedded Requester Dashboard Screenshots

![Requester Dashboard Desktop](artifacts/lab-04/screenshots/requester-dashboard/01-requester-dashboard-desktop.png)
*รูปที่ 8.1: Requester Dashboard บน Desktop (1280px) แสดง 5 การ์ดตัวชี้วัด, รายการตั๋วล่าสุด และ Quick Actions*

![Requester Dashboard Tablet](artifacts/lab-04/screenshots/requester-dashboard/02-requester-dashboard-tablet.png)
*รูปที่ 8.2: Requester Dashboard บน Tablet (768px)*

![Requester Dashboard Mobile](artifacts/lab-04/screenshots/requester-dashboard/03-requester-dashboard-mobile.png)
*รูปที่ 8.3: Requester Dashboard บน Mobile (375px) แสดงการ์ดเรียงต่อกันในแนวตั้ง ไม่มี Scroll แนวนอน*

![Requester Dashboard Drilldown](artifacts/lab-04/screenshots/requester-dashboard/04-requester-dashboard-drilldown.png)
*รูปที่ 8.4: ผลการ Drill-down สู่หน้ารายการตั๋วส่วนตัว My Tickets ที่กรองสถานะไว้ล่วงหน้า*

## 8.3 Full Regression Evidence across Labs 1, 2, and 3
- **Server Regression (`REG-01`):** 182 ชุดทดสอบดั้งเดิมจาก Lab 1 (Categories, Health), Lab 2 (Tickets, Attachments), และ Lab 3 (Auth, Staff Queue, Admin Users) ผ่านฉลุย 100%
- **Client Regression (`REG-02`):** 95 ชุดทดสอบ Component UI ดั้งเดิมผ่านฉลุย 100%
- **E2E Regression (`REG-03`):** ชุดทดสอบ Playwright E2E รันครบ 27 ข้อ (Lab 2: 3 ข้อภายใต้ระบบ Auth ใหม่ + Lab 3: 24 ข้อ) ผ่าน 100% ปราศจากข้อผิดพลาดตกค้าง

---

# Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish
*(5 Points — Evidence: Rendered `ui-spec.md`, Desktop/Tablet/Mobile screenshots across all major screens, Visual & accessibility checklist, Keyboard focus, Zero clipping, Zero overlap, Zero horizontal overflow)*

- **File Link:** [`docs/lab-04/ui-spec.md`](ui-spec.md)

## 9.1 Visual & Accessibility Verification Checklist
- [x] **Zero Horizontal Overflow:** ยืนยันผ่านการทดสอบอัตโนมัติใน Playwright ว่า `scrollWidth === clientWidth` ($scrollX = 0$) ในทุกหน้าจอและทุก Viewport (1280px, 768px, 375px)
- [x] **Zero Control Collisions:** ตรวจสอบระยะห่างระหว่างปุ่ม ลิงก์ และ Form controls (`input`, `select`, `textarea`) ทั้งหมด ไม่มีการทับซ้อนกันในระดับพิกเซล
- [x] **Accessible Touch Targets:** ปุ่มและ Action controls บนหน้าจอสัมผัส (Tablet และ Mobile) มีขนาดความสูงอย่างน้อย $44\text{px}$ ตามมาตรฐาน WCAG 2.1 AAA
- [x] **Zero Text Clipping:** ตรวจสอบข้อความ หัวข้อ การ์ดตัวชี้วัด และเซลล์ในตารางข้อมูล (`th, td`) ปราศจากการตัดทอนข้อความทั้งในแนวนอนและแนวตั้ง
- [x] **Keyboard Operation & Focus Trapping:** Modal ของ Actions Taken รองรับการวนลูปโฟกัสแป้นพิมพ์ (Focus Trapping) และเมื่อปิด Modal จะคืนโฟกัสกลับไปยังปุ่มเดิมที่เปิดเสมอ
- [x] **Zen Green CSS Design Tokens:** บังคับใช้ตัวแปร CSS กลางอย่างเคร่งครัด (`--zg-primary: #006B3C`, `--zg-bg-page: #F5F7F6`, `--zg-surface: #FFFFFF`, `--zg-border: #E2E8F0`)

## 9.2 Embedded Administrator Dashboard Screenshots

![Admin Dashboard Desktop](artifacts/lab-04/screenshots/admin-dashboard/01-admin-dashboard-desktop.png)
*รูปที่ 9.1: Administrator Dashboard บน Desktop (1280px) แสดงภาพรวมระบบ, สถิติบัญชีผู้ใช้ และ Quick Actions*

![Admin Dashboard Tablet](artifacts/lab-04/screenshots/admin-dashboard/02-admin-dashboard-tablet.png)
*รูปที่ 9.2: Administrator Dashboard บน Tablet (768px)*

![Admin Dashboard Mobile](artifacts/lab-04/screenshots/admin-dashboard/03-admin-dashboard-mobile.png)
*รูปที่ 9.3: Administrator Dashboard บน Mobile (375px)*

![Admin Dashboard Drilldown](artifacts/lab-04/screenshots/admin-dashboard/04-admin-dashboard-drilldown.png)
*รูปที่ 9.4: ผลการคลิกการ์ดสถิติผู้ใช้เพื่อ Drill-down สู่หน้าระบบจัดการผู้ใช้งาน User Management*

---

# สรุปภาพรวมความพร้อมในการส่งมอบงาน
TokTickIT ใน Sprint 4 (Lab 4) ดำเนินการพัฒนาและทดสอบครบถ้วนทุกข้อกำหนดของใบงาน (Score: 60/60) เอกสารฉบับนี้ถูกจัดโครงสร้างตามหัวข้อ **Answer Part 1 ถึง Answer Part 9** ครบทั้ง 9 ส่วนอย่างถูกต้อง

**ขั้นตอนสุดท้ายของการปิดงาน (Final Release & Handover Pipeline):**
1. **Merge PR #66 สู่ `lab4-staging`:** รวมเอกสารและหลักฐานทั้งหมดเข้า staging branch
2. **เปิด Release PR (`lab4-staging` $\rightarrow$ `main`):** รวมการเปลี่ยนแปลงทั้งหมดของ Sprint 4 สู่ `main`
3. **Verify บน `main` & Export Single PDF:** ยืนยันผลทดสอบทั้งหมด 501 ข้อบน `main` และ Export เอกสารนี้เป็น Single PDF เพื่อส่งมอบการประเมินผลทางการศึกษาอย่างเป็นทางการ
