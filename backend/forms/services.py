# backend/forms/services.py
"""
Service layer for forms app business logic.
Extracted from views/serializers for testability and separation of concerns.
"""
import logging

from django.db import transaction

from .models import Form, Submission

logger = logging.getLogger(__name__)


def _notify_admin_new_submission(submission: Submission) -> None:
    """Send in-app notification + email to admins about a new submission."""
    from django.contrib.auth import get_user_model
    from notifications.models import Notification
    from notifications.email import send_admin_submission_email

    User = get_user_model()
    admin_users = User.objects.filter(is_staff=True)

    notifications = [
        Notification(
            user=user,
            type='submission',
            title='New Form Submission',
            message=f'A new submission for "{submission.form.name}" requires review.',
            related_submission=submission,
        )
        for user in admin_users
    ]
    Notification.objects.bulk_create(notifications)

    responses_text = '\n'.join(
        f'  {key}: {value}' for key, value in (submission.responses or {}).items()
    ) or 'No responses'

    send_admin_submission_email(
        form_name=submission.form.name,
        submission_id=str(submission.id),
        client=submission.client_identifier or 'Not provided',
        submitted_by=str(submission.submitted_by or 'Anonymous'),
        submitted_at=str(submission.created_at),
        responses=responses_text,
    )


def create_submission(*, form: Form, responses: dict, submitted_by=None, client_identifier: str = '') -> Submission:
    """Create a submission with schema version snapshot and trigger notifications."""
    with transaction.atomic():
        submission = Submission.objects.create(
            form=form,
            responses=responses,
            submitted_by=submitted_by,
            client_identifier=client_identifier,
            schema_version=form.schema_version,
        )

    logger.info(
        'Submission %s created for form "%s" by %s',
        submission.id, form.name, submitted_by or 'anonymous',
    )

    try:
        _notify_admin_new_submission(submission)
    except Exception:
        logger.exception('Failed to send notification for submission %s', submission.id)

    return submission


def update_submission_status(*, submission: Submission, new_status: str) -> Submission:
    """Update submission status with validation, audit logging, and client notification."""
    valid_statuses = [s[0] for s in Submission.STATUS_CHOICES]
    if new_status not in valid_statuses:
        raise ValueError(f'Invalid status. Choose from: {valid_statuses}')

    old_status = submission.status
    submission.status = new_status
    submission.save(update_fields=['status', 'updated_at'])

    logger.info(
        'Submission %s status changed: %s -> %s',
        submission.id, old_status, new_status,
    )

    # Notify client when status changes to reviewed/approved/rejected
    if new_status in ('reviewed', 'approved', 'rejected'):
        try:
            from notifications.tasks import notify_client_status_change_synchronous
            notify_client_status_change_synchronous(str(submission.id))
        except Exception:
            logger.exception('Failed to notify client for submission %s', submission.id)

    return submission
