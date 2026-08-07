from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import MagicLinkToken


def send_magic_link_email(email: str, token: MagicLinkToken) -> None:
    """Send magic link email via Brevo SMTP."""
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token.token}"

    html_message = render_to_string('users/magic_link_email.html', {'link': link})
    plain_message = (
        f'Sign in to Mr.Wam\n\n'
        f'Click the link below to sign in. This link expires in 10 minutes.\n\n'
        f'{link}\n\n'
        f'If you did not request this, you can safely ignore this email.'
    )

    send_mail(
        subject='Sign in to Mr.Wam',
        message=plain_message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@actserv.local'),
        recipient_list=[email],
        html_message=html_message,
        fail_silently=True,
    )
