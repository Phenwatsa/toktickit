# TokTickIT Lab 3 — UI Specification & Apple-Style Zen Green Design System

This specification defines the visual standards, design tokens, component ergonomics, screen layouts, responsive behavior, and visual checklist for TokTickIT Sprint 3 (Lab 3).

---

## 1. Apple-Style Zen Green Design Philosophy

The TokTickIT user interface merges the **Zen Green** color identity from Lab 2 with the clean, minimalist principles of **Apple Human Interface Guidelines (HIG)**:
- **Clarity and Hierarchy**: High-contrast typography, generous whitespace, and purposeful color accents direct user attention without visual clutter.
- **Deference to Content**: UI chrome (headers, borders, backgrounds) recedes subtly so operational ticket data and user administration tasks stand out.
- **Micro-Interactions**: Smooth CSS transitions (150ms–200ms `ease-in-out`), tactile button feedback, and clear focus rings (`#006B3C` with 2px offset).
- **Physical Depth & Corners**: Refined border-radii (`8px` for inputs/badges, `12px` for cards/tables, `16px` for modal dialogs) coupled with delicate diffuse drop shadows (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)`).
- **Zero Horizontal Overflow**: Fluid table-to-card transformations ensure that no horizontal scrollbars occur across mobile and tablet viewports.

---

## 2. Design System Tokens

### 2.1 Color Palette

| Token | CSS Variable | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `--zg-primary` | `#006B3C` | Primary buttons, active navbar tab, brand logo, key icons |
| **Primary Dark / Hover**| `--zg-primary-hover` | `#00502D` | Hover and active states of primary buttons |
| **Secondary Accent** | `--zg-secondary` | `#0B7A46` | Secondary badges, subheaders, active toggle switches |
| **Pale Green Tint** | `--zg-pale-green` | `#EAF6EF` | Status `New`/`Open` badges, card highlight fills, selected rows |
| **Page Background** | `--zg-bg-page` | `#F5F7F6` | Universal page background (matte, anti-glare) |
| **Surface Card** | `--zg-bg-card` | `#FFFFFF` | Card containers, modal backgrounds, input fields |
| **Text Primary** | `--zg-text-primary`| `#1A202C` | Headings, table body text, primary labels (WCAG AAA) |
| **Text Secondary** | `--zg-text-muted` | `#64748B` | Timestamps, help text, placeholders, metadata labels |
| **Border Subtle** | `--zg-border` | `#E2E8F0` | Input outlines, table cell borders, card dividers |
| **Private Amber Fill** | `--zg-amber-bg` | `#FEF3C7` | Background highlight for Internal Notes |
| **Private Amber Border**| `--zg-amber-border`| `#F59E0B` | Border accent and icon for Internal Notes |
| **Private Amber Text** | `--zg-amber-text` | `#92400E` | Heading & badge for Internal Notes |
| **Error / Alert** | `--zg-danger` | `#DC2626` | Error banners, invalid field borders, deactivation badges |

### 2.2 Typography & Spacing
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Form Controls & Touch Targets**: Minimum touch target height of `44px` for all interactive buttons, inputs, and select elements.
- **Spacing Grid**: Multiples of 4px (`8px`, `12px`, `16px`, `24px`, `32px`).

---

## 3. Screen Structure & Mode Specifications

### 3.1 Login Screen (`/login`)
- **Mode**: Centered Apple-style card container ($420\text{px}$ max-width) on `#F5F7F6` backdrop.
- **Branding**: TokTickIT leaf icon in primary green with clean title "Sign in to your account".
- **Fields**:
  - Email Address (type `email`, required, autofocus).
  - Password (type `password`, toggleable show/hide eye icon).
- **Feedback & Validation**:
  - Inline error banner (`#DC2626`) with icon on failed login: *"Invalid email or password. Please try again."*
  - Busy state: Submit button shows spinner and label *"Signing in..."*, inputs disabled.
- **Excluded**: No "Forgot password" or "Create account" active flows.

### 3.2 Mandatory Password Change Interstitial (`/change-password`)
- **Mode**: Modal overlay or dedicated fullscreen interstitial card. The user cannot access other application routes until completion.
- **Header**: "Change Your Password — You must change your temporary password to continue".
- **Inputs**:
  - Current (Temporary) Password.
  - New Password.
  - Confirm New Password.
- **Live Checklist Indicators**:
  - [x] At least 8 characters
  - [x] Includes uppercase and lowercase letters
  - [x] Includes a number
- **Action**: "Save Password & Continue" button (disabled until validation criteria met).

### 3.3 Application Shell & Role Navigation Header
- **Left**: TokTickIT Brand Logo + Name.
- **Center Navigation Links**:
  - **Requester**: "My Tickets", "Create Ticket".
  - **IT Staff**: "Ticket Queue".
  - **Administrator**: "User Management", "Ticket Queue".
