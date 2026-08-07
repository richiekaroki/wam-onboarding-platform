import json
import urllib.request

from django.conf import settings
from django.template.loader import render_to_string

from .models import MagicLinkToken


def send_magic_link_email(email: str, token: MagicLinkToken) -> None:
    """Send magic link email via Brevo HTTP API (bypasses SMTP port blocking)."""
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token.token}"

    html_message = render_to_string('users/magic_link_email.html', {'link': link})
    plain_message = (
        f'Sign in to Mr.Wam\n\n'
        f'Click the link below to sign in. This link expires in 10 minutes.\n\n'
        f'{link}\n\n'
        f'If you did not request this, you can safely ignore this email.'
    )

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'karokirichard522@gmail.com')

    payload = json.dumps({
        "sender": {"email": from_email, "name": "Mr.Wam"},
        "to": [{"email": email}],
        "subject": "Sign in to Mr.Wam",
        "htmlContent": html_message,
        "textContent": plain_message,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": settings.BREVO_API_KEY,
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()
