# Lab 2 UI Specification: Zen Green Theme Foundation

## 1. Visual Design Tokens & Palette

TokTickIT adopts the **Zen Green** design language, delivering a clean, modern, and accessible enterprise ticketing interface.

| Token / Element | Color Value | CSS Variable / Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` | `--color-primary`: App header, primary buttons, major headings, key emphasis |
| **Secondary Green** | `#0B7A46` | `--color-secondary`: Active tabs, focus rings, link text, button hover states |
| **Pale Green** | `#EAF6EF` | `--color-pale-green`: Card highlights, selected rows, success badge backgrounds |
| **Page Background** | `#F5F7F6` | `--color-bg-page`: Quiet, near-white neutral background |
| **Surface / Cards** | `#FFFFFF` | `--color-surface`: Card panels with subtle 1px border (`#E2E8F0`) and soft shadow |
| **Text Primary** | `#1A2E22` | `--color-text-primary`: Dark charcoal-green (not harsh black) for comfortable readability |
| **Text Muted** | `#5F7167` | `--color-text-muted`: Form helper text, timestamps, table column headers |
| **Editable Input** | `#FFFFFF` | Background with neutral `#CBD5E1` border; turns `#006B3C` with ring on focus |
| **Read-Only Input** | `#F1F5F2` | Soft gray-green shading with distinct non-editable appearance |
| **Error / Destructive** | `#DC2626` | Border and text for validation errors; soft `#FEF2F2` alert background |
| **Warning** | `#D97706` | Amber badges and callout notices for caution states |
| **Success** | `#15803D` | Green confirmation alerts and success badges |

---

## 2. Typography and Spacing

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Scale**:
  - `H1 / Page Title`: 24px (1.5rem), Semi-Bold (600), Line height 1.25.
  - `H2 / Section Title`: 18px (1.125rem), Semi-Bold (600), Line height 1.35.
  - `Body / Inputs`: 14px (0.875rem), Regular (400), Line height 1.5.
  - `Small / Badges / Helper`: 12px (0.75rem), Medium (500), Line height 1.4.
- **Spacing Grid**: 4px base increment (4px, 8px, 12px, 16px, 24px, 32px).
- **Form Controls Height**: 40px consistent height for inputs, selects, and standard buttons. Multiline textareas default to 120px height with vertical-only resize.

---

## 3. Component Hierarchy and State Styling

### 3.1 Buttons
- **Primary Action**: Solid `#006B3C` background, white text. Hover: `#0B7A46`. Active: `#00502D`.
- **Secondary Action**: White background, `#006B3C` text, 1px `#CBD5E1` border. Hover: `#EAF6EF`.
- **Destructive Action**: Soft red border/text or solid `#DC2626` for confirmed deletion actions.
- **Disabled State**: Background `#E2E8F0`, text `#94A3B8`, `cursor: not-allowed`, no hover interaction.
- **Busy / Loading State**: Spinner icon inside button, text updated (e.g., "Submitting..."), button disabled.

### 3.2 Form Inputs & Validation
- **Required Fields**: Label positioned above control with a red asterisk (`*`).
- **Validation Errors**: Red border (`#DC2626`) on the invalid control, accompanied by an explicit text error message immediately below the field.
- **Read-Only Fields**: Distinct soft gray-green background (`#F1F5F2`), lock/read-only indicator where applicable.

### 3.3 Badges
- **Status Badges**:
  - `NEW`: Pale green background (`#EAF6EF`), dark green text (`#006B3C`).
  - `OPEN` / `IN_PROGRESS`: Blue tint (`#EFF6FF`), dark blue text (`#1D4ED8`).
  - `RESOLVED` / `CLOSED`: Gray tint (`#F1F5F9`), slate text (`#475569`).
- **Priority Badges**:
  - `LOW`: Slate/Green (`#F0FDF4`, text `#166534`).
  - `MEDIUM`: Amber tint (`#FEF3C7`, text `#92400E`).
  - `HIGH` / `URGENT`: Red tint (`#FEE2E2`, text `#991B1B`).

---

## 4. Application Layout & Screen Specifications

### 4.1 Application Shell & Navigation
- **Top Header (`#006B3C`)**:
  - Left: TokTickIT logo and brand name.
  - Middle: Navigation links ("My Tickets", "Create Ticket") with clear active-tab underline indicator.
  - Right: Development Requester identity badge ("Current Requester: [Name]") and a "Change Requester" dropdown trigger.

### 4.2 Development Requester Selection Screen
- Centered modal/card displaying:
  - Title: "Select Development Requester"
  - Explanatory Notice: *"Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen."*
  - Select Dropdown loading only active requesters from PostgreSQL.
  - "Continue" button and empty/error fallback states.

