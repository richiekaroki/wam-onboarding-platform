<h1 align="center">Mr.Wam Onboarding Platform</h1>

<p align="center">
  Dynamic form management for financial services — KYC, loan applications, and investment declarations.
</p>

<p align="center">
  <a href="https://onboarding-frontend.vercel.app">Live Demo</a> ·
  <a href="https://actserv-backend.onrender.com/api/schema/swagger/">API Docs</a> ·
  <a href="docs/SETUP.md">Setup Guide</a>
</p>

---

## Overview

Mr.Wam is a full-stack onboarding platform that enables financial services firms to create, distribute, and manage dynamic forms for client onboarding. Admins build custom forms with a visual configuration interface, share them via unique links, and review submissions with real-time status tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| Backend | Django 5.2, Django REST Framework |
| Database | PostgreSQL (Render) |
| Email | Brevo HTTP API (transactional) |
| Auth | Passwordless magic link (JWT) |
| PDF | ReportLab |
| Hosting | Vercel (frontend), Render (backend) |

## Features

- **Passwordless Auth** — Magic link login via email. No passwords stored. Users click a one-time link sent to their inbox.
- **Two-Step Login** — Name first, then email. Rate-limited to 1 request per minute per email.
- **Dynamic Form Builder** — Visual drag-and-drop interface with JSON schema, supporting text, select, textarea, file upload, and currency fields.
- **Conditional Logic** — Show/hide fields based on other field values. Visual rule builder in admin, live evaluation in form renderer.
- **Form Assignments** — Admins assign forms to specific clients. Clients only see assigned and unassigned forms.
- **Submission Management** — Real-time status tracking (submitted → reviewed → approved/rejected). Clients see only their own submissions.
- **Bulk Status Changes** — Update multiple submissions at once via `POST /submissions/bulk-status/`.
- **PDF Export** — Download any submission as a formatted PDF with submission details, field values, and metadata.
- **Email Notifications** — Branded HTML emails via Brevo. Admin alerts on new submissions, client alerts on status changes.
- **Escalating Alerts** — Automated deadline reminders at 5, 8, 10, and 15-day thresholds.
- **Form Versioning** — Auto-incremented `schema_version` on schema changes. Submissions record the version they were submitted against.
- **Audit Log** — Tracks all admin actions (status changes, form edits) with timestamp, user, and details.
- **Dark Mode** — Toggle between light and dark themes. Persisted in localStorage.
- **Mobile Responsive** — Hamburger nav menu, responsive layouts across all screen sizes.
- **Admin Dashboard** — Stats cards showing approval rate, overdue count, and weekly activity.
- **Profile Page** — Users can view and edit their name.
- **Health Check** — Liveness probe with DB ping at `/`.

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL (or SQLite for development)
- Brevo account (for transactional emails in production)

### Local Development

```bash
# Clone the repository
git clone https://github.com/richiekaroki/wam-onboarding-platform.git
cd wam-onboarding-platform

# Start with Docker
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/schema/swagger/ |
| Django Admin | http://localhost:8000/admin/ |

### Production

| Service | URL |
|---------|-----|
| Frontend | https://onboarding-frontend.vercel.app |
| Backend | https://actserv-backend.onrender.com |

## Authentication — Magic Link Flow

No passwords. Users authenticate via a one-time link sent to their email.

1. User enters name at `/login`, then email
2. Backend rate-limits to 1 request per minute per email
3. Backend generates a UUID token (expires in 10 minutes)
4. Backend sends branded HTML email via Brevo HTTP API
5. User clicks link → `/auth/verify?token=<uuid>`
6. Backend validates token, creates user if new, returns JWT
7. Access token stored in memory, refresh token in HttpOnly cookie

### Admin Bootstrap

First admin is created via environment variable:

```bash
# Set in Render / Docker / .env
DJANGO_ADMIN_EMAIL=admin@actserv.local
DJANGO_ADMIN_PASSWORD=your-secure-password

