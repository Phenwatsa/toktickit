# TokTickIT Lab 3 — REST API Specification

This document defines the complete REST API contract for TokTickIT Sprint 3 (Lab 3). It details endpoint paths, HTTP methods, authentication headers, request and response payloads, query parameters, authorization rules, and standardized safe error schemas.

---

## 1. Authentication & Session Architecture

### 1.1 Mechanism: Stateless JWT with Server-Side `tokenVersion` Revocation
To combine high performance with immediate server-side revocation on logout, the application employs a **JWT Bearer Token backed by a `tokenVersion` on the User model**:
- **Token Delivery**: Clients transmit the token via standard HTTP Header:
  `Authorization: Bearer <token>`
- **Token Payload Schema**:
  ```json
  {
    "userId": 1,
    "email": "jennifer.anderson@toktickit.com",
    "role": "REQUESTER",
    "tokenVersion": 1,
    "mustChangePassword": false,
    "iat": 1726400000,
    "exp": 1726486400
  }
  ```
- **Logout / Invalidation Lifecycle**:
  1. When a user calls `POST /api/auth/logout`, the backend executes `prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })`.
  2. The authentication middleware (`requireAuth`) inspects incoming JWTs, decoding `tokenVersion` and comparing it against the live user record:
     - If `decoded.tokenVersion !== user.tokenVersion`, the token is recognized as revoked and the server returns `401 Unauthorized`.
     - If the user account has `isActive: false`, the server returns `401 Unauthorized`.
  3. This completely resolves the stateless JWT logout problem without requiring Redis or complex infrastructure.

### 1.2 Standardized Safe Error Schema
All error responses adhere to a consistent, safe JSON payload:
```json
{
  "error": "Human-readable error explanation",
  "code": "STANDARDIZED_ERROR_CODE",
  "details": [
    {
      "field": "email",
      "message": "Valid email address is required"
    }
  ]
}
```

### 1.3 Global First-Login Password Change Enforcement (`requirePasswordChanged`)
All protected functional endpoints across Staff Queue, Ticket Detail, Operations, Comments, Notes, Requester Operations, and Admin User Management execute the `requirePasswordChanged` middleware following JWT verification:
* **Enforcement Rule**: If an authenticated user's `mustChangePassword === true`, access to functional endpoints is blocked immediately:
  - **HTTP Status**: `403 Forbidden`
  - **Payload**:
    ```json
    {
      "error": "Password change required before accessing application features.",
      "code": "PASSWORD_CHANGE_REQUIRED"
    }
    ```
* **Exempted Routes**:
  - `POST /api/auth/change-password` (to update initial password)
  - `POST /api/auth/logout` (to terminate session)
  - `GET /api/auth/me` (to inspect current user profile and flag status)

---

## 2. Authentication Endpoints

### 2.1 Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "string (valid email, required)",
    "password": "string (required)"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@toktickit.com",
      "role": "REQUESTER",
      "department": "Engineering",
      "mustChangePassword": false,
      "isActive": true
    }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "error": "Invalid input data", "code": "VALIDATION_ERROR", "details": [{ "field": "email", "message": "Email is required" }] }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Invalid email or password", "code": "INVALID_CREDENTIALS" }
    ```
    *(Note: Deactivated accounts also return this generic message to prevent account discovery)*

### 2.2 Logout
* **Endpoint**: `POST /api/auth/logout`
* **Access**: Authenticated (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
* **Request Body**: None
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token (`{ "error": "Authentication required", "code": "UNAUTHORIZED" }`).

### 2.3 Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Access**: Authenticated (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@toktickit.com",
      "role": "REQUESTER",
      "department": "Engineering",
      "mustChangePassword": false,
      "isActive": true
    }
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: Token invalid or account deactivated (`{ "error": "Session expired or invalid", "code": "UNAUTHORIZED" }`).

### 2.4 Change Password (Mandatory First-Login / Self-Service)
* **Endpoint**: `POST /api/auth/change-password`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "currentPassword": "string (required)",
    "newPassword": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number, required)",
    "confirmPassword": "string (must match newPassword, required)"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Password changed successfully",
    "mustChangePassword": false
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Passwords do not match or complexity rules failed (`{ "error": "New password does not meet security requirements", "code": "PASSWORD_POLICY_ERROR" }`).
  - `401 Unauthorized`: Current password verification failed (`{ "error": "Current password is incorrect", "code": "INVALID_CURRENT_PASSWORD" }`).

---

## 3. IT Staff Ticket Queue & Operations

> [!NOTE]
> **Canonical Ticket Statuses**: The backend API strictly exchanges uppercase ENUM values: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`. The frontend renders corresponding display labels (`New`, `In Progress`, etc.).
> **Role Restriction**: In accordance with the course specification (§4.3), all staff ticketing operations are strictly restricted to `IT_STAFF`. `ADMINISTRATOR` and `REQUESTER` users receive `403 Forbidden`.

