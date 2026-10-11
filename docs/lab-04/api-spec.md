# TokTickIT Lab 4 — REST API Specification

This document defines the authoritative REST API contracts for TokTickIT Sprint 4 (Lab 4). It specifies endpoint paths, HTTP methods, authentication headers, request and response payloads, status codes, RBAC rules, standardized error schemas, and optimistic concurrency control.

---

## 1. Authentication & Common Conventions

### 1.1 Headers & Lab 3 Authentication Architecture Reconciliation
All protected endpoints require an authenticated JWT Bearer token adhering strictly to the established Lab 3 security middleware (`server/src/middleware/auth.ts`):
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```
* **Payload Structure**: The JWT payload contains `{ userId: number, email: string, role: Role, tokenVersion: number, mustChangePassword: boolean }`.
* **Session Lifecycle & Revocation**: Handled via `requireAuth` middleware. If `tokenVersion` in the JWT does not match the active `tokenVersion` in the database, or if the user is inactive (`isActive === false`), the request is rejected immediately with `HTTP 401 Unauthorized` (`UNAUTHORIZED`).
* **Session Attribution**: Authenticated user identity (`req.user`) is injected into the Express request context for automated actor attribution (`performedById = req.user.id`).
* **Backward Compatibility**: Completely preserves existing authentication, login, and password change flows from Lab 3.

### 1.2 Standardized Safe Error Schema
All error responses across all endpoints adhere strictly to a uniform JSON envelope:
```json
{
  "error": "Human-readable error explanation",
  "code": "STANDARDIZED_ERROR_CODE",
  "details": [
    {
      "field": "optionalField",
      "message": "Specific field validation message"
    }
  ],
  "currentUpdatedAt": "2026-10-10T14:35:00.000Z"
}
```
* **Mandatory Fields**: `error` (string), `code` (string), and `details` (array of objects; empty `[]` when no sub-field details exist).
* **Conditional Field**: `currentUpdatedAt` (ISO 8601 string) is permitted exclusively on `HTTP 409 Conflict` to provide the client with the authoritative database timestamp for synchronization.

### 1.3 Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Entity successfully created.
- `400 Bad Request`: Payload validation failed, required fields missing, or invalid status transition.
- `401 Unauthorized`: Missing, malformed, expired, or revoked JWT token (`tokenVersion` mismatch).
- `403 Forbidden`: Authenticated user lacks permission for the requested action or entity.
- `404 Not Found`: Target entity does not exist.
- `409 Conflict`: Concurrency conflict detected (stale update on ticket).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken for Ticket
- **Endpoint**: `GET /api/tickets/:id/actions`
- **Authorized Roles**: `REQUESTER` (owned tickets only), `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Ticket ID (integer)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "ticketId": 10,
      "actionDateTime": "2026-10-10T14:30:00.000Z",
      "actionDescription": "Checked server logs and identified failing Redis cache node.",
      "result": "Restarted Redis service and verified connection pool recovery.",
      "performedBy": {
        "id": 2,
        "name": "Alex Taylor",
        "email": "alex.taylor@toktickit.com",
        "role": "IT_STAFF"
      },
      "isFollowUpRequired": true,
      "followUpNote": "Monitor Redis memory threshold over the next 24 hours.",
      "attachmentNotes": "Log extract saved in redis-error-oct10.log",
      "createdAt": "2026-10-10T14:32:00.000Z",
      "updatedAt": "2026-10-10T14:32:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Requester attempts to view other user's ticket actions):
    ```json
    { "error": "You do not have permission to view actions on this ticket", "code": "FORBIDDEN", "details": [] }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Ticket not found", "code": "NOT_FOUND", "details": [] }
    ```

---

### 2.2 Create Action Taken
- **Endpoint**: `POST /api/tickets/:id/actions`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Ticket ID (integer)
- **Request Body**:
  ```json
  {
    "actionDateTime": "2026-10-10T14:30:00.000Z",
    "actionDescription": "Checked server logs and identified failing Redis cache node.",
    "result": "Restarted Redis service and verified connection pool recovery.",
    "isFollowUpRequired": true,
    "followUpNote": "Monitor Redis memory threshold over the next 24 hours.",
    "attachmentNotes": "Log extract saved in redis-error-oct10.log"
  }
  ```
