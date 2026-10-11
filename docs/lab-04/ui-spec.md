# TokTickIT Lab 4 — UI Specification & Zen Green Design System

This document specifies the user interface design, screen structures, responsive behaviors, accessibility standards, and visual checklist for TokTickIT Sprint 4 (Lab 4).

---

## 1. Apple-Style Zen Green Design System Tokens

All Lab 4 UI components must adhere strictly to the established **Zen Green Design System**:

| Token Category | CSS Variable | Hex / Value | Usage & Meaning |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `--zg-primary` | `#006B3C` | Forest Green: Primary buttons, active nav indicators, key brand elements |
| **Primary Hover** | `--zg-primary-hover` | `#00522E` | Deep Forest: Button hover, focus highlights |
| **Light Tint** | `--zg-primary-light` | `#E8F5E9` | Mint Tint: Selected rows, badge backgrounds, card headers |
| **Page Background** | `--zg-bg-page` | `#F5F7F6` | Off-white subtle sage: Full-page background |
| **Surface / Card** | `--zg-surface` | `#FFFFFF` | Crisp white: Card backgrounds, modals, input containers |
| **Borders** | `--zg-border` | `#E2E8F0` | Delicate slate border: Clean division between cards and table cells |
| **Text Primary** | `--zg-text-primary` | `#1E293B` | Charcoal slate: Headings, primary text, high-contrast readability |
| **Text Muted** | `--zg-text-muted` | `#64748B` | Medium slate: Subtitles, timestamps, metadata labels |
| **Amber Warning** | `--zg-warning` | `#D97706` | Warm Amber: Follow-up required badge, internal note borders |
| **Red Danger** | `--zg-danger` | `#DC2626` | Safe Crimson: Cancelled status, error alerts, conflict notifications |
| **Corner Radius** | `--zg-radius` | `8px` to `12px` | Modern Apple-style rounded cards and dialogs |
| **Shadow** | `--zg-shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle depth for cards and interactive metric tiles |

---

## 2. Application Shell & Global Navigation

### 2.1 Navigation Bar Updates (`Header.tsx`)
- **Branding**: TokTickIT logo with Zen Green leaf icon and clear typography.
- **Role-Based Navigation Links**:
  - **Requester**:
    - `Dashboard` (`#/requester-dashboard` or default `#/dashboard`)
    - `My Tickets` (`#/my-tickets`)
    - `Create Ticket` (`#/create-ticket`)
  - **IT Staff**:
    - `Dashboard` (`#/staff-dashboard` or default `#/dashboard`)
    - `Ticket Queue` (`#/staff-queue`)
  - **Administrator**:
    - `Dashboard` (`#/admin-dashboard` or default `#/dashboard`)
    - `User Management` (`#/admin-users`)
- **Active Tab Cue**: An active navigation pill indicator styled with `--zg-primary` text and `--zg-primary-light` background pill.
- **User Profile & Logout**: Right-aligned user name, role badge, and standard logout button.
- **Default Landing**: The default authenticated landing page for all users is set to their respective role's **Dashboard**.

---

## 3. Actions Taken Component on Ticket Detail (`ActionsTakenSection.tsx`)

### 3.1 Overview & Placement
Positioned directly underneath the Ticket Summary/Metadata section and directly above the Public Comments / Internal Notes area on both Requester and IT Staff Ticket Detail screens.

### 3.2 Visual Structure
- **Section Header**:
  - Title: "Actions Taken" with item count badge (e.g. `Actions Taken (3)`).
  - Subtext: "Operational record of diagnostic and remediation activities."
  - Action Button (IT Staff and Administrator): "+ Add Action Taken" (`zen-btn-primary`).
