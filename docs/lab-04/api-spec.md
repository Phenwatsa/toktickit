# TokTickIT Lab 4 — REST API Specification

This document defines the complete REST API contract for TokTickIT Sprint 4 (Lab 4). It specifies endpoint paths, HTTP methods, headers, request and response payloads, status codes, RBAC rules, safe error schemas, and concurrency conflict handling.

---

## 1. Authentication & Common Conventions

### 1.1 Headers
All protected endpoints require an authenticated JWT Bearer token:
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### 1.2 Standardized Safe Error Schema
All error responses adhere to a uniform, safe JSON structure:
```json
{
  "error": "Human-readable error explanation",
  "code": "STANDARDIZED_ERROR_CODE",
  "details": [
    {
      "field": "followUpNote",
      "message": "Follow-up note is required when follow-up is needed"
    }
  ]
}
```

Standard HTTP Error Codes:
- `400 Bad Request`: Payload validation failed or invalid state transition.
- `401 Unauthorized`: Missing, expired, or revoked token (`tokenVersion` mismatch).
- `403 Forbidden`: Authenticated user lacks permission for the requested resource.
- `404 Not Found`: Target entity does not exist.
- `409 Conflict`: Concurrency / stale update detected.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken for Ticket
- **Endpoint**: `GET /api/tickets/:id/actions`
- **Authorized Roles**: `REQUESTER` (owner only), `IT_STAFF`, `ADMINISTRATOR`
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
  - `401 Unauthorized`: Not logged in.
  - `403 Forbidden`: Requester does not own this ticket.
  - `404 Not Found`: Ticket not found.

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
  - `actionDateTime`: Valid ISO date string (optional, defaults to `new Date()`).
  - `isFollowUpRequired`: Boolean (required, default `false`).
  - `followUpNote`: String, required if `isFollowUpRequired === true` (min 3 chars), optional/null otherwise.
  - `attachmentNotes`: String, max 500 characters (optional).
  - `performedById`: **Auto-populated** from authenticated session user ID. Client payload overrides are ignored.
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
  - `400 Bad Request`: Validation failure (e.g. missing follow-up note when follow-up required).
  - `401 Unauthorized`: Not logged in.
  - `403 Forbidden`: Caller is not IT Staff or Administrator.
  - `404 Not Found`: Ticket not found.

---

### 2.3 Update Action Taken
- **Endpoint**: `PATCH /api/tickets/:id/actions/:actionId`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Ticket ID (integer)
  - `actionId`: Action Taken ID (integer)
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
  - `400 Bad Request`: Validation failure.
  - `403 Forbidden`: Non-staff user.
  - `404 Not Found`: Action Taken record not found.

---

## 3. Ticket Workflow, Resolution Gate & Concurrency Endpoints

### 3.1 Transition Ticket Status (with Concurrency Protection)
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
  - `status`: Must be one of `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Must satisfy the Permitted 8-Status Transition Matrix (BR-07).
  - **Resolution Gate**: Only `IT_STAFF` or `ADMINISTRATOR` can invoke this endpoint to set status to `RESOLVED` or `CLOSED`.
  - **Optimistic Concurrency Check**: If `expectedUpdatedAt` is provided and does not match the database `ticket.updatedAt` timestamp, returns `409 Conflict`.
- **Response**: `200 OK`
  ```json
  {
    "message": "Ticket status transitioned successfully",
    "currentStatus": "RESOLVED",
    "updatedAt": "2026-10-10T14:40:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid status transition (e.g. from `NEW` to `RESOLVED`).
  - `403 Forbidden`: Requester attempting to execute status transition.
  - `404 Not Found`: Ticket not found.
  - `409 Conflict`: Stale update detected (ticket was updated by another actor).
    ```json
    {
      "error": "Conflict: Ticket has been modified by another user. Please refresh and try again.",
      "code": "STALE_UPDATE_CONFLICT",
      "currentUpdatedAt": "2026-10-10T14:35:00.000Z"
    }
    ```

---

### 3.2 Requester Advisory Resolution Indication
- **Endpoint**: `PATCH /api/requester/tickets/:id/resolve-indication`
- **Authorized Roles**: `REQUESTER` (owner only)
- **Description**: Requesters indicate that the issue appears resolved. This sets `problemAppearsResolved = true` without modifying `currentStatus`.
- **Response**: `200 OK`
  ```json
  {
    "message": "Problem indicated as resolved. IT Staff will review and formally resolve the ticket.",
    "problemAppearsResolved": true,
    "currentStatus": "IN_PROGRESS"
  }
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
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: User role is not `REQUESTER`.

---

### 4.2 IT Staff Dashboard Metrics
- **Endpoint**: `GET /api/staff/dashboard`
- **Authorized Roles**: `IT_STAFF`, `ADMINISTRATOR`
- **Description**: Computes system-wide operational workload metrics and current user queue assignments.
- **Response**: `200 OK`
  ```json
  {
    "metrics": {
      "unassignedTickets": 6,
      "myAssignedTickets": 16,
      "byStatus": {
        "new": 14,
        "open": 23,
        "inProgress": 18,
        "waitingForRequester": 7,
        "resolved": 12,
        "closed": 45
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
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: User role is `REQUESTER`.

---

### 4.3 Administrator Dashboard Metrics
- **Endpoint**: `GET /api/admin/dashboard`
- **Authorized Roles**: `ADMINISTRATOR`
- **Description**: Extends operational queue metrics with system account distribution statistics.
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
  - `403 Forbidden`: Non-administrators.
