# backend/notifications/email.py
"""Shared email utilities — sends via Brevo HTTP API (works without Celery/SMTP)."""
import json
import logging
import urllib.request

from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_email(*, to: str, subject: str, text: str, html: str | None = None) -> bool:
    """Send a single email via Brevo HTTP API. Returns True on success."""
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'karokirichard522@gmail.com')
    api_key = getattr(settings, 'BREVO_API_KEY', '')
    if not api_key:
        logger.error('BREVO_API_KEY is not set — cannot send email')
        return False

    payload = json.dumps({
        "sender": {"email": from_email, "name": "Mr.Wam"},
        "to": [{"email": to}],
        "subject": subject,
        "textContent": text,
        "htmlContent": html or f"<pre>{text}</pre>",
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        logger.info('Email sent to %s: %s', to, subject)
        return True
    except Exception:
        logger.exception('Failed to send email to %s', to)
        return False


def send_admin_submission_email(*, form_name: str, submission_id: str, client: str,
                                submitted_by: str, submitted_at: str, responses: str) -> bool:
    """Send notification email to admins about a new submission."""
    admin_emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', [])
    if not admin_emails:
        logger.warning('No ADMIN_NOTIFICATION_EMAILS configured')
        return False

    subject = f"New {form_name} Submission Received"
    dashboard_url = f"{settings.FRONTEND_URL}/admin"
    html = render_to_string('notifications/admin_submission_email.html', {
        'form_name': form_name,
        'client': client,
        'submitted_at': submitted_at,
        'submission_id': submission_id,
        'dashboard_url': dashboard_url,
    })
    text = (
        f"A new form submission has been received.\n\n"
        f"Form:           {form_name}\n"
        f"Submission ID:  {submission_id}\n"
        f"Client:         {client}\n"
        f"Submitted by:   {submitted_by}\n"
        f"Submitted at:   {submitted_at}\n\n"
        f"Responses:\n{responses}\n\n"
        f"Please review the submission in the admin dashboard."
    )

    results = []
    for email in admin_emails:
        results.append(send_email(to=email, subject=subject, text=text, html=html))
    return any(results)


def send_client_status_email(*, to: str, form_name: str, submission_id: str,
                             new_status: str) -> bool:
    """Send notification email to client when their submission status changes."""
    status_labels = {
        'submitted': 'Submitted',
        'reviewed': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
    }
    status_colors = {
        'submitted': '#1e40af',
        'reviewed': '#92400e',
        'approved': '#065f46',
        'rejected': '#991b1b',
    }
    status_messages = {
        'approved': 'Your submission has been approved. No further action is required.',
        'rejected': 'Your submission was not approved. Please review the feedback and resubmit if necessary.',
        'reviewed': 'Your submission is now being reviewed by our team. You will be notified once a decision has been made.',
        'submitted': 'Your submission has been received and is pending review.',
    }
    label = status_labels.get(new_status, new_status)
    color = status_colors.get(new_status, '#555555')
    message = status_messages.get(new_status, 'Thank you for your submission.')

    subject = f"Your {form_name} submission has been {label}"
    submissions_url = f"{settings.FRONTEND_URL}/submissions"
    html = render_to_string('notifications/client_status_email.html', {
        'form_name': form_name,
        'submission_id': submission_id,
        'status_label': label,
        'status_color': color,
        'status_message': message,
        'submissions_url': submissions_url,
    })
    text = (
        f"Hello,\n\n"
        f"Your submission for \"{form_name}\" has been updated.\n\n"
        f"Submission ID:  {submission_id}\n"
        f"New Status:     {label}\n\n"
        f"{message}\n\n"
        f"Thank you,\nMr.Wam Team"
    )

    return send_email(to=to, subject=subject, text=text, html=html)
