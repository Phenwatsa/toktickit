# TokTickIT (ตอกติ๊กไอที) — Lab 2 Individual Sprint Report
## Full-Stack IT Service Desk Ticketing MVP & Zen Green Foundation

---

**Course:** CPE334 Software Engineering / Full-Stack Development Laboratory  
**Sprint / Assignment:** Lab 2 — Requester Ticketing MVP & Multi-Tenant Data Isolation  
**Author:** Penwatsa Saengyenpan (รหัสนักศึกษา: 67070503431) — GitHub: [@Phenwatsa](https://github.com/Phenwatsa)  
**Peer Reviewer:** Phirada Lekpaeng (รหัสนักศึกษา: 67070503491) — GitHub: [@lephirada](https://github.com/lephirada)  
**Author Repository:** `https://github.com/Phenwatsa/toktickit.git`  
**Partner Repository:** `https://github.com/lephirada/toktickit.git`  
**Date:** September 6, 2026  

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
TokTickIT (ตอกติ๊กไอที) เป็นเว็บแอปพลิเคชันระบบ IT Service Desk สำหรับองค์กรที่พัฒนาขึ้นเพื่อจัดการคำขอรับบริการด้านไอทีอย่างเป็นระบบ ใน Sprint 2 (Lab 2) ได้มุ่งเน้นการพัฒนา **Requester-Facing Ticketing MVP** ซึ่งประกอบด้วย:
- **Development Requester Context:** ระบบจำลองผู้ใช้งานและสลับตัวตนตามฐานข้อมูล PostgreSQL เพื่อทดสอบการแบ่งแยกสิทธิ์
- **Ticket Creation System:** ฟอร์มสร้างคำขอพร้อมการตรวจสอบข้อมูล (Validation), การสร้างเลขตั๋วอัตโนมัติ (`TKT-YYYY-NNNNNN`), และการแนบไฟล์ล่วงหน้า
- **My Tickets Dashboard:** ตารางรายการตั๋วของผู้ใช้งาน พร้อมระบบค้นหา, ตัวกรองหลายเงื่อนไข, การเรียงลำดับ และการแบ่งหน้า (Pagination)
- **Ticket Detail & Attachment Lifecycle:** หน้าตรวจสอบรายละเอียดตั๋วแบบอ่านอย่างเดียว และวงจรชีวิตไฟล์แนบ (Upload, Download, Soft-Removal พร้อมบันทึกเหตุผล และการบล็อกดาวน์โหลดด้วย HTTP 410 Gone)
- **Multi-Tenant Ownership Isolation:** การป้องกันการเข้าถึงข้อมูลข้ามผู้ใช้งานอย่างเข้มงวดทั้งในระดับ API (`X-Requester-Id`) และ UI
- **Zen Green Design System:** การออกแบบส่วนติดต่อผู้ใช้ที่เข้าถึงง่าย (Accessible) และรองรับ Responsive ครบ 3 รูปแบบ (Desktop, Tablet, Mobile) โดยไม่มีการเลื่อนในแนวนอน (Zero Horizontal Overflow)

## 1.2 Full-Stack Architecture Matrix

| Layer | Technology | Key Libraries / Frameworks | Purpose & Architectural Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | React 18, TypeScript | Vite, React Router, Custom CSS Modules | Single Page Application (SPA), จัดการ State ของฟอร์ม, แสดงผล Feedback/Loading/Error, และควบคุม Responsive Layout |
| **Backend API** | Node.js, TypeScript | Express.js, Multer, Zod Validation | RESTful API Endpoints, ตรวจสอบ Payload, ออกเลขตั๋วที่ไม่ซ้ำ, จัดการไฟล์แนบ และควบคุมสิทธิ์การเข้าถึงข้อมูลตาม `X-Requester-Id` |
| **Database & ORM** | PostgreSQL | Prisma ORM, Prisma Client | จัดเก็บข้อมูลเชิงสัมพันธ์, Schema Migrations, บังคับใช้ Foreign Keys/Constraints, และ Idempotent Database Seeding |
| **Testing Suite** | Vitest, Playwright | Supertest, React Testing Library | Full Test Pyramid: Unit tests, REST API Integration tests, Component UI tests, และ Cross-Viewport E2E Browser Automation |

---

# Part 2: GitHub Project, Issue Decomposition & PR Traceability

การพัฒนายึดหลักการทำงานแบบ Git Discipline อย่างเคร่งครัด โดยแบ่งงานออกเป็น 7 GitHub Issues (#5 ถึง #11) และทำการแตกกิ่ง Feature Branch ออกจาก `lab2-staging` เมื่อพัฒนาและทดสอบเสร็จสิ้น จะทำการเปิด Pull Request พร้อมแนบหลักฐานการทดสอบและส่งให้ Peer Reviewer ตรวจสอบก่อน Merge

## 2.1 Issue & PR Mapping Table

| Issue # | Issue Title | Feature Branch | Pull Request | Reviewer Verdict | Target Branch |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **#5** | Sprint Specification and Test Plan (Spec DD) | `docs/lab2-spec-and-test-plan` | [PR #26](https://github.com/Phenwatsa/toktickit/pull/26) | **Approved** | `lab2-staging` |
| **#6** | Development Requester Context & Seed Data | `feature/1-requester-context` | [PR #27](https://github.com/Phenwatsa/toktickit/pull/27) | **Approved** | `lab2-staging` |
| **#7** | Ticket Creation & Zen Green Form Foundation | `feature/2-ticket-creation` | [PR #28](https://github.com/Phenwatsa/toktickit/pull/28) | **Approved** | `lab2-staging` |
| **#8** | My Tickets List Screen & Filtering | `feature/3-my-tickets` | [PR #29](https://github.com/Phenwatsa/toktickit/pull/29) | **Approved** | `lab2-staging` |
| **#9** | Ticket Detail, Attachment Upload & Soft-Removal | `feature/4-ticket-detail-attachments` | [PR #30](https://github.com/Phenwatsa/toktickit/pull/30) | **Approved** | `lab2-staging` |
| **#10** | End-to-End Testing & Responsive Polish | `feature/5-e2e-and-responsive` | [PR #31](https://github.com/Phenwatsa/toktickit/pull/31) | **Approved** | `lab2-staging` |
| **#11** | Release Integration & Final Documentation | `docs/lab2-documentation` | PR #32 | **Ready** | `lab2-staging` $\rightarrow$ `main` |

---

# Part 3: Spec-Driven Development (Spec DD) Engineering Contracts

การพัฒนาใน Sprint 2 ยึดหลัก Spec DD โดยมีการร่างข้อกำหนดทางวิศวกรรม (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) เป็นสัญญาร่วมกันก่อนเริ่มเขียนโค้ด

## 3.1 Functional Requirements (FR) & Business Rules (BR) Summary
- **FR-01 to FR-03:** การโหลดรายชื่อ Active Requester, หมวดหมู่คำขอ (Categories) 4 กลุ่ม, และระบบที่เกี่ยวข้อง (Related Systems) 6 ระบบ
- **FR-04 to FR-05 (Ticket Creation):** สร้างคำขอโดยระบุ Category, Related System, Priority (P0-P3), Summary (5-100 ตัวอักษร), Description (10-2,000 ตัวอักษร) พร้อมสถานะเริ่มต้นเป็น `NEW`
- **FR-06 to FR-08 (My Tickets):** แสดงเฉพาะตั๋วที่เป็นของตนเอง รองรับการค้นหาคำสำคัญ, กรองตามสถานะ/หมวดหมู่/ความสำคัญ, จัดเรียงคอลัมน์ และแบ่งหน้า
- **FR-09 to FR-12 (Detail & Attachments):** แสดงรายละเอียดตั๋วแบบอ่านอย่างเดียว, อัปโหลดไฟล์แนบสูงสุด 5 ไฟล์ต่อตั๋ว (ไฟล์ละไม่เกิน 5 MB, รองรับ JPG/PNG/WEBP/PDF), และการทำ Soft-Removal พร้อมบันทึกเหตุผล
- **BR-05 (Ownership Protection):** ป้องกันไม่ให้ Requester เข้าถึงหรือดูตั๋วของผู้อื่นโดยเด็ดขาด หากพยายามเข้าถึงจะได้รับ HTTP 403 Forbidden หรือ 404 Not Found
- **BR-08 (Safe Error State):** หากการส่งฟอร์มไม่สำเร็จ ข้อมูลที่ผู้ใช้กรอกและไฟล์ที่แนบไว้จะต้องไม่สูญหาย
- **BR-10 (Attachment Retention & 410 Gone):** ไฟล์แนบที่ถูก Soft-remove จะคงอยู่ในฐานข้อมูลและ Disk แต่จะถูกปิดกั้นการดาวน์โหลดด้วย HTTP 410 Gone

## 3.2 Zen Green Design System Tokens

| Design Token | Hex Code | Purpose & Usage in Application |
| :--- | :--- | :--- |
| **Primary Color** | `#006B3C` | สีหลักสำหรับปุ่ม Submit, แถบ Navigation Active, และ Header Brand Icon |
| **Secondary Accent** | `#0B7A46` | สีปุ่ม Hover, Secondary Badges, และการเน้นหัวข้อย่อย |
| **Pale Green Tint** | `#EAF6EF` | สีพื้นหลังสำหรับสถานะ NEW, Active Chips, และ Card Highlights |
| **Page Background** | `#F5F7F6` | สีพื้นหลังมาตรฐานของทุกหน้าจอ ให้ความรู้สึกสบายตา สะอาดตา |
| **Text Primary** | `#1A202C` | สีตัวอักษรหลักเพื่อ Contrast ที่คมชัดและอ่านง่ายตามมาตรฐาน Accessibility |
| **Error / Alert** | `#DC2626` | สีแสดงข้อความแจ้งเตือนข้อผิดพลาดใต้ช่อง Input และ Alert Banners |

---

# Part 4: Core Implementation & Business Logic Rules

## 4.1 Multi-Tenant Data Isolation (`X-Requester-Id`)
ระบบใช้ Middleware ตรวจสอบ HTTP Header `X-Requester-Id` ในทุก Request ที่เกี่ยวข้องกับข้อมูลตั๋ว:
- ใน API `GET /api/tickets`: Query จะทำการกรอง `where: { requesterId: currentRequesterId }` เสมอ
- ใน API `GET /api/tickets/:id`: หากพบตั๋วแต่ `ticket.requesterId !== currentRequesterId` เซิร์ฟเวอร์จะตัดสิทธิ์และส่งกลับ HTTP 403 Forbidden ทันที ป้องกันการเจาะดูข้อมูลข้ามบัญชี

## 4.2 Unique Ticket Number Generation
หมายเลขตั๋วสร้างขึ้นผ่านฟังก์ชันที่รับประกันความไม่ซ้ำกันในรูปแบบ `TKT-YYYY-NNNNNN`:
```typescript
// server/src/services/ticketNumberService.ts
const year = new Date().getFullYear();
const count = await prisma.ticket.count({
  where: { ticketNumber: { startsWith: `TKT-${year}-` } }
});
const sequence = String(count + 1).padStart(6, "0");
const ticketNumber = `TKT-${year}-${sequence}`;
```

## 4.3 Safe Form State & Attachment Management
- **Client-Side Validation:** ตรวจสอบความถูกต้องของข้อมูลทันทีเมื่อกด Submit โดยแสดงข้อความสีแดงใต้ช่อง Input ที่ผิดพลาด พร้อมโฟกัสช่องแรกที่พบปัญหา
- **Submit Busy State:** ในระหว่างที่กำลังส่ง Request ปุ่ม Submit จะเปลี่ยนสถานะเป็น Disabled พร้อมแสดงไอคอน Loading Spinner เพื่อป้องกันการกดซ้ำ (Double Submission)
- **Attachment Soft-Removal:** เมื่อผู้ใช้ทำการลบไฟล์ ระบบจะเปิด Modal ให้กรอกเหตุผล จากนั้นส่ง Request `DELETE /api/tickets/:id/attachments/:attachmentId` เพื่อตั้งค่า `isRemoved: true` และ `removalReason: reason` โดยไม่มีการลบ Record หรือไฟล์จริงออกจากดิสก์

---

# Part 5: UI Design System & Responsive Layout Walkthrough

## 5.1 Responsive Strategy (Desktop, Tablet, Mobile)
- **Desktop Viewport ($\ge 992\text{px}$):** แสดงผลตาราง My Tickets เต็มรูปแบบ 9 คอลัมน์ พร้อม Header Menu แนวนอน และฟอร์มสร้างตั๋วแบบ 2 คอลัมน์ Grid
- **Tablet Viewport ($768\text{px} - 991\text{px}$):** ปรับขนาดตารางให้กระชับ เพิ่ม Touch Target ของปุ่มให้อย่างน้อย 44px
- **Mobile Viewport ($< 768\text{px}$):** แปลงตาราง My Tickets เป็น **Responsive Card Layout (`zg-mobile-card`)** เรียงต่อกันในแนวตั้ง พร้อมจัดฟอร์มเป็น Single Column เพื่อรับประกัน **Zero Horizontal Scroll**

## 5.2 Deliverable Screenshots Mapping

| # | Deliverable Screenshot Path | Viewport | Key Verification Highlight |
| :- | :--- | :--- | :--- |
| 1 | `artifacts/lab-02/screenshots/01-requester-selector.png` | Desktop | หน้าต่างเลือกตัวตน Active Requester พร้อมแสดงข้อมูลตำแหน่งและรูปโปรไฟล์ |
| 2 | `artifacts/lab-02/screenshots/02-create-ticket-desktop.png` | Desktop ($1280\times800$) | ฟอร์มสร้างตั๋วแบบ 2 คอลัมน์ พร้อม Dropdown หมวดหมู่ และพื้นที่แนบไฟล์ |
| 3 | `artifacts/lab-02/screenshots/02-create-ticket-tablet.png` | Tablet ($768\times1024$) | ฟอร์มสร้างตั๋วบนแท็บเล็ต จัดเลย์เอาต์สมดุล Touch-friendly |
| 4 | `artifacts/lab-02/screenshots/02-create-ticket-mobile.png` | Mobile ($375\times667$) | ฟอร์มสร้างตั๋วบนมือถือ เรียงคอลัมน์เดี่ยว ไม่มี Scroll แนวนอน |
| 5 | `artifacts/lab-02/screenshots/03-my-tickets-desktop.png` | Desktop ($1280\times800$) | ตารางตั๋ว 9 คอลัมน์ แสดง Badge สถานะ Zen Green และ Pagination |
| 6 | `artifacts/lab-02/screenshots/03-my-tickets-tablet.png` | Tablet ($768\times1024$) | ตารางตั๋วบนแท็บเล็ต ปรับความกว้างคอลัมน์อัตโนมัติ |
| 7 | `artifacts/lab-02/screenshots/03-my-tickets-mobile.png` | Mobile ($375\times667$) | เลย์เอาต์แบบการ์ด (`zg-mobile-card`) แสดงข้อมูลตั๋วครบถ้วนบนมือถือ |
| 8 | `artifacts/lab-02/screenshots/06-ticket-detail-desktop.png` | Desktop ($1280\times800$) | หน้ารายละเอียดตั๋วแบบอ่านอย่างเดียว แสดงไฟล์แนบและปุ่มดาวน์โหลด |
| 9 | `artifacts/lab-02/screenshots/06-ticket-detail-tablet.png` | Tablet ($768\times1024$) | หน้ารายละเอียดตั๋วบนแท็บเล็ต |
| 10 | `artifacts/lab-02/screenshots/06-ticket-detail-mobile.png` | Mobile ($375\times667$) | หน้ารายละเอียดตั๋วบนมือถือ |
| 11 | `artifacts/lab-02/screenshots/07-attachment-soft-remove-modal.png` | Desktop | Modal ยืนยันการ Soft-Remove ไฟล์แนบพร้อมช่องกรอกเหตุผล |
| 12 | `artifacts/lab-02/screenshots/08-ticket-detail-soft-removed.png` | Desktop | สถานะหลัง Soft-remove แสดง Badge "Removed", เหตุผล และบล็อกดาวน์โหลด |

---

# Part 6: Automated Testing Pyramid & Verification Matrix

## 6.1 Planned Test Matrix & Results

| Test ID | Level | Traced AC | Scenario & Objective | Result |
| :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | AC-01, FR-04 | สร้างตั๋วถูกต้อง ออกเลข `TKT-YYYY-NNNNNN` บันทึกลง DB สำเร็จ (HTTP 201) | **Passed** |
| **API-02** | API | AC-02, BR-06 | ปฏิเสธการสร้างตั๋วเมื่อข้อมูลไม่ครบถ้วน (HTTP 400 Validation Error) | **Passed** |
| **API-03** | API | AC-05, FR-06 | ดึงรายการตั๋วเฉพาะของผู้ใช้งานตนเอง พร้อม Metadata Pagination | **Passed** |
| **API-04** | API | AC-05, BR-05 | แยกข้อมูลระหว่าง Requester A และ B อย่างเด็ดขาด (Tenant Isolation) | **Passed** |
| **API-05** | API | AC-07, FR-07 | ค้นหาและกรองตั๋วตามคำสำคัญ, หมวดหมู่ และสถานะ | **Passed** |
| **API-06** | API | AC-06, BR-05 | ดูรายละเอียดตั๋วที่เป็นของตนเอง (HTTP 200 พร้อม Attachments) | **Passed** |
| **API-07** | API | AC-06, BR-05 | ป้องกันการดูตั๋วของผู้อื่น (HTTP 403/404 Forbidden Access) | **Passed** |
| **API-08** | API | AC-03, FR-10 | อัปโหลดไฟล์แนบที่ถูกต้อง (PNG $\le$ 5MB) สำเร็จ (HTTP 201) | **Passed** |
| **API-09** | API | AC-03, BR-09 | ปฏิเสธไฟล์ขนาดเกิน 5 MB หรือประเภทไฟล์ไม่อนุญาต (HTTP 413/415) | **Passed** |
| **API-10** | API | AC-08, BR-10 | Soft-remove ไฟล์แนบพร้อมบันทึกเหตุผล (`isRemoved: true`) | **Passed** |
| **API-11** | API | AC-08, BR-10 | ปิดกั้นการดาวน์โหลดไฟล์ที่ถูก Soft-remove ด้วย HTTP 410 Gone | **Passed** |
| **API-12** | API | AC-04, BR-04 | ดึงรายชื่อ Requester เฉพาะที่มีสถานะ `isActive: true` | **Passed** |
| **UI-01** | UI | AC-04, FR-01 | แสดง Requester Selector และจำลองสลับตัวตนใน React Context | **Passed** |
| **UI-02** | UI | AC-01, FR-03 | โหลด Dropdown Categories และ Related Systems อัตโนมัติ | **Passed** |
| **UI-03** | UI | AC-02, BR-06 | แสดงข้อความ Error สีแดงใต้ช่องกรอกเมื่อข้อมูลไม่ผ่านเกณฑ์ | **Passed** |
| **UI-04** | UI | AC-09, BR-07 | แสดงปุ่มหมุน Loading และ Disable ปุ่ม Submit เมื่อกำลังส่งฟอร์ม | **Passed** |
| **UI-05** | UI | AC-10, BR-08 | รักษาข้อมูลฟอร์มและไฟล์ที่แนบไว้ครบถ้วนเมื่อ API เกิดข้อผิดพลาด | **Passed** |
| **UI-06** | UI | AC-05, FR-06 | แสดงตาราง My Tickets พร้อม Badge สี Zen Green | **Passed** |
| **UI-07** | UI | AC-07, BR-11 | แสดง Empty State (0 ตั๋ว) และ No-Results State (ไม่พบผลกรอง) แยกกัน | **Passed** |
| **UI-08** | UI | AC-08, FR-12 | แสดง Modal ลบไฟล์แนบ ตรวจสอบเหตุผล และอัปเดตสถานะ Removed | **Passed** |
| **UI-09** | UI | AC-06, FR-09 | แสดงหน้ารายละเอียดตั๋วแบบอ่านอย่างเดียว พร้อมปุ่มย้อนกลับ | **Passed** |
| **E2E-01** | E2E | AC-01..08 | Full Lifecycle E2E (เลือกผู้ใช้ $\rightarrow$ สร้างตั๋ว $\rightarrow$ ดูในตาราง $\rightarrow$ เปิดดูรายละเอียด $\rightarrow$ Soft-remove ไฟล์) | **Passed** |
| **E2E-02** | E2E | AC-05..06 | Multi-User Switching & Ownership Protection ผ่าน Browser จริง | **Passed** |
| **E2E-03** | E2E | AC-01..10 | ตรวจสอบ Responsive 3 หน้าจอ และ Assert ค่า `scrollWidth <= clientWidth` | **Passed** |

## 6.2 Terminal Verification Outputs

### Backend API Test Suite (Supertest + Vitest)
```text
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/requesters.api.test.ts (2 tests)
 ✓ tests/lab-02/ticket-detail.api.test.ts (4 tests)
 ✓ tests/lab-02/create-ticket.api.test.ts (8 tests)
 ✓ tests/lab-02/attachments.api.test.ts (9 tests)
 ✓ tests/lab-02/my-tickets.api.test.ts (7 tests)

 Test Files  7 passed (7)
      Tests  32 passed (32)
```

### Frontend UI Test Suite (React Testing Library + Vitest)
```text
 ✓ tests/lab-02/RequesterSelector.test.tsx (3 tests)
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx (2 tests)
 ✓ tests/lab-02/AttachmentSection.test.tsx (6 tests)
 ✓ tests/lab-01/App.test.tsx (4 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (8 tests)
 ✓ tests/lab-02/MyTickets.test.tsx (7 tests)

 Test Files  6 passed (6)
      Tests  30 passed (30)
```

### End-to-End Browser Test Suite (Playwright)
```text
Running 3 tests using 1 worker

  ✓  1 [chromium] › e2e/lab-02/requester-ticket-flow.spec.ts › E2E-01: Complete Requester Ticket Lifecycle
  ✓  2 [chromium] › e2e/lab-02/requester-ticket-flow.spec.ts › E2E-02: Multi-User Ownership Isolation
  ✓  3 [chromium] › e2e/lab-02/requester-ticket-flow.spec.ts › E2E-03: Responsive Viewport Verification & Screenshots

  3 passed (13.6s)
```

---

# Part 7: Peer Code Review Records & Collaboration Analysis

## 7.1 Pull Requests Authored by Penwatsa (@Phenwatsa)
- **PR #26 (Issue 5: Spec & Test Plan):** ได้รับข้อเสนอแนะเรื่องความสอดคล้องของการกรอง IT Priority และการปรับ Markdown link $\rightarrow$ ดำเนินการปรับแก้เอกสาร `api-spec.md` และ `ui-spec.md` จนได้รับ **Approved**
- **PR #27 (Issue 6: Requester Context & Seed Data):** ได้รับการตรวจสอบ Prisma Schema, Seed Data 5 บัญชี และ API $\rightarrow$ **Approved**
- **PR #28 (Issue 7: Ticket Creation & Form Foundation):** ได้รับการตรวจสอบ Ticket Number Generation, Validation rules และ Loading states $\rightarrow$ **Approved**
- **PR #29 (Issue 8: My Tickets List & Filtering):** ได้รับการตรวจสอบ Tenant Isolation และ State การกรอง $\rightarrow$ **Approved**
- **PR #30 (Issue 9: Ticket Detail & Attachments):** ได้รับการตรวจสอบสิทธิ์การเข้าถึงไฟล์, 5-File Limit และ Soft-removal $\rightarrow$ **Approved**
- **PR #31 (Issue 10: E2E & Responsive Polish):** ได้รับข้อเสนอแนะเรื่องความสอดคล้องของสีพื้นหลัง `#F5F7F6` $\rightarrow$ ปรับแก้ `zen-green.css` และ Specs ให้ตรงกัน 100% จนได้รับ **Approved**

## 7.2 Pull Requests Reviewed for Partner Phirada (@lephirada)
- **PR #18 (Issue 5: Spec & Test Plan):** ตรวจสอบ Functional Requirements, API contracts และ DoD $\rightarrow$ **Approved**
- **PR #19 (Issue 6: Requester Context & Seed Data):** ตรวจสอบ Prisma models, Seed script และ Switch requester context $\rightarrow$ **Approved**
- **PR #20 (Issue 7: Create Ticket with Pre-upload):** ตรวจพบจุดที่ต้องปรับปรุงเรื่อง Client-side MIME validation (ป้องกันไฟล์ปลอมนามสกุล) $\rightarrow$ เพื่อนดำเนินการเพิ่ม direct `file.type` validation และ unit tests $\rightarrow$ ทำการ Re-check และให้ **Approved**
- **PR #21 (Issue 8: Requester Selection & My Tickets):** ตรวจสอบพบว่าฟังก์ชัน `onViewTicket` ยังไม่ต่อ URL Route ไปยัง `/tickets/:id` $\rightarrow$ ให้ผลการประเมินเป็น **Changes Requested** เพื่อให้เพื่อนเชื่อมต่อ Routing ก่อน Approve
- **Issue 9 (Ticket Details & Attachments):** อยู่ในระหว่างที่เพื่อนกำลังพัฒนา (Pending)

---

# Part 8: AI-Assisted Development & Reflection

## 8.1 Summary of 10 Key AI Prompts

| # | Prompt (Summarised) | Impact & Action Taken |
| :- | :--- | :--- |
| 1 | วิเคราะห์ขอบเขตงาน Lab 2, ข้อกำหนด Multi-tenant และเกณฑ์การตรวจรายงาน 9 ส่วน | วางแผนสถาปัตยกรรมระบบและกำหนดโครงสร้าง Deliverables ครบถ้วน |
| 2 | แตก Issue #5 ถึง #11 บน GitHub Project พร้อมกำหนด Acceptance Criteria รายข้อ | สร้าง GitHub Kanban Board และวางแผนแตก Branch ตามหลักการ Git Discipline |
| 3 | จัดทำเอกสาร Spec-Driven Development (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) | สร้าง Engineering Contract ที่ชัดเจน ป้องกันการเขียนโค้ดผิดสเปก |
| 4 | พัฒนา Prisma Schema, Idempotent Seed Data และ Requester Selection Context | สร้างฐานข้อมูลผู้ใช้ 5 บัญชี และระบบสลับตัวตนใน React Context |
| 5 | พัฒนา Create Ticket API, Ticket Number Generator และ Create Ticket Form | ออกแบบการสร้างเลขตั๋ว `TKT-YYYY-NNNNNN` และฟอร์มที่มี Client Validation คมชัด |
| 6 | พัฒนา My Tickets API พร้อม Tenant Isolation และ My Tickets Dashboard UI | พัฒนาการกรองหลายมิติ, ค้นหาแบบ Real-time, Pagination และทดสอบ Isolation |
| 7 | พัฒนา Ticket Detail, Attachment Binary Upload, Soft-Removal และ 410 Gone Blocking | สร้างวงจรชีวิตไฟล์แนบที่ปลอดภัย บันทึกเหตุผลการลบ และป้องกันการดูตั๋วผู้อื่น |
| 8 | พัฒนา Playwright E2E Suite และ Responsive Layout บน Desktop, Tablet, Mobile | ตรวจสอบ Zero Horizontal Overflow และบันทึก Screenshot 12 ภาพสำหรับรายงาน |
| 9 | ปรับแต่ง UI สไตล์ Apple-Zen Green ให้ Contrast สูง ใช้งานง่าย และรองรับ Browser Navigation | ปรับแต่งโทนสี `#006B3C`, Single-row Filter Bar และ Modal ยืนยันการสลับผู้ใช้ |
| 10 | รวบรวมเอกสารสรุปผลการพัฒนา Peer Review, Test Outputs และจัดทำ Final Report | ตรวจสอบความถูกต้องของสัญญาทั้งหมด และจัดเตรียมรายงานฉบับสมบูรณ์สำหรับส่งงาน |

## 8.2 My Reflection (บทสะท้อนการเรียนรู้)
1. **พลังของ Spec-Driven Development (Spec DD):** การเขียนเอกสารสเปกและตารางความเชื่อมโยงของ Test ก่อนเขียนโค้ดช่วยลดความสับสนได้อย่างมหาศาล ทำให้การพัฒนาทั้งฝั่ง Frontend และ Backend สื่อสารผ่านสัญญาเดียวกัน ส่งผลให้โค้ดทำงานร่วมกันได้ตั้งแต่ครั้งแรก
2. **AI ในฐานะ Pair Programmer คุณภาพสูง:** การใช้ AI ร่วมพัฒนาไม่ใช่แค่การสร้างโค้ด แต่เป็นการช่วยคิด Edge Cases เช่น การป้องกัน Double Submission, การตรวจจับ Oversized File, และการเขียน Playwright Assertion เพื่อตรวจวัด Layout Overflow ในทุกขนาดหน้าจอ
3. **ความสำคัญของ Peer Code Review:** การแลกเปลี่ยนรีวิวโค้ดกับคู่ตรวจช่วยให้เห็นจุดบกพร่องที่มองข้าม เช่น ข้อจำกัดเรื่องการตรวจสอบ MIME Type ที่แท้จริงของไฟล์ และความสอดคล้องของชุดสี ดีไซน์ระบบจึงมีความประณีตและปลอดภัยยิ่งขึ้น

---

# Part 9: Release Management & Sprint Retrospective

## 9.1 Release Management & Verification
- รวมโค้ดทุก Feature Branch เข้าสู่ `lab2-staging` ผ่าน Pull Request ที่ได้รับการ Approve
- ดำเนินการรัน Automated Test Suite ครบทุกระดับ (Supertest 32 ข้อ, Vitest 30 ข้อ, Playwright 3 ข้อ) ผลลัพธ์ผ่าน 100%
- ตรวจสอบ Production Build ด้วย `npm run build` สำเร็จโดยไม่มี Error
- เตรียม Release Pull Request จาก `lab2-staging` เข้าสู่ `main` สำหรับการส่งมอบงานอย่างเป็นทางการ

## 9.2 Sprint Retrospective
- **What Went Well:** การแบ่งงานเป็นชิ้นเล็กผ่าน GitHub Issues ทำให้งานเสร็จตรงตามเวลา, การใช้ Spec DD ทำให้ครอบคลุมทุก AC ได้ 100%, และ E2E Test ช่วยจับภาพ Screenshot เพื่อทำเอกสารได้อย่างสมบูรณ์
- **What Could Be Improved:** การกำหนดดีไซน์โทนสีควรมี Style Guide ที่เป็นค่าคงที่กลางตั้งแต่เริ่มต้น เพื่อลดการปรับแก้ความสอดคล้องของสีในภายหลัง
- **Action Items for Sprint 3:** นำระบบ Token กลางไปใช้ในส่วน IT Staff/Admin และออกแบบ Role-Based Access Control (RBAC) ต่อยอดจาก Requester Context ที่วางรากฐานไว้อย่างมั่นคง
