import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create the initial admin user from DJANGO_ADMIN_EMAIL env var'

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.environ.get('DJANGO_ADMIN_EMAIL', '').lower().strip()
        admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD', 'admin123')

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
            user.set_password(admin_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Created admin: {email}\n'
                f'Django admin password: {admin_password}\n'
                f'Log in at: https://actserv-backend.onrender.com/admin/\n'
                f'Change this password immediately after first login!'
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
            # Ensure they have a usable password
            if not user.has_usable_password():
                user.set_password(admin_password)
                changed = True
                self.stdout.write(self.style.SUCCESS(
                    f'Set Django admin password for {email}: {admin_password}'
                ))
            if changed:
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Existing user {email} promoted to admin.'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Admin {email} already exists — skipping.'
                ))
