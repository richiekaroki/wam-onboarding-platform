# ===== backend/actserv_backend/urls.py =====
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from users.auth_views import (
    CustomRefreshView,
    LogoutView,
    RequestMagicLinkView,
    VerifyMagicLinkView,
)


def health_check(request):
    """Liveness probe with DB ping — useful for Docker / load balancers."""
    import django.db
    db_ok = True
    try:
        with django.db.connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return JsonResponse({
        "status": "ok" if db_ok else "degraded",
        "service": "mrwam-backend",
        "version": "1.0.0",
        "database": "connected" if db_ok else "unavailable",
    }, status=status_code)


urlpatterns = [
    # ── Health ─────────────────────────────────────────────────────────────
    path("", health_check, name="health-check"),

    # ── Django admin ────────────────────────────────────────────────────────
    path("admin/", admin.site.urls),

    # ── Auth (magic link) ──────────────────────────────────────────────────
    path("api/auth/magic-link/",       RequestMagicLinkView.as_view(),  name="request-magic-link"),
    path("api/auth/verify-magic-link/", VerifyMagicLinkView.as_view(), name="verify-magic-link"),
    path("api/auth/refresh/",          CustomRefreshView.as_view(),     name="token-refresh"),
    path("api/auth/logout/",           LogoutView.as_view(),            name="token-logout"),

    # Registration and /me/ (users app)
    path("api/auth/", include("users.urls")),

    # ── Core API ────────────────────────────────────────────────────────────
    path("api/", include("forms.urls")),
    path("api/", include("notifications.urls")),

    # ── API docs ────────────────────────────────────────────────────────────
    path("api/schema/",         SpectacularAPIView.as_view(),                       name="schema"),
    path("api/schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"),  name="swagger-ui"),
    path("api/schema/redoc/",   SpectacularRedocView.as_view(url_name="schema"),    name="redoc"),
]

# Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
