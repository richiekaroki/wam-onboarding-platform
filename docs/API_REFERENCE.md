# API Reference

All endpoints are prefixed with `/api/`. Authentication uses passwordless magic link + JWT.

**Production:** `https://actserv-backend.onrender.com`
**Swagger UI:** `https://actserv-backend.onrender.com/api/schema/swagger/`

---

## Authentication (Magic Link)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/magic-link/` | Request magic link email | Public |
| GET | `/api/auth/verify-magic-link/?token=<uuid>` | Verify magic link, get JWT | Public |
| POST | `/api/auth/refresh/` | Refresh access token (from HttpOnly cookie) | Public |
| POST | `/api/auth/logout/` | Blacklist token, clear cookie | Public |
| GET | `/api/auth/me/` | Get current user profile | JWT |

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
    "first_name": "",
    "last_name": "",
    "role": "client",
    "is_staff": false
  }
}
```

The refresh token is set as an HttpOnly cookie automatically.

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
| GET | `/api/submissions/` | List submissions | Admin |
| GET | `/api/submissions/{id}/` | Get submission details | Admin |
| POST | `/api/submissions/{id}/upload/` | Upload file to submission | JWT |
| PATCH | `/api/submissions/{id}/status/` | Update status | Admin |

**Submission statuses:** `submitted` → `reviewed` → `approved` or `rejected`

---

## Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications/` | List notifications | JWT |
| GET | `/api/notifications/{id}/` | Get notification | JWT |
| PATCH | `/api/notifications/{id}/` | Mark as read | JWT |
| POST | `/api/notifications/mark-all-read/` | Mark all as read | JWT |

---

## API Documentation

- **Swagger UI:** `/api/schema/swagger/`
- **ReDoc:** `/api/schema/redoc/`
- **OpenAPI Schema:** `/api/schema/`
