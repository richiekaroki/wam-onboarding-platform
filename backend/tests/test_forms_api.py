# backend/tests/test_forms_api.py
"""
Integration tests for the Forms API.

  GET    /api/forms/          → list (public)
  POST   /api/forms/          → create (admin only)
  GET    /api/forms/<slug>/   → retrieve (public)
  PATCH  /api/forms/<slug>/   → update (admin only)
  DELETE /api/forms/<slug>/   → destroy (admin only)
"""
import pytest

FORMS_URL = '/api/forms/'


def form_detail_url(slug):
    return f'/api/forms/{slug}/'


# ── List ──────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_public_can_list_active_forms(api_client, basic_form, kyc_form):
    response = api_client.get(FORMS_URL)
    assert response.status_code == 200
    slugs = [f['slug'] for f in response.json()['results']]
    assert 'basic-form' in slugs
    assert 'kyc-form' in slugs


@pytest.mark.django_db
def test_list_returns_field_count(api_client, kyc_form):
    response = api_client.get(FORMS_URL)
    assert response.status_code == 200
    form_data = next(f for f in response.json()['results'] if f['slug'] == 'kyc-form')
    # kyc_form fixture creates 3 fields
    assert len(form_data['fields']) == 3


# ── Retrieve ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_public_can_retrieve_form_by_slug(api_client, kyc_form):
    response = api_client.get(form_detail_url('kyc-form'))
    assert response.status_code == 200
    assert response.json()['name'] == 'KYC Form'


@pytest.mark.django_db
def test_retrieve_nonexistent_form_returns_404(api_client):
    response = api_client.get(form_detail_url('does-not-exist'))
    assert response.status_code == 404


# ── Create ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_admin_can_create_form(admin_client):
    response = admin_client.post(FORMS_URL, {
        'name': 'Loan Application',
        'slug': 'loan-application',
        'description': 'Apply for a personal loan.',
        'schema': {'version': 1, 'fields': []},
        'is_active': True,
    }, format='json')
    assert response.status_code == 201
    assert response.json()['slug'] == 'loan-application'


@pytest.mark.django_db
def test_anonymous_cannot_create_form(api_client):
    response = api_client.post(FORMS_URL, {
        'name': 'Hack Form', 'slug': 'hack', 'schema': {},
    }, format='json')
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_regular_client_cannot_create_form(auth_client):
    response = auth_client.post(FORMS_URL, {
        'name': 'Client Form', 'slug': 'client-form', 'schema': {},
    }, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_create_form_duplicate_slug_returns_400(admin_client, basic_form):
    response = admin_client.post(FORMS_URL, {
        'name': 'Duplicate', 'slug': 'basic-form', 'schema': {},
    }, format='json')
    assert response.status_code == 400


# ── Update ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_admin_can_update_form_description(admin_client, basic_form):
    response = admin_client.patch(
        form_detail_url('basic-form'),
        {'description': 'Updated description.'},
        format='json',
    )
    assert response.status_code == 200
    assert response.json()['description'] == 'Updated description.'


@pytest.mark.django_db
def test_anonymous_cannot_update_form(api_client, basic_form):
    response = api_client.patch(
        form_detail_url('basic-form'),
        {'description': 'Sneaky edit'},
        format='json',
    )
    assert response.status_code in (401, 403)


# ── Delete ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_admin_can_delete_form_with_no_submissions(admin_client, basic_form):
    response = admin_client.delete(form_detail_url('basic-form'))
    assert response.status_code == 204


@pytest.mark.django_db
def test_delete_form_with_submissions_is_blocked(admin_client, basic_form):
    """Forms.Submission uses on_delete=PROTECT — this must be enforced."""
    from forms.models import Submission
    Submission.objects.create(form=basic_form, schema_version=1, responses={})

    response = admin_client.delete(form_detail_url('basic-form'))
    # DRF returns 500 for unhandled ProtectedError without custom error handling,
    # but the important thing is the form was NOT deleted.
    assert response.status_code in (400, 409, 500)
    from forms.models import Form
    assert Form.objects.filter(slug='basic-form').exists()


# ── Field API ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_field_list(admin_client, basic_form):
    from forms.models import Field
    Field.objects.create(form=basic_form, key='name', label='Name', field_type='text', required=True, order=1)
    Field.objects.create(form=basic_form, key='email', label='Email', field_type='email', required=False, order=2)
    url = '/api/forms/basic-form/fields/'
    resp = admin_client.get(url)
    assert resp.status_code == 200
    data = resp.json()
    fields = data if isinstance(data, list) else data.get('results', data)
    assert isinstance(fields, list)
    returned_keys = {item['key'] for item in fields}
    assert {'name', 'email'} == returned_keys


@pytest.mark.django_db
def test_field_detail(admin_client, basic_form):
    from forms.models import Field
    field = Field.objects.create(form=basic_form, key='age', label='Age', field_type='number', required=False, order=1)
    url = f'/api/forms/basic-form/fields/{field.id}/'
    resp = admin_client.get(url)
    assert resp.status_code == 200
    json = resp.json()
    assert json['key'] == 'age'
    assert json['field_type'] == 'number'