# TokTickIT Lab 3 — Test Plan & Traceability Matrix

This document outlines the planned automated test suite for TokTickIT Sprint 3 (Lab 3). It defines the test matrix across the testing pyramid (Backend REST API Integration tests, Frontend UI Component tests, and End-to-End Playwright scenarios), mapping every test directly to its corresponding Acceptance Criterion (AC-xx).

---

## 1. Planned Test Matrix

### 1.1 Backend API Tests (`server/tests/lab-03/`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | AC-01 | Valid user login with correct email and password | HTTP 200; returns JWT token and safe user profile (id, name, email, role, mustChangePassword) | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-02** | API | AC-05 | Login attempt with incorrect password | HTTP 401 Unauthorized; safe error `"Invalid email or password"` without leaking details | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-03** | API | AC-05 | Login attempt with deactivated account (`isActive: false`) | HTTP 401 Unauthorized; safe generic error response | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-04** | API | AC-02 | User with `mustChangePassword = true` changes password | HTTP 200; updates password hash, sets `mustChangePassword = false` | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-05** | API | AC-02 | Password change fails if new password does not meet complexity rules | HTTP 400 Bad Request; descriptive validation errors | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-06** | API | AC-03 | Requester attempts to query tickets with another `requesterId` in header/query | Authenticated identity from session is strictly enforced; foreign tickets not returned | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-07** | API | AC-06 | IT Staff queries ticket queue with search and filters | HTTP 200; returns paginated array of all system tickets with metadata | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| **API-08** | API | AC-15 | Unauthorized roles (Requester and Admin) attempt to access staff queue (`GET /api/staff/tickets`) | HTTP 403 Forbidden; zero queue data leaked | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| **API-09** | API | AC-07 | IT Staff claims unassigned ticket ownership | HTTP 200; ticket owner set to current authenticated staff ID | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-10** | API | AC-08 | IT Staff updates `itPriority` | HTTP 200; `itPriority` updated while original `requestedPriority` remains intact | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-11** | API | AC-09 | IT Staff attempts invalid status transition (`IN_PROGRESS` to `CLOSED`) | HTTP 400 Bad Request; transition blocked according to transition rules | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-12** | API | AC-10 | Requester and IT Staff exchange Public Comments on ticket | HTTP 201; comment created, visible to both Requester and Staff | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-13** | API | AC-04 | Unauthorized roles (Requester and Admin) attempt to read or post Internal Notes | HTTP 403 Forbidden; zero note content or metadata returned | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-14** | API | AC-11 | Admin creates new user with one role and initial password | HTTP 201; user created with `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-15** | API | AC-12 | Admin attempts to create user with duplicate email | HTTP 409 Conflict; duplicate email error message | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-16** | API | AC-13 | Admin attempts to deactivate own account | HTTP 400 Bad Request; self-deactivation blocked by safety guard | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-17** | API | AC-14 | Admin attempts to deactivate or demote last active admin | HTTP 400 Bad Request; system retains at least one active administrator | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-18** | API | AC-15 | Non-Admin attempts to call Admin User endpoints | HTTP 403 Forbidden for Requester and IT Staff | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-19** | API | AC-17 | Authenticated user retrieves current profile via `GET /api/auth/me` | HTTP 200 with user profile; HTTP 401 when token is missing or invalid | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-20** | API | AC-18 | User logs out via `POST /api/auth/logout` and previous token is revoked | Calling protected route with old token fails with HTTP 401 (`tokenVersion` mismatch) | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-21** | API | AC-20 | Requester B attempts to access/upload/remove attachments on Requester A's ticket | HTTP 403 Forbidden; attachments cross-user manipulation blocked | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-22** | API | AC-21 | Requester owner marks problem resolved via `PATCH /api/requester/tickets/:id/resolve-indication`; non-owner, IT Staff, and Admin attempts rejected | HTTP 200 with `problemAppearsResolved: true` and official status unchanged; HTTP 403 Forbidden for non-owner, Staff, and Admin; HTTP 404 for nonexistent ticket | `server/tests/lab-03/requester-resolution.api.test.ts` | Planned |

---

### 1.2 Frontend UI Component Tests (`client/src/tests/lab-03/`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-01** | UI | AC-01 | Login view form validation, input handling, and busy state | Form submits credentials, disables button with spinner during request | `client/src/tests/lab-03/Login.test.tsx` | Planned |
| **UI-02** | UI | AC-05 | Login view displays safe error banner on 401 response | Shows `"Invalid email or password"` alert banner | `client/src/tests/lab-03/Login.test.tsx` | Planned |
| **UI-03** | UI | AC-02 | Change Password form enforces password policy checks in real-time | Submit button remains disabled until all 3 rules (length, cases, number) pass | `client/src/tests/lab-03/ChangePassword.test.tsx` | Planned |
| **UI-04** | UI | AC-06 | Staff Ticket Queue table renders tickets, badges, and owner names | Correct data columns displayed with Zen Green badges | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| **UI-05** | UI | AC-06 | Staff Ticket Queue handles empty state and no-results search filter | Displays empty illustration / message with "Reset Filters" action | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| **UI-06** | UI | AC-07, AC-08 | Ticket Detail renders operational controls (Claim, Reassign, IT Priority) | Operational buttons trigger appropriate callbacks | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-07** | UI | AC-04, AC-10 | Ticket Detail enforces confidentiality of Internal Notes & renders Public Comments | When viewed by Requester, Internal Notes are completely absent; when viewed by Staff, both render with clear visual distinction | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-08** | UI | AC-11 | Admin User Management displays user list and open Create User modal | Form renders name, email, role radio buttons, and initial password | `client/src/tests/lab-03/UserManagement.test.tsx` | Planned |
| **UI-09** | UI | AC-13 | Admin User Management disables deactivation for current admin row | Active toggle switch is disabled with explanatory tooltip | `client/src/tests/lab-03/UserManagement.test.tsx` | Planned |
| **UI-10** | UI | AC-19 | Role-based navigation renders strictly permitted links per role | Requester sees My Tickets/Create Ticket; Staff sees Ticket Queue; Admin sees User Management | `client/src/tests/lab-03/Navigation.test.tsx` | Planned |
| **UI-11** | UI | AC-21 | Requester Ticket Detail renders "Problem Appears Resolved" button and updates indicator | Button click triggers PATCH request and displays resolved indicator without altering official status badge | `client/src/tests/lab-03/RequesterTicketDetail.test.tsx` | Planned |