- **Action Item Card**:
  - **Top Row**: Action Date/Time (formatted e.g. `Oct 10, 2026, 2:30 PM`), Performed By badge (`By Alex Taylor`), and Follow-Up indicator badge.
  - **Content Body**:
    - **Description**: "Action Description: [Text]"
    - **Result**: "Result: [Text]"
  - **Follow-Up Section** (if `isFollowUpRequired === true`):
    - Displayed with warm amber highlight background (`#FEF3C7`), warning icon, and text: "Follow-Up Required: [Note text]".
  - **Attachment Reference** (if `attachmentNotes` exists):
    - Paperclip icon with text: "Referenced Attachments: [Notes]".
  - **Staff & Admin Controls** (IT Staff and Administrator): Subtle "Edit" button allowing in-place editing of action details.

### 3.3 Create & Edit Modal/Drawer (`ActionTakenModal.tsx`)
- **Fields**:
  - `Action Date/Time`: Datetime-local input (defaults to current local timestamp; converted to UTC ISO-8601 string `YYYY-MM-DDTHH:mm:ss.sssZ` upon submission).
  - `Action Description`: Textarea (min 5 chars, placeholder: "Describe the specific activity taken...").
  - `Result`: Textarea (min 3 chars, placeholder: "Describe the outcome or findings...").
  - `Performed By`: Read-only field showing current user name: "Logged-in Staff Member (Auto-assigned)".
  - `Follow-Up Required?`: Checkbox toggle.
  - `Follow-Up Note`: Textarea that dynamically appears or becomes mandatory when the checkbox is active (enforcing at least 3 non-whitespace characters per BR-04).
    - **Validation Behavior**: Submitting a blank string, whitespace-only (`"   "`), or fewer than 3 non-whitespace characters (e.g. `"ab"`, `"  a  "`) blocks submission and displays a red inline error message: `"Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"`. Submitting 3 or more non-whitespace characters passes validation.
  - `Attachment Notes`: Optional text field referencing file names or diagnostic images.
- **Footer**: "Cancel" and "Save Action Taken" buttons with loading spinner during submission.

### 3.4 Requester Mode
- Purely read-only presentation.
- "+ Add Action Taken" and "Edit" buttons are completely hidden.
- Clean, transparent audit trail for the ticket requester.

---

## 4. Role-Appropriate Dashboards

