import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create the initial admin user from DJANGO_ADMIN_EMAIL env var'

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.environ.get('DJANGO_ADMIN_EMAIL', '').lower().strip()

        if not email:
            self.stdout.write(self.style.ERROR(
                'DJANGO_ADMIN_EMAIL env var is not set.\n'
                'Set it to the email of your first admin:\n'
                '  export DJANGO_ADMIN_EMAIL="admin@mrwam.com"\n'
                '  python manage.py create_initial_admin'
            ))
            return

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Created admin: {email}\n'
                f'Log in via magic link at your frontend URL.'
            ))
        else:
            # User exists — promote to admin if not already
            changed = False
            if user.role != 'admin':
                user.role = 'admin'
                changed = True
            if not user.is_staff:
                user.is_staff = True
                changed = True
            if not user.is_superuser:
                user.is_superuser = True
                changed = True
            if changed:
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Existing user {email} promoted to admin.'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Admin {email} already exists — skipping.'
                ))
