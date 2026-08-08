# backend/notifications/email.py
"""Shared email utilities — sends via Brevo HTTP API (works without Celery/SMTP)."""
import json
import logging
import urllib.request

from django.conf import settings

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
        results.append(send_email(to=email, subject=subject, text=text))
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
    label = status_labels.get(new_status, new_status)

    subject = f"Your {form_name} submission has been {label}"
    text = (
        f"Hello,\n\n"
        f"Your submission for \"{form_name}\" has been updated.\n\n"
        f"Submission ID:  {submission_id}\n"
        f"New Status:     {label}\n\n"
    )

    if new_status == 'approved':
        text += (
            f"Your submission has been approved. No further action is required.\n\n"
            f"Thank you,\nMr.Wam Team"
        )
    elif new_status == 'rejected':
        text += (
            f"Your submission was not approved. Please review the feedback "
            f"and resubmit if necessary.\n\n"
            f"Thank you,\nMr.Wam Team"
        )
    elif new_status == 'reviewed':
        text += (
            f"Your submission is now being reviewed by our team. "
            f"You will be notified once a decision has been made.\n\n"
            f"Thank you,\nMr.Wam Team"
        )
    else:
        text += f"Thank you,\nMr.Wam Team"

    return send_email(to=to, subject=subject, text=text)
