# Setup Instructions

How to set up and run the Mr.Wam Onboarding Platform locally.

---

## Prerequisites

- **Python 3.13+**
- **Node.js 20+**
- **PostgreSQL 14+** (or SQLite for local dev)
- **Git**
- **Brevo account** (for transactional emails in production)

Optional: Docker & Docker Compose

---

## Clone Repository

```bash
git clone https://github.com/richiekaroki/wam-onboarding-platform.git
cd wam-onboarding-platform
```

---

## Backend Setup

```bash
cd backend
python -m venv .venv

# Linux/Mac
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -e .
```

Create `backend/.env`:

```
SECRET_KEY=your_django_secret_key_here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
DJANGO_ADMIN_EMAIL=admin@example.com
DJANGO_ADMIN_PASSWORD=your-secure-password
```

Run migrations and start:

```bash
python manage.py migrate
python manage.py create_initial_admin
python manage.py runserver
```

Backend: http://localhost:8000
API Docs: http://localhost:8000/api/schema/swagger/

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

---

## Docker Setup (Optional)

```bash
docker-compose up --build
```

Services:
- Django backend → http://localhost:8000
- Next.js frontend → http://localhost:3000

---

## Authentication

Mr.Wam uses **passwordless magic link** authentication. No passwords are stored for end users.

### How it works

1. User enters name at `/login`, then email
2. Backend rate-limits to 1 request per minute per email
3. Backend sends a branded HTML email via Brevo HTTP API
4. User clicks link → `/auth/verify?token=<uuid>`
5. Backend validates token, creates user if new, returns JWT
6. Access token stored in memory, refresh token in HttpOnly cookie

### Two-Step Login

The login flow collects the user's name first, then their email. This allows personalization (greeting, nav bar) without requiring a separate registration step.

### Admin Bootstrap

First admin is created via environment variable:

```bash
# Set in .env or Render environment
DJANGO_ADMIN_EMAIL=admin@example.com
DJANGO_ADMIN_PASSWORD=your-secure-password

# Run once (auto-runs on first deploy via start.sh)
python manage.py create_initial_admin
```

The command sets `is_staff=True`, `is_superuser=True`, and a usable password. Subsequent admin promotion: Django Admin → Users → change role to Admin.

---

## Production

| Service | URL | Hosting |
|---------|-----|---------|
| Frontend | https://onboarding-frontend.vercel.app | Vercel |
| Backend | https://actserv-backend.onrender.com | Render |
| Database | PostgreSQL (Render) | Render |
| Email | Brevo HTTP API | Brevo |

### Environment Variables (Render)

See [README.md](../README.md#environment-variables) for the full list.

Key variables:
```
DEBUG=False
SECRET_KEY=<new-key>
DATABASE_URL=<render-connection-string>
FRONTEND_URL=https://onboarding-frontend.vercel.app
DJANGO_ADMIN_EMAIL=admin@yourdomain.com
DJANGO_ADMIN_PASSWORD=<secure-password>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_NOTIFICATION_EMAILS=admin@yourdomain.com
BREVO_API_KEY=<your-brevo-api-key>
```

### Email (Brevo)

All transactional emails (magic links, admin notifications, status alerts) are sent via Brevo's HTTP API. The sender email must be verified in your Brevo account.

- **Magic link emails:** Sent from `users/email.py`
- **Admin notifications:** Sent from `notifications/email.py` (new submission alerts)
- **Client status alerts:** Sent from `notifications/email.py` (status change alerts)
- **HTML templates:** `notifications/templates/notifications/`

### Cron Jobs (Render)

Two cron jobs are defined in `render.yaml`:

| Job | Schedule | Command | Description |
|-----|----------|---------|-------------|
| `check-escalations` | Daily 9am UTC | `python manage.py check_escalations` | Sends deadline reminder emails |
| `check-backups` | Daily 8am UTC | `python manage.py check_backups` | DB health check |

---

## Testing

### Backend

```bash
cd backend
pytest                          # Run all tests
pytest --cov --cov-report=html  # Coverage report
```

### Frontend

```bash
cd frontend
npm run test
```

---

## Notes

- Local dev uses SQLite (no PostgreSQL setup needed)
- Production uses Render PostgreSQL
- File uploads stored locally in `backend/media/`
- API documentation available at `/api/schema/swagger/`
- Celery is not used on Render free tier — all tasks have synchronous fallbacks
