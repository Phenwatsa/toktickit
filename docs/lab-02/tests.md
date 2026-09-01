# Lab 2 Test Plan and Traceability

## 1. Test Strategy
Testing in Lab 2 adheres to Test-Driven Development (TDD) across four integrated test levels:
1. **Unit Tests**: Verify isolated business logic functions such as official Ticket Number formatting and validation helper rules.
2. **Server API Tests (Supertest & Vitest)**: Test every REST endpoint for correct HTTP status codes, JSON response schemas, validation errors, soft-removal rules, and multi-tenant requester data isolation.
3. **Client UI Component Tests (Vitest & React Testing Library)**: Test user interface components, form validation feedback, loading/busy states, dropdown population, and empty/no-results states.
4. **End-to-End Tests (Playwright)**: Test full browser workflows across Desktop, Tablet, and Mobile viewports, capturing visual screenshots and verifying complete lifecycle actions.

---

## 2. Planned-Test Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | API | AC-01, FR-04 | Create valid ticket with all required fields | HTTP 201; generated unique ticketNumber returned; saved in DB | `server/tests/lab-02/create-ticket.api.test.ts` | Passed |
| **API-02** | API | AC-02, BR-06 | Reject ticket creation with missing summary/description | HTTP 400 with field-level validation error details | `server/tests/lab-02/create-ticket.api.test.ts` | Passed |
| **API-03** | API | AC-05, FR-06 | Retrieve paginated tickets owned by Requester A | HTTP 200; only Requester A's tickets returned; correct pagination meta | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-04** | API | AC-05, BR-05 | Isolate data between Requester A and Requester B | HTTP 200; Requester B cannot see tickets belonging to Requester A | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-05** | API | AC-07, FR-07 | Filter and search tickets by keyword and category | HTTP 200; returns only matching subset of owned tickets | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-06** | API | AC-06, BR-05 | Retrieve single owned ticket detail | HTTP 200 with full ticket & attachments data | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-07** | API | AC-06, BR-05 | Reject unauthorized access to another requester's ticket | HTTP 403 Forbidden or 404 Not Found | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-08** | API | AC-03, FR-10 | Upload valid attachment (PNG <= 5MB) | HTTP 201; attachment linked to ticket | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-09** | API | AC-03, BR-09 | Reject oversized attachment (> 5MB) or invalid format | HTTP 413 / 415 rejection | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-10** | API | AC-08, BR-10 | Soft-remove attachment with valid reason | HTTP 200; `isRemoved: true`; reason saved; metadata retained | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-11** | API | AC-08, BR-10 | Block download of soft-removed attachment | HTTP 410 Gone; file stream blocked | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-12** | API | AC-04, BR-04 | Retrieve active requesters list | HTTP 200; only `isActive: true` requesters returned | `server/tests/lab-02/requesters.api.test.ts` | Passed |
| **UI-01** | UI | AC-04, FR-01 | Render Requester Selector & persist context | Active user displayed; changing user updates context | `client/tests/lab-02/RequesterSelector.test.tsx` | Passed |
| **UI-02** | UI | AC-01, FR-03 | Populate reference dropdowns on Create Ticket | Categories and Related Systems loaded from API | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-03** | UI | AC-02, BR-06 | Trigger client-side validation on empty submission | Field error messages displayed below inputs; API not called | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-04** | UI | AC-09, BR-07 | Display busy state & disable button on submit | Submit button disabled with loading spinner during in-flight request | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-05** | UI | AC-10, BR-08 | Handle API failure safely on ticket creation | Error banner displayed; user input values preserved in form | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-06** | UI | AC-05, FR-06 | Render My Tickets table with priority & status badges | Table columns render correctly with designated Zen Green styling | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| **UI-07** | UI | AC-07, BR-11 | Display empty state & no-results state | Distinct empty illustration for 0 tickets and no-results banner for filter | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| **UI-08** | UI | AC-08, FR-12 | Soft removal modal validation and UI update | Requires reason; updates attachment list to soft-removed state | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01..AC-08 | Full ticket lifecycle E2E flow | Select requester $\rightarrow$ Create ticket $\rightarrow$ View in My Tickets $\rightarrow$ Detail $\rightarrow$ Soft-remove | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-05, AC-06 | Multi-user ownership & switching E2E | Switching requester A to B isolates ticket lists and blocks cross-access | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Covered by Test IDs | Test Level |
| :--- | :--- | :--- |
| **AC-01 (Ticket Creation)** | `API-01`, `UI-02`, `E2E-01` | API, UI, E2E |
| **AC-02 (Validation Failure)** | `API-02`, `UI-03` | API, UI |
| **AC-03 (Attachment Constraints)** | `API-08`, `API-09`, `E2E-01` | API, E2E |
| **AC-04 (Dev Requester Selection)** | `API-12`, `UI-01`, `E2E-01`, `E2E-02` | API, UI, E2E |
| **AC-05 (Ownership Protection - List)** | `API-03`, `API-04`, `UI-06`, `E2E-02` | API, UI, E2E |
| **AC-06 (Ownership Protection - Detail)** | `API-06`, `API-07`, `E2E-02` | API, E2E |
| **AC-07 (Search & Filter)** | `API-05`, `UI-07`, `E2E-01` | API, UI, E2E |
| **AC-08 (Attachment Soft Removal)** | `API-10`, `API-11`, `UI-08`, `E2E-01` | API, UI, E2E |
| **AC-09 (Duplicate Submission Prevention)**| `UI-04`, `E2E-01` | UI, E2E |
| **AC-10 (Safe Error State)** | `UI-05` | UI |

---

## 4. Responsive and Visual Checklist

- [ ] **Desktop ($\ge 992\text{px}$)**: Centered layout with max-width container; multi-column form grids; full 9-column My Tickets table.
- [ ] **Tablet ($768 - 991\text{px}$)**: 2-column form grids; condensed table layout; touch-friendly target sizes ($\ge 40\text{px}$).
- [ ] **Mobile ($< 768\text{px}$)**: Single-column vertically stacked controls; My Tickets table transitions to responsive card layout; zero unwanted horizontal scroll.
- [ ] **Zen Green Palette**: Primary `#006B3C`, Secondary `#0B7A46`, Pale Green `#EAF6EF`, Background `#F5F7F6`.
- [ ] **Form Styling**: Required asterisks visible; field error messages positioned immediately below inputs; read-only fields have soft gray-green background.

---

## 5. Test Commands

```bash
# Run server API tests (Supertest + Vitest)
cd server && npm test

# Run client component tests (Vitest + React Testing Library)
cd client && npm test

# Run Playwright End-to-End tests
npx playwright test
```

---

## 6. Passing Terminal Output

### Server Tests (Supertest)
```text
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/requesters.api.test.ts (2 tests)
 ✓ tests/lab-02/create-ticket.api.test.ts (8 tests)

 Test Files  4 passed (4)
      Tests  12 passed (12)
```

### Client Tests (Vitest)
```text
 ✓ tests/lab-02/RequesterSelector.test.tsx (3 tests)
 ✓ tests/lab-01/App.test.tsx (4 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (7 tests)

 Test Files  3 passed (3)
      Tests  14 passed (14)
```
