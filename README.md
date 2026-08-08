<h1 align="center">Mr.Wam</h1>

<p align="center">
  Dynamic onboarding platform for financial services.
</p>

<p align="center">
  <a href="https://onboarding-frontend.vercel.app">Live Demo</a> ·
  <a href="https://actserv-backend.onrender.com/api/schema/swagger/">API Docs</a> ·
  <a href="docs/SETUP.md">Setup</a>
</p>

---

## What it does

Admins build custom onboarding forms (KYC, loan apps, investment declarations) with a visual builder. Clients fill them out via unique links. Submissions are tracked, reviewed, and exported — all in one place.

## Features

- **Passwordless auth** — Magic link login, no passwords stored
- **Visual form builder** — Drag-and-drop with conditional logic
- **Form assignments** — Assign forms to specific clients
- **Submission tracking** — Status workflow: submitted → reviewed → approved/rejected
- **PDF export** — Download any submission as a formatted PDF
- **Bulk actions** — Update multiple submissions at once
- **Email notifications** — Admin alerts on new submissions, client alerts on status changes
- **Escalating reminders** — Automated deadline alerts at 5, 8, 10, and 15 days
- **Audit log** — Tracks all admin actions with timestamps
- **Form versioning** — Schema changes are versioned automatically
- **Dark mode** — Toggle between light and dark themes
- **Mobile responsive** — Works across all screen sizes

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Django, Django REST Framework |
| Database | PostgreSQL |
| Email | Brevo |
| Auth | JWT + magic link |
| PDF | ReportLab |
| Hosting | Vercel + Render |

## Quick Start

```bash
git clone https://github.com/richiekaroki/wam-onboarding-platform.git
cd wam-onboarding-platform
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/api/schema/swagger/ |

## Docs

- [Setup](docs/SETUP.md) — Local dev, Docker, production deployment
- [API Reference](docs/API_REFERENCE.md) — All endpoints
- [Testing](docs/TESTING.md) — Test suite and coverage

## License

Proprietary
