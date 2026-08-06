# backend/users/auth_views.py
import logging

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, MagicLinkToken
from .email import send_magic_link_email

logger = logging.getLogger(__name__)


def _cookie_kwargs() -> dict:
    """Return common cookie attributes; HttpOnly for refresh token."""
    from django.conf import settings as _settings
    return {
        'max_age': 7 * 24 * 60 * 60,  # 7 days
        'path': '/',
        'secure': not getattr(_settings, 'DEBUG', True),
        'samesite': 'Strict',
    }


def _issue_tokens(user: CustomUser) -> dict:
    """Generate JWT pair for a user, return dict with access + set refresh cookie."""
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['role'] = user.role
    refresh['is_staff'] = user.is_staff
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
        },
    }


class RequestMagicLinkView(APIView):
    """
    POST /api/auth/magic-link/
    Body: { "email": "user@example.com" }
    Always returns 200 to prevent email enumeration.
    """

    permission_classes = []  # AllowAny

    def post(self, request: Request) -> Response:
        email = request.data.get('email', '').lower().strip()
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Always return 200 — don't reveal whether user exists
        user = CustomUser.objects.filter(email=email).first()
        if user is None:
            # Still return 200 — silent no-op
            return Response({'detail': 'If an account exists, a sign-in link has been sent.'})

        # Invalidate any existing unused tokens for this email
        MagicLinkToken.objects.filter(email=email, used=False).update(used=True)

        # Create new token
        token = MagicLinkToken.create_for_email(email)

        # Send email
        try:
            send_magic_link_email(email, token)
            logger.info('Magic link email sent to %s', email)
        except Exception as e:
            logger.error('Failed to send magic link email to %s: %s [%s]', email, str(e), type(e).__name__)
            import traceback
            logger.error(traceback.format_exc())
            # Don't leak email provider errors
            return Response({'detail': 'If an account exists, a sign-in link has been sent.'})

        return Response({'detail': 'If an account exists, a sign-in link has been sent.'})


class VerifyMagicLinkView(APIView):
    """
    GET /api/auth/verify-magic-link/?token=<uuid>
    Validates the one-time token, creates user if new, returns JWT tokens.
    """

    permission_classes = []  # AllowAny

    def get(self, request: Request) -> Response:
        token_str = request.query_params.get('token', '')
        if not token_str:
            return Response(
                {'detail': 'Token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = MagicLinkToken.objects.get(token=token_str, used=False)
        except MagicLinkToken.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token.is_expired():
            token.mark_used()
            return Response(
                {'detail': 'This link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark token as used
        token.mark_used()

        # Get or create user
        user, created = CustomUser.objects.get_or_create(
            email=token.email,
            defaults={
                'username': token.email,
                'first_name': '',
                'last_name': '',
                'role': 'client',
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
            logger.info('New user created via magic link: %s', user.email)

        # Issue JWT tokens
        data = _issue_tokens(user)

        response = Response({
            'access': data['access'],
            'user': data['user'],
        })

        # Set refresh token as HttpOnly cookie
        response.set_cookie(
            'refresh_token',
            data['refresh'],
            httponly=True,
            **_cookie_kwargs(),
        )

        return response


class CustomRefreshView(APIView):
    """
    POST /api/auth/refresh/
    Reads refresh token from HttpOnly cookie; returns new access token.
    """

    permission_classes = []  # AllowAny (token validity is the auth)

    def post(self, request: Request) -> Response:
        from rest_framework_simplejwt.tokens import RefreshToken as RT
        from rest_framework_simplejwt.exceptions import TokenError

        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not found.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RT(refresh_token)
            # Blacklist old refresh token (rotation)
            refresh.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Issue new pair
        new_refresh = RT.for_user(refresh.user)
        new_refresh['email'] = refresh.user.email
        new_refresh['role'] = refresh.user.role
        new_refresh['is_staff'] = refresh.user.is_staff

        response = Response({
            'access': str(new_refresh.access_token),
        })
        response.set_cookie(
            'refresh_token',
            str(new_refresh),
            httponly=True,
            **_cookie_kwargs(),
        )

        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token and clears cookies.
    """

    permission_classes = []  # AllowAny — clearing cookies doesn't need auth

    def post(self, request: Request) -> Response:
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as RT
                token = RT(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token may already be invalid

        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/')
        return response