- **Validation Rules**:
  - `actionDescription`: String, 5–2000 characters (required).
  - `result`: String, 3–2000 characters (required).
  - `actionDateTime`: Valid ISO-8601 UTC date string (`YYYY-MM-DDTHH:mm:ss.sssZ`) (optional, defaults to server current UTC timestamp).
  - `isFollowUpRequired`: Boolean (optional, default `false`).
  - `followUpNote`: String, **strictly required** when `isFollowUpRequired === true` (minimum 3 non-whitespace characters; values that are empty, whitespace-only, or under 3 non-whitespace characters are rejected); optional or null when `false`.
  - `attachmentNotes`: String, max 500 characters (optional).
  - `performedById`: **Auto-populated** from authenticated session user ID (`req.user.id`). Any client-supplied performer ID is ignored.
- **Response**: `201 Created`
  ```json
  {
    "id": 1,
    "ticketId": 10,
    "actionDateTime": "2026-10-10T14:30:00.000Z",
    "actionDescription": "Checked server logs and identified failing Redis cache node.",
    "result": "Restarted Redis service and verified connection pool recovery.",
    "performedBy": {
      "id": 2,
      "name": "Alex Taylor",
      "email": "alex.taylor@toktickit.com",
      "role": "IT_STAFF"
    },
    "isFollowUpRequired": true,
    "followUpNote": "Monitor Redis memory threshold over the next 24 hours.",
    "attachmentNotes": "Log extract saved in redis-error-oct10.log",
    "createdAt": "2026-10-10T14:32:00.000Z",
    "updatedAt": "2026-10-10T14:32:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Validation error):
    ```json
    {
      "error": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "followUpNote",
          "message": "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
        }
      ]
    }
    ```
  - `400 Bad Request` (Ticket cancelled):
    ```json
    { "error": "Cannot add Actions Taken to a cancelled ticket", "code": "TICKET_CANCELLED", "details": [] }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Requester attempts creation):
    ```json
    { "error": "Access denied. Only IT Staff and Administrators may record Actions Taken", "code": "FORBIDDEN", "details": [] }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Ticket not found", "code": "NOT_FOUND", "details": [] }
    ```

---

### 2.3 Update Action Taken
- **Endpoint**: `PATCH /api/tickets/:id/actions/:actionId`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Ticket ID (integer)
  - `actionId`: Action Taken ID (integer)
  - **Ticket Scoping Invariant**: The backend verifies that `action.ticketId === :id`. If `actionId` does not exist or does not belong to ticket `:id`, the backend returns `404 Not Found` (`NOT_FOUND`) with message `"Action Taken record not found under this ticket"`.
- **Request Body**:
  ```json
  {
    "actionDescription": "Updated action details after secondary inspection.",
    "result": "System stabilized and latency returned to normal levels.",
    "isFollowUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Updated diagnostic log"
  }
  ```
- **Validation Rules**:
  - `actionDescription`: String, 5–2000 characters (optional on update).
  - `result`: String, 3–2000 characters (optional on update).
  - `isFollowUpRequired`: Boolean (optional on update).
  - `followUpNote`: String (optional on update). Evaluated against effective state: if resulting `isFollowUpRequired === true`, `followUpNote` must contain at least 3 non-whitespace characters; if `isFollowUpRequired === false`, `followUpNote` may be null or cleared.
  - `attachmentNotes`: String, max 500 characters (optional on update).
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "ticketId": 10,
    "actionDateTime": "2026-10-10T14:30:00.000Z",
    "actionDescription": "Updated action details after secondary inspection.",
    "result": "System stabilized and latency returned to normal levels.",
    "performedBy": {
      "id": 2,
      "name": "Alex Taylor"
    },
    "isFollowUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Updated diagnostic log",
    "createdAt": "2026-10-10T14:32:00.000Z",
    "updatedAt": "2026-10-10T15:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Validation error):
    ```json
    {
      "error": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "followUpNote",
          "message": "Follow-up note is required (minimum 3 non-whitespace characters) when follow-up is needed"
        }
      ]
    }
    ```
  - `400 Bad Request` (Ticket cancelled):
    ```json
    { "error": "Cannot modify Actions Taken on a cancelled ticket", "code": "TICKET_CANCELLED", "details": [] }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Requester attempts update):
    ```json
    { "error": "Access denied. Only IT Staff and Administrators may modify Actions Taken", "code": "FORBIDDEN", "details": [] }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Action Taken record not found under this ticket", "code": "NOT_FOUND", "details": [] }
    ```

---

## 3. Ticket Workflow, Resolution Gate & Concurrency Endpoints

### 3.0 Concurrency Protection Scope
* **Scope Boundary**: Optimistic concurrency control via mandatory `expectedUpdatedAt` is strictly mandated for **Ticket Status Transitions** (`PATCH /api/staff/tickets/:id/status`), where concurrent triage/resolution between staff members poses a severe race condition risk.
* **Actions Taken Record Scope**: Individual `ActionTaken` entries represent discrete, chronological audit logs ($1:N$). Edits to an individual Action Taken (`PATCH /api/tickets/:id/actions/:actionId`) are audited and tracked via Prisma's model-level `@updatedAt` timestamp and do not mutate or conflict with overall ticket status transitions.

### 3.1 Transition Ticket Status (with Mandatory Concurrency Protection)
- **Endpoint**: `PATCH /api/staff/tickets/:id/status`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Ticket ID (integer)
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "expectedUpdatedAt": "2026-10-10T12:00:00.000Z"
  }
  ```
