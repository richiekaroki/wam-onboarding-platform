# backend/tests/conftest.py
import pytest
from rest_framework.test import APIClient

from forms.models import Field, Form
from users.models import CustomUser

User = CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        username='admin@test.com',
        email='admin@test.com',
        role='admin',
        is_staff=True,
    )
    user.set_unusable_password()
    user.save()
    return user


@pytest.fixture
def client_user(db):
    user = User.objects.create_user(
        username='client@test.com',
        email='client@test.com',
        role='client',
        is_staff=False,
    )
    user.set_unusable_password()
    user.save()
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def auth_client(api_client, client_user):
    api_client.force_authenticate(user=client_user)
    return api_client


@pytest.fixture
def basic_form(db):
    return Form.objects.create(
        name='Basic Form', slug='basic-form',
        description='A simple test form', schema={'version': 1},
    )


@pytest.fixture
def kyc_form(db):
    form = Form.objects.create(
        name='KYC Form', slug='kyc-form',
        description='Know Your Customer onboarding form', schema={'version': 1},
    )
    Field.objects.create(form=form, key='full_name', label='Full Name',  field_type='text', required=True,  order=1)
    Field.objects.create(form=form, key='id_number', label='ID Number',  field_type='text', required=True,  order=2)
    Field.objects.create(form=form, key='notes',     label='Additional Notes', field_type='text', required=False, order=3)
    return form


@pytest.fixture(autouse=True)
def _disable_throttling(settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
    }
