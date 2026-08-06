# ===== backend/notifications/tasks.py =====
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils.timezone import now, localtime

logger = logging.getLogger(__name__)


# ── Escalation thresholds (days past due_date) ─────────────────────────────
# Matches the diagram: 5th → friendly, 8th → urgent, 10th → penalty, 15th → final
ESCALATION_THRESHOLDS = [
    (5, 1, 'Friendly Reminder',
     'This is a friendly reminder that your submission is due soon. Please complete it as soon as possible.'),
    (8, 2, 'Urgent: 2 Days Left!',
     'Your submission is now overdue. Please complete it within 2 days to avoid a penalty.'),
    (10, 3, 'Penalty Applied',
     'A penalty has been applied to your account due to late submission. Please complete your submission immediately.'),
    (15, 4, 'Final Notice',
     'This is your final notice. Your submission is significantly overdue and further penalties may apply.'),
]


@shared_task(bind=True, max_retries=3)
def notify_admin_new_submission(self, submission_id: str) -> str:
    try:
        from django.contrib.auth import get_user_model
        from forms.models import Submission
        from .models import Notification

        User = get_user_model()

        try:
            submission = Submission.objects.select_related('form').get(id=submission_id)
        except Submission.DoesNotExist:
            logger.warning("Submission %s not found — skipping notification", submission_id)
            return f"Submission {submission_id} not found"

        form = submission.form
        # submission.files is a reverse RelatedManager added by FileUpload(ForeignKey).
        # django-stubs doesn't model reverse accessors — the ignore below is correct.
        file_count = submission.files.count()  # pyrefly: ignore[missing-attribute]

        admin_users = User.objects.filter(is_staff=True)
        notifications = [
            Notification(
                user=user,
                type='submission',
                title='New Form Submission',
                message=f'A new submission for "{form.name}" requires review.',
                related_submission=submission,
            )
            for user in admin_users
        ]
        Notification.objects.bulk_create(notifications)

        subject = f"New {form.name} Submission Received"
        message = (
            f"A new form submission has been received.\n\n"
            f"Form:           {form.name}\n"
            f"Submission ID:  {submission.id}\n"
            f"Client:         {submission.client_identifier or 'Not provided'}\n"
            f"Submitted by:   {submission.submitted_by or 'Anonymous'}\n"
            f"Submitted at:   {submission.created_at:%Y-%m-%d %H:%M UTC}\n"
            f"Files attached: {file_count}\n"
            f"Schema version: {submission.schema_version}\n\n"
            f"Responses:\n{format_responses(submission.responses)}\n\n"
            f"Please review the submission in the admin dashboard."
        )

        admin_emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', ['admin@actserv.local'])
        # Offload email sending to a separate Celery task to avoid blocking the current task
        send_admin_email.delay(subject, message, admin_emails)

        logger.info(
            "Notifications sent for submission %s (%d admin(s) notified)",
            submission_id, len(notifications),
        )
        return f"Notification sent successfully for submission {submission_id}"

    except Exception as exc:
        logger.exception("Failed to send notifications for submission %s", submission_id)
        raise self.retry(exc=exc, countdown=60)


@shared_task
def cleanup_old_notifications(days_to_keep: int = 90) -> str:
    """Delete read notifications older than the specified number of days."""
    from datetime import timedelta
    from .models import Notification

    cutoff = now() - timedelta(days=days_to_keep)
    deleted_count, _ = Notification.objects.filter(
        is_read=True, created_at__lt=cutoff
    ).delete()
    logger.info("Cleaned up %d old read notifications (older than %d days)", deleted_count, days_to_keep)
    return f"Deleted {deleted_count} notifications"


def format_responses(responses: dict | None) -> str:
    """Format a submission's response dict for plain-text email display."""
    if not responses:
        return "No responses"
    return "\n".join(f"  {key}: {value}" for key, value in responses.items())