- **Validation & Enforcement Rules**:
  - `status`: String, **strictly required**. Must be one of `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Must satisfy the Permitted 8-Status Transition Matrix (BR-07).
  - **Resolution Gate**: Only `IT_STAFF` or `ADMINISTRATOR` can invoke this endpoint to transition to `RESOLVED` or `CLOSED`. Requesters are blocked with `403 Forbidden`.
  - **Mandatory Optimistic Concurrency Check**:
    - `expectedUpdatedAt`: ISO-8601 UTC string, **strictly required**.
    - Evaluates 3 distinct concurrency scenarios:
      1. **Missing**: If `expectedUpdatedAt` is omitted, null, or empty, returns `400 Bad Request` (`VALIDATION_ERROR`).
      2. **Malformed**: If `expectedUpdatedAt` is not a valid ISO-8601 date string, returns `400 Bad Request` (`VALIDATION_ERROR`).
      3. **Stale/Mismatched**: If `new Date(expectedUpdatedAt).getTime() !== new Date(ticket.updatedAt).getTime()`, returns `409 Conflict` (`STALE_UPDATE_CONFLICT`) with current timestamp.
- **Response**: `200 OK`
  ```json
  {
    "message": "Ticket status transitioned successfully",
    "currentStatus": "RESOLVED",
    "updatedAt": "2026-10-10T14:40:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Missing expectedUpdatedAt):
    ```json
    {
      "error": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "expectedUpdatedAt",
          "message": "expectedUpdatedAt timestamp is required for concurrency control"
        }
      ]
    }
    ```
  - `400 Bad Request` (Malformed expectedUpdatedAt):
    ```json
    {
      "error": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "expectedUpdatedAt",
          "message": "expectedUpdatedAt must be a valid ISO-8601 UTC date string"
        }
      ]
    }
    ```
  - `400 Bad Request` (Invalid status transition):
    ```json
    {
      "error": "Cannot transition status from NEW to RESOLVED. Permitted transitions from NEW are: OPEN, CANCELLED",
      "code": "INVALID_TRANSITION",
      "details": []
    }
    ```
  - `400 Bad Request` (Ticket cancelled):
    ```json
    { "error": "Cannot transition status of a cancelled ticket", "code": "TICKET_CANCELLED", "details": [] }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden`:
    ```json
    { "error": "Access denied. Only IT Staff and Administrators may transition ticket status", "code": "FORBIDDEN", "details": [] }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Ticket not found", "code": "NOT_FOUND", "details": [] }
    ```
  - `409 Conflict` (Stale-update conflict):
    ```json
    {
      "error": "Conflict: Ticket has been modified by another user. Please refresh and try again",
      "code": "STALE_UPDATE_CONFLICT",
      "details": [
        {
          "field": "expectedUpdatedAt",
          "message": "Provided timestamp does not match current ticket updatedAt timestamp"
        }
      ],
      "currentUpdatedAt": "2026-10-10T14:35:00.000Z"
    }
    ```

---

### 3.2 Requester Advisory Resolution Indication
- **Endpoint**: `PATCH /api/requester/tickets/:id/resolve-indication`
- **Authorized Roles**: `REQUESTER` (owner only)
- **Description**: Requesters indicate that the issue appears resolved. Sets `problemAppearsResolved = true` without modifying `currentStatus`.
- **Response**: `200 OK`
  ```json
  {
    "message": "Problem indicated as resolved. IT Staff will review and formally resolve the ticket",
    "problemAppearsResolved": true,
    "currentStatus": "IN_PROGRESS"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Ticket cancelled):
    ```json
    { "error": "Cannot submit resolution indication on a cancelled ticket", "code": "TICKET_CANCELLED", "details": [] }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (User does not own ticket or is not Requester):
    ```json
    { "error": "Access denied. Only the ticket requester can indicate resolution", "code": "FORBIDDEN", "details": [] }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Ticket not found", "code": "NOT_FOUND", "details": [] }
    ```

---

## 4. Role-Appropriate Dashboard Endpoints

### 4.1 Requester Dashboard Metrics
- **Endpoint**: `GET /api/requester/dashboard`
- **Authorized Roles**: `REQUESTER`
- **Description**: Computes authoritative metrics strictly isolated to the authenticated requester (`req.user.id`).
- **Response**: `200 OK`
  ```json
  {
    "metrics": {
      "openTickets": 3,
      "inProgressTickets": 2,
      "waitingForRequesterTickets": 1,
      "resolvedTickets": 5,
      "closedTickets": 12
    },
    "recentTickets": [
      {
        "id": 14,
        "ticketNumber": "TKT-2026-001234",
        "summary": "Laptop battery drains quickly",
        "currentStatus": "IN_PROGRESS",
        "requestedPriority": "MEDIUM",
        "category": { "id": 1, "name": "Hardware" },
        "updatedAt": "2026-10-10T11:20:00.000Z"
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `openTickets`: Count of owned tickets with status `IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')`.
  - `inProgressTickets`: Count of owned tickets with status `= 'IN_PROGRESS'`.
  - `waitingForRequesterTickets`: Count of owned tickets with status `= 'WAITING_FOR_REQUESTER'`.
  - `resolvedTickets`: Count of owned tickets with status `= 'RESOLVED'`.
  - `closedTickets`: Count of owned tickets with status `= 'CLOSED'`.
  - `recentTickets`: Array of up to 5 most recently updated owned tickets ordered by `updatedAt DESC`.
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Non-requester user):
    ```json
    { "error": "Access denied. Only Requesters can access the Requester Dashboard", "code": "FORBIDDEN", "details": [] }
    ```