---

### 1.3 End-to-End Browser Automation Tests (`e2e/lab-03/`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-01** | E2E | AC-01, AC-18 | Complete authentication flow (Login $\rightarrow$ Dashboard $\rightarrow$ Logout $\rightarrow$ Session Revocation) | User logs in, sees customized role navbar, logs out, redirected to login, old session dead | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-02** | E2E | AC-02 | First-login mandatory password change intercept and continuation | User with initial password is forced to change password before app opens | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-03** | E2E | AC-06, AC-19 | IT Staff end-to-end queue navigation, search, filter, and role nav | Queue loads, filters narrow results, clicking ticket opens detail view | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-04** | E2E | AC-07, AC-08, AC-09, AC-10 | IT Staff claims ticket, updates priority, transitions status, posts comment/note | Full operational flow persists across page refresh | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-05** | E2E | AC-04, AC-10 | Requester logs in, inspects ticket, verifies Internal Notes are hidden | Internal Notes container is completely absent; comments work | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-06** | E2E | AC-11, AC-12, AC-13, AC-19 | Admin creates user, duplicate email check, attempts self-deactivation, resets password | Full admin lifecycle verified in UI with security rules | `e2e/lab-03/user-administration.spec.ts` | Planned |
| **E2E-07** | E2E | AC-03, AC-20 | Lab 2 Requester Regression: create ticket, list my tickets, attachments | All Lab 2 features function without the mock requester selector | `e2e/lab-03/requester-regression.spec.ts` | Planned |
| **E2E-08** | E2E | AC-16 | Cross-viewport responsive audit (Desktop, Tablet, Mobile) | Zero horizontal overflow (`scrollWidth === clientWidth`) across all screens | `e2e/lab-03/responsive.spec.ts` | Planned |
| **E2E-09** | E2E | AC-21 | Requester marks problem resolved, verifying indication persists while ticket status remains active | Flag `problemAppearsResolved` displays true in Requester view and IT Staff queue/detail, official status remains `OPEN` or `IN_PROGRESS` | `e2e/lab-03/requester-resolution.spec.ts` | Planned |

---

## 2. Acceptance Criteria Traceability Matrix

| AC ID | Acceptance Criterion Summary | Covering Automated Tests |
| :--- | :--- | :--- |
| **AC-01** | Valid credentials establish authenticated session and role | `API-01`, `UI-01`, `E2E-01` |
| **AC-02** | Initial password user must change password before app access | `API-04`, `API-05`, `UI-03`, `E2E-02` |
| **AC-03** | Requester identity derived from session, enforcing cross-user ownership isolation | `API-06`, `E2E-07` |
| **AC-04** | Internal Notes strictly hidden and forbidden for Requesters and Admins | `API-13`, `UI-07`, `E2E-05` |
| **AC-05** | Invalid credentials or inactive accounts safely rejected | `API-02`, `API-03`, `UI-02`, `E2E-01` |
| **AC-06** | IT Staff queue retrieval with search, filters, pagination | `API-07`, `UI-04`, `UI-05`, `E2E-03` |
| **AC-07** | Ticket ownership claim and reassignment | `API-09`, `UI-06`, `E2E-04` |
| **AC-08** | IT Priority management preserving Requested Priority | `API-10`, `UI-06`, `E2E-04` |
| **AC-09** | Status transitions adhere to defined state matrix | `API-11`, `UI-06`, `E2E-04` |
| **AC-10** | Public Comments exchange between Requester and Staff | `API-12`, `UI-07`, `E2E-04`, `E2E-05` |
| **AC-11** | Admin user creation with role and initial password | `API-14`, `UI-08`, `E2E-06` |
| **AC-12** | Duplicate email rejection on user creation/update | `API-15`, `E2E-06` |
| **AC-13** | Prevention of Admin self-deactivation | `API-16`, `UI-09`, `E2E-06` |
| **AC-14** | Last active administrator protection | `API-17` |
| **AC-15** | Non-Admin forbidden from User Management / Non-Staff forbidden from Staff Queue | `API-08`, `API-18` |
| **AC-16** | Cross-viewport responsive layout and zero horizontal overflow | `E2E-08` |
| **AC-17** | Current user profile retrieval via `GET /api/auth/me` | `API-19` |
| **AC-18** | Server-side token revocation on logout via `tokenVersion` | `API-20`, `E2E-01` |
| **AC-19** | Role-based navigation rendering strictly permitted destinations | `UI-10`, `E2E-01`, `E2E-03`, `E2E-06` |
| **AC-20** | Requester attachment ownership isolation against unauthorized access | `API-21`, `E2E-07` |
| **AC-21** | Requester owner marks problem appears resolved without altering official status; non-owners blocked | `API-22`, `UI-11`, `E2E-09` |
