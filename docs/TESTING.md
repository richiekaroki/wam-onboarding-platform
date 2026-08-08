# Testing Guide

## Overview

- **Framework:** pytest + pytest-django (backend), Jest (frontend)
- **Visual Testing:** Playwright MCP (browser automation)
- **Coverage:** 88%+

---

## Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov --cov-report=term-missing

# Generate HTML coverage report
pytest --cov --cov-report=html
# Open: htmlcov/index.html

# Run specific test files
pytest tests/test_forms_api.py -v
pytest tests/test_auth.py -v
pytest tests/test_notifications.py -v
pytest tests/test_submissions_api.py -v
```

### Test Files

| File | Tests |
|------|-------|
| `tests/test_forms_api.py` | Form CRUD, permissions, field management, assignments, stats |
| `tests/test_auth.py` | Magic link request, verify, token refresh, logout, rate limiting |
| `tests/test_submissions_api.py` | Submission creation, file upload, status changes, bulk status, PDF export |
| `tests/test_notifications.py` | Email alerts, escalation tasks |
| `tests/test_models.py` | Model methods, relationships, schema versioning |
| `tests/test_celery_integration.py` | Async task execution |
| `tests/test_api.py` | General API tests |

---

## Frontend Tests

```bash
cd frontend
npm run test
```

### Test Files

| File | Tests |
|------|-------|
| `FormRenderer.test.tsx` | Form rendering, field types, conditional logic |
| `FieldTypes.test.tsx` | Input, select, file, currency fields |
| `FileValidation.test.tsx` | File size, type validation |
| `ConditionalValidation.test.tsx` | Conditional field show/hide logic |
| `api.test.ts` | API client functions |

---

## Visual Testing (Playwright)

Browser-based testing to verify UI renders correctly across pages and screen sizes.

### Test Flow

1. **Home page** — Verify unauthenticated state shows "Sign in"
2. **Login** — Test two-step flow (name → email), magic link request, resend countdown
3. **Verify** — Test magic link callback, auto-login, redirect to dashboard
4. **Admin dashboard** — Verify stats cards, form list, navigation
5. **Form builder** — Test visual builder, conditional logic UI, field types
6. **Form renderer** — Test form filling, conditional field visibility, file upload progress
7. **Submissions** — Test list view, PDF download, status badges
8. **Profile** — Test name editing
9. **Dark mode** — Test toggle persistence
10. **Mobile** — Test responsive hamburger nav at 375px width
11. **Logout** — Confirm cookies cleared, redirect to login
12. **Auth guard** — Verify `/admin` blocks access after logout

### Bugs Found and Fixed

| Bug | Fix |
|-----|-----|
| Logout didn't clear cookies | `deleteCookie` now matches `SameSite=Strict` + `Secure` |
| "Sign out" links didn't call `logout()` | Replaced `<Link>` with `<button onClick={logout}>` |
| Forms page showed "Sign out" when not logged in | Conditionally render based on auth state |
| Login logo not clickable | Wrapped in `<Link href="/">` |
| Broken `assigned_to.child.queryset` in serializer | Removed nested child query, use flat assigned_to field |
| Missing `get_user_model` import in views | Added import at top of `forms/views.py` |
| Admin unusable password | `create_initial_admin` now sets password from env var |

---

## Test Configuration

**pytest.ini:**
```ini
[pytest]
DJANGO_SETTINGS_MODULE = actserv_backend.settings
python_files = tests.py test_*.py *_tests.py
```

**.coveragerc:**
```ini
[run]
branch = True
source = backend

[report]
show_missing = True
skip_covered = True
```

---

## Quality Gates

- All tests must pass before merge
- 80%+ coverage required
- No security permission regressions
- Visual tests pass on desktop and mobile