---

### 4.2 IT Staff Dashboard Metrics
- **Endpoint**: `GET /api/staff/dashboard`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Description**: Computes authoritative system-wide queue metrics and current user queue assignments for IT Staff and Administrators.
- **Response**: `200 OK`
  ```json
  {
    "metrics": {
      "primary": {
        "newTickets": 14,
        "openTickets": 23,
        "inProgressTickets": 18,
        "waitingForRequesterTickets": 7,
        "myAssignedTickets": 16
      },
      "unassignedTickets": 6,
      "byStatus": {
        "new": 14,
        "open": 23,
        "inProgress": 18,
        "waitingForRequester": 7,
        "resolved": 12,
        "closed": 45,
        "reopened": 2,
        "cancelled": 1
      },
      "byPriority": {
        "low": 10,
        "medium": 28,
        "high": 18,
        "urgent": 6
      }
    },
    "recentTickets": [
      {
        "id": 20,
        "ticketNumber": "TKT-2026-001240",
        "summary": "VPN disconnects randomly",
        "currentStatus": "NEW",
        "itPriority": "HIGH",
        "ticketOwner": null,
        "requester": { "id": 3, "name": "Bob Martin" },
        "updatedAt": "2026-10-10T14:15:00.000Z"
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `primary.newTickets`: Active tickets with status `= 'NEW'`.
  - `primary.openTickets`: Active tickets with status `= 'OPEN'`.
  - `primary.inProgressTickets`: Active tickets with status `= 'IN_PROGRESS'`.
  - `primary.waitingForRequesterTickets`: Active tickets with status `= 'WAITING_FOR_REQUESTER'`.
  - `primary.myAssignedTickets`: Active tickets assigned to current user (`ticketOwnerId = req.user.id`).
  - `unassignedTickets`: Active tickets unassigned (`ticketOwnerId IS NULL` and status not closed/cancelled).
  - `byStatus`: Complete counts across all 8 lifecycle statuses.
  - `byPriority`: Active ticket counts across all 4 IT priorities.
  - `recentTickets`: Up to 5 most recently updated active tickets in system.
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Requester attempts staff dashboard):
    ```json
    { "error": "Access denied. Only IT Staff and Administrators can access the Staff Dashboard", "code": "FORBIDDEN", "details": [] }
    ```

---

### 4.3 Administrator Dashboard Metrics
- **Endpoint**: `GET /api/admin/dashboard`
- **Authorized Roles**: `ADMINISTRATOR`
- **Description**: Extends operational queue metrics with user account distribution statistics.
- **Response**: `200 OK`
  ```json
  {
    "operational": {
      "unassignedTickets": 6,
      "totalActiveTickets": 62
    },
    "users": {
      "totalUsers": 25,
      "activeUsers": 23,
      "inactiveUsers": 2,
      "byRole": {
        "requester": 18,
        "itStaff": 5,
        "administrator": 2
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    { "error": "Authentication required", "code": "UNAUTHORIZED", "details": [] }
    ```
  - `403 Forbidden` (Non-administrator user):
    ```json
    { "error": "Access denied. Only Administrators can access the Administrator Dashboard", "code": "FORBIDDEN", "details": [] }
    ```
