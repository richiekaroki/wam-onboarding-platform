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
| Backend | Django 5.2, Django REST Framework, Celery |
| Database | PostgreSQL (Neon.tech) |
| Cache | Redis (Upstash) |
| Auth | Passwordless magic link (JWT) |
| Hosting | Vercel (frontend), Render (backend) |

## Features

- **Passwordless Auth** — Magic link login via email. No passwords stored. Users click a one-time link sent to their inbox.
- **Dynamic Form Builder** — Admin-configurable forms with JSON schema, supporting text, select, file upload, and currency fields
- **Form Sharing** — Unique slug-based URLs for each form, accessible to authenticated clients
- **Submission Management** — Real-time status tracking (submitted, reviewed, approved, rejected)
- **Escalating Alerts** — Automated email reminders at 5, 8, 10, and 15-day deadlines
- **Responsive Design** — Mobile-first interface across all screen sizes

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+
- Redis (for Celery broker)
- PostgreSQL (or SQLite for development)
- Gmail account with App Password (for magic link emails)

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

1. User enters email at `/login`
2. Backend generates a UUID token (expires in 10 minutes)
3. Backend sends HTML email via Gmail SMTP
4. User clicks link → `/auth/verify?token=<uuid>`
5. Backend validates token, creates user if new, returns JWT
6. Access token stored in memory, refresh token in HttpOnly cookie

### Admin Bootstrap

First admin is created via environment variable:

```bash
# Set in Render / Docker / .env
DJANGO_ADMIN_EMAIL=admin@mrwam.com

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
| GET | `/api/forms/` | JWT | List active forms |
| POST | `/api/forms/` | JWT (admin) | Create form |
| GET | `/api/submissions/` | JWT (admin) | List submissions |
| POST | `/api/submissions/` | JWT | Submit form response |
| PATCH | `/api/submissions/{id}/status/` | JWT (admin) | Update status |

## Environment Variables

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | *(generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)* |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `actserv-backend.onrender.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `REDIS_URL` | Redis connection string | `redis://default:pass@host:6379` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `https://onboarding-frontend.vercel.app` |
| `FRONTEND_URL` | Frontend base URL (for magic links) | `https://onboarding-frontend.vercel.app` |
| `DJANGO_ADMIN_EMAIL` | Email of first admin | `admin@actserv.local` |
| `EMAIL_BACKEND` | Email backend | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USE_TLS` | Use TLS | `True` |
| `EMAIL_HOST_USER` | Gmail address | `your-gmail@gmail.com` |
| `EMAIL_HOST_PASSWORD` | Gmail App Password | `xxxx-xxxx-xxxx-xxxx` |
| `DEFAULT_FROM_EMAIL` | Sender email | `Mr.Wam <your-gmail@gmail.com>` |
| `ADMIN_NOTIFICATION_EMAILS` | Admin notification emails | `admin@actserv.local` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://actserv-backend.onrender.com/api` |

## Project Structure

```
wam-onboarding-platform/
├── backend/
│   ├── actserv_backend/    # Django project settings
│   ├── forms/              # Form & submission models, views, serializers
│   ├── notifications/      # Email alerts & escalation logic
│   └── users/              # Auth, magic link, user management
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages (admin, forms, login, auth/verify)
│       ├── components/     # React components (FormRenderer, Navbar)
│       └── lib/            # API client & utilities
├── docs/                   # Technical documentation
├── docker-compose.yml
└── README.md
```

## Documentation

- [SETUP.md](docs/SETUP.md) — Local development & Docker instructions
- [TESTING.md](docs/TESTING.md) — Test suite & coverage reports
- [API_REFERENCE.md](docs/API_REFERENCE.md) — Full endpoint reference

## License

Proprietary — Mr.Wam Ltd
