# API Reference

All endpoints are prefixed with `/api/`. Authentication uses passwordless magic link + JWT.

**Production:** `https://actserv-backend.onrender.com`
**Swagger UI:** `https://actserv-backend.onrender.com/api/schema/swagger/`

---

## Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Health check with DB ping | Public |

Response (200):
```json
{
  "status": "ok",
  "service": "mrwam-backend",
  "version": "1.0.0",
  "database": "connected"
}
```

Response (503 if DB unavailable):
```json
{
  "status": "degraded",
  "service": "mrwam-backend",
  "version": "1.0.0",
  "database": "unavailable"
}
```

---

## Authentication (Magic Link)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/magic-link/` | Request magic link email | Public |
| GET | `/api/auth/verify-magic-link/?token=<uuid>` | Verify magic link, get JWT | Public |
| POST | `/api/auth/refresh/` | Refresh access token (from HttpOnly cookie) | Public |
| POST | `/api/auth/logout/` | Blacklist token, clear cookie | Public |
| GET | `/api/auth/me/` | Get current user profile | JWT |
| PATCH | `/api/auth/me/` | Update current user profile | JWT |

### Request Magic Link

```http
POST /api/auth/magic-link/
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response (always 200 — prevents email enumeration):
```json
{
  "detail": "If an account exists, a sign-in link has been sent."
}
```

Rate limiting: 1 request per minute per email. Returns 429 if cooldown active.

### Verify Magic Link

```http
GET /api/auth/verify-magic-link/?token=<uuid-from-email>
```

Response:
```json
{
  "access": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "client",
    "is_staff": false
  }
}
```

The refresh token is set as an HttpOnly cookie automatically.

### Update Profile

```http
PATCH /api/auth/me/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "first_name": "John",
  "last_name": "Doe"
}
```

### Logout

```http
POST /api/auth/logout/
```

Blacklists the refresh token and clears the cookie.

---

## Forms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/forms/` | List forms | JWT |
| POST | `/api/forms/` | Create form | Admin |
| GET | `/api/forms/{slug}/` | Get form by slug | JWT |
| PATCH | `/api/forms/{slug}/` | Update form | Admin |
| DELETE | `/api/forms/{slug}/` | Delete form | Admin |
| GET | `/api/forms/stats/` | Dashboard statistics | Admin |

**Client filtering:** Non-staff users only see forms assigned to them or unassigned forms.

### Form Stats

```http
GET /api/forms/stats/
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "total_submissions": 42,
  "approval_rate": 78.5,
  "overdue_count": 3,
  "weekly_activity": [
    {"date": "2026-08-01", "count": 5},
    {"date": "2026-08-02", "count": 8}
  ]
}
```

### Schema Versioning

When a form's `schema` or `fields` are updated via `PATCH /api/forms/{slug}/`, the `schema_version` auto-increments. Submissions record which version they were submitted against.

---

## Form Assignments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/forms/{slug}/assign/` | Assign form to clients | Admin |
| DELETE | `/api/forms/{slug}/assign/` | Unassign form from clients | Admin |

### Assign Clients

```http
POST /api/forms/{slug}/assign/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "user_ids": ["uuid1", "uuid2"]
}
```

Response:
```json
{
  "detail": "Form assigned to 2 users."
}
```

### Unassign Clients

```http
DELETE /api/forms/{slug}/assign/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "user_ids": ["uuid1"]
}
```

---

## Fields (nested under forms)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/forms/{slug}/fields/` | List fields for a form | JWT |
| POST | `/api/forms/{slug}/fields/` | Create a field | Admin |
| DELETE | `/api/forms/{slug}/fields/{id}/` | Delete a field | Admin |

---

## Submissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/submissions/` | Create submission | JWT |
| GET | `/api/submissions/` | List submissions | JWT |
| GET | `/api/submissions/{id}/` | Get submission details | JWT |
| POST | `/api/submissions/{id}/upload/` | Upload file to submission | JWT |
| PATCH | `/api/submissions/{id}/status/` | Update status | Admin |
| GET | `/api/submissions/{id}/export-pdf/` | Download submission as PDF | JWT |
| POST | `/api/submissions/bulk-status/` | Bulk update statuses | Admin |

**Submission statuses:** `submitted` → `reviewed` → `approved` or `rejected`

**Client filtering:** Non-staff users only see their own submissions.

### Update Status

```http
PATCH /api/submissions/{id}/status/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "approved"
}
```

Status changes are logged in the audit log and trigger client email notifications.

### Export PDF

```http
GET /api/submissions/{id}/export-pdf/
Authorization: Bearer <token>
```

Returns a PDF file with submission details, all field values, status, timestamps, and metadata.

### Bulk Status Update

```http
POST /api/submissions/bulk-status/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "status": "approved"
}
```

Response:
```json
{
  "detail": "Updated 3 submissions to approved."
}
```

---

## Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications/` | List notifications | JWT |
| GET | `/api/notifications/{id}/` | Get notification | JWT |
| PATCH | `/api/notifications/{id}/` | Mark as read | JWT |
| POST | `/api/notifications/mark-all-read/` | Mark all as read | JWT |

---

## Audit Log

Audit logs are created automatically when:
- Submission status changes (submitted → reviewed → approved/rejected)
- Forms are created, updated, or deleted

Viewable in Django Admin at `/admin/audit/auditlog/`.

---

## API Documentation

- **Swagger UI:** `/api/schema/swagger/`
- **ReDoc:** `/api/schema/redoc/`
- **OpenAPI Schema:** `/api/schema/`