### 4.3 Create Ticket Screen (Create Mode)
- Top Section: System-generated / read-only fields banner (Selected Requester name, Today's Date).
- Classification Grid: 2-column dropdown layout for Category, Related System, and Requested Priority.
- Content Area: Ticket Summary input (single line, full width) and Description textarea (multiline).
- Attachments Section: File dropzone / file picker supporting JPG, PNG, WEBP, PDF up to 5 MB each (max 5 active files) with live file size preview and removal before submit.
- Footer Actions: "Submit Ticket" (primary with busy state) and "Cancel" (secondary).

### 4.4 My Tickets Screen (List Mode)
- Header: Page title ("My Tickets"), subtitle, "Clear Filters" button, and "+ Create Ticket" primary button.
- Filter Bar:
  - Search input (searches Ticket Number & Summary).
  - Category dropdown filter.
  - Requested Priority dropdown filter.
  - Status dropdown filter.
- Data Table (Desktop) / Cards (Mobile):
  - Columns: Ticket No, Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Ticket Owner, Last Updated.
  - Interactive rows with click-to-open Ticket Detail.
- Pagination Bar: "Showing X to Y of Z tickets", Previous / Page Numbers / Next buttons.
- State Feedback:
  - **Loading**: Skeleton placeholder rows.
  - **Empty State**: Friendly illustration/icon with "No tickets found. Create your first support ticket."
  - **No-Results State**: "No tickets match your search or filter criteria. Try clearing filters."

### 4.5 Ticket Detail Screen (View Mode & Attachments)
- Header: Back to My Tickets link, Ticket Number, Created Date, Current Status badge, Priority badge.
- Detail Card (Read-Only): Category, Related System, Requester Name, Summary, and Description.
- Attachments Section:
  - List of active attachments with filename, size, uploaded date, "Download" button, and "Remove" action.
  - "+ Add Attachment" button (active if < 5 attachments exist).
  - Soft-Removed Attachments Table: Displays removed filename, removal timestamp, and removal reason badge; download button is permanently disabled with a "Removed" tag.
- Soft Removal Modal: Requires entering a non-empty removal reason (min 3 chars) before confirming deletion.

---

## 5. Responsive Behavior Rules

| Viewport | Breakpoint | Responsive Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | Multi-column layout; centered container with `max-width: 1200px`; full table display for My Tickets. |
| **Tablet** | $768\text{px} - 991\text{px}$ | 2-column form grids; condensed table with scrollable or stacked secondary columns; comfortable touch targets. |
| **Mobile** | $< 768\text{px}$ | Single-column stacked layout; form controls full-width; My Tickets converts from table to stacked cards; navigation collapses to a responsive drawer/menu; zero horizontal scrolling. |

---

## 6. Accessibility & Usability Standards

- **Keyboard Navigation**: All interactive elements (inputs, buttons, dropdowns, links, modals) are fully reachable via `Tab` with visible focus rings (`#006B3C` 2px ring).
- **Color Independence**: Badges and status indicators pair color with explicit text labels and icons so information is never conveyed by color alone.
- **Accessible Tooltips**: All icon-only buttons include `aria-label` and visible browser tooltips.
- **Form Association**: Every form input is strictly associated with a `<label htmlFor="...">`.

---

## 7. Visual Inspection Checklist & Screenshot Artifacts

During testing, screenshots must be saved to `artifacts/lab-02/screenshots/`:
- `artifacts/lab-02/screenshots/create-ticket/`:
  - `01-create-ticket-desktop.png` (Desktop initial form)
  - `02-create-ticket-validation-errors.png` (Field validation messages)
  - `03-create-ticket-submitting-busy.png` (Submit button loading/disabled state)
  - `04-create-ticket-success.png` (Success modal/message with generated Ticket Number)
  - `05-create-ticket-invalid-attachment.png` (Rejected file size/MIME message)
  - `06-create-ticket-api-failure-preserved.png` (Safe error state with preserved inputs)
- `artifacts/lab-02/screenshots/my-tickets/`:
  - `01-my-tickets-requester-a.png` (Tickets owned by Requester A)
  - `02-my-tickets-requester-b.png` (Switch to Requester B, A's tickets disappear)
  - `03-my-tickets-filter-search.png` (Search and category filter applied)
  - `04-my-tickets-empty-state.png` (Zero tickets state)
  - `05-my-tickets-no-results.png` (No matching search results)
  - `06-my-tickets-mobile-cards.png` (Mobile viewport $< 768\text{px}$ card view)
- `artifacts/lab-02/screenshots/ticket-detail/`:
  - `01-ticket-detail-view.png` (Read-only detail view)
  - `02-attachment-add-and-download.png` (Adding and downloading attachments)
  - `03-attachment-soft-removal.png` (Soft-removal modal with reason)
  - `04-attachment-removed-metadata.png` (Disabled download with visible reason)
  - `05-unauthorized-access-rejected.png` (Cross-requester access forbidden error)
