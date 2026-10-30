# TokTickIT (ตอกติ๊กไอที) — Lab 4 Individual Sprint Report
## Diagnostic Actions Taken, Resolution Gate, Role-Appropriate Dashboards & Multi-Tier Regression

---

**Course:** CPE334 Software Engineering / Full-Stack Development Laboratory  
**Sprint / Assignment:** Lab 4 — Technical Actions Taken, State Enforcement, Role Dashboards & Verification  
**Author:** Penwatsa Saengyenpan (รหัสนักศึกษา: 67070503431) — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer Reviewer:** Phirada Lekpaeng (รหัสนักศึกษา: 67070503491) — GitHub: [@lephirada](https://github.com/lephirada)  
**Author Repository:** `https://github.com/Phenwatsa/toktickit.git`  
**Partner Repository:** `https://github.com/lephirada/toktickit.git`  
**Date:** October 30, 2026  

---

# Table of Contents
1. [Part 1: Executive Summary & Full-Stack Architecture](#part-1-executive-summary--full-stack-architecture)
2. [Part 2: GitHub Project, Issue Decomposition & PR Traceability](#part-2-github-project-issue-decomposition--pr-traceability)
3. [Part 3: Spec-Driven Development (Spec DD) Engineering Contracts](#part-3-spec-driven-development-spec-dd-engineering-contracts)
4. [Part 4: Core Implementation & Business Logic Rules](#part-4-core-implementation--business-logic-rules)
5. [Part 5: UI Design System & Responsive Layout Walkthrough](#part-5-ui-design-system--responsive-layout-walkthrough)
6. [Part 6: Automated Testing Pyramid & Verification Matrix](#part-6-automated-testing-pyramid--verification-matrix)
7. [Part 7: Peer Code Review Records & Collaboration Analysis](#part-7-peer-code-review-records--collaboration-analysis)
8. [Part 8: AI-Assisted Development & Reflection](#part-8-ai-assisted-development--reflection)
9. [Part 9: Release Management & Sprint Retrospective](#part-9-release-management--sprint-retrospective)

---

# Part 1: Executive Summary & Full-Stack Architecture

## 1.1 Executive Summary
TokTickIT (ตอกติ๊กไอที) ใน Sprint 4 (Lab 4) ได้รับการยกระดับขึ้นเป็น Enterprise IT Service Desk เต็มรูปแบบ โดยเน้นการสร้างความน่าเชื่อถือทางวิศวกรรมซอฟต์แวร์ (Reliability, Integrity & Verification) ประกอบด้วย 5 เสาหลักสำคัญ:
- **Diagnostic Actions Taken & Non-Deletable Audit Trail:** ระบบบันทึกประวัติการวินิจฉัยและปฏิบัติการทางเทคนิค เรียงลำดับตามเวลาจริง (`actionDateTime ASC, id ASC`) ระบุตัวผู้กระทำ (`performedById`) อัตโนมัติจาก JWT Session บังคับเงื่อนไข Follow-up Note ($\ge 3$ ตัวอักษร) และป้องกันการแก้ไข/ลบโดยมิชอบ (Non-deletable Audit Trail)
- **Authoritative Ticket Resolution Gate:** การควบคุมวงจรชีวิตตั๋วอย่างเข้มงวดที่ระดับ Server โดยจำกัดสิทธิ์การเปลี่ยนสถานะสู่ `RESOLVED` และ `CLOSED` เฉพาะ `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น พร้อมกำหนด Resolution Gate ว่าการ Resolve ต้องมี Action Taken อย่างน้อย 1 รายการ และมีคำอธิบายผลสรุป การส่งสัญญาณจาก Requester (`problemAppearsResolved = true`) เป็นเพียงการแจ้งข้อมูลเชิงปรึกษา (Advisory) และไม่เปลี่ยนสถานะตั๋ว
- **Optimistic Concurrency Control (OCC):** กลไกป้องกันการอัปเดตทับซ้อน (Lost Updates) ด้วยการตรวจสอบ `@updatedAt` (`expectedUpdatedAt`) โดยหากมีผู้แก้ไขก่อนหน้า เซิร์ฟเวอร์จะปฏิเสธด้วย HTTP 409 Conflict พร้อมส่งค่าล่าสุดกลับมา ขณะที่ฝั่ง UI ออกแบบให้รักษาสถานะข้อมูลที่ผู้ใช้พิมพ์ค้างไว้ (Form State Preservation) ไม่ให้สูญหาย
- **Role-Appropriate Operational Dashboards:** หน้าสรุปข้อมูลเชิงสถิติและตัวชี้วัดที่ออกแบบแยกตามบทบาททั้ง 3 ฝั่ง:
  - *Requester Dashboard:* แสดง 5 การ์ดตัวชี้วัดตั๋วของตนเอง, รายการตั๋วล่าสุด, ทางลัด Quick Actions และระบบ Drill-down สู่ตารางตั๋วที่ผ่านการกรอง
  - *IT Staff Dashboard:* แสดง 5 การ์ดตัวชี้วัดคิวงานส่วนกลางและคิวงานตนเอง (`myAssignedTickets`), คิวที่ยังไม่มีผู้รับผิดชอบ, สถิติตาม 8 สถานะ และ 4 ลำดับความสำคัญ
  - *Administrator Dashboard:* สรุปภาพรวมการปฏิบัติการระบบ, สถิติบัญชีผู้ใช้งาน (รวม, Active, Inactive, แยกตาม Role) และทางลัดจัดการผู้ใช้งาน
- **Design System Invariants & Multi-Tier Regression Architecture:** การรับประกันความเข้ากันได้ย้อนหลัง 100% สำหรับฟีเจอร์จาก Lab 1, 2 และ 3 พร้อมการตรวจวัด Responsive Invariants ข้าม 3 ขนาดหน้าจอ (Desktop 1280px, Tablet 768px, Mobile 375px) ด้วยเงื่อนไขไม่มี Scroll แนวนอน (`scrollWidth === clientWidth`), การ์ดเรียงตัวถูกต้อง, ควบคุมระยะห่างปุ่มไม่ทับซ้อน (No Control Collisions), Touch Target $\ge 44\text{px}$ และข้อความไม่ถูกตัดทอน (Zero Clipped Text)

## 1.2 Full-Stack Architecture Matrix

| Layer | Technology | Key Libraries / Frameworks | Purpose & Architectural Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | **React 18**, **TypeScript** | Vite 6, React Router, Custom CSS Modules, Lucide Icons | Single Page Application (SPA), ควบคุม State ด้วย React Hooks, จัดการ JWT Session, นำทางแบบ Role-Aware, ออกแบบเลย์เอาต์ตาม **Zen Green Tokens** (`#006B3C`, `#F5F7F6`, `#FFFFFF`, `#E2E8F0`), ควบคุม Responsive Table-to-Card และป้องกัน Horizontal Scroll |
| **Backend API** | **Node.js**, **TypeScript** | Express.js, JWT, bcryptjs, Multer, Zod | RESTful API Controllers, สถาปัตยกรรม RBAC Authorization, Finite State Machine สำหรับ 8 สถานะตั๋ว, Optimistic Concurrency Control (`expectedUpdatedAt`), และการคำนวณ Dashboard Metrics แบบ Optimized รวมข้อมูลต่ำกว่า 300ms |
| **Database & ORM** | **PostgreSQL 15**, **Prisma** | Prisma ORM, Prisma Client | ฐานข้อมูลเชิงสัมพันธ์ Relational Schema (`User`, `Ticket`, `ActionTaken`, `Comment`, `InternalNote`, `Attachment`, `Category`), Additive Schema Migrations โดยไม่สูญเสียข้อมูลเดิม, และ Idempotent Database Seeding ครอบคลุม 5 มิติ |
| **Testing Pyramid** | **Vitest**, **Supertest**, **Playwright** | React Testing Library, Chromium Headless | การทดสอบครอบคลุม 7 Tiers: **298 Server Unit/API/DB tests**, **162 Client UI tests**, **14 Lab 4 Playwright E2E tests**, และ **27 Regression E2E tests** (รวม 501 tests ผ่าน 100%) |

---

# Part 2: GitHub Project, Issue Decomposition & PR Traceability

การพัฒนาใน Sprint 4 ปฏิบัติตามวินัยของ Git และ Spec-Driven Development อย่างเคร่งครัด โดยแบ่งขอบเขตงานออกเป็น 8 GitHub Issues (Issue 20 ถึง Issue 27) พร้อมทั้งทำการแยก Branch พัฒนาแบบอิสระ และส่งให้ Peer Reviewer (@lephirada) ตรวจสอบผ่าน Pull Request บน GitHub ก่อนรวมเข้าสู่ `lab4-staging`

## 2.1 Issue & PR Mapping Table

| Issue # | Issue Title | Feature Branch | Pull Request | Reviewer Verdict | Target Branch |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **#51** (Issue 20) | Sprint 4 Engineering Contracts, Specification & Test Plan (Spec DD) | `docs/lab4-spec-and-test-plan` | [PR #59](https://github.com/Phenwatsa/toktickit/pull/59) | **Approved** | `lab4-staging` |
| **#52** (Issue 21) | Database Migration, Seed Data & Actions Taken Backend API | `feature/lab4-1-actions-taken-foundation` | [PR #60](https://github.com/Phenwatsa/toktickit/pull/60) | **Approved** | `lab4-staging` |
| **#53** (Issue 22) | Ticket Workflow Hardening & Resolution Gate (Backend & State Enforcement) | `feature/lab4-2-ticket-workflow-enforcement` | [PR #61](https://github.com/Phenwatsa/toktickit/pull/61) | **Approved** | `lab4-staging` |
| **#54** (Issue 23) | Actions Taken UI & Ticket Detail Integration (Frontend) | `feature/lab4-3-actions-taken-ui` | [PR #62](https://github.com/Phenwatsa/toktickit/pull/62) | **Approved** | `lab4-staging` |
| **#55** (Issue 24) | Role-Appropriate Dashboard Metrics APIs (Backend) | `feature/lab4-4-dashboard-apis` | [PR #63](https://github.com/Phenwatsa/toktickit/pull/63) | **Approved** | `lab4-staging` |
| **#56** (Issue 25) | Role-Appropriate Dashboards UI & Drill-Down (Frontend) | `feature/lab4-5-dashboard-ui` | [PR #64](https://github.com/Phenwatsa/toktickit/pull/64) | **Approved** | `lab4-staging` |
| **#57** (Issue 26) | End-to-End Testing, Responsive Audit & Screenshot Artifacts | `feature/lab4-6-e2e-and-responsive` | [PR #65](https://github.com/Phenwatsa/toktickit/pull/65) | **Approved** | `lab4-staging` |
| **#58** (Issue 27) | Release Integration, Peer Review, AI Reflection & Final Handover | `docs/lab4-documentation` | *(Planned / Pending PR)* | **In Progress** | `lab4-staging` $\rightarrow$ `main` |

---

# Part 3: Spec-Driven Development (Spec DD) Engineering Contracts

การพัฒนาใน Sprint 4 ขับเคลื่อนด้วยสัญญาวิศวกรรมซอฟต์แวร์ที่สมบูรณ์ 100% ในโฟลเดอร์ `docs/lab-04/` ก่อนเริ่มเขียนโค้ดจริง

## 3.1 สรุปข้อกำหนดทางหน้าที่ (FR) และกฎทางธุรกิจ (BR)
- **FR-01 to FR-06 (Actions Taken Management):** การบันทึกและแก้ไขประวัติการปฏิบัติการทางเทคนิค, การเรียงลำดับแบบ Deterministic (`actionDateTime ASC, id ASC`), การระบุ Performer จาก JWT Session, การแสดงผลแบบอ่านอย่างเดียวสำหรับ Requester, และการเป็น Append-only Audit Trail ที่ไม่มี Endpoint ลบข้อมูล
- **FR-07 to FR-10 (Workflow & Resolution Gate):** การจำกัดสิทธิ์การ Resolve/Close ให้เฉพาะ IT Staff และ Admin, การทำให้การยืนยันของ Requester เป็นเพียง Advisory, การบังคับว่าการ Resolve ต้องมีอย่างน้อย 1 Action Taken และมีสรุปผล (10–1000 ตัวอักษร), และการใช้ Optimistic Concurrency Control ด้วย ISO Timestamp
- **FR-11 to FR-15 (Role-Appropriate Dashboards):** การคำนวณและแยกตัวชี้วัดตาม Role (Requester, Staff, Admin), การจำกัดการเข้าถึงข้อมูลข้ามบทบาท, การนำทางแบบ Drill-down สู่ตารางตั๋วที่คัดกรองไว้ล่วงหน้า, และปุ่มทางลัด Quick Actions
- **FR-16 & FR-17 (Quality & Design System):** ความเข้ากันได้ย้อนหลังของฟีเจอร์เดิม (Zero Regressions) และการบังคับใช้ Zen Green Design Tokens พร้อม Responsive Layout Invariants
- **BR-04 (Follow-Up Validation):** หากระบุว่าต้องติดตามผล (`isFollowUpRequired = true`) จะต้องระบุ `followUpNote` ที่มีตัวอักษรไม่ใช่อักขระว่างอย่างน้อย 3 ตัวอักษร ($\ge 3$ non-whitespace chars)
- **BR-08 (Resolution Gate Enforcement):** ตั๋วจะเปลี่ยนสถานะเป็น `RESOLVED` หรือ `CLOSED` ได้เฉพาะเมื่อผู้เรียกมีสิทธิ์ `IT_STAFF` หรือ `ADMINISTRATOR`, มี Action Taken อย่างน้อย 1 รายการ และมี `resolutionSummary` ครบถ้วน
- **BR-10 & BR-16 (Optimistic Concurrency Control):** Request ในการเปลี่ยนสถานะตั๋วต้องส่ง `expectedUpdatedAt` หากค่าไม่ตรงกับฐานข้อมูลจะส่งกลับ `409 Conflict` และฝั่ง UI จะต้องไม่ล้างค่าฟอร์มที่ผู้ใช้พิมพ์ค้างไว้
- **BR-11 & BR-18 (Terminal Ticket Protection & Reassignment Guards):** ตั๋วที่มีสถานะ `CANCELLED` จะไม่อนุญาตให้เพิ่ม/แก้ไข Action, เปลี่ยนสถานะ หรือ Reassign เจ้าของ โดยจะส่งกลับ `400 Bad Request` เสมอ

## 3.2 Design System Tokens (Zen Green)

| Token Name | Computed Value | Architectural Purpose |
| :--- | :--- | :--- |
| `--zg-primary` | `#006B3C` | สีหลักประจำแบรนด์ สำหรับปุ่ม Action หลัก, ส่วนหัว และ Active Indicator |
| `--zg-bg-page` | `#F5F7F6` | สีพื้นหลังหน้าจอ สบายตา สะอาดตาตามสไตล์ Apple Minimalist |
| `--zg-surface` | `#FFFFFF` | สีพื้นหลังของการ์ดตัวชี้วัด (Metric Cards), Modal และตารางข้อมูล |
| `--zg-border` | `#E2E8F0` | สีเส้นขอบมาตรฐานสำหรับ Card และ Input Fields |
| `--zg-warning` | `#D97706` | สี Accent เตือนสำหรับคิวงานที่ต้องติดตามผล และแถบเส้นขอบการ์ด |
| `--zg-danger` | `#DC2626` | สีข้อความแจ้งเตือนข้อผิดพลาด และการเน้นลำดับความสำคัญ Urgent |

---

# Part 4: Core Implementation & Business Logic Rules

## 4.1 Schema Evolution & Non-Destructive Migration
แบบจำลองข้อมูล `ActionTaken` ถูกสร้างขึ้นโดยเชื่อมโยงแบบ Many-to-One กับ `Ticket` (Cascade Delete เมื่อตั๋วถูกลบ) และ `User` (Restrict Delete ป้องกันการลบผู้ใช้ที่มีประวัติบันทึกงาน):
```prisma
model ActionTaken {
  id                 String    @id @default(uuid())
  ticketId           String
  ticket             Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime     DateTime  @default(now())
  actionDescription  String    @db.VarChar(2000)
  performedById      String
  performedBy        User      @relation(fields: [performedById], references: [id], onDelete: Restrict)
  result             String    @db.VarChar(2000)
  isFollowUpRequired Boolean   @default(false)
  followUpNote       String?   @db.VarChar(2000)
  attachmentNotes    String?   @db.VarChar(500)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([ticketId, actionDateTime])
  @@index([performedById])
}
```

## 4.2 Optimistic Concurrency Control (OCC) Implementation
การปรับปรุงข้อมูลสถานะตั๋วใช้การ Query แบบ Conditional Update เพื่อรับประกันว่า timestamp มีการเปลี่ยนแปลงแบบ Monotonic เสมอ:
```typescript
// server/src/routes/ticketWorkflow.ts
const expectedDate = new Date(expectedUpdatedAt);
const now = new Date();
const nextUpdatedAt = new Date(Math.max(now.getTime(), expectedDate.getTime() + 1));

const updateResult = await prisma.ticket.updateMany({
  where: { id: ticketId, updatedAt: expectedDate },
  data: {
    currentStatus: targetStatus,
    resolutionSummary: targetStatus === "RESOLVED" ? resolutionSummary : undefined,
    updatedAt: nextUpdatedAt,
  },
});

if (updateResult.count === 0) {
  const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  return res.status(409).json({
    error: "STALE_UPDATE_CONFLICT",
    message: "Ticket has been modified by another user. Please refresh and review latest state.",
    currentUpdatedAt: currentTicket?.updatedAt.toISOString(),
  });
}
```

## 4.3 Resolution Gate & Advisory Feedback
- **Requester Advisory Flow:** เมื่อ Requester กด "Problem Appears Resolved" ระบบจะเรียก `PATCH /api/requester/tickets/:id/resolve-indication` ซึ่งตั้งค่า `problemAppearsResolved: true` โดยที่ `currentStatus` ของตั๋วยังคงเดิมทุกประการ
- **Server Enforcement:** เมื่อ IT Staff ทำการเปลี่ยนสถานะสู่ `RESOLVED` ระบบจะตรวจสอบจำนวน `ActionTaken`:
```typescript
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

# Part 5: UI Design System & Responsive Layout Walkthrough

## 5.1 Responsive Strategy across 3 Viewports
- **Desktop (1280px):** แสดงการ์ดตัวชี้วัดแถวละ 5 คอลัมน์ (`grid-template-columns: repeat(5, 1fr)`), ตารางรายการประวัติ Actions Taken เต็มรูปแบบ พร้อม Action Buttons ทางขวา
- **Tablet (768px):** ปรับการ์ดตัวชี้วัดเป็น 2–3 คอลัมน์แบบยืดหยุ่น, ตารางห่อหุ้มใน `.table-responsive` เพื่อแยกการเลื่อนเฉพาะตาราง ไม่ให้ดันหน้าจอหลักแตก
- **Mobile (375px):** ยุบการ์ดตัวชี้วัดเป็นคอลัมน์เดี่ยว 1fr, ตารางประวัติ Actions Taken แสดงเป็นการ์ดสรุปย่อย, และบังคับขนาด Touch Target ปุ่มกด $\ge 44\text{px}$ ตามมาตรฐาน WCAG 2.1 AAA

## 5.2 Visual Screenshot Artifacts (17 Deliverables)

### หมวดหมู่ที่ 1: Actions Taken UI (`artifacts/lab-04/screenshots/actions-taken/`)
1. `01-actions-taken-list-staff.png`: รายการ Actions Taken สำหรับ IT Staff แสดงประวัติเรียงตามเวลา
2. `02-actions-taken-modal-create.png`: Modal บันทึก Action ใหม่ แสดง Performer อัตโนมัติจาก Session
3. `03-actions-taken-validation-error.png`: แสดงข้อความเตือนเมื่อเลือก Follow-up Required แต่กรอก Note < 3 ตัวอักษร
4. `04-actions-taken-edit-modal.png`: Modal แก้ไข Action Taken ที่บันทึกไว้
5. `05-actions-taken-requester-readonly.png`: มุมมอง Requester ตรวจสอบประวัติ Actions Taken แบบอ่านอย่างเดียว (ไม่มีปุ่ม Add/Edit)

### หมวดหมู่ที่ 2: Requester Dashboard (`artifacts/lab-04/screenshots/requester-dashboard/`)
6. `01-requester-dashboard-desktop.png`: หน้าแดชบอร์ด Requester บน Desktop (5 การ์ดตัวชี้วัด, ตั๋วล่าสุด, Quick Actions)
7. `02-requester-dashboard-tablet.png`: หน้าแดชบอร์ด Requester บน Tablet (768px)
8. `03-requester-dashboard-mobile.png`: หน้าแดชบอร์ด Requester บน Mobile (375px) การ์ดเรียง 1fr ไม่มี Scroll แนวนอน
9. `04-requester-dashboard-drilldown.png`: ผลการคลิกการ์ดตัวชี้วัดเพื่อ Drill-down สู่ตาราง My Tickets ที่กรองสถานะไว้ล่วงหน้า

### หมวดหมู่ที่ 3: IT Staff Dashboard (`artifacts/lab-04/screenshots/staff-dashboard/`)
10. `01-staff-dashboard-desktop.png`: หน้าแดชบอร์ด IT Staff บน Desktop แสดง 5 การ์ดคิวงาน, สถิติตามสถานะ และ Priority
11. `02-staff-dashboard-tablet.png`: หน้าแดชบอร์ด IT Staff บน Tablet (768px)
12. `03-staff-dashboard-mobile.png`: หน้าแดชบอร์ด IT Staff บน Mobile (375px)
13. `04-staff-dashboard-drilldown.png`: ผลการคลิกการ์ดตัวชี้วัดเพื่อ Drill-down สู่ตารางคิวงาน Staff Queue ตามเงื่อนไข

### หมวดหมู่ที่ 4: Administrator Dashboard (`artifacts/lab-04/screenshots/admin-dashboard/`)
14. `01-admin-dashboard-desktop.png`: หน้าแดชบอร์ด Admin บน Desktop แสดงภาพรวมระบบ, สถิติผู้ใช้ และ Quick Actions
15. `02-admin-dashboard-tablet.png`: หน้าแดชบอร์ด Admin บน Tablet (768px)
16. `03-admin-dashboard-mobile.png`: หน้าแดชบอร์ด Admin บน Mobile (375px)
17. `04-admin-dashboard-drilldown.png`: ผลการคลิกการ์ดสถิติผู้ใช้เพื่อ Drill-down สู่หน้าระบบจัดการผู้ใช้งาน User Management

---

# Part 6: Automated Testing Pyramid & Verification Matrix

## 6.1 Planned Test Matrix Verification (53/53 Planned Tests Passed)
การทดสอบครอบคลุมทั้ง 7 Testing Tiers ตามสัญญาใน `docs/lab-04/tests.md`:
1. **Unit Tests (4 tests):** `UNIT-01` (Follow-up Validation), `UNIT-02` (Status Transition Matrix), `UNIT-03` (OCC Comparator), `UNIT-04` (Dashboard Calculator) $\rightarrow$ **100% Passed**
2. **API & Perf Smoke Tests (21 tests):** `API-01` ถึง `API-17`, `PERF-SMOKE-01` (Latency < 300ms) $\rightarrow$ **100% Passed**
3. **Database Migration & Seed Tests (3 tests):** `MIG-01` (Deploy & Preserve), `MIG-02` (Rollback Recovery Simulation), `SEED-01` (Idempotent 5-Dimension Seed) $\rightarrow$ **100% Passed**
4. **Workflow Tests (3 tests):** `WF-01` (Resolution Gate), `WF-02` (Advisory Indication), `WF-03` (Multi-step Lifecycle) $\rightarrow$ **100% Passed**
5. **UI Component Tests (13 tests):** `UI-01a` ถึง `UI-08`, `UI-04b`, `UI-EMPTY-01`, `UI-STYLE-01` $\rightarrow$ **100% Passed**
6. **E2E Playwright Tests (6 tests):** `E2E-01` (Actions Taken Flow), `E2E-02` (Resolution Flow), `E2E-03a` (Dashboards Drill-down), `E2E-03b` (Quick Actions), `E2E-04` (Responsive Audit), `A11Y-01` (Modal Focus & A11y) $\rightarrow$ **100% Passed**
7. **Regression Suites (3 suites):** `REG-01` (Server Regression: 298 tests), `REG-02` (Client Regression: 162 tests), `REG-03` (E2E Regression: 27 tests) $\rightarrow$ **100% Passed**

## 6.2 Raw Terminal Verification Outputs

### Server Test Suite (Unit, API, DB, Regression — Supertest + Vitest)
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

### Client Test Suite (Vitest + React Testing Library)
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

### Playwright End-to-End Suite (Lab 4 & Regression)
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

# Part 7: Peer Code Review Records & Collaboration Analysis

## 7.1 Pull Requests Authored by Penwatsa (@Phenwatsa)
- **PR #59 (Issue 20: Spec DD):** ได้รับข้อเสนอแนะเรื่องความชัดเจนของ Authentication contract, ความสอดคล้องของเกณฑ์ $\ge 3$ ตัวอักษรสำหรับ Follow-up Note, และการเพิ่ม Migration Rollback Strategy $\rightarrow$ ดำเนินการปรับแก้และได้รับ **Approved**
- **PR #60 (Issue 21: Migration & Actions Taken API):** ได้รับข้อเสนอแนะให้เพิ่มการตรวจสอบ PATCH type safety สำหรับ `isFollowUpRequired` และ RFC 3339 date format $\rightarrow$ เพิ่ม API negative tests และได้รับ **Approved**
- **PR #61 (Issue 22: Ticket Workflow & Resolution Gate):** ตรวจสอบ Resolution Gate, State transition matrix, และ Optimistic Concurrency Control $\rightarrow$ **Approved**
- **PR #62 (Issue 23: Actions Taken UI):** ตรวจสอบ Actions Taken list/modal, Requester read-only view, Focus restoration และ OCC input preservation $\rightarrow$ **Approved**
- **PR #63 (Issue 24: Dashboard APIs):** ตรวจสอบ Dashboard metrics APIs สำหรับ 3 บทบาท, Performance smoke test (< 300ms) และ RBAC isolation $\rightarrow$ **Approved**
- **PR #64 (Issue 25: Dashboard UI):** ได้รับข้อเสนอแนะให้ขยายการตรวจ Computed Style ของ badge ให้ครบทั้ง 8 สถานะ (รวม `REOPENED`) $\rightarrow$ ดำเนินการเพิ่ม assertion จนได้รับ **Approved**
- **PR #65 (Issue 26: E2E & Responsive Audit):** ผ่านการรีวิวเข้มข้น 4 รอบ ครอบคลุม:
  - *Cycle 1:* เพิ่ม Database ground truth assertions สำหรับ metrics และ Touch Target $\ge 44\text{px}$
  - *Cycle 2:* ขยาย `assertNoControlCollisions()` ให้ครอบคลุม form controls (`input`, `select`, `textarea`) และเพิ่มการตรวจ vertical text clipping
  - *Cycle 3:* ปรับปรุงชุด E2E Regression ให้รันทั้ง Lab 2 (3 tests ใต้ระบบ Auth ใหม่) และ Lab 3 (24 tests)
  - *Cycle 4:* ผ่านการอนุมัติ **Approved** สมบูรณ์แบบ 100%
- **Issue 27 (Release Integration & Handover):** รวบรวมเอกสาร, บันทึกการรีวิว, สรุปผลการทดสอบ และจัดเตรียมรายงาน 9 ส่วนสำหรับส่งมอบ (In Progress / Documentation Phase)

## 7.2 Pull Requests Reviewed for Partner Phirada (@lephirada)
- **PR #50 (Issue 18: Spec & Test Plan):** ตรวจพบข้อขัดแย้งเรื่อง `resolutionIndicated` (ต้องไม่เปลี่ยนสถานะตั๋ว), `performedAt` ห้ามเป็นเวลาในอนาคต, และขอบเขตการคำนวณ Dashboard metrics $\rightarrow$ เพื่อนดำเนินการแก้ไขครบถ้วน และให้คำรับรอง **Approved**
- **PR #51 (Issue 19: Migration & Seed):** ตรวจสอบ ActionTaken Prisma model, Foreign key deletion constraints (Cascade vs Restrict) และ Seed 5 มิติ $\rightarrow$ **Approved**
- **PR #52 (Issue 20: Actions Taken Backend):** ให้ข้อเสนอแนะเรื่อง Concurrency token reliability (การรับประกันว่า timestamp มีการ advance เสมอ) และการตรวจสอบความยาว Follow-up note $\rightarrow$ เพื่อนทำการแก้ไขและให้ **Approved**
- **PR #53 (Issue 21: Resolution Gate):** ตรวจพบ Error code ไม่ตรงตามสัญญา (`RESOLUTION_ACTION_REQUIRED` แทนที่จะเป็น `ACTION_TAKEN_REQUIRED_FOR_RESOLUTION`) $\rightarrow$ เพื่อนทำการปรับแก้โค้ดและชื่อไฟล์ทดสอบจนถูกต้อง และให้ **Approved**
- **PR #55 (Issue 22: Dashboard APIs):** ตรวจสอบ Endpoint แดชบอร์ด, Rolling 7-day window, และ Priority calculation $\rightarrow$ **Approved**
- **PR #56 (Issue 23: Actions Taken UI):** ตรวจสอบการผสาน ActionsTakenSection เข้ากับ Ticket Detail ทั้ง Requester และ Staff $\rightarrow$ **Approved**
- **PR #57 (Issue 24: Dashboard UI):** ตรวจสอบการแสดงผลแดชบอร์ดทั้ง 3 บทบาท, Quick Actions และ Drill-down navigation $\rightarrow$ **Approved**
- **PR #58 (Issue 25: E2E & Responsive Audit):** ตรวจสอบ Playwright E2E suites, การตรวจ DB ground truth, Control collisions, และ Screenshot ทั้ง 17 ภาพ $\rightarrow$ **Approved**

---

# Part 8: AI-Assisted Development & Reflection

## 8.1 Summary of 10 Key AI Prompts
1. **Prompt 1 (Sprint Breakdown):** วิเคราะห์ข้อกำหนด Lab 4 และวางแผนแตก 8 GitHub Issues (Issue 20 ถึง 27) พร้อมขอบเขต In/Out of scope
2. **Prompt 2 (Spec DD Contracts):** ร่างสัญญาวิศวกรรมซอฟต์แวร์ `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`
3. **Prompt 3 (Spec Reconciliation):** ปรับจูนสัญญาตามข้อเสนอแนะของคู่ตรวจ (Auth JWT, $\ge 3$ chars, Migration rollback)
4. **Prompt 4 (Migration & Actions Taken API):** พัฒนา Prisma Schema, Migration, Seed 5 มิติ และ REST APIs สำหรับ Actions Taken
5. **Prompt 5 (Ticket Workflow & Resolution Gate):** พัฒนาระบบตรวจสอบ 8 สถานะ, Resolution Gate และ Optimistic Concurrency Control
6. **Prompt 6 (Actions Taken UI):** พัฒนา ActionsTakenSection, Modal, Validation, OCC state preservation และ Requester read-only view
7. **Prompt 7 (Dashboard APIs):** พัฒนา REST APIs คำนวณตัวชี้วัดแดชบอร์ด 3 บทบาท พร้อม Performance Smoke Test (< 300ms)
8. **Prompt 8 (Dashboard UI):** พัฒนาหน้าจอแดชบอร์ด Requester, IT Staff และ Admin พร้อม Quick Actions และ Drill-down
9. **Prompt 9 (E2E & Responsive Audit):** พัฒนา Playwright E2E suites, ตรวจสอบ Responsive Invariants ข้าม 3 Viewports, ตรวจ DB Ground Truth, และบันทึก Screenshot 17 ภาพ
10. **Prompt 10 (Release & Documentation):** รวบรวมผลการทดสอบ, บันทึก Peer Review สองทาง, เขียนบทสะท้อน AI และจัดทำ Final Report 9 ส่วน

## 8.2 My Reflection (บทสะท้อนการเรียนรู้)
1. **คุณค่าของ Spec-Driven Development (Spec DD):** ใน Sprint 4 ที่มีความซับซ้อนของสถานะตั๋วและบทบาทผู้ใช้สูง การมีเอกสารสเปกที่ชัดเจนช่วยป้องกันความผิดพลาดระดับสถาปัตยกรรมได้อย่างสมบูรณ์ โดยเฉพาะเรื่อง Resolution Gate ที่แยกขาดระหว่าง Requester Advisory และ Staff Formal Resolution
2. **AI ในฐานะ Pair Programmer คุณภาพสูง:** AI ทำหน้าที่เป็นทั้งผู้ช่วยเขียนโค้ดและผู้ช่วยตรวจสอบ (Reviewer) โดยช่วยคิด Edge Cases ทางเทคนิคที่ซับซ้อน เช่น การจัดการ Timestamp Rollover, การดักจับ Layout Collisions ในระดับ DOM และการเขียน Playwright Locator ที่ทนทานต่อการเปลี่ยนแปลง
3. **การรักษา Human Authority และ Git Discipline:** แม้ AI จะสามารถสร้างโค้ดได้อย่างรวดเร็ว แต่วิศวกรมนุษย์จะต้องเป็นผู้ถือสิทธิ์ขาดในการตัดสินใจทางสถาปัตยกรรม ตรวจสอบโค้ดทุกบรรทัด และเป็นผู้ควบคุมคำสั่ง Git (Commit, Push, Merge) ด้วยตนเองเพื่อรักษาความปลอดภัยและความถูกต้องของ Repository
4. **การทำงานร่วมกันแบบสามเส้า (Developer - AI - Peer Reviewer):** วงจรการรีวิวร่วมกับคุณภิรดา (@lephirada) เป็นกลไกประกันคุณภาพที่แท้จริง ข้อคิดเห็นในแต่ละรอบช่วยผลักดันให้ซอฟต์แวร์มีความแข็งแกร่ง ประณีต และเป็นไปตามมาตรฐานวิศวกรรมซอฟต์แวร์ระดับสากล

---

# Part 9: Release Management & Sprint Retrospective

## 9.1 Release Management & Verification
- รวมโค้ดทุก Feature Branch เข้าสู่ `lab4-staging` ผ่าน Pull Request ที่ได้รับการตรวจสอบและ Approved ครบทั้ง 8 Issues
- ดำเนินการรัน Automated Test Suite ครบถ้วน: Server Tests (298 ข้อ), Client Tests (162 ข้อ), Lab 4 E2E (14 ข้อ) และ E2E Regression (27 ข้อ) รวม **501 ข้อผ่าน 100%**
- ตรวจสอบ Production Build (`npm run build`) ผ่านฉลุย 0 Errors
- ดำเนินการเปิด Release Pull Request จาก `lab4-staging` เข้าสู่ `main` สำหรับการส่งมอบระบบอย่างเป็นทางการ

## 9.2 Sprint Retrospective
- **What Went Well (สิ่งที่ทำได้ดี):**
  - การวางแผนงานแบบ Spec DD ทำให้การพัฒนาโค้ดราบรื่นและมีทิศทางที่ชัดเจน
  - การทำ Test Automation ครอบคลุมทั้ง Unit, API, Component, E2E และ Regression ทำให้มั่นใจได้ว่าระบบไม่มีบั๊กตกหล่น
  - การทำงานร่วมกันกับ Peer Reviewer มีการสื่อสารที่ดี แลกเปลี่ยนความคิดเห็นเชิงเทคนิคที่เป็นประโยชน์อย่างยิ่ง
- **What Could Be Improved (สิ่งที่ปรับปรุงได้):**
  - การจัดการ Regression Test ของ Lab ก่อนหน้า ควรออกแบบโครงสร้างชุดทดสอบให้รองรับการ Authentication ตั้งแต่วันแรก เพื่อลดภาระในการ Migrate ในช่วง Regression
- **Overall Conclusion:** TokTickIT ใน Sprint 4 ประสบความสำเร็จในการส่งมอบคุณภาพระดับ Enterprise มีสถาปัตยกรรมที่มั่นคง มีความปลอดภัยของข้อมูล และมีหลักฐานการทดสอบยืนยันความถูกต้องอย่างครบถ้วนสมบูรณ์
