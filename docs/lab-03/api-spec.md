# TokTickIT Lab 3 — REST API Specification

This document defines the complete REST API contract for TokTickIT Sprint 3 (Lab 3). It details endpoint paths, HTTP methods, authentication headers, request and response payloads, query parameters, authorization matrix, and safe error semantics.

---

## 1. Authentication & Session Strategy

- **Mechanism**: Bearer Token (JWT) transmitted via the standard `Authorization: Bearer <token>` HTTP header, or secure session token.
- **Token Payload**:
  ```json
  {
    "userId": 1,
    "email": "jennifer.anderson@toktickit.com",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "iat": 1726400000,
    "exp": 1726486400
  }
  ```
- **Error Behavior**:
  - `401 Unauthorized`: Missing, expired, or invalid token, or user account inactive.
  - `403 Forbidden`: Authenticated user lacks permission for the requested resource (e.g. Requester calling Admin or Notes APIs).

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
  - `400 Bad Request`: Validation error (e.g. missing email/password).
  - `401 Unauthorized`: Invalid credentials or account deactivated (`{ "error": "Invalid email or password" }`).

### 2.2 Logout
* **Endpoint**: `POST /api/auth/logout`
* **Access**: Authenticated (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

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
* **Error Response**:
  - `401 Unauthorized`: Not authenticated.

### 2.4 Change Password (Mandatory / Self-Service)
* **Endpoint**: `POST /api/auth/change-password`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "currentPassword": "string (required)",
    "newPassword": "string (min 8 chars, 1 upper, 1 lower, 1 number, required)",
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
  - `400 Bad Request`: New password does not meet policy or passwords do not match.
  - `401 Unauthorized`: Current password is incorrect.

---

## 3. IT Staff Ticket Queue & Operations

### 3.1 Retrieve Staff Ticket Queue
* **Endpoint**: `GET /api/staff/tickets`
* **Access**: `IT_STAFF`, `ADMINISTRATOR` (Returns `403 Forbidden` for `REQUESTER`)
* **Query Parameters**:
  - `search` (string, optional): Search keyword against `ticketNumber` and `summary`.
  - `status` (string, optional): Comma-separated or single status (e.g. `NEW,OPEN,IN_PROGRESS`).
  - `categoryId` (number, optional): Filter by category ID.
  - `requestedPriority` (string, optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `itPriority` (string, optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `ownerId` (number, optional): User ID of assigned owner (or `unassigned`).
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

### 3.2 Retrieve Single Ticket Detail (Staff View)
* **Endpoint**: `GET /api/staff/tickets/:id`
* **Access**: `IT_STAFF`, `ADMINISTRATOR`
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
      "attachments": [],
      "publicCommentsCount": 3,
      "internalNotesCount": 2
    }
  }
  ```

### 3.3 Claim Ticket Ownership
* **Endpoint**: `PATCH /api/staff/tickets/:id/claim`
* **Access**: `IT_STAFF`, `ADMINISTRATOR`
* **Request Body**: None (assigns authenticated user)
* **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Ticket successfully claimed",
    "ticketOwner": {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael@toktickit.com"
    }
  }
  ```

### 3.4 Reassign Ticket Ownership
* **Endpoint**: `PATCH /api/staff/tickets/:id/assign`
* **Access**: `IT_STAFF`, `ADMINISTRATOR`
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
    "ticketOwner": {
      "id": 3,
      "name": "Sarah Johnson",
      "email": "sarah@toktickit.com"
    }
  }
  ```

### 3.5 Update IT Priority
* **Endpoint**: `PATCH /api/staff/tickets/:id/priority`
* **Access**: `IT_STAFF`, `ADMINISTRATOR`
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

### 3.6 Transition Ticket Status
* **Endpoint**: `PATCH /api/staff/tickets/:id/status`
* **Access**: `IT_STAFF`, `ADMINISTRATOR`
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
* **Error Response (`400 Bad Request`)**:
  ```json
  {
    "error": "Invalid status transition from IN_PROGRESS to CLOSED. Must be RESOLVED first."
  }
  ```

---

## 4. Public Comments & Internal Notes

### 4.1 Get Public Comments
* **Endpoint**: `GET /api/tickets/:id/comments`
* **Access**: Ticket Requester Owner, `IT_STAFF`, `ADMINISTRATOR`
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "content": "Thank you for the update. Please let me know if you need any additional information.",
      "createdAt": "2026-05-13T11:45:00Z",
      "author": {
        "id": 4,
        "name": "Jennifer Anderson",
        "role": "REQUESTER"
      }
    }
  ]
  ```

### 4.2 Post Public Comment
* **Endpoint**: `POST /api/tickets/:id/comments`
* **Access**: Ticket Requester Owner, `IT_STAFF`, `ADMINISTRATOR`
* **Request Body**:
  ```json
  {
    "content": "string (min 2, max 2000 chars, non-whitespace)"
  }
  ```
* **Success Response (`201 Created`)**: Returns newly created comment object.

### 4.3 Get Internal Notes
* **Endpoint**: `GET /api/tickets/:id/notes`
* **Access**: `IT_STAFF`, `ADMINISTRATOR` (Returns `403 Forbidden` for `REQUESTER`)
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "content": "Battery diagnostic shows 62% battery wear. Ordering replacement battery pack.",
      "createdAt": "2026-05-13T10:00:00Z",
      "author": {
        "id": 2,
        "name": "Michael Brown",
        "role": "IT_STAFF"
      }
    }
  ]
  ```
* **Forbidden Response (`403 Forbidden`)**:
  ```json
  {
    "error": "Access denied. Internal notes are restricted to IT staff."
  }
  ```

### 4.4 Post Internal Note
* **Endpoint**: `POST /api/tickets/:id/notes`
* **Access**: `IT_STAFF`, `ADMINISTRATOR` (Returns `403 Forbidden` for `REQUESTER`)
* **Request Body**:
  ```json
  {
    "content": "string (min 2, max 2000 chars, non-whitespace)"
  }
  ```
* **Success Response (`201 Created`)**: Returns newly created note object.

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

---

## 6. Administrator User Management

### 6.1 List Users
* **Endpoint**: `GET /api/admin/users`
* **Access**: `ADMINISTRATOR` (Returns `403 Forbidden` for others)
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
* **Success Response (`201 Created`)**: Returns created user object with `mustChangePassword: true`.
* **Error Response (`409 Conflict`)**:
  ```json
  {
    "error": "A user with this email address already exists."
  }
  ```

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
* **Safety Rules Enforced**:
  - If target user is current authenticated admin and `isActive: false` $\rightarrow$ `400 Bad Request` (`"Administrators cannot deactivate their own account."`)
  - If target user is the last remaining active admin and `isActive: false` or role changed $\rightarrow$ `400 Bad Request` (`"Cannot deactivate or demote the last remaining active administrator."`)

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
    "message": "Initial password reset successfully. User must change password at next login."
  }
  ```