@shared_task(bind=True, max_retries=3)
def send_admin_email(self, subject: str, message: str, recipient_list: list[str]):
    """Send email to admins via Celery. Retries on failure with exponential backoff."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@actserv.local'),
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info("Admin notification email sent at %s", now())
        return "email_sent"
    except Exception as exc:
        logger.exception("Failed to send admin email")
        raise self.retry(exc=exc, countdown=60)


# ── Escalating SMS / notification alerts ────────────────────────────────────

@shared_task
def check_escalating_alerts() -> str:
    """Daily task: scan submissions with due_dates and send escalating alerts.

    Escalation timeline (days past due):
        5  → Friendly reminder
        8  → Urgent warning
        10 → Penalty applied
        15 → Final notice
    """
    from django.contrib.auth import get_user_model
    from forms.models import Submission
    from .models import Notification

    User = get_user_model()
    today = localtime().date()
    processed = 0

    # Only check active submissions that have a due_date and aren't deleted/rejected
    submissions = Submission.objects.filter(
        due_date__isnull=False,
        is_deleted=False,
    ).exclude(status__in=['rejected', 'approved']).select_related('form', 'submitted_by')

    for sub in submissions:
        days_overdue = (today - sub.due_date).days
        if days_overdue < 5:
            continue  # not yet due for escalation

        # Find the highest threshold we've crossed
        chosen_level = 0
        chosen_title = ''
        chosen_body = ''
        for threshold_days, level, title, body in ESCALATION_THRESHOLDS:
            if days_overdue >= threshold_days:
                chosen_level = level
                chosen_title = title
                chosen_body = body

        # Skip if we already sent this level (or a higher one)
        if sub.escalation_level >= chosen_level:
            continue

        # ── Apply penalty at level 3 ──────────────────────────────────────
        if chosen_level >= 3 and sub.penalty_applied_at is None:
            sub.penalty_applied_at = now()
            sub.save(update_fields=['penalty_applied_at', 'updated_at'])
            logger.info("Penalty applied to submission %s", sub.id)

        # ── Create in-app notification ────────────────────────────────────
        recipients = []
        if sub.submitted_by:
            recipients.append(sub.submitted_by)
        # Also notify admin staff
        admin_users = User.objects.filter(is_staff=True)
        recipients.extend(admin_users)

        notifications = [
            Notification(
                user=user,
                type='submission',
                title=f'[Escalation] {chosen_title}',
                message=(
                    f'Form: {sub.form.name}\n'
                    f'Submission: {sub.id}\n'
                    f'Due date: {sub.due_date}\n'
                    f'Days overdue: {days_overdue}\n\n'
                    f'{chosen_body}'
                ),
                related_submission=sub,
            )
            for user in recipients
        ]
        Notification.objects.bulk_create(notifications)

        # ── Update escalation state ───────────────────────────────────────
        sub.escalation_level = chosen_level
        sub.last_reminder_sent_at = now()
        sub.save(update_fields=[
            'escalation_level', 'last_reminder_sent_at', 'updated_at',
        ])

        # ── Send email to submitter ───────────────────────────────────────
        if sub.submitted_by and sub.submitted_by.email:
            send_escalation_email.delay(
                sub.submitted_by.email,
                sub.form.name,
                str(sub.id),
                chosen_title,
                chosen_body,
                str(sub.due_date),
                days_overdue,
            )

        processed += 1
        logger.info(
            "Escalation level %d sent for submission %s (%d days overdue)",
            chosen_level, sub.id, days_overdue,
        )

    return f"Processed {processed} escalation(s)"


@shared_task
def cleanup_expired_magic_links() -> str:
    """Delete expired and used magic link tokens."""
    from django.db import models
    from users.models import MagicLinkToken

    deleted_count, _ = MagicLinkToken.objects.filter(
        models.Q(expires_at__lt=now()) | models.Q(used=True)
    ).delete()
    logger.info("Cleaned up %d expired/used magic link tokens", deleted_count)
    return f"Deleted {deleted_count} magic link tokens"


@shared_task(bind=True, max_retries=3)
def send_escalation_email(
    self,
    recipient_email: str,
    form_name: str,
    submission_id: str,
    title: str,
    body: str,
    due_date_str: str,
    days_overdue: int,
):
    """Send escalation email to the submitter."""
    try:
        subject = f"[TOPMARK SACCO] {title} — {form_name}"
        message = (
            f"Dear Member,\n\n"
            f"{body}\n\n"
            f"Form:           {form_name}\n"
            f"Submission ID:  {submission_id}\n"
            f"Due date:       {due_date_str}\n"
            f"Days overdue:   {days_overdue}\n\n"
            f"Please log in to the portal to complete your submission.\n\n"
            f"Thank you,\nTOPMARK SACCO Team"
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@actserv.local'),
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        logger.info("Escalation email sent to %s for submission %s", recipient_email, submission_id)
    except Exception as exc:
        logger.exception("Failed to send escalation email to %s", recipient_email)
        raise self.retry(exc=exc, countdown=60)