### 3.1 Retrieve Staff Ticket Queue
* **Endpoint**: `GET /api/staff/tickets`
* **Access**: `IT_STAFF`
* **Query Parameters**:
  - `search` (string, optional): Search keyword against `ticketNumber` and `summary`.
  - `status` (string, optional): Filter by single status or comma-separated list (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
  - `categoryId` (number, optional): Filter by category ID.
  - `requestedPriority` (string, optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `itPriority` (string, optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `ownerId` (number | string, optional): IT Staff ID or `'unassigned'`.
  - `sortBy` (string, optional): `createdAt`, `updatedAt`, `ticketNumber`, `itPriority`. Default: `createdAt`.
  - `sortOrder` (string, optional): `asc`, `desc`. Default: `desc`.
  - `page` (number, optional): Default: `1`.
  - `pageSize` (number, optional): Default: `10`.
* **Success Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 1, "name": "Hardware" },
        "requestedPriority": "MEDIUM",
        "itPriority": "MEDIUM",
        "currentStatus": "IN_PROGRESS",
        "requester": { "id": 4, "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
        "ticketOwner": { "id": 2, "name": "Michael Brown", "email": "michael@toktickit.com" },
        "createdAt": "2026-05-13T09:14:00Z",
        "updatedAt": "2026-05-13T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalRecords": 87,
      "totalPages": 9
    }
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: User role is not `IT_STAFF` (e.g. `REQUESTER` or `ADMINISTRATOR`) (`{ "error": "Access denied. Ticket queue is restricted to IT Staff.", "code": "FORBIDDEN" }`).

### 3.2 Retrieve Single Ticket Detail (Staff View)
* **Endpoint**: `GET /api/staff/tickets/:id`
* **Access**: `IT_STAFF`
* **Success Response (`200 OK`)**:
  ```json
  {
    "ticket": {
      "id": 12,
      "ticketNumber": "TKT-2026-000012",
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining much faster than usual even when idle.",
      "category": { "id": 1, "name": "Hardware" },
      "relatedSystem": { "id": 3, "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "IN_PROGRESS",
      "problemAppearsResolved": false,
      "requester": { "id": 4, "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
      "ticketOwner": { "id": 2, "name": "Michael Brown", "email": "michael@toktickit.com" },
      "createdAt": "2026-05-13T09:14:00Z",
      "updatedAt": "2026-05-13T10:30:00Z",
      "attachments": [
        {
          "id": 1,
          "fileName": "battery_report.png",
          "fileSize": 102400,
          "mimeType": "image/png",
          "url": "/uploads/battery_report.png"
        }
      ],
      "publicComments": [
        {
          "id": 1,
          "content": "We have ordered replacement parts.",
          "createdAt": "2026-05-13T09:30:00Z",
          "author": { "id": 2, "name": "Michael Brown", "role": "IT_STAFF" }
        }
      ],
      "internalNotes": [
        {
          "id": 1,
          "content": "Battery diagnostic shows 62% wear. Vendor ticket #9941.",
          "createdAt": "2026-05-13T09:35:00Z",
          "author": { "id": 2, "name": "Michael Brown", "role": "IT_STAFF" }
        }
      ]
    }
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Requester attempted to access staff detail (`{ "error": "Access denied.", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket does not exist (`{ "error": "Ticket not found", "code": "NOT_FOUND" }`).

### 3.3 Claim Ticket Ownership
* **Endpoint**: `PATCH /api/staff/tickets/:id/claim`
* **Access**: `IT_STAFF`
* **Request Body**: None (assigns authenticated user)
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Ticket successfully claimed",
    "ticketOwner": { "id": 2, "name": "Michael Brown", "email": "michael@toktickit.com" }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Ticket is already closed or cancelled (`{ "error": "Cannot claim a closed or cancelled ticket", "code": "INVALID_STATE" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-IT Staff user (`{ "error": "Access denied. IT Staff role required.", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket not found.

### 3.4 Reassign Ticket Ownership
* **Endpoint**: `PATCH /api/staff/tickets/:id/assign`
* **Access**: `IT_STAFF`
* **Request Body**:
  ```json
  {
    "newOwnerId": 3
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Ticket reassigned successfully",
    "ticketOwner": { "id": 3, "name": "Sarah Johnson", "email": "sarah@toktickit.com" }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Target user is inactive or not an IT Staff (`{ "error": "Target user must be an active IT Staff member", "code": "INVALID_OWNER" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-IT Staff user (`{ "error": "Access denied. IT Staff role required.", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket or target user not found.

### 3.5 Update IT Priority
* **Endpoint**: `PATCH /api/staff/tickets/:id/priority`
* **Access**: `IT_STAFF`
* **Request Body**:
  ```json
  {
    "itPriority": "HIGH"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "IT Priority updated",
    "itPriority": "HIGH"
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Invalid priority value (`{ "error": "Priority must be LOW, MEDIUM, HIGH, or URGENT", "code": "VALIDATION_ERROR" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-IT Staff user.
  - `404 Not Found`: Ticket not found.

### 3.6 Transition Ticket Status
* **Endpoint**: `PATCH /api/staff/tickets/:id/status`
* **Access**: `IT_STAFF`
* **Request Body**:
  ```json
  {
    "status": "WAITING_FOR_REQUESTER"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Ticket status transitioned",
    "currentStatus": "WAITING_FOR_REQUESTER"
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Status transition violates state matrix (`{ "error": "Invalid status transition from IN_PROGRESS to CLOSED. Ticket must be RESOLVED first.", "code": "INVALID_TRANSITION" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-IT Staff user.
  - `404 Not Found`: Ticket not found.

---

## 4. Public Comments & Internal Notes

### 4.1 Get Public Comments
* **Endpoint**: `GET /api/tickets/:id/comments`
* **Access**: Ticket Requester Owner, `IT_STAFF` (Returns `403 Forbidden` for other users or Administrators)
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "content": "Thank you for the update. Please let me know if you need any additional information.",
      "createdAt": "2026-05-13T11:45:00Z",
      "author": { "id": 4, "name": "Jennifer Anderson", "role": "REQUESTER" }
    }
  ]
  ```
* **Error Responses**:
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: User is not the ticket owner or an IT Staff member (`{ "error": "Access denied", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket not found.

### 4.2 Post Public Comment
* **Endpoint**: `POST /api/tickets/:id/comments`
* **Access**: Ticket Requester Owner, `IT_STAFF`
* **Request Body**:
  ```json
  {
    "content": "string (min 2, max 2000 chars, non-whitespace)"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": 2,
    "content": "We have received replacement parts.",
    "createdAt": "2026-05-13T12:00:00Z",
    "author": { "id": 2, "name": "Michael Brown", "role": "IT_STAFF" }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Empty or whitespace-only content (`{ "error": "Comment content cannot be empty", "code": "VALIDATION_ERROR" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: User is neither the ticket owner nor an IT Staff member.
  - `404 Not Found`: Ticket not found.

### 4.3 Get Internal Notes
* **Endpoint**: `GET /api/tickets/:id/notes`
* **Access**: `IT_STAFF` (Strictly **FORBIDDEN** for `REQUESTER` and `ADMINISTRATOR`)
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "content": "Battery diagnostic shows 62% battery wear. Ordering replacement pack.",
      "createdAt": "2026-05-13T10:00:00Z",
      "author": { "id": 2, "name": "Michael Brown", "role": "IT_STAFF" }
    }
  ]
  ```
* **Error Responses**:
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Requesters and Administrators receive safe rejection without leaking note existence (`{ "error": "Access denied. Internal notes are restricted to IT staff.", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket not found.

### 4.4 Post Internal Note
* **Endpoint**: `POST /api/tickets/:id/notes`
* **Access**: `IT_STAFF` (Strictly **FORBIDDEN** for `REQUESTER` and `ADMINISTRATOR`)
* **Request Body**:
  ```json
  {
    "content": "string (min 2, max 2000 chars, non-whitespace)"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": 2,
    "ticketId": 12,
    "content": "Battery diagnostic shows 62% battery wear. Ordering replacement pack.",
    "createdAt": "2026-05-13T10:05:00Z",
    "author": { "id": 2, "name": "Michael Brown", "role": "IT_STAFF" }
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Empty or whitespace content.
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Forbidden for Requester and Administrator.
  - `404 Not Found`: Ticket not found.

---

## 5. Requester Operations

### 5.1 Mark Problem Appears Resolved
* **Endpoint**: `PATCH /api/requester/tickets/:id/resolve-indication`
* **Access**: Authenticated ticket owner (`REQUESTER`)
* **Request Body**: None or `{ "problemAppearsResolved": true }`
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Problem indicated as resolved. IT Staff notified.",
    "problemAppearsResolved": true
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: User is not the ticket owner (`{ "error": "Access denied. You do not own this ticket.", "code": "FORBIDDEN" }`) or user role is not `REQUESTER` (`{ "error": "Access denied. Requester role required.", "code": "FORBIDDEN" }`).
  - `404 Not Found`: Ticket not found.

### 5.2 Ticket Submission Contract (Continuity & `itPriority` Initialization)
* **Endpoint**: `POST /api/tickets`
* **Access**: Authenticated `REQUESTER`
* **Request Body**:
  ```json
  {
    "summary": "Cannot access internal network printer",
    "description": "Printer on 3rd floor shows offline state continuously.",
    "requestedPriority": "HIGH",
    "categoryId": 1,
    "relatedSystemId": 2
  }
  ```
* **Initialization Contract (BR-11)**:
  - **`itPriority` Initialization**: The application service layer explicitly initializes `itPriority` to the exact value of `requestedPriority` (`itPriority: requestedPriority`). The database schema enforces `NOT NULL` on `itPriority`.
  - **Session-Derived Requester**: The backend binds `requesterId` strictly from the authenticated JWT session (`req.user.id`), discarding any client-provided requester ID.
  - **Initial Status**: Initial status is automatically set to `NEW`.
* **Success Response (`201 Created`)**: Returns full created ticket object including `requestedPriority: "HIGH"`, `itPriority: "HIGH"`, and `currentStatus: "NEW"`.

### 5.3 Lab 2 Requester Endpoints Continuity Contract (FR-06, BR-03, AC-03, AC-20)
All ticket queries and attachment operations established in Lab 2 continue to be supported with 100% functional continuity, upgraded to enforce **Bearer JWT Authentication** and **Ownership Isolation**:

* **List My Tickets**: `GET /api/tickets`
  - **Access**: Authenticated `REQUESTER` (isolated by session `req.user.id`). IT Staff use `GET /api/staff/tickets` to inspect all system tickets.
  - **Behavior**: Returns tickets created by the authenticated requester. Query parameters attempting to override identity (e.g. `?requesterId=...`) are strictly ignored.
* **Single Ticket Detail**: `GET /api/tickets/:id`
  - **Access**: Ticket Requester Owner or `IT_STAFF`.
  - **Behavior**: If accessed by a Requester who does not own the ticket, returns `403 Forbidden` (`{ "error": "Access denied. You do not own this ticket.", "code": "FORBIDDEN" }`). Requester view excludes `internalNotes`.
* **Attachment Upload**: `POST /api/tickets/:id/attachments`
  - **Access**: Ticket Requester Owner or `IT_STAFF`.
  - **Behavior**: Requesters may upload attachments only to tickets they own. Non-owner Requesters receive `403 Forbidden`. Multipart validation (max 5 MB; allowed formats: JPG, PNG, WebP, PDF) remains unchanged from Lab 2.
* **Attachment Soft-Delete**: `DELETE /api/tickets/:id/attachments/:attachmentId`
  - **Access**: Ticket Requester Owner or `IT_STAFF`.
  - **Behavior**: Requesters may soft-delete attachments only on tickets they own. Non-owner Requesters receive `403 Forbidden`.

---

## 6. Administrator User Management

### 6.1 List Users
* **Endpoint**: `GET /api/admin/users`
* **Access**: `ADMINISTRATOR`
* **Query Parameters**:
  - `search` (string, optional): Search by name or email.
  - `role` (string, optional): `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john.smith@toktickit.com",
      "role": "ADMINISTRATOR",
      "department": "IT Operations",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-01-10T08:00:00Z"
    }
  ]
  ```
* **Error Responses**:
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-admin user (`{ "error": "Access denied. Administrator privilege required.", "code": "FORBIDDEN" }`).

### 6.2 Create User
* **Endpoint**: `POST /api/admin/users`
* **Access**: `ADMINISTRATOR`
* **Request Body**:
  ```json
  {
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "department": "Service Desk",
    "isActive": true,
    "initialPassword": "Password123!"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": 15,
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "department": "Service Desk",
    "isActive": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-15T12:00:00Z"
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Validation failure (`{ "error": "Missing required fields", "code": "VALIDATION_ERROR" }`).
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-admin user.
  - `409 Conflict`: Email duplicate (`{ "error": "A user with this email address already exists.", "code": "DUPLICATE_EMAIL" }`).

### 6.3 Update User
* **Endpoint**: `PATCH /api/admin/users/:id`
* **Access**: `ADMINISTRATOR`
* **Request Body**:
  ```json
  {
    "name": "Alex Thompson Updated",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": false
  }
  ```
* **Success Response (`200 OK`)**: Returns updated user object.
* **Error Responses**:
  - `400 Bad Request (Self-Deactivation)`:
    ```json
    { "error": "Administrators cannot deactivate their own account.", "code": "SELF_DEACTIVATION_BLOCKED" }
    ```
  - `400 Bad Request (Last Admin Guard)`:
    ```json
    { "error": "Cannot deactivate or demote the last remaining active administrator.", "code": "LAST_ADMIN_PROTECTED" }
    ```
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-admin user.
  - `404 Not Found`: Target user not found.
  - `409 Conflict`: New email address is already taken by another user.

### 6.4 Reset User Initial Password
* **Endpoint**: `POST /api/admin/users/:id/reset-password`
* **Access**: `ADMINISTRATOR`
* **Request Body**:
  ```json
  {
    "newInitialPassword": "TemporaryPass123!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Initial password reset successfully. User must change password at next login.",
    "mustChangePassword": true
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Invalid password complexity.
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Non-admin user.
  - `404 Not Found`: User not found.
