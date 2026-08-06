# backend/tests/test_auth.py
import pytest
from users.models import CustomUser

MAGIC_LINK_URL = '/api/auth/magic-link/'
VERIFY_URL     = '/api/auth/verify-magic-link/'
ME_URL         = '/api/auth/me/'

User = CustomUser


@pytest.mark.django_db
def test_magic_link_returns_200_for_existing_user(api_client, admin_user):
    response = api_client.post(MAGIC_LINK_URL, {'email': admin_user.email}, format='json')
    assert response.status_code == 200


@pytest.mark.django_db
def test_magic_link_returns_200_for_nonexistent_user(api_client):
    # Should not reveal whether user exists
    response = api_client.post(MAGIC_LINK_URL, {'email': 'ghost@test.com'}, format='json')
    assert response.status_code == 200


@pytest.mark.django_db
def test_magic_link_requires_email(api_client):
    response = api_client.post(MAGIC_LINK_URL, {}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_verify_magic_link_creates_user(api_client):
    from users.models import MagicLinkToken
    token = MagicLinkToken.create_for_email('newuser@test.com')

    response = api_client.get(f'{VERIFY_URL}?token={token.token}')
    assert response.status_code == 200
    data = response.json()
    assert 'access' in data
    assert data['user']['email'] == 'newuser@test.com'
    assert data['user']['role'] == 'client'


@pytest.mark.django_db
def test_verify_magic_link_invalid_token(api_client):
    response = api_client.get(f'{VERIFY_URL}?token=00000000-0000-0000-0000-000000000000')
    assert response.status_code == 400


@pytest.mark.django_db
def test_verify_magic_link_expired_token(api_client):
    from users.models import MagicLinkToken
    from django.utils.timezone import now, timedelta
    token = MagicLinkToken.create_for_email('expired@test.com')
    # Force expiry
    token.expires_at = now() - timedelta(minutes=1)
    token.save()

    response = api_client.get(f'{VERIFY_URL}?token={token.token}')
    assert response.status_code == 400


@pytest.mark.django_db
def test_verify_magic_link_used_token(api_client):
    from users.models import MagicLinkToken
    token = MagicLinkToken.create_for_email('used@test.com')
    token.mark_used()

    response = api_client.get(f'{VERIFY_URL}?token={token.token}')
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_returns_current_user_profile(auth_client, client_user):
    response = auth_client.get(ME_URL)
    assert response.status_code == 200
    data = response.json()
    assert data['email'] == client_user.email
    assert data['role'] == 'client'


@pytest.mark.django_db
def test_me_requires_authentication(api_client):
    response = api_client.get(ME_URL)
    assert response.status_code == 401


# ── Me endpoint via users app ────────────────────────────────────────────────

@pytest.mark.django_db
def test_me_endpoint(auth_client, client_user):
    from django.urls import reverse
    url = reverse('user-me')
    resp = auth_client.get(url)
    assert resp.status_code == 200
    json = resp.json()
    assert json['email'] == client_user.email
