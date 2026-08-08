# backend/users/models.py
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin',  'Admin'),
        ('client', 'Client'),
    ]

    # Pyrefly reports bad-override here because AbstractUser.id is typed as int
    # in django-stubs, but UUID primary keys are a standard Django pattern.
    # This is a stub limitation — the code is correct.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # pyrefly: ignore[bad-override]

    phone       = models.CharField(max_length=20,  blank=True)
    department  = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=50,  blank=True, unique=True, null=True)
    role        = models.CharField(max_length=20,  choices=ROLE_CHOICES, default='client')

    def __str__(self) -> str:
        return f"{self.email} ({self.get_role_display()})"


class MagicLinkToken(models.Model):
    """One-time magic link token for passwordless authentication."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def mark_used(self) -> None:
        self.used = True
        self.save(update_fields=['used'])

    @classmethod
    def create_for_email(cls, email: str, ttl_minutes: int = 10) -> "MagicLinkToken":
        return cls.objects.create(
            email=email.lower().strip(),
            expires_at=timezone.now() + timezone.timedelta(minutes=ttl_minutes),
        )

    class Meta:
        ordering = ['-created_at']