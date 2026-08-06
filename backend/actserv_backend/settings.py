# ===== backend/actserv_backend/settings.py =====
"""
Django settings for actserv_backend project.
"""

import os
import logging
from datetime import timedelta
from pathlib import Path

import dj_database_url
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ===== SENTRY (error tracking) =====
SENTRY_DSN = os.getenv('SENTRY_DSN', '')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,       # capture 10% of transactions for performance
        send_default_pii=True,        # attach user info to errors
        environment='production' if os.getenv('DEBUG', 'True').lower() not in ('1', 'true', 'yes') else 'development',
    )

BASE_DIR = Path(__file__).resolve().parent.parent

# ===== SECURITY =====
SECRET_KEY = os.getenv('SECRET_KEY', 'test-secret-key')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Production guards — fail fast if critical env vars are missing
if not DEBUG:
    if SECRET_KEY == 'test-secret-key':
        raise RuntimeError('SECRET_KEY must be set to a secure value in production')
    if not os.environ.get('DATABASE_URL'):
        raise RuntimeError('DATABASE_URL must be set in production (SQLite fallback is dev-only)')

# ===== APPS =====
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'drf_spectacular',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'forms',
    'notifications',
    'users',
]

AUTH_USER_MODEL = 'users.CustomUser'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'actserv_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'actserv_backend.wsgi.application'

# ===== DATABASE =====
# ─────────────────────────────────────────────────────────────────────────────
# IMPORTANT: dj_database_url.config() returns {} when DATABASE_URL is empty,
# which causes "ImproperlyConfigured: Please supply the ENGINE value."
# We always provide a fallback so the backend is never unconfigured.
# ─────────────────────────────────────────────────────────────────────────────
_db_url = os.environ.get('DATABASE_URL', '').strip()

if _db_url:
    # Explicit DATABASE_URL set (SQLite path or PostgreSQL connection string)
    DATABASES = {
        'default': dj_database_url.config(
            default=_db_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Nothing set — fall back to SQLite in the project root
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ===== PASSWORD VALIDATION =====
# Disabled — passwordless magic link auth; passwords are never used
AUTH_PASSWORD_VALIDATORS = []

# ===== I18N =====
LANGUAGE_CODE = 'en-gb'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# ===== STATIC / MEDIA =====
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===== FILE UPLOAD LIMITS =====
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024))  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE
ALLOWED_UPLOAD_CONTENT_TYPES = [
    ct.strip()
    for ct in os.environ.get(
        'ALLOWED_UPLOAD_CONTENT_TYPES',
        'application/pdf,image/jpeg,image/png,image/jpg,text/csv,application/vnd.ms-excel',
    ).split(',')
]
MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE', 10 * 1024 * 1024))  # 10MB per file

# ===== CELERY =====
_redis_url = os.environ.get('REDIS_URL', '').strip()

CELERY_BROKER_URL = _redis_url or 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = _redis_url or 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'

# Run tasks synchronously when Redis is not configured (dev / CI)
if not _redis_url:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# ── Periodic tasks (Celery Beat) ────────────────────────────────────────────
CELERY_BEAT_SCHEDULE = {
    'check-escalating-alerts': {
        'task': 'notifications.tasks.check_escalating_alerts',
        'schedule': timedelta(hours=24),  # run every 24 hours
    },
    'cleanup-expired-magic-links': {
        'task': 'notifications.tasks.cleanup_expired_magic_links',
        'schedule': timedelta(hours=1),  # run every hour
    },
}

# Ensure Redis broker is configured in production
if not DEBUG and not _redis_url:
    raise RuntimeError('REDIS_URL environment variable must be set in production')

# ===== CORS =====
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
]
CORS_ALLOW_CREDENTIALS = True

# Frontend URL for magic link redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Warn if CORS is still pointing at localhost in production
if not DEBUG and any('localhost' in o for o in CORS_ALLOWED_ORIGINS):
    import sys
    print(
        'WARNING: CORS_ALLOWED_ORIGINS contains localhost but DEBUG=False. '
        'Set CORS_ALLOWED_ORIGINS to your production frontend domain.',
        file=sys.stderr,
    )

# ===== REST FRAMEWORK =====
REST_FRAMEWORK = {
    # Default permission – require authentication for all endpoints unless overridden
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Throttling to protect public endpoints (e.g., submissions)
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    # Rates can be overridden per-view; set conservative defaults here
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/min',   # 10 requests per minute for anonymous users
        'user': '100/min',  # 100 requests per minute for authenticated users
    },

    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ===== API DOCS =====
SPECTACULAR_SETTINGS = {
    'TITLE': 'Mr.Wam Onboarding API',
    'DESCRIPTION': 'Dynamic form onboarding platform for financial services',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {'persistAuthorization': True},
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
}

# ===== JWT =====
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 1))
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'TOKEN_OBTAIN_SERIALIZER': 'users.serializers.CustomTokenObtainPairSerializer',
}

# ===== EMAIL =====
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend'
)
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@actserv.local')
ADMIN_NOTIFICATION_EMAILS = [
    e.strip()
    for e in os.environ.get('ADMIN_NOTIFICATION_EMAILS', 'admin@actserv.local').split(',')
]

# ===== LOGGING =====

# Security settings (enabled for production)
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    # Ensure CSRF cookie is secure and HttpOnly
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = True
    # Enforce HTTPS (if behind proxy set SECURE_PROXY_SSL_HEADER accordingly)
    SECURE_SSL_REDIRECT = True
    # HSTS settings (optional, can be tuned)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'forms':         {'handlers': ['console'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'notifications': {'handlers': ['console'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'users':         {'handlers': ['console'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
    },
}