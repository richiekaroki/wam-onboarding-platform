# backend/tests/test_notifications.py
import uuid
from unittest.mock import patch

import pytest

from forms.models import Form, Submission
from notifications.models import Notification
from notifications.tasks import (
    format_responses,
    notify_admin_new_submission,
)
from users.models import CustomUser

NOTIFICATIONS_URL = '/api/notifications/'

User = CustomUser


class TestFormatResponses:
    def test_formats_dict_as_indented_lines(self):
        result = format_responses({'name': 'John', 'age': 30})
        assert 'name: John' in result
        assert 'age: 30' in result

    def test_empty_dict_returns_no_responses(self):
        assert format_responses({}) == 'No responses'

    def test_none_returns_no_responses(self):
        # format_responses now accepts dict | None — passing None is valid
        assert format_responses(None) == 'No responses'  # type: ignore[arg-type]


@pytest.mark.django_db
class TestNotifyAdminNewSubmission:

    @patch('notifications.tasks.send_mail')
    def test_creates_notification_for_each_staff_user(self, mock_mail, admin_user, basic_form):
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={'full_name': 'John Doe'})
        notify_admin_new_submission(str(sub.id))
        assert Notification.objects.filter(user=admin_user, type='submission', related_submission=sub).exists()

    @patch('notifications.tasks.send_mail')
    def test_sends_email_to_admin_list(self, mock_mail, admin_user, basic_form):
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={'a': 'b'})
        notify_admin_new_submission(str(sub.id))
        mock_mail.assert_called_once()

    @patch('notifications.tasks.send_mail')
    def test_email_subject_contains_form_name(self, mock_mail, admin_user, basic_form):
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={})
        notify_admin_new_submission(str(sub.id))
        subject = mock_mail.call_args[1]['subject']
        assert 'Basic Form' in subject

    @patch('notifications.tasks.send_mail')
    def test_returns_success_string(self, mock_mail, admin_user, basic_form):
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={})
        result = notify_admin_new_submission(str(sub.id))
        assert 'Notification sent successfully' in result
        assert str(sub.id) in result

    def test_nonexistent_submission_returns_not_found(self):
        result = notify_admin_new_submission(str(uuid.uuid4()))
        assert 'not found' in result.lower()

    @patch('notifications.tasks.send_mail')
    def test_failed_email_raises_for_retry(self, mock_mail, admin_user, basic_form):
        mock_mail.side_effect = Exception('SMTP timeout')
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={})
        with pytest.raises(Exception):
            notify_admin_new_submission(str(sub.id))

    @patch('notifications.tasks.send_mail')
    def test_bulk_creates_notifications_efficiently(self, mock_mail, db):
        for i in range(3):
            User.objects.create_user(
                username=f'staff{i}@test.com', email=f'staff{i}@test.com',
                password='pass', is_staff=True,
            )
        form = Form.objects.create(name='Bulk Test', slug='bulk-test', schema={})
        sub = Submission.objects.create(form=form, schema_version=1, responses={})
        notify_admin_new_submission(str(sub.id))
        assert Notification.objects.filter(related_submission=sub).count() == 3


@pytest.mark.django_db
class TestNotificationsApi:

    def _create_notification(self, user, basic_form):
        sub = Submission.objects.create(form=basic_form, schema_version=1, responses={})
        return Notification.objects.create(
            user=user, type='submission', title='New Submission',
            message='A form was submitted.', related_submission=sub,
        )

    def test_unauthenticated_cannot_list_notifications(self, api_client):
        assert api_client.get(NOTIFICATIONS_URL).status_code == 401

    def test_user_sees_only_own_notifications(self, auth_client, client_user, admin_user, basic_form):
        self._create_notification(client_user, basic_form)
        self._create_notification(admin_user, basic_form)
        response = auth_client.get(NOTIFICATIONS_URL)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_mark_notification_as_read(self, auth_client, client_user, basic_form):
        notif = self._create_notification(client_user, basic_form)
        assert notif.is_read is False  # explicit False check, not identity

        response = auth_client.patch(f'{NOTIFICATIONS_URL}{notif.id}/', {'is_read': True}, format='json')
        assert response.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read is True

    def test_mark_all_read(self, auth_client, client_user, basic_form):
        for _ in range(3):
            self._create_notification(client_user, basic_form)
        response = auth_client.post('/api/notifications/mark-all-read/')
        assert response.status_code == 200
        assert response.json()['marked_read'] == 3
        assert Notification.objects.filter(user=client_user, is_read=False).count() == 0

    def test_user_cannot_access_another_users_notification(self, auth_client, admin_user, basic_form):
        notif = self._create_notification(admin_user, basic_form)
        assert auth_client.get(f'{NOTIFICATIONS_URL}{notif.id}/').status_code == 404


# ── Mark-all-read (standalone, from notifications app) ───────────────────────

@pytest.mark.django_db
def test_mark_all_read_notifications(auth_client, client_user):
    Notification.objects.create(user=client_user, type='system', title='Test 1', message='msg 1')
    Notification.objects.create(user=client_user, type='system', title='Test 2', message='msg 2')
    other = client_user.__class__.objects.create_user(username='other@test.com', email='other@test.com', role='client')
    other.set_unusable_password()
    other.save()
    Notification.objects.create(user=other, type='system', title='Other', message='other')
    url = '/api/notifications/mark-all-read/'
    resp = auth_client.post(url)
    assert resp.status_code == 200
    result = resp.json()
    assert result['marked_read'] == 2
    assert Notification.objects.filter(user=client_user, is_read=False).count() == 0
    assert Notification.objects.filter(user=other, is_read=False).count() == 1