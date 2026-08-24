# Lab 2 REST API Specification

## 1. Overview & Protocol Conventions
- **Base URL**: `/api`
- **Data Format**: JSON for requests and responses (except file upload/download).
- **Authentication**: Simulated via `x-requester-id` HTTP header or `requesterId` query/body parameters for Lab 2 development testing.
- **Timestamp Format**: ISO 8601 UTC strings (e.g., `2025-05-12T09:14:00.000Z`).

---

## 2. Standard Error Response Shape
All error responses adhere to a consistent error schema:
```json
{
  "error": "Error title or brief summary",
  "message": "Human-readable descriptive error message",
  "details": [
    {
      "field": "summary",
      "issue": "Summary must be at least 5 characters long."
    }
  ]
}
```

---

## 3. Endpoints Specification

### 3.1 Development Requesters & Reference Data

#### `GET /api/requesters/active`
- **Description**: Returns a list of all active development requesters. Inactive requesters (`isActive: false`) are excluded.
- **Response 200 OK**:
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.a@toktickit.local",
      "department": "Human Resources",
      "isActive": true
    }
  ]
  ```

#### `GET /api/categories/active`
- **Description**: Returns all active ticket categories in alphabetical/ID order.
- **Response 200 OK**:
  ```json
  [
    { "id": 1, "name": "Account and Access", "isActive": true },
    { "id": 2, "name": "Hardware", "isActive": true },
    { "id": 3, "name": "Software", "isActive": true },
    { "id": 4, "name": "Network", "isActive": true }
  ]
  ```

#### `GET /api/related-systems/active`
- **Description**: Returns all active related systems.
- **Response 200 OK**:
  ```json
  [
    { "id": 1, "name": "Corporate Laptop", "description": "Standard issue laptop hardware" },
    { "id": 2, "name": "Campus Wi-Fi", "description": "University wireless network" },
    { "id": 3, "name": "VPN", "description": "Remote secure access" },
    { "id": 4, "name": "Email", "description": "Office 365 / Webmail service" },
    { "id": 5, "name": "LEB2 App", "description": "Learning environment platform" },
    { "id": 6, "name": "Grade Submission App", "description": "Faculty grading system" },
    { "id": 7, "name": "Printer", "description": "Department network printers" }
  ]
  ```

---

### 3.2 Ticket Management

#### `POST /api/tickets`
- **Description**: Creates a new IT support ticket for the current requester and generates a unique official Ticket Number.
- **Request Headers**: `Content-Type: application/json`, `x-requester-id: <number>`
- **Request Body**:
  ```json
  {
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 1,
    "requestedPriority": "MEDIUM",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle."
  }
  ```
- **Validation Rules**:
  - `requesterId`: Required, integer, must match an active `RequesterUser`.
  - `categoryId`: Required, integer, must match an active `Category`.
  - `relatedSystemId`: Required, integer, must match an active `RelatedSystem`.
  - `requestedPriority`: Required, one of `["LOW", "MEDIUM", "HIGH", "URGENT"]`.
  - `summary`: Required, string, trimmed length between 5 and 150 characters.
  - `description`: Required, string, trimmed length between 10 and 2000 characters.
- **Response 201 Created**:
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2025-001234",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 1,
    "ticketOwner": null,
    "createdAt": "2025-05-12T09:14:00.000Z",
    "updatedAt": "2025-05-12T09:14:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure on payload fields.
  - `404 Not Found`: Referenced requester, category, or related system does not exist.

---

#### `GET /api/tickets`
- **Description**: Returns a paginated list of tickets owned strictly by the requesting requester.
- **Query Parameters**:
  - `requesterId` (required): Filter tickets by the active requester ID.
  - `search` (optional): Case-insensitive search on `ticketNumber` or `summary`.
  - `categoryId` (optional): Filter by category ID.
  - `priority` (optional): Filter by `requestedPriority`.
  - `status` (optional): Filter by `currentStatus`.
  - `sortBy` (optional): `createdAt` (default), `updatedAt`, or `ticketNumber`.
  - `sortOrder` (optional): `desc` (default) or `asc`.
  - `page` (optional): 1-indexed page number (default: 1).
  - `pageSize` (optional): Number of items per page (default: 10, max: 50).
- **Response 200 OK**:
  ```json
  {
    "data": [
      {
        "id": 101,
        "ticketNumber": "TKT-2025-001234",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 2, "name": "Hardware" },
        "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
        "requestedPriority": "MEDIUM",
        "itPriority": null,
        "currentStatus": "NEW",
        "ticketOwner": null,
        "createdAt": "2025-05-12T09:14:00.000Z",
        "updatedAt": "2025-05-12T09:14:00.000Z",
        "attachmentsCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

---

#### `GET /api/tickets/:id`
- **Description**: Retrieves full details and attachment list of a single ticket. Enforces requester ownership.
- **Headers / Query**: `x-requester-id: <number>` or `?requesterId=<number>`
- **Response 200 OK**:
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2025-001234",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "requester": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.a@toktickit.local",
      "department": "Human Resources"
    },
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
    "ticketOwner": null,
    "createdAt": "2025-05-12T09:14:00.000Z",
    "updatedAt": "2025-05-12T09:14:00.000Z",
    "attachments": [
      {
        "id": 12,
        "originalName": "battery-report.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 245000,
        "isRemoved": false,
        "removedAt": null,
        "removalReason": null,
        "createdAt": "2025-05-12T09:14:00.000Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Requester does not own this ticket.
  - `404 Not Found`: Ticket with specified ID does not exist.

---

### 3.3 Attachment Management

#### `POST /api/tickets/:id/attachments`
- **Description**: Uploads an attachment to an existing ticket.
- **Headers**: `Content-Type: multipart/form-data`, `x-requester-id: <number>`
- **Body**: Form data containing `file` and `requesterId`.
- **Validation**:
  - File MIME type must be `image/jpeg`, `image/png`, `image/webp`, or `application/pdf`.
  - File size must not exceed 5 MB (5,242,880 bytes).
  - Ticket active attachments count must not exceed 5 files.
  - Requesting user must own the ticket.
- **Response 201 Created**:
  ```json
  {
    "id": 13,
    "ticketId": 101,
    "originalName": "screen-error.png",
    "mimeType": "image/png",
    "sizeBytes": 512000,
    "isRemoved": false,
    "createdAt": "2025-05-12T09:20:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Exceeds max 5 active attachments limit or invalid file format.
  - `403 Forbidden`: Requester does not own this ticket.
  - `413 Payload Too Large`: File exceeds 5 MB.
  - `415 Unsupported Media Type`: File type not permitted.

---

#### `GET /api/attachments/:id/download`
- **Description**: Streams the physical attachment file for download.
- **Headers / Query**: `x-requester-id: <number>` or `?requesterId=<number>`
- **Response 200 OK**: Binary file stream with `Content-Disposition: attachment; filename="..."` and matching `Content-Type`.
- **Error Responses**:
  - `403 Forbidden`: Requester does not own the associated ticket.
  - `404 Not Found`: Attachment ID does not exist.
  - `410 Gone`: Attachment has been soft-removed; download is permanently disabled.

---

#### `DELETE /api/tickets/:id/attachments/:attachmentId`
- **Description**: Soft-removes an attachment. Preserves metadata while disabling future downloads.
- **Headers**: `Content-Type: application/json`, `x-requester-id: <number>`
- **Request Body**:
  ```json
  {
    "requesterId": 1,
    "removalReason": "Uploaded incorrect document containing sensitive data"
  }
  ```
- **Validation**: `removalReason` is required, non-empty, and min 3 characters.
- **Response 200 OK**:
  ```json
  {
    "id": 13,
    "ticketId": 101,
    "originalName": "screen-error.png",
    "isRemoved": true,
    "removedAt": "2025-05-12T10:00:00.000Z",
    "removalReason": "Uploaded incorrect document containing sensitive data"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing or invalid removal reason.
  - `403 Forbidden`: Requester does not own the associated ticket.
  - `404 Not Found`: Attachment does not exist on this ticket.
