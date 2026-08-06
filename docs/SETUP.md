# Setup Instructions

How to set up and run the Mr.Wam Onboarding Platform locally.

---

## Prerequisites

- **Python 3.13+**
- **Node.js 20+**
- **Redis** (for Celery broker)
- **PostgreSQL 14+** (or SQLite for local dev)
- **Git**
- **Gmail App Password** (for magic link emails in production)

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
DJANGO_ADMIN_EMAIL=admin@mrwam.com
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
- Redis → localhost:6379

---

## Authentication

Mr.Wam uses **passwordless magic link** authentication. No passwords are stored.

### How it works

1. User enters email at `/login`
2. Backend sends a one-time link via Gmail SMTP
3. User clicks link → `/auth/verify?token=<uuid>`
4. Backend validates token, creates user if new, returns JWT
5. Access token stored in memory, refresh token in HttpOnly cookie

### Admin Bootstrap

First admin is created via environment variable:

```bash
# Set in .env or Render environment
DJANGO_ADMIN_EMAIL=admin@mrwam.com

# Run once (auto-runs on first deploy via start.sh)
python manage.py create_initial_admin
```

Subsequent admin promotion: Django Admin → Users → change role to Admin.

---

## Production

| Service | URL | Hosting |
|---------|-----|---------|
| Frontend | https://onboarding-frontend.vercel.app | Vercel |
| Backend | https://actserv-backend.onrender.com | Render |
| Database | Neon.tech PostgreSQL | Neon.tech |
| Cache | Upstash Redis | Upstash |

### Environment Variables (Render)

See [README.md](../README.md#environment-variables) for the full list.

Key variables:
```
DEBUG=False
SECRET_KEY=<new-key>
DATABASE_URL=<neon-connection-string>
REDIS_URL=<upstash-redis-url>
FRONTEND_URL=https://onboarding-frontend.vercel.app
DJANGO_ADMIN_EMAIL=admin@actserv.local
EMAIL_HOST_USER=<your-gmail>
EMAIL_HOST_PASSWORD=<gmail-app-password>
```

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
- Production uses Neon.tech PostgreSQL (free tier, no expiration)
- File uploads stored locally in `backend/media/` (production uses Supabase Storage when configured)
- API documentation available at `/api/schema/swagger/`
