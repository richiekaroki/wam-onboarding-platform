from django.conf import settings
from django.template.loader import render_to_string
import resend

from .models import MagicLinkToken


def send_magic_link_email(email: str, token: MagicLinkToken) -> None:
    """Send magic link email using Resend API."""
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token.token}"

    html_message = render_to_string('users/magic_link_email.html', {'link': link})
    plain_message = (
        f'Sign in to Mr.Wam\n\n'
        f'Click the link below to sign in. This link expires in 10 minutes.\n\n'
        f'{link}\n\n'
        f'If you did not request this, you can safely ignore this email.'
    )

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev'),
        "to": [email],
        "subject": "Sign in to Mr.Wam",
        "html": html_message,
        "text": plain_message,
    })