### 4.1 Requester Dashboard (`RequesterDashboard.tsx`)
- **Header Banner**: "Welcome back, [First Name]!" with subtitle "Here's what's happening with your support requests."
- **Primary Metric Cards Grid (5 Cards)**:
  1. `My Open Tickets` (`openTickets`): Count of active open tickets (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`).
  2. `In Progress` (`inProgressTickets`): Count of tickets actively being worked on by IT.
  3. `Waiting for Requester` (`waitingForRequesterTickets`): Count of tickets awaiting user confirmation/action.
  4. `Resolved Tickets` (`resolvedTickets`): Count of all resolved tickets awaiting requester closure.
  5. `Closed` (`closedTickets`): Count of finalized tickets.
- **Card Interactive Drill-Down**:
  - `My Open Tickets` $\to$ `#/my-tickets?status=OPEN_GROUP` (preset filter displaying active non-final tickets: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`)
  - `In Progress` $\to$ `#/my-tickets?status=IN_PROGRESS`
  - `Waiting for Requester` $\to$ `#/my-tickets?status=WAITING_FOR_REQUESTER`
  - `Resolved Tickets` $\to$ `#/my-tickets?status=RESOLVED`
  - `Closed` $\to$ `#/my-tickets?status=CLOSED`
- **My Recent Tickets (Left Panel)**:
  - Table showing Ticket Number, Summary, Status badge, and Updated Date.
  - Clicking a row opens the Requester Ticket Detail view (`#/ticket/:id`).
- **Quick Actions (Right Panel)**:
  - "Create Ticket": Quick button navigating to ticket submission form.
  - "View All My Tickets": Direct link to complete tickets list.

---

### 4.2 IT Staff Dashboard (`StaffDashboard.tsx`)
- **Header Banner**: "Welcome back, [First Name]!" with "Refresh" button in the top-right corner.
- **Primary Metric Cards Grid (5 Cards)**:
  1. `New` (`primary.newTickets`): Unopened tickets.
  2. `Open` (`primary.openTickets`): Acknowledged tickets.
  3. `In Progress` (`primary.inProgressTickets`): Active remediation.
  4. `Waiting for Requester` (`primary.waitingForRequesterTickets`): Blocked on user input.
  5. `My Assigned` (`primary.myAssignedTickets`): Active tickets where the logged-in staff member is owner.
- **Secondary Workload & Status Breakdown Indicators**:
  - `Unassigned Queue`: Amber highlighted callout for active tickets needing triage (`unassignedTickets`).
  - `Full Lifecycle Status Distribution (8 Statuses)`: Complete pill badges showing live counts across all 8 states (`byStatus`): `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
  - `Priority Breakdown`: Horizontal badge row showing Low, Medium, High, Urgent active counts (`byPriority`).
- **Card Interactive Drill-Down**:
  - `New` $\to$ `#/staff-queue?status=NEW`
  - `Open` $\to$ `#/staff-queue?status=OPEN`
  - `In Progress` $\to$ `#/staff-queue?status=IN_PROGRESS`
  - `Waiting for Requester` $\to$ `#/staff-queue?status=WAITING_FOR_REQUESTER`
  - `My Assigned` $\to$ `#/staff-queue?owner=me`
  - `Unassigned Queue` $\to$ `#/staff-queue?owner=unassigned`
  - Any status badge in breakdown $\to$ `#/staff-queue?status=[STATUS]`
- **Recent Queue Tickets (Left Panel)**:
  - Table displaying Ticket Number, Summary, IT Priority badge, Status badge, Requester, and Updated Date.
  - Clicking a row navigates to IT Staff Ticket Detail (`#/ticket/:id`).
- **Quick Actions (Right Panel)**:
  - "Create Ticket", "Search Tickets", "My Assigned Queue".

---

### 4.3 Administrator Dashboard (`AdminDashboard.tsx`)
- **Header Banner**: "Welcome back, [First Name]!" with subtitle "System Administration & Service Desk Overview" and "Refresh" button.
- **Primary Metric Cards Grid**:
  1. `Total Active Tickets` (`operational.totalActiveTickets`): Count of non-closed/non-cancelled tickets across the system.
  2. `Unassigned Queue` (`operational.unassignedTickets`): Active unassigned tickets needing assignment.
  3. `Total Users` (`users.totalUsers`): Total registered user accounts.
  4. `Active Users` (`users.activeUsers`): Active accounts.
  5. `Inactive Users` (`users.inactiveUsers`): Deactivated accounts.
- **Role Distribution Badges**: Horizontal badge row displaying Requesters (`users.byRole.requester`), IT Staff (`users.byRole.itStaff`), and Administrators (`users.byRole.administrator`).
- **Quick Actions (Right Panel)**:
  - "User Management": Navigates directly to User Management (`#/admin-users`).
  - "Ticket Queue": Navigates to operational ticket queue (`#/staff-queue`).
  - "Create Ticket": Quick link to ticket creation form (`#/create-ticket`).
- **Recent Queue Overview (Left Panel)**: Table displaying recent system tickets with priority, status, and assigned staff. Clicking a row navigates to Ticket Detail (`#/ticket/:id`).
- **Interactive Drill-Down**:
  - Clicking `Total Active Tickets` navigates to `#/staff-queue`.
  - Clicking `Unassigned Queue` navigates to `#/staff-queue?owner=unassigned`.
  - Clicking `Total Users` / `Active Users` / `Inactive Users` navigates to `#/admin-users`.

---

## 5. Responsive Layout & Viewport Rules

The interface adapts smoothly across three standard test viewports:

| Viewport | Screen Width | Layout Transformations |
| :--- | :--- | :--- |
| **Desktop** | $1280\text{px} \times 800\text{px}$ | 4–5 column metric cards row; side-by-side Recent Tickets and Quick Actions; full multi-column data tables. |
| **Tablet** | $768\text{px} \times 1024\text{px}$ | 2–3 column metric cards grid; stacked Recent Tickets and Quick Actions; responsive scrollable data tables. |
| **Mobile** | $375\text{px} \times 667\text{px}$ | 1 column stacked metric cards; full-width action buttons ($44\text{px}+$ touch targets); tables transform into vertical card stacks; zero horizontal overflow ($scrollWidth === clientWidth$). |

### 5.1 Responsive Audit & Design System Verification Protocol
To guarantee compliance with FR-17 and AC-17, testing is partitioned into two distinct, non-overlapping automated suites:

1. **Design System & Styling Tokens (`UI-STYLE-01`)**: Component-level test suite in `client/tests/lab-04/DesignSystemTokens.test.tsx` asserting design token implementation and CSS styling rules:
   - **Zen Green Design Tokens**: Automated assertion verifying computed CSS variables (`--zg-primary: #006B3C`, `--zg-bg-page: #F5F7F6`, `--zg-surface: #FFFFFF`, `--zg-border: #E2E8F0`) on cards, background containers, and interactive elements.
   - **Status Badges & Colors**: Consistent background and text styling across all 8 ticket statuses.
   - **Focus Rings**: Accessible focus indicators (`:focus-visible`) on all interactive controls.
   - **Role Styling Cues**: Distinct visual treatment for internal staff actions versus shared content.

2. **Multi-Viewport Responsive Audit (`E2E-04`)**: Browser-level viewport suite in `e2e/lab-04/dashboards.spec.ts` executing across Desktop ($1280\text{px}$), Tablet ($768\text{px}$), and Mobile ($375\text{px}$) on all four core screens (Requester Dashboard `#/dashboard`, IT Staff Dashboard `#/staff-dashboard`, Administrator Dashboard `#/admin-dashboard`, and Ticket Detail `#/ticket/:id`), asserting:
   - **Zero Horizontal Overflow**: Assert `document.body.scrollWidth === document.body.clientWidth` and `window.scrollX === 0` across all three viewports.
   - **Responsive Grid & Stacking**: Assert grid rearrangement (3-column on Desktop, 2–3 column on Tablet, 1-column vertical stack on Mobile).
   - **No Overlapping Interactive Elements**: Programmatically verify that sticky headers, action buttons, Quick Action shortcut tiles, and modal dialogs do not collide (intersecting bounding boxes).
   - **No Clipped Text or Cutoff Labels**: Elements retain complete visibility without truncation of critical identifiers (Ticket IDs, status badges, timestamps).
   - **Accessible Controls**: Interactive elements remain visible, reachable, and tappable ($44\text{px}+$ touch targets on mobile) in all viewports.

---

## 6. State Management, Loading & UI Resilience (BR-16, AC-24, AC-28)

### 6.1 Skeleton Loading States (`zg-skeleton`)
- **Metric Tiles**: While dashboard metrics are in transit, display subtle pulsing skeleton boxes matching metric card dimensions (`120px` height) using `--zg-surface` background and `--zg-border` pulsing animation.
- **Recent Tickets & Queue Tables**: Render 3 placeholder skeleton rows with simulated column widths (Ticket #, Title, Status badge) to eliminate layout shift (CLS).
- **Actions Taken**: Display 2 pulsing action item cards during initial ticket detail loading.

### 6.2 Zero-State / Empty Containers (`zg-empty-state`)
- **Requester Dashboard (0 Tickets)**: Friendly Zen Green leaf/inbox icon with title "No support tickets yet", subtitle "Have an IT issue or question? Submit your first request", and primary "+ Create Ticket" button.
- **IT Staff Dashboard (Queue Empty)**: Checkmark circle icon with message "Queue clear! No tickets currently requiring triage."
- **Admin Dashboard (No Activity)**: Status icon indicating "All systems normal. No pending tickets."
- **Actions Taken (0 Items)**: A clean slate container with message "No diagnostic actions recorded yet. IT Staff will log investigation and troubleshooting steps here."

### 6.3 Forbidden & Unauthorized Route Guards (403 State)
- When a user navigates to an unauthorized view (e.g. Requester hitting `#/staff-dashboard` or Staff hitting `#/admin-dashboard`), the client displays an accessible 403 Forbidden banner with a single primary button: `"Return to My Dashboard"`, smoothly directing the user to their authorized home screen.

### 6.4 Concurrency Conflict State & Form State Preservation (409 Conflict, BR-16, AC-28)
- **Visual Alert**: When a status transition or ticket update yields HTTP 409 Conflict (`STALE_UPDATE_CONFLICT`), a prominent red banner is displayed at the top of the detail screen:
  `"Conflict: This ticket was updated by another team member while you were viewing it. Please review the updated status."`
- **Form State Preservation Contract**: The UI **strictly preserves all uncommitted user inputs** in open modals and forms (e.g. draft action description, draft result, draft follow-up notes). It does NOT wipe the form.
- **Resolution Action**: The banner provides a `"Refresh Ticket State"` button that re-fetches the current ticket state and updates the internal `updatedAt` / `expectedUpdatedAt` token, enabling the user to review the changes and submit without retyping.

---

## 7. Accessibility, Focus Trapping & Semantic Cues (Handout §10 & Part 6)

### 7.1 Modal Focus Trapping (`ActionTakenModal.tsx`)
- When the modal opens, programmatic focus is automatically placed on the first interactive form element (`actionDateTime` or `actionDescription`).
- A focus trap listener intercepts `Tab` and `Shift+Tab` keys, cycling focus strictly between modal inputs, checkboxes, the Cancel button, and the Save button.
- Pressing `Escape` or clicking the backdrop triggers cancellation and dismisses the modal.

### 7.2 Focus Restoration
- Upon closing the modal (either via Save or Cancel), focus is programmatically returned to the "+ Add Action Taken" button that opened it.

### 7.3 Semantic ARIA & Live Regions
- Modal container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="action-modal-title"`.
- Form validation error messages and 409 Conflict banners are announced via `aria-live="polite"` or `role="alert"`.
- Follow-up checkbox includes `aria-controls="followup-note-container"` and `aria-expanded` attributes.

### 7.4 Private vs Shared Content Separation
- Staff-only diagnostic content, Internal Notes, and operational triage controls use distinct visual framing: warm amber left borders (`border-left: 4px solid var(--zg-warning)`), light amber tint backgrounds, and clear "Staff Only" textual badges.
- Requesters never see or receive internal edit controls, preserving strict confidentiality.

---

## 8. Visual Polish & Acceptance Checklist (Pre-Implementation Acceptance Contract)

- [ ] **Visual Focus Indicators**: All interactive elements (buttons, inputs, links, metric cards) feature clear `--zg-primary` focus rings (`outline: 2px solid #006B3C; outline-offset: 2px`).
- [ ] **Non-Color Status Cues**: Status badges include distinct textual labels and distinct background shapes/borders alongside color.
- [ ] **Touch Targets**: All clickable targets meet Apple Human Interface Guidelines and WCAG 2.1 AAA Target Size (Enhanced) standards ($44\text{px} \times 44\text{px}$).
- [ ] **Empty States**: If a user has zero tickets or no actions taken, display friendly Zen Green illustration/icon and helpful prompt rather than an empty blank container.
- [ ] **Conflict Feedback (409)**: Clear, accessible alert banner prompting the user to reload the ticket without losing unsaved form text.
- [ ] **Safe Loading States**: Skeleton placeholders prevent layout shift across all metric cards and data tables.
- [ ] **No Clipping / Overlapping**: Cards, modals, and sticky action bars strictly avoid overlapping content or truncating critical IDs across 1280px, 768px, and 375px viewports.