# Run once (auto-runs on first deploy via start.sh)
python manage.py create_initial_admin
```

Subsequent admin promotion: Django Admin → Users → change role to Admin.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/magic-link/` | Public | Request magic link email |
| GET | `/api/auth/verify-magic-link/?token=<uuid>` | Public | Verify magic link, get JWT |
| POST | `/api/auth/refresh/` | Public | Refresh access token (cookie) |
| POST | `/api/auth/logout/` | Public | Blacklist token, clear cookie |
| GET | `/api/auth/me/` | JWT | Get current user profile |
| PATCH | `/api/auth/me/` | JWT | Update current user profile |
| GET | `/api/forms/` | JWT | List forms (filtered by assignment for clients) |
| POST | `/api/forms/` | Admin | Create form |
| GET | `/api/forms/{slug}/` | JWT | Get form by slug |
| PATCH | `/api/forms/{slug}/` | Admin | Update form (auto-increments schema version) |
| DELETE | `/api/forms/{slug}/` | Admin | Delete form |
| GET | `/api/forms/stats/` | Admin | Dashboard stats (approval rate, overdue, weekly) |
| POST | `/api/forms/{slug}/assign/` | Admin | Assign form to clients |
| DELETE | `/api/forms/{slug}/assign/` | Admin | Unassign form from clients |
| GET | `/api/forms/{slug}/fields/` | JWT | List fields for a form |
| POST | `/api/forms/{slug}/fields/` | Admin | Create a field |
| DELETE | `/api/forms/{slug}/fields/{id}/` | Admin | Delete a field |
| POST | `/api/submissions/` | JWT | Submit form response |
| GET | `/api/submissions/` | JWT | List submissions (admin: all, client: own) |
| GET | `/api/submissions/{id}/` | JWT | Get submission details |
| POST | `/api/submissions/{id}/upload/` | JWT | Upload file to submission |
| PATCH | `/api/submissions/{id}/status/` | Admin | Update status (logged in audit log) |
| GET | `/api/submissions/{id}/export-pdf/` | JWT | Download submission as PDF |
| POST | `/api/submissions/bulk-status/` | Admin | Bulk update submission statuses |
| GET | `/api/notifications/` | JWT | List notifications |
| GET | `/api/notifications/{id}/` | JWT | Get notification |
| PATCH | `/api/notifications/{id}/` | JWT | Mark as read |
| POST | `/api/notifications/mark-all-read/` | JWT | Mark all as read |

## Environment Variables

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | *(auto-generated)* |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `actserv-backend.onrender.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `REDIS_URL` | Redis connection string | `redis://default:pass@host:6379` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `https://onboarding-frontend.vercel.app` |
| `FRONTEND_URL` | Frontend base URL (for magic links) | `https://onboarding-frontend.vercel.app` |
| `DJANGO_ADMIN_EMAIL` | Email of first admin | `admin@actserv.local` |
| `DJANGO_ADMIN_PASSWORD` | Password for Django admin | `your-secure-password` |
| `DEFAULT_FROM_EMAIL` | Sender email (must be verified in Brevo) | `karokirichard522@gmail.com` |
| `ADMIN_NOTIFICATION_EMAILS` | Admin notification emails | `karokirichard522@gmail.com` |
| `BREVO_API_KEY` | Brevo transactional email API key | *(from Brevo dashboard)* |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://actserv-backend.onrender.com/api` |

## Project Structure

```
wam-onboarding-platform/
├── backend/
│   ├── actserv_backend/    # Django project settings, URLs, Celery
│   ├── audit/              # Audit log model (tracks admin actions)
│   ├── forms/              # Form, Field, Submission models + views + PDF export
│   ├── notifications/      # Email alerts, escalation commands, cron jobs
│   ├── users/              # Auth, magic link, user management
│   └── tests/              # pytest test suite
├── frontend/
│   └── src/
│       ├── app/            # Next.js App Router pages
│       │   ├── admin/      # Admin dashboard, form create/edit
│       │   ├── auth/       # Magic link verification
│       │   ├── forms/      # Form list, form detail [slug]
│       │   ├── login/      # Two-step login
│       │   ├── profile/    # User profile
│       │   └── submissions/ # Submissions list
│       ├── components/     # React components
│       │   ├── FormRenderer.tsx      # Form renderer with conditional logic
│       │   ├── VisualFormBuilder.tsx  # Drag-and-drop form builder
│       │   ├── Navbar.tsx            # Navigation bar
│       │   ├── MobileNav.tsx         # Hamburger menu
│       │   ├── ThemeToggle.tsx       # Dark/light mode
│       │   └── Toast.tsx             # Auto-dismiss notifications
│       └── lib/            # API client & utilities
├── docs/                   # Technical documentation
├── docker-compose.yml
├── render.yaml             # Render Blueprint (infra-as-code)
└── README.md
```

## Documentation

- [SETUP.md](docs/SETUP.md) — Local development & Docker instructions
- [TESTING.md](docs/TESTING.md) — Test suite & coverage reports
- [API_REFERENCE.md](docs/API_REFERENCE.md) — Full endpoint reference

## License

Proprietary — Mr.Wam Ltd