- **Right Profile Menu**:
  - Displays user full name.
  - Role pill badge (`Requester` in green, `IT Staff` in blue/secondary, `Admin` in purple/neutral).
  - Logout action button (clears token, routes to `/login`).
- **Decommissioned**: Development Requester dropdown is completely removed.

### 3.4 IT Staff Ticket Queue (`/staff/queue`)
- **Header Bar**: Queue title, total ticket counter chip, and quick search bar.
- **Single-Row Filter Bar**:
  - Category dropdown filter.
  - Requested Priority dropdown.
  - IT Priority dropdown.
  - Status multi/single select dropdown.
  - "Clear Filters" button (visible when filters are active).
- **Queue Table (Desktop $\ge 992\text{px}$)**:
  - Columns: Ticket No, Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner.
  - Zen Green status badges with rounded corners.
  - Clicking any row navigates to Ticket Detail.
- **Queue Cards (Mobile $< 768\text{px}$)**:
  - Responsive cards with ticket number, summary, dual priority badges, and status pill.
- **Pagination Controls**: Clean centered pagination with Previous, numbered pills, and Next buttons.
- **States**: Skeleton loading, Empty queue (no tickets in system), No-results state (filters matched zero items with "Reset filters" button).

### 3.5 IT Staff Ticket Detail (`/staff/tickets/:id`)
- **Back Navigation**: "< Back to Queue" link.
- **Header Card**:
  - Ticket Number and Created Date.
  - Requester information (Name, Email, Department).
  - Summary and multiline Description.
- **Operational Controls Card**:
  - **Ticket Owner**: Display current owner or "Unassigned". Actions: "Claim Ticket" (quick button) or "Reassign" dropdown.
  - **IT Priority**: Editable dropdown selector (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with save button.
  - **Current Status**: Workflow dropdown with status transition confirmation.
- **Communication Tabs / Panels**:
  - **Public Comments Panel** (`--zg-pale-green` subtle accent): For communication with Requester. Displays author, role, timestamp, and message.
  - **Internal Notes Panel** (`--zg-amber-bg` amber border accent with "Confidential" badge): Private notes strictly visible to IT Staff and Admin.
  - Comment input box with "Post Public Comment" and "Add Internal Note" buttons.
- **Attachments Card**: Lists existing attachments from Lab 2 with file size and download button.

### 3.6 Administrator User Management (`/admin/users`)
- **Header Bar**: "User Management", user count badge, and "+ Create User" primary action button.
- **Controls**: Search input (by name or email) and Role filter dropdown (`All`, `Requester`, `IT Staff`, `Administrator`).
- **User List Table (Desktop)**:
  - Columns: Name, Email, Role badge, Status badge (`Active` green / `Inactive` gray), and Edit button.
- **Create User Drawer / Modal**:
  - Inputs: Full Name, Email, Role selector (single radio/dropdown), Active toggle, Initial Password field.
  - Hint text: *"User will be prompted to set a new password on first login."*
- **Edit User Drawer / Modal**:
  - Edit Name, Email, Role, and Active switch.
  - "Reset Initial Password" action button.
  - **Safety Guard Warning**: If the admin edits their own account, the "Active" toggle is disabled with the warning: *"You cannot deactivate your own administrator account."*
  - **Last Admin Guard**: If the admin is the sole active administrator, deactivation or role demotion is disabled with an explanatory tooltip.

---

## 4. Responsive Layout Strategy & Breakpoints

| Viewport | Width Range | Layout Strategy |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | Full 8-column queue table, two-column form layouts, side-by-side modal panels |
| **Tablet** | $768\text{px} - 991\text{px}$ | Compact table with scroll container or condensed columns, touch-friendly 44px targets |
| **Mobile** | $< 768\text{px}$ | Full transformation of tables to stacked cards (`zg-mobile-card`), single-column forms, full-width buttons, collapsible hamburger navigation, strictly **Zero Horizontal Scroll** |

---

## 5. Visual Inspection Checklist

Prior to release, the following checklist must be satisfied across Desktop, Tablet, and Mobile:
- [ ] **Design Consistency**: Zen Green primary (`#006B3C`), secondary (`#0B7A46`), and pale (`#EAF6EF`) applied uniformly.
- [ ] **Role Navigation**: Navbar shows only permitted links according to active user role.
- [ ] **Badges**: Distinct colors for Statuses, Priorities, and Roles with consistent typography.
- [ ] **Field Contrast**: Clean contrast between editable inputs and read-only text fields.
- [ ] **Validation Feedback**: Red validation errors render directly beneath the offending input field.
- [ ] **Focus Rings**: Keyboard focus indicator (`outline: 2px solid #006B3C; outline-offset: 2px`) visible on all interactive elements.
- [ ] **Visual Distinction**: Public Comments (green accent) and Internal Notes (amber accent) cannot be visually confused.
- [ ] **No Overflow**: `document.documentElement.scrollWidth === window.innerWidth` across all viewports (no accidental horizontal scrollbars).
